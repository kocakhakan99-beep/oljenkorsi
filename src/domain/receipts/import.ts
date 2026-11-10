import { optionalCategoryDefinitions } from "../categories";
import { entry, uid, today, type State, type Entry } from "../model";
import { occurrenceAmount, occurrenceStatus, scheduledOccurrences, validDate } from "../calculations";
import { receiptDraftSchema, receiptImportSchema, type ReceiptDraft, type ReceiptImport } from "./schema";

export function receiptCategoryOptions(s: State) {
  const options = s.categories.filter(c => c.kind === "expenses" && !c.archived);
  return [...options, ...optionalCategoryDefinitions.filter(c => c.kind === "expenses" && !options.some(o => o.name === c.name)).map(c => ({ ...c, id: `optional-${c.name}`, archived: false }))];
}
export const receiptKey = (d: ReceiptDraft) => [d.chain, d.merchant.toLocaleLowerCase("fi-FI").replace(/\s+/g, " ").trim(), d.receiptId, d.date, d.total].join("|");
export function duplicateReceipt(s: State, draft: ReceiptDraft, hash: string) {
  const key = receiptKey(draft);
  return (s.receiptImports || []).some(g => g.sourceHash === hash || g.semanticKey === key);
}
export function receiptMatches(s: State, draft: ReceiptDraft): Entry[] {
  if (!draft.date || draft.total === null) return [];
  return s.expenses.filter(e => e.active && scheduledOccurrences(e, draft.date.slice(0, 7)).includes(draft.date) && occurrenceStatus(e, draft.date) !== "skipped" && occurrenceAmount(e, draft.date) === draft.total);
}
export function receiptCategoryTotals(draft: ReceiptDraft, categories: Record<string, string>) {
  const result = new Map<string, number>();
  for (const line of draft.lines) {
    const name = categories[line.id] || "";
    result.set(name, (result.get(name) || 0) + line.net);
  }
  return result;
}
export function validateReceiptGroup(group: ReceiptImport) {
  const d = group.draft;
  if (!d.date || !validDate(d.date) || d.total === null || d.total <= 0 || d.chain === "unknown" || !d.merchant || !d.receiptId || !d.lines.length || d.issues.some(i => i.blocking)) throw Error("Kuitti ei ole valmis kirjattavaksi.");
  if (new Set(d.lines.map(l => l.id)).size !== d.lines.length) throw Error("Kuittirivien tunnisteet toistuvat.");
  if (d.lines.some(l => l.net < 0 || l.gross - l.discount !== l.net || !group.categories[l.id])) throw Error("Tuotteiden luokittelu tai alennuserittely on virheellinen.");
  if (d.lines.some(l => l.unitPrice != null && (l.quantity === null || l.unit === null || ![l.gross, l.net].includes(Math.round(l.quantity * l.unitPrice))))) throw Error("Tuotteen määrä ja yksikköhinta eivät täsmää kuittierittelyyn.");
  if (d.lines.reduce((n, l) => n + l.net, 0) !== d.total) throw Error("Tuoterivit eivät täsmää kuitin loppusummaan.");
  if (group.semanticKey !== receiptKey(d)) throw Error("Kuitin tunniste ei vastaa erittelyä.");
}
export function prepareReceiptImport(s: State, draftRaw: ReceiptDraft, hash: string, categories: Record<string, string>, options: { replaceEntryId?: string; allowSeparatePurchase?: boolean; clearActuals?: boolean; checked: boolean }): State {
  const draft = receiptDraftSchema.parse(draftRaw);
  if (!options.checked) throw Error("Tarkista kirjaukset ennen hyväksyntää.");
  if (duplicateReceipt(s, draft, hash)) throw Error("Tämä kuitti on jo tuotu. Uutta kirjausta ei tehty.");
  const allowed = new Set(receiptCategoryOptions(s).map(c => c.name));
  if (draft.lines.some(l => !allowed.has(categories[l.id]))) throw Error("Valitse jokaiselle tuotteelle käytössä oleva menokategoria.");
  const totals = receiptCategoryTotals(draft, categories), month = draft.date.slice(0, 7);
  const matches = receiptMatches(s, draft);
  if (matches.length && !options.replaceEntryId && !options.allowSeparatePurchase) throw Error("Samalle päivälle löytyy samansuuruinen maksu. Valitse täsmäytys tai vahvista eri ostos.");
  if (options.replaceEntryId && !matches.some(e => e.id === options.replaceEntryId)) throw Error("Täsmäytettävä maksu on muuttunut. Tarkista valinta uudelleen.");
  const affectedCategories = new Set([...totals.keys(), ...matches.filter(e => e.id === options.replaceEntryId).map(e => e.category)]);
  for (const name of affectedCategories) if (s.budgetActuals[month]?.[name] !== undefined && !options.clearActuals) throw Error("Kategoriassa on käsin asetettu toteuma. Hyväksy paluu kirjauksista laskettavaan toteumaan.");
  const groupId = uid();
  const entries = [...totals].filter(([, amount]) => amount > 0).map(([category, amount]) => entry({ name: `${draft.merchant} · ${category}`.slice(0, 200), category, amount, date: draft.date, status: draft.date <= today() ? "actual" : "planned", recurrence: "once", description: `Kuittituonti ${groupId}. ${draft.lines.filter(l => categories[l.id] === category).map(l => l.name).join("; ")}`.slice(0, 2000), essential: ["Ruoka", "Päivittäistavara", "Hygieniatarvikkeet", "Lapset ja perhe"].includes(category) }));
  const group = receiptImportSchema.parse({ id: groupId, sourceHash: hash, semanticKey: receiptKey(draft), importedAt: new Date().toISOString(), draft, categories, entryIds: entries.map(e => e.id) });
  validateReceiptGroup(group);
  const expenses = s.expenses.flatMap(e => {
    if (e.id !== options.replaceEntryId) return [e];
    if (e.recurrence === "once") return [];
    return [{ ...e, occurrenceStatuses: { ...e.occurrenceStatuses, [draft.date]: "skipped" as const }, updatedAt: new Date().toISOString() }];
  });
  const budgetActuals = structuredClone(s.budgetActuals);
  if (options.clearActuals && budgetActuals[month]) for (const name of affectedCategories) delete budgetActuals[month][name];
  const selectedNames = new Set(totals.keys());
  const nextCategories = s.categories.map(c => c.kind === "expenses" && selectedNames.has(c.name) ? { ...c, archived: false } : c);
  for (const definition of optionalCategoryDefinitions) if (definition.kind === "expenses" && selectedNames.has(definition.name) && !nextCategories.some(c => c.kind === "expenses" && c.name === definition.name)) nextCategories.push({ ...definition, id: uid(), archived: false });
  return { ...s, categories: nextCategories, expenses: [...expenses, ...entries], receiptImports: [...(s.receiptImports || []), group], budgetActuals,
    coverage: { ...s.coverage, expenseMonths: s.coverage.expenseMonths.filter(m => m !== month) } };
}
