import { validDate } from "../calculations";
import { receiptDraftSchema, type ReceiptDraft, type ReceiptLine, type ReceiptSource } from "./schema";

export interface ReceiptTextPage { page: number; lines: string[] }
const amountPattern = /(?<![\p{L}\p{N}.,-])(-?(?:\d{1,3}(?:[ \u00a0]\d{3})+|\d+)[,.]\d{2})(-)?\s*(?:EUR|€)?\s*\*?\s*$/iu;
function amountAtEnd(text: string) {
  const match = amountPattern.exec(text);
  if (!match) return null;
  const n = Number(match[1].replace(/[ \u00a0]/g, "").replace(",", "."));
  return { cents: Math.round(n * 100) * (match[2] ? -1 : 1), index: match.index };
}
const merchantPattern = /\b(?:PRISMA|S[ -]MARKET|ALEPA|SALE|K[ -](?:CITYMARKET|SUPERMARKET|MARKET))\b/i;
const headerPattern = /^\s*\*?\s*K\s*(\d+)\s+M\s*(\d+)\s*\/\s*(\d+)/;
const plain = (s: string) => s.trim().replace(/^\*+\s*/, "").replace(/\s*\*+$/, "").trim();
const isSeparator = (s: ReceiptSource) => /^[-=]{3,}$/.test(s.text.trim());
const isTotal = (s: ReceiptSource) => /^YHTEENSÄ(?:\s|$)/i.test(plain(s.text));
function isKProductStart(source: ReceiptSource) {
  const text = source.text.trim(), semantic = plain(text);
  if (/^PLUSSA-TASAERÄ\b/i.test(semantic)) return true;
  if (/^(?:NORM\.|KAMPANJA|PLUSSA-ETU|ALV|VERO|KORTTI|DEBIT|BONUS|YHTEENSÄ)\b/i.test(semantic)) return false;
  const amount = amountAtEnd(text);
  return !!amount && /[\p{L}]/u.test(text.slice(0, amount.index));
}
function category(name: string): string | null {
  if (/pantti|muovikassi|paperikassi/i.test(name)) return "Päivittäistavara";
  if (/suihkusaip|saippua|silmälasipyyh|pesukinnas|hammastahn|hammasharj|hammaslank|terveysside|nenäliina|wc.paper|shampoo/i.test(name)) return "Hygieniatarvikkeet";
  if (/petroleum jelly|meikki|huulipun|ripsiväri|kasvovoide|kangasnaamio/i.test(name)) return "Kosmetiikka";
  if (/yötutti|tuttipullo|vaippa/i.test(name)) return "Lapset ja perhe";
  if (/nilkkuri|leggins|leggings|pyjama|trikoopaita|potkupuku|lippis|hiuspanta|sukka|housu|rukkaset|fleecekauluri/i.test(name)) return "Vaatteet";
  if (/piltti|maito|juusto|jogurtti|nakki|leikkele|peruna|omena|banaani|kurkku|tomaatti|purjo|salaatti|tilli|suola|curry|pippuri|kerma|rae |arkirae|apetina|jauheliha|seiti|lasagn|couscous|maissinaksu|nuud|pizza|ristorante|fazer|paahto|reissumies|välipal|sose|celsius|appelsiini|om\/must|porkkana|leipä|kahvi|smoothie|päärynäjuoma|burgeri|pepperoni|kebab|no sugar|cola sokeriton|proteiinipirtelö|proteiinipatukka|maissisnacks|kasvis.karj|kasvis.kalkkuna|sips poimu|dipmix|dippi|glassstrut|kermaviili/i.test(name)) return "Ruoka";
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
  if (pages.length > 50 || pages.some(p => !Number.isInteger(p.page) || p.page < 1 || p.page > 50 || p.lines.length > 10000) || new Set(pages.map(p => p.page)).size !== pages.length || pages.reduce((n, p) => n + p.lines.join("").length, 0) > 200000) throw Error("Kuitin tekstimäärä tai sivutiedot ylittävät käsittelyrajan.");
  const sources: ReceiptSource[] = [...pages].sort((a, b) => a.page - b.page).flatMap(p => p.lines.map((text, i) => ({ page: p.page, line: i + 1, text: text.normalize("NFKC").replace(/[\u00a0\u202f\u2009]/g, " ").replace(/[−–]/g, "-").trimEnd() })).filter(s => s.text.trim()));
  const header = sources.findIndex(s => headerPattern.test(s.text));
  const merchant = plain(sources.slice(0, header < 0 ? 8 : header).find(s => merchantPattern.test(s.text))?.text || "").replace(/\s+/g, " ");
  const chain = /\b(?:PRISMA|S[ -]MARKET|SALE|ALEPA)\b/i.test(merchant) ? "s" : /\bK[ -](?:CITYMARKET|SUPERMARKET|MARKET)\b/i.test(merchant) ? "k" : "unknown";
  // The date must be near the transaction header, never a footer, an offer or an arbitrary PDF date.
  const dateSources = header < 0 ? [] : [sources[header]];
  if (header >= 0) for (const s of sources.slice(header + 1, header + 4)) {
    if (!/^(?:\d{1,2}\s*\.\s*\d{1,2}\s*\.\s*20\d{2}(?:\s+\d{1,2}[:.]\d{2})?|\d{1,2}[:.]\d{2})$/.test(plain(s.text))) break;
    dateSources.push(s);
  }
  const dateSource = dateSources.map(s => s.text).join(" ");
  const d = /\b(\d{1,2})\s*\.\s*(\d{1,2})\s*\.\s*(20\d{2})\b/.exec(dateSource);
  const date = d ? `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}` : "";
  const h = header >= 0 ? headerPattern.exec(sources[header].text) : null;
  const receiptId = h ? `K${h[1]} M${h[2]}/${h[3]}` : "";
  const draft: ReceiptDraft = { parserVersion: "receipt-2", chain, merchant, receiptId, date: validDate(date) ? date : "", currency: "EUR", total: null, lines: [], issues: [] };
  const issue = (code: string, message: string, blocking = true, source?: ReceiptSource) => { if (draft.issues.length < 199) draft.issues.push({ code, message, blocking, ...(source ? { source } : {}) }); };
  if (chain === "unknown" || header < 0) { issue("unsupported", "Kuitin kauppaa tai rakennetta ei tunnistettu. Testatut kaupat ovat Prisma, S-market, Alepa ja K-Citymarket."); return receiptDraftSchema.parse(draft); }
  if (!draft.date) issue("date", "Kuitin ostopäivä puuttuu tai on virheellinen.");
  // Find the purchase block from receipt structure before looking at any amounts.
  // K items follow the transaction header and stop at the dashed rule; S receipts
  // mark product rows and the total with asterisks. Header/footer amounts are not items.
  const totalSourceIndex = sources.findIndex((s, i) => i > header && isTotal(s));
  let itemStart = -1, itemEnd = totalSourceIndex >= 0 ? totalSourceIndex : sources.length;
  const dateRowSet = new Set(dateSources.slice(1));
  if (chain === "k") {
    // K item rows follow the transaction header. End at the closing rule when
    // present; some K layouts omit it, in which case the explicit YHTEENSÄ row
    // is the boundary. The uploaded K-Citymarket receipt has no opening rule.
    let closingRule = -1;
    for (let i = itemEnd - 1; i > header; i--) if (isSeparator(sources[i])) { closingRule = i; break; }
    if (closingRule > header) itemEnd = closingRule;
    if (itemEnd > header) {
      itemStart = sources.findIndex((s, i) => i > header && i < itemEnd && !dateRowSet.has(s) && isKProductStart(s));
    }
  } else {
    itemStart = sources.findIndex((s, i) => i > header && i < itemEnd && /^\s*\*/.test(s.text) && !isTotal(s));
  }
  if (itemStart < 0) {
    if (totalSourceIndex >= 0) draft.total = amountAtEnd(plain(sources[totalSourceIndex].text))?.cents ?? null;
    issue("structure", "Kuitin tuotealuetta ei voitu rajata luotettavasti sen rakennerajoista. Tarkista PDF; tallennus estetään.");
    return receiptDraftSchema.parse(draft);
  }
  const finished = totalSourceIndex >= 0;
  if (totalSourceIndex >= 0) draft.total = amountAtEnd(plain(sources[totalSourceIndex].text))?.cents ?? null;
  let last: ReceiptLine | undefined;
  let kBundle: number[] | null = null;
  let sBundle: ReceiptLine | null = null;
  let sBundleDetails = false;
  const quantityEvidence = new Map<string, { expected: number; source: ReceiptSource }>();
  let pendingName: ReceiptSource | null = null;
  function add(name: string, net: number, source: ReceiptSource) {
    const kind = net < 0 ? "refund" : /pantti/i.test(name) ? "deposit" : /kassi/i.test(name) ? "bag" : "product";
    const line: ReceiptLine = { id: `p${source.page}-l${source.line}`, name, quantity: null, unit: null, gross: net, discount: 0, net, kind, suggestedCategory: category(name), source: [source] };
    draft.lines.push(line); last = line;
    if (net < 0) issue("refund", "Kuitti sisältää palautuksen. Tämä tuontiversio ei vielä kirjaa kuluhyvityksiä.");
    if (kBundle) kBundle.push(draft.lines.length - 1);
    return line;
  }
  for (const source of sources.slice(itemStart, itemEnd)) {
    const t = source.text.trim(), semantic = plain(t);
    if (dateRowSet.has(source)) continue;
    if (isSeparator(source)) continue;
    if (pendingName) {
      if (!t.startsWith("*") && !/^(?:NORM\.|KAMPANJA|PLUSSA|ALV|KORTTI)/i.test(semantic) && amountAtEnd(t)) {
        const a = amountAtEnd(t)!;
        const line = add(`${plain(pendingName.text)} ${t.slice(0, a.index).trim()}`.trim(), a.cents, pendingName);
        line.source.push(source); pendingName = null; continue;
      }
      issue("unknown-row", "Tuotteen jatkoriviltä puuttuu tunnistettava hinta.", true, pendingName); pendingName = null;
    }
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
    if (chain === "s" && /^NORM\./i.test(semantic)) {
      const gross = amountAtEnd(t)?.cents;
      if (!last || gross === undefined || gross === null || gross < last.net) issue("normal-price", "Normaalihinnan ja maksetun hinnan yhteys on tarkistettava.");
      else { last.gross = gross; last.source.push(source); }
      continue;
    }
    if (chain === "s" && /^KAMPANJA\b/i.test(semantic)) {
      const discount = amountAtEnd(t)?.cents;
      if (!last || discount === null || discount === undefined || discount >= 0) issue("campaign", "Kampanja-alennusta ei voitu tulkita.");
      else { last.discount += -discount; last.source.push(source); if (last.gross - last.discount !== last.net) issue("campaign", "Kampanjan normaalihinta, alennus ja maksettu hinta eivät täsmää."); }
      continue;
    }
    // S-ryhmän tarjousotsikon hinta on JO maksettu summa. Sisärivit eivät ole uusia ostoksia.
    if (chain === "s" && /^TASAERÄ(?:\s|$)/i.test(semantic)) {
      const a = amountAtEnd(t);
      if (!a) { issue("bundle", "Tarjouspaketin loppusumma puuttuu."); continue; }
      sBundle = add(t.slice(1, a.index).trim(), a.cents, source); sBundle.suggestedCategory = null; sBundleDetails = false; continue;
    }
    if (chain === "s" && sBundle && /^\*/.test(t) && !amountAtEnd(t) && !sBundleDetails) {
      sBundle.name = t.replace(/^\*|\*$/g, "").trim(); sBundle.suggestedCategory = category(sBundle.name); sBundle.source.push(source); sBundleDetails = true; continue;
    }
    const quantity = /^(\d+(?:[,.]\d+)?)\s*(KPL|KG|L)\s+([\d,.]+)\s*€\s*\/\s*(KPL|KG|L)(?:\s+([\d,.]+))?\s*\*?$/i.exec(t);
    if (quantity && last) {
      last.quantity = Number(quantity[1].replace(",", ".")); last.unitPrice = Math.round(Number(quantity[3].replace(",", ".")) * 100); last.unit = quantity[2].toLowerCase() as "kpl" | "kg" | "l"; last.source.push(source);
      if (quantity[2].toLowerCase() !== quantity[4].toLowerCase()) issue("quantity-unit", "Määrän ja yksikköhinnan yksiköt eivät vastaa toisiaan.", true, source);
      quantityEvidence.set(last.id, { expected: Math.round(last.quantity * last.unitPrice), source });
      if (sBundle === last && quantity[5]) { last.gross = Math.round(Number(quantity[5].replace(",", ".")) * 100); }
      continue;
    }
    if ((chain === "s" && t.startsWith("*")) || chain === "k") {
      const a = amountAtEnd(t);
      if (a) {
        const name = t.slice(0, a.index).replace(/^\*/, "").trim();
        if (!name || /^(ALV|VERO|KORTTI|DEBIT|PLUSSA|BONUS|NORM|KAMPANJA)\b/i.test(name)) { issue("unknown-row", "Kuitin erittelyssä on tunnistamaton raharivi."); continue; }
        if (sBundle && !sBundleDetails) issue("bundle", "Tarjouspaketin tuote-erittely puuttuu.");
        sBundle = null; sBundleDetails = false; add(name, a.cents, source); continue;
      }
    }
    if (chain === "s" && t.startsWith("*") && !amountAtEnd(t) && /[\p{L}]/u.test(semantic) && !/[?]/.test(t)) { pendingName = source; continue; }
    issue("unknown-row", `Tuoteriviä ei tunnistettu (sivu ${source.page}, rivi ${source.line}). Tarkista PDF:n rakenne.`, true, source);
  }
  if (pendingName) issue("unknown-row", "Tuotteen nimi löytyi, mutta hinta puuttuu.", true, pendingName);
  for (const line of draft.lines) {
    if (line.gross - line.discount !== line.net) issue("line-arithmetic", "Tuotteen normaalihinta, alennus ja maksettu hinta eivät täsmää.", true, line.source[0]);
    const q = quantityEvidence.get(line.id);
    if (q && q.expected !== line.gross && q.expected !== line.net) issue("quantity-price", "Tuotemäärä × yksikköhinta ei vastaa rivi- tai normaalihintaa. Tarkista erittely.", true, q.source);
  }
  if (totalSourceIndex >= 0) {
    const footer = sources.slice(totalSourceIndex + 1);
    if (footer.some(s => headerPattern.test(s.text))) issue("multiple-receipts", "PDF sisältää useamman ostoksen. Tuo kuitit erillisinä tiedostoina.");
    for (const source of footer) if (/^YHTEENSÄ(?:\s|$)/i.test(plain(source.text))) {
      const amount = amountAtEnd(plain(source.text));
      if (amount && amount.cents !== draft.total) issue("footer-total", "Ostosten ja ALV-yhteenvedon loppusummat eroavat.", true);
    }
    // A single debit payment can cross-check the purchase. Split tenders require their own adapter.
    const payments = footer.filter(s => /^Debit\s*\/\s*Veloitus\b/i.test(plain(s.text)));
    const splitTender = footer.some(s => /käteinen|cash|lahjakort|gift.card|maksutavat/i.test(s.text));
    if (payments.length === 1 && !splitTender) {
      const amount = amountAtEnd(plain(payments[0].text));
      if (amount && amount.cents !== draft.total) issue("payment-total", "Ostosten ja korttiveloituksen summat eroavat.");
    }
  }
  if (sBundle && !sBundleDetails) issue("bundle", "Tarjouspaketin tuote-erittely puuttuu.");
  if (!finished || draft.total === null) issue("total", "Maksettava loppusumma puuttuu.");
  if (kBundle?.length) issue("bundle", "Tarjousryhmältä puuttuu alennusrivi.");
  if (!draft.lines.length) issue("lines", "Kuitista ei löytynyt tuoterivejä.");
  const sum = draft.lines.reduce((n, l) => n + l.net, 0);
  if (draft.total !== null && sum !== draft.total) issue("reconciliation", `Tuoterivien ja loppusumman erotus on ${((sum - draft.total) / 100).toFixed(2).replace(".", ",")} €. Tuonti on estetty.`);
  return receiptDraftSchema.parse(draft);
}
