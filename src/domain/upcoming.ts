import type { Entry } from './model';
import { occurrenceAmount, occurrencesWithStatus } from './calculations';

/** Individual planned occurrences, ordered by their actual scheduled day. */
export function upcomingExpenses(expenses: Entry[], month: string) {
  return expenses.flatMap(item => occurrencesWithStatus(item, month, 'planned').map(date => ({
    id: item.id, name: item.name, date, amount: occurrenceAmount(item, date),
  }))).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, 'fi') || a.id.localeCompare(b.id));
}
