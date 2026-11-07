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
export function csvEntry(row: string[], map: Record<string, number>): Entry {
  let get = (k: string) => (map[k] >= 0 ? row[map[k]] || "" : "");
  let d = get("date");
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(d)) {
    let [day, m, y] = d.split(".");
    d = `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  let e = entry({
    name: get("name"),
    amount: money(get("amount")),
    category: get("category") || "Muu",
    date: d || entry().date,
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
