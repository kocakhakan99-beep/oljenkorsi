import { optionalCategoryDefinitions } from "../categories";
import { entry, uid, today, type State, type Entry } from "../model";
import { occurrenceAmount, occurrenceStatus, scheduledOccurrences, validDate } from "../calculations";
import { receiptDraftSchema, type ReceiptDraft } from "./schema";

export function receiptCategoryOptions(s: State) {
  const options = s.categories.filter(c => c.kind === "expenses" && !c.archived);
  return [...options, ...optionalCategoryDefinitions.filter(c => c.kind === "expenses" && !options.some(o => o.name === c.name)).map(c => ({ ...c, id: `optional-${c.name}`, archived: false }))];
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
export function prepareReceiptImport(s: State, draftRaw: ReceiptDraft, categories: Record<string, string>, options: { replaceEntryId?: string; allowSeparatePurchase?: boolean; clearActuals?: boolean; checked: boolean }): State {
  const draft = receiptDraftSchema.parse(draftRaw);
  if (!options.checked) throw Error("Tarkista kirjaukset ennen hyväksyntää.");
  if (!draft.date || !validDate(draft.date) || draft.total === null || draft.total <= 0 || draft.chain === "unknown" || !draft.merchant || !draft.receiptId || !draft.lines.length || draft.issues.some(issue => issue.blocking)) throw Error("Kuitti ei ole valmis kirjattavaksi.");
  if (new Set(draft.lines.map(line => line.id)).size !== draft.lines.length) throw Error("Kuittirivien tunnisteet toistuvat.");
  if (draft.lines.some(line => line.net < 0 || line.gross - line.discount !== line.net)) throw Error("Tuotteiden alennuserittely on virheellinen.");
  if (draft.lines.some(line => line.unitPrice != null && (line.quantity === null || line.unit === null || ![line.gross, line.net].includes(Math.round(line.quantity * line.unitPrice))))) throw Error("Tuotteen määrä ja yksikköhinta eivät täsmää kuittierittelyyn.");
  if (draft.lines.reduce((n, line) => n + line.net, 0) !== draft.total) throw Error("Tuoterivit eivät täsmää kuitin loppusummaan.");
  const allowed = new Set(receiptCategoryOptions(s).map(c => c.name));
  if (draft.lines.some(l => !allowed.has(categories[l.id]))) throw Error("Valitse jokaiselle tuotteelle käytössä oleva menokategoria.");
  const totals = receiptCategoryTotals(draft, categories), month = draft.date.slice(0, 7);
  const matches = receiptMatches(s, draft);
  if (matches.length && !options.replaceEntryId && !options.allowSeparatePurchase) throw Error("Samalle päivälle löytyy samansuuruinen maksu. Valitse täsmäytys tai vahvista eri ostos.");
  if (options.replaceEntryId && !matches.some(e => e.id === options.replaceEntryId)) throw Error("Täsmäytettävä maksu on muuttunut. Tarkista valinta uudelleen.");
  const affectedCategories = new Set([...totals.keys(), ...matches.filter(e => e.id === options.replaceEntryId).map(e => e.category)]);
  for (const name of affectedCategories) if (s.budgetActuals[month]?.[name] !== undefined && !options.clearActuals) throw Error("Kategoriassa on käsin asetettu toteuma. Hyväksy paluu kirjauksista laskettavaan toteumaan.");
  const entries = [...totals].filter(([, amount]) => amount > 0).map(([category, amount]) => entry({ name: `${draft.merchant} · ${category}`.slice(0, 200), category, amount, date: draft.date, status: draft.date <= today() ? "actual" : "planned", recurrence: "once", essential: ["Ruoka", "Päivittäistavara", "Hygieniatarvikkeet", "Lapset ja perhe"].includes(category) }));
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
  return { ...s, categories: nextCategories, expenses: [...expenses, ...entries], budgetActuals,
    coverage: { ...s.coverage, expenseMonths: s.coverage.expenseMonths.filter(m => m !== month) } };
}
