import type { Entry, State } from "./model";

function invalidatedCoverageMonths(
  before: Entry[],
  after: Entry[],
  completed: string[],
) {
  const oldById = new Map(before.map((item) => [item.id, item]));
  const newById = new Map(after.map((item) => [item.id, item]));
  const ids = new Set([...oldById.keys(), ...newById.keys()]);
  const exact = new Set<string>();
  const cutoffs: string[] = [];
  const root = (item: Entry) => {
    const { occurrenceStatuses, occurrenceAmounts, priceHistory, source, description, tags, createdAt, updatedAt, ...fields } = item;
    void occurrenceStatuses;
    void occurrenceAmounts;
    void priceHistory;
    void source;
    void description;
    void tags;
    void createdAt;
    void updatedAt;
    return fields;
  };
  const addMonth = (date: string) => {
    if (date) exact.add(date.slice(0, 7));
  };
  for (const id of ids) {
    const oldItem = oldById.get(id);
    const newItem = newById.get(id);
    if (JSON.stringify(oldItem) === JSON.stringify(newItem)) continue;
    const oldPrices = new Map((oldItem?.priceHistory || []).map(change => [change.startDate, change.amount]));
    const newPrices = new Map((newItem?.priceHistory || []).map(change => [change.startDate, change.amount]));
    for (const date of new Set([...oldPrices.keys(), ...newPrices.keys()]))
      if (oldPrices.get(date) !== newPrices.get(date)) cutoffs.push(date.slice(0, 7));
    const oldRoot = oldItem ? JSON.stringify(root(oldItem)) : null;
    const newRoot = newItem ? JSON.stringify(root(newItem)) : null;
    if (oldRoot !== newRoot) {
      const changed = [oldItem, newItem].filter(
        (item): item is Entry => Boolean(item),
      );
      if (changed.some((item) => item.recurrence !== "once"))
        cutoffs.push(...changed.map((item) => item.date.slice(0, 7)));
      else changed.forEach((item) => addMonth(item.date));
      continue;
    }
    for (const key of new Set([
      ...Object.keys(oldItem?.occurrenceStatuses || {}),
      ...Object.keys(newItem?.occurrenceStatuses || {}),
      ...Object.keys(oldItem?.occurrenceAmounts || {}),
      ...Object.keys(newItem?.occurrenceAmounts || {}),
    ]))
      if (
        oldItem?.occurrenceStatuses[key] !== newItem?.occurrenceStatuses[key] ||
        oldItem?.occurrenceAmounts[key] !== newItem?.occurrenceAmounts[key]
      )
        addMonth(key);
  }
  return completed.filter(
    (period) =>
      !exact.has(period) && !cutoffs.some((cutoff) => period >= cutoff),
  );
}
/** Reopen affected months after edits. Explicit confirmation is handled by the caller. */
export function coverageAfterEntryChanges(previous: State, next: State): State["coverage"] {
  const manualActualMonths = new Set<string>();
  for (const period of new Set([
    ...Object.keys(previous.budgetActuals),
    ...Object.keys(next.budgetActuals),
  ])) {
    if (
      JSON.stringify(previous.budgetActuals[period] || {}) !==
      JSON.stringify(next.budgetActuals[period] || {})
    ) manualActualMonths.add(period);
  }
  const expenseMonths = new Set(invalidatedCoverageMonths(
    previous.expenses,
    next.expenses,
    previous.coverage.expenseMonths,
  ));
  for (const period of manualActualMonths) expenseMonths.delete(period);
  return {
    incomeMonths: invalidatedCoverageMonths(
      previous.incomes,
      next.incomes,
      previous.coverage.incomeMonths,
    ),
    expenseMonths: [...expenseMonths].sort(),
  };
}
