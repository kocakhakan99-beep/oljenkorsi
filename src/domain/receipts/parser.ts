import { validDate } from "../calculations";
import { receiptDraftSchema, type ReceiptDraft, type ReceiptLine, type ReceiptSource } from "./schema";

export interface ReceiptTextPage { page: number; lines: string[] }
const amountPattern = /(-?(?:\d{1,3}(?:[ \u00a0]\d{3})+|\d+)[,.]\d{2})(-)?\s*(?:EUR|€)?\s*\*?\s*$/i;
function amountAtEnd(text: string) {
  const match = amountPattern.exec(text);
  if (!match) return null;
  const n = Number(match[1].replace(/[ \u00a0]/g, "").replace(",", "."));
  return { cents: Math.round(n * 100) * (match[2] ? -1 : 1), index: match.index };
}
function category(name: string): string | null {
  if (/pantti|muovikassi|paperikassi/i.test(name)) return "Päivittäistavara";
  if (/suihkusaip|saippua|silmälasipyyh|pesukinnas|hammastahn|hammasharj|wc.paper|shampoo/i.test(name)) return "Hygieniatarvikkeet";
  if (/petroleum jelly|meikki|huulipun|ripsiväri|kasvovoide/i.test(name)) return "Kosmetiikka";
  if (/nilkkuri|leggins|leggings|pyjama|trikoopaita|potkupuku|lippis|hiuspanta|sukka|housu/i.test(name)) return "Vaatteet";
  if (/yötutti|tuttipullo|vaippa/i.test(name)) return "Lapset ja perhe";
  if (/piltti|maito|juusto|jogurtti|nakki|leikkele|peruna|omena|banaani|kurkku|tomaatti|purjo|salaatti|tilli|suola|curry|pippuri|kerma|rae |arkirae|apetina|jauheliha|seiti|lasagn|couscous|maissinaksu|nuud|pizza|ristorante|fazer|paahto|reissumies|välipal|sose|celsius|appelsiini|om\/must|porkkana|leipä|kahvi/i.test(name)) return "Ruoka";
  return null;
}
/** Deterministic largest-remainder allocation: a discount never disappears in rounding. */
export function allocateDiscount(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!Number.isSafeInteger(total) || total < 0 || total > sum || !Number.isSafeInteger(sum) || weights.some(w => !Number.isSafeInteger(w) || w < 0)) throw Error("Alennusta ei voi kohdistaa tuotteille.");
  if (!sum) return weights.map(() => 0);
  const numerator = BigInt(total), denominator = BigInt(sum);
  const values = weights.map(w => Number(numerator * BigInt(w) / denominator));
  const order = weights.map((w, i) => ({ i, remainder: numerator * BigInt(w) % denominator })).sort((a, b) => a.remainder === b.remainder ? a.i - b.i : a.remainder > b.remainder ? -1 : 1);
  for (let left = total - values.reduce((a, b) => a + b, 0), i = 0; left > 0; left--, i++) values[order[i].i]++;
  return values;
}
export function parseReceipt(pages: ReceiptTextPage[]): ReceiptDraft {
  if (pages.length > 50 || pages.reduce((n, p) => n + p.lines.join("").length, 0) > 200000) throw Error("Kuitin tekstimäärä ylittää käsittelyrajan.");
  const sources: ReceiptSource[] = pages.flatMap(p => p.lines.map((text, i) => ({ page: p.page, line: i + 1, text: text.replace(/\u00a0/g, " ").replace(/[−–]/g, "-").trimEnd() })).filter(s => s.text.trim()));
  const text = sources.map(s => s.text).join("\n");
  const chain = /PRISMA|S-MARKET|SALE\b|ALEPA\b/i.test(text) ? "s" : /K-(?:CITYMARKET|SUPERMARKET|MARKET)/i.test(text) ? "k" : "unknown";
  const merchant = sources.find(s => /PRISMA|S-MARKET|SALE\b|ALEPA\b|K-(?:CITYMARKET|SUPERMARKET|MARKET)/i.test(s.text))?.text.replace(/\*/g, "").trim() || "";
  const header = sources.findIndex(s => /\bK\d+\s+M\d+\/\d+/.test(s.text));
  const dateSource = header >= 0 ? sources[header].text : "";
  const d = /\b(\d{1,2})\.(\d{1,2})\.(20\d{2})\b/.exec(dateSource);
  const date = d ? `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}` : "";
  const receiptId = /\b(K\d+)\s+(M\d+\/\d+)/.exec(dateSource)?.slice(1).join(" ") || "";
  const draft: ReceiptDraft = { parserVersion: "receipt-1", chain, merchant, receiptId, date: validDate(date) ? date : "", currency: "EUR", total: null, lines: [], issues: [] };
  const issue = (code: string, message: string, blocking = true) => { if (draft.issues.length < 199) draft.issues.push({ code, message, blocking }); };
  if (chain === "unknown" || header < 0) { issue("unsupported", "Kuitin kauppaa tai rakennetta ei tunnistettu. Tuettuina ovat testatut Prisma- ja K-kaupan tekstikuitit."); return receiptDraftSchema.parse(draft); }
  if (!draft.date) issue("date", "Kuitin ostopäivä puuttuu tai on virheellinen.");
  let started = false, finished = false;
  let last: ReceiptLine | undefined;
  let kBundle: number[] | null = null;
  let sBundle: ReceiptLine | null = null;
  let sBundleDetails = false;
  function add(name: string, net: number, source: ReceiptSource) {
    const kind = net < 0 ? "refund" : /pantti/i.test(name) ? "deposit" : /kassi/i.test(name) ? "bag" : "product";
    const line: ReceiptLine = { id: `p${source.page}-l${source.line}`, name, quantity: null, unit: null, gross: net, discount: 0, net, kind, suggestedCategory: category(name), source: [source] };
    draft.lines.push(line); last = line;
    if (net < 0) issue("refund", "Kuitti sisältää palautuksen. Tämä tuontiversio ei vielä kirjaa kuluhyvityksiä.");
    if (kBundle) kBundle.push(draft.lines.length - 1);
    return line;
  }
  for (const source of sources.slice(header + 1)) {
    const t = source.text.trim();
    if (/^YHTEENSÄ(?:\s|$)/i.test(t)) { draft.total = amountAtEnd(t)?.cents ?? null; finished = true; break; }
    if (/^-{3,}$/.test(t) || /^ASIAKASOMISTAJAN/.test(t)) continue;
    if (!started && chain === "s" && !t.startsWith("*")) continue;
    if (!started && chain === "k" && !amountAtEnd(t) && !/^PLUSSA-TASAERÄ/.test(t)) continue;
    started = true;
    if (chain === "k" && /^PLUSSA-TASAERÄ/.test(t)) { if (kBundle?.length) issue("bundle", "Tarjousryhmältä puuttuu alennusrivi."); kBundle = []; continue; }
    if (chain === "k" && /^PLUSSA-ETU\b/.test(t)) {
      const discount = amountAtEnd(t)?.cents;
      const targets = kBundle?.length ? kBundle.map(i => draft.lines[i]) : last ? [last] : [];
      if (discount === undefined || discount === null || discount >= 0 || !targets.length) issue("discount", "Plussa-alennusta ei voitu yhdistää tuotteisiin.");
      else {
        try { const parts = allocateDiscount(-discount, targets.map(l => l.net)); targets.forEach((l, i) => { l.net -= parts[i]; l.discount += parts[i]; l.source.push(source); }); }
        catch { issue("discount", "Plussa-alennus ylittää tunnistetut tuoterivit."); }
      }
      kBundle = null; continue;
    }
    if (chain === "s" && /^NORM\./.test(t)) {
      const gross = amountAtEnd(t)?.cents;
      if (!last || gross === undefined || gross === null || gross < last.net) issue("normal-price", "Normaalihinnan ja maksetun hinnan yhteys on tarkistettava.");
      else { last.gross = gross; last.source.push(source); }
      continue;
    }
    if (chain === "s" && /^KAMPANJA\b/.test(t)) {
      const discount = amountAtEnd(t)?.cents;
      if (!last || discount === null || discount === undefined || discount >= 0) issue("campaign", "Kampanja-alennusta ei voitu tulkita.");
      else { last.discount += -discount; last.source.push(source); if (last.gross - last.discount !== last.net) issue("campaign", "Kampanjan normaalihinta, alennus ja maksettu hinta eivät täsmää."); }
      continue;
    }
    // S-ryhmän tarjousotsikon hinta on JO maksettu summa. Sisärivit eivät ole uusia ostoksia.
    if (chain === "s" && /^\*TASAERÄ(?:\s|$)/.test(t)) {
      const a = amountAtEnd(t);
      if (!a) { issue("bundle", "Tarjouspaketin loppusumma puuttuu."); continue; }
      sBundle = add(t.slice(1, a.index).trim(), a.cents, source); sBundle.suggestedCategory = null; sBundleDetails = false; continue;
    }
    if (chain === "s" && sBundle && /^\*/.test(t) && !amountAtEnd(t) && !sBundleDetails) {
      sBundle.name = t.replace(/^\*|\*$/g, "").trim(); sBundle.suggestedCategory = category(sBundle.name); sBundle.source.push(source); sBundleDetails = true; continue;
    }
    const quantity = /^(\d+(?:[,.]\d+)?)\s*(KPL|KG|L)\s+([\d,.]+)\s*€\s*\/\s*(KPL|KG|L)(?:\s+([\d,.]+))?\s*\*?$/i.exec(t);
    if (quantity && last) {
      last.quantity = Number(quantity[1].replace(",", ".")); last.unit = quantity[2].toLowerCase() as "kpl" | "kg" | "l"; last.source.push(source);
      if (sBundle === last && quantity[5]) { last.gross = Math.round(Number(quantity[5].replace(",", ".")) * 100); }
      continue;
    }
    if (chain === "s" && t.startsWith("*") || chain === "k") {
      const a = amountAtEnd(t);
      if (a) {
        const name = t.slice(0, a.index).replace(/^\*/, "").trim();
        if (!name || /^(ALV|VERO|KORTTI|DEBIT|PLUSSA|BONUS|NORM|KAMPANJA)\b/i.test(name)) { issue("unknown-row", "Kuitin erittelyssä on tunnistamaton raharivi."); continue; }
        if (sBundle && !sBundleDetails) issue("bundle", "Tarjouspaketin tuote-erittely puuttuu.");
        sBundle = null; sBundleDetails = false; add(name, a.cents, source); continue;
      }
    }
    issue("unknown-row", `Tuoteriviä ei tunnistettu (sivu ${source.page}, rivi ${source.line}). Tarkista PDF:n rakenne.`);
  }
  if (sBundle && !sBundleDetails) issue("bundle", "Tarjouspaketin tuote-erittely puuttuu.");
  if (!finished || draft.total === null) issue("total", "Maksettava loppusumma puuttuu.");
  if (kBundle?.length) issue("bundle", "Tarjousryhmältä puuttuu alennusrivi.");
  if (!draft.lines.length) issue("lines", "Kuitista ei löytynyt tuoterivejä.");
  const sum = draft.lines.reduce((n, l) => n + l.net, 0);
  if (draft.total !== null && sum !== draft.total) issue("reconciliation", `Tuoterivien ja loppusumman erotus on ${((sum - draft.total) / 100).toFixed(2).replace(".", ",")} €. Tuonti on estetty.`);
  return receiptDraftSchema.parse(draft);
}
