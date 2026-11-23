import { budgetSummary, expenseType, occurrenceSum, sum } from "./calculations";
import { annualReserveSummary } from "./annual-planning";
import type { State } from "./model";

export function dashboardAttention(state: State, month: string, asOf: string) {
  const budget = budgetSummary(state, month).categories.flatMap(category => {
    if (category.planned <= 0) return [];
    if (category.hasManualActual) {
      const shortfall = category.actual - category.planned;
      return shortfall > 0 ? [{ category: category.category, shortfall, actualOnly: true }] : [];
    }
    const upcoming = sum(state.expenses
      .filter(item => item.category === category.category && expenseType(item) === "consumption")
      .map(item => occurrenceSum(item, month, "planned")));
    const shortfall = category.actual + upcoming - category.planned;
    return shortfall > 0 ? [{ category: category.category, shortfall, actualOnly: false }] : [];
  }).sort((a, b) => b.shortfall - a.shortfall || a.category.localeCompare(b.category, "fi"));
  const cutoff = new Date(`${asOf}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() + 60);
  const end = cutoff.toISOString().slice(0, 10);
  const reserves = annualReserveSummary(state, asOf).items.filter(item =>
    item.eligible && item.nextDue && item.nextDue.date <= end && item.shortfallForNextDue > 0,
  );
  const review = month < asOf.slice(0, 7) &&
    (!state.coverage.incomeMonths.includes(month) || !state.coverage.expenseMonths.includes(month));
  return { budget, reserves, review };
}
