import { entry, type Entry } from "../domain/model";
import { money, validDate } from "../domain/calculations";
import { validateEntry } from "./validation";
export function parseCSV(text: string, delimiter = ";"): string[][] {
  if (text.length > 5000000) throw Error("CSV ylittää 5 Mt rajan.");
  let rows: string[][] = [],
    row: string[] = [],
    field = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    let c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (!quoted && field.length)
        throw Error("Virheellinen lainausmerkki.");
      else quoted = !quoted;
    } else if (c === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((c === "\n" || c === "\r") && !quoted) {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
      field = "";
    } else field += c;
    if (rows.length > 20000) throw Error("Enintään 20 000 riviä.");
  }
  if (quoted) throw Error("Sulkematon lainausmerkki.");
  row.push(field);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}
export const csvFields = [
  "name",
  "amount",
  "category",
  "date",
  "recurrence",
  "status",
  "description",
  "quantity",
  "purchasePrice",
  "ownership",
  "liquid",
  "rate",
  "payment",
  "target",
  "monthly",
  "endDate",
  "tags",
  "active",
  "essential",
  "occurrenceStatuses",
  "occurrenceAmounts",
];
export const csvFieldLabels: Record<string, string> = {
  name: "Nimi",
  amount: "Summa (€)",
  category: "Kategoria",
  date: "Päivä",
  recurrence: "Toistuvuus",
  status: "Tila",
  description: "Kuvaus",
  quantity: "Määrä",
  purchasePrice: "Hankintahinta (€)",
  ownership: "Omistusosuus (%)",
  liquid: "Likvidi omaisuus",
  rate: "Vuosikorko tai tuotto (%)",
  payment: "Kuukausierä (€)",
  target: "Tavoitesumma (€)",
  monthly: "Kuukausisummaa (€)",
  endDate: "Päättymispäivä",
  tags: "Tunnisteet",
  active: "Aktiivinen",
  essential: "Välttämätön meno",
  occurrenceStatuses: "Esiintymien tilat",
  occurrenceAmounts: "Esiintymien summat",
};
const csvHeaderAliases: Record<string, string[]> = {
  name: [
    "nimi",
    "tapahtuma",
    "tapahtuman nimi",
    "selite",
    "kuvaus",
    "saaja maksaja",
    "saaja/maksaja",
    "payee",
    "merchant",
  ],
  amount: [
    "summa",
    "määrä",
    "summa eur",
    "summa €",
    "amount eur",
    "amount €",
    "value",
  ],
  category: ["kategoria", "luokka", "menoluokka", "tuloluokka"],
  date: [
    "päivä",
    "pvm",
    "päivämäärä",
    "tapahtumapäivä",
    "kirjauspäivä",
    "maksupäivä",
    "transaction date",
    "value date",
  ],
};
function normalizedHeader(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fi-FI")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
export function mapCSVHeaders(header: string[]): Record<string, number> {
  const aliases = new Map<string, string>();
  for (const field of csvFields) aliases.set(normalizedHeader(field), field);
  for (const [field, values] of Object.entries(csvHeaderAliases))
    for (const alias of values) aliases.set(normalizedHeader(alias), field);
  const map: Record<string, number> = Object.fromEntries(
    csvFields.map((field) => [field, -1]),
  );
  const used = new Set<string>();
  header.forEach((value, index) => {
    const field = aliases.get(normalizedHeader(value));
    if (field && map[field] < 0 && !used.has(field)) {
      map[field] = index;
      used.add(field);
    }
  });
  return map;
}
export function exportCSV(es: Entry[]) {
  let safe = (s: string) => {
    if (/^[\s]*[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return (
    "\ufeff" +
    [
      csvFields.join(";"),
      ...es.map((e) =>
        csvFields
          .map((k) => {
            let v = e[k as keyof Entry];
            if (
              [
                "amount",
                "purchasePrice",
                "payment",
                "target",
                "monthly",
              ].includes(k)
            )
              v = (Number(v) / 100).toFixed(2).replace(".", ",");
            if (k === "occurrenceStatuses") v = JSON.stringify(v);
            if (k === "occurrenceAmounts") v = JSON.stringify(v);
            return safe(String(v));
          })
          .join(";"),
      ),
    ].join("\r\n")
  );
}
export function csvEntry(
  row: string[],
  map: Record<string, number>,
  transactionKind?: "incomes" | "expenses",
): Entry {
  if (!(map.date >= 0))
    throw Error("Päivämääräsarake puuttuu. Yhdistä se ennen tuontia.");
  let get = (k: string) => (map[k] >= 0 ? row[map[k]] || "" : "");
  let d = get("date");
  if (!d.trim()) throw Error("Päivämäärä puuttuu.");
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(d)) {
    let [day, m, y] = d.split(".");
    d = `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  let amount = money(get("amount"));
  if (transactionKind === "expenses" && amount < 0) amount = Math.abs(amount);
  else if (transactionKind === "incomes" && amount < 0)
    throw Error("Miinusmerkkinen summa näyttää menolta. Tuo se Menot-näkymään.");
  let e = entry({
    name: get("name"),
    amount,
    category: get("category") || "Muu",
    date: d,
  });
  for (let k of csvFields) {
    let v = get(k);
    if (!v || ["name", "amount", "category", "date"].includes(k)) continue;
    if (["purchasePrice", "payment", "target", "monthly"].includes(k))
      (e as any)[k] = money(v);
    else if (k === "occurrenceStatuses" || k === "occurrenceAmounts")
      (e as any)[k] = JSON.parse(v);
    else if (["quantity", "ownership", "rate"].includes(k))
      (e as any)[k] = Number(v.replace(",", "."));
    else if (["liquid", "active", "essential"].includes(k))
      (e as any)[k] = v === "true";
    else (e as any)[k] = v;
  }
  validateEntry(e);
  return e;
}
export function download(
  text: string,
  name: string,
  type = "application/json",
) {
  let url = URL.createObjectURL(new Blob([text], { type })),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
