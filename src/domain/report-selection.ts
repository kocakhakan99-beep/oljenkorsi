import type { State, Entry } from "./model";
import type { ReportSelection, ReportDetailEntry } from "./report-model";
import {
  occurrencesWithStatus,
  occurrenceAmount,
  expenseType,
  budgetSummary,
} from "./calculations";

export function reportSelection(
  s: State,
  history: { key: string }[],
  selectedReport: ReportSelection | null,
) {
  const periodEntries = (
    items: Entry[],
    kind: "income" | "expense",
  ): ReportDetailEntry[] => {
    const grouped = new Map<string, ReportDetailEntry>();
    for (const period of history) {
      for (const record of items) {
        const dates = occurrencesWithStatus(record, period.key, "actual");
        if (!dates.length) continue;
        const key = `${kind}-${record.id}`;
        const previous = grouped.get(key);
        grouped.set(key, {
          entry: record,
          kind,
          amount:
            (previous?.amount || 0) +
            dates.reduce(
              (amount, date) => amount + occurrenceAmount(record, date),
              0,
            ),
          occurrences: (previous?.occurrences || 0) + dates.length,
        });
      }
    }
    return [...grouped.values()];
  };
  const selectedReportEntries: ReportDetailEntry[] =
    selectedReport?.type === "period"
      ? selectedReport.metric === "income"
        ? periodEntries(s.incomes, "income")
        : selectedReport.metric === "expense"
          ? periodEntries(s.expenses, "expense")
          : [
              ...periodEntries(s.incomes, "income"),
              ...periodEntries(s.expenses, "expense"),
            ]
      : selectedReport?.type === "month" || selectedReport?.type === "budget"
        ? (selectedReport.type === "budget"
            ? s.expenses.filter(
                (item) =>
                  expenseType(item) === "consumption" &&
                  (s.budgets[selectedReport.month]?.[item.category] || 0) > 0,
              )
            : selectedReport.metric === "income"
              ? s.incomes
              : s.expenses
          )
            .filter(
              (e) =>
                occurrencesWithStatus(e, selectedReport.month, "actual")
                  .length > 0,
            )
            .map((e) => {
              const dates = occurrencesWithStatus(
                e,
                selectedReport.month,
                "actual",
              );
              return {
                entry: e,
                kind:
                  selectedReport.type === "budget"
                    ? ("expense" as const)
                    : selectedReport.metric,
                amount: dates.reduce(
                  (amount, date) => amount + occurrenceAmount(e, date),
                  0,
                ),
              };
            })
        : selectedReport?.type === "category"
          ? s.expenses
              .filter(
                (e) =>
                  e.category === selectedReport.category &&
                  expenseType(e) === "consumption",
              )
              .map((e) => {
                const dates = history.flatMap((period) =>
                  occurrencesWithStatus(e, period.key, "actual"),
                );
                return {
                  entry: e,
                  kind: "expense" as const,
                  amount: dates.reduce(
                    (amount, date) => amount + occurrenceAmount(e, date),
                    0,
                  ),
                  occurrences: dates.length,
                };
              })
              .filter((item) => item.occurrences > 0)
          : selectedReport?.type === "day"
            ? [
                ...s.incomes
                  .filter((e) =>
                    history.some((period) =>
                      occurrencesWithStatus(e, period.key, "actual").includes(
                        selectedReport.date,
                      ),
                    ),
                  )
                  .map((e) => ({
                    entry: e,
                    kind: "income" as const,
                    amount: occurrenceAmount(e, selectedReport.date),
                  })),
                ...s.expenses
                  .filter((e) =>
                    history.some((period) =>
                      occurrencesWithStatus(e, period.key, "actual").includes(
                        selectedReport.date,
                      ),
                    ),
                  )
                  .map((e) => ({
                    entry: e,
                    kind: "expense" as const,
                    amount: occurrenceAmount(e, selectedReport.date),
                  })),
              ]
            : [];
  const selectedReportTotal =
    selectedReport?.type === "budget"
      ? selectedReport.actual
      : selectedReport?.type === "period" && selectedReport.metric === "cash"
        ? selectedReportEntries.reduce(
            (value, item) =>
              value + (item.kind === "income" ? item.amount : -item.amount),
            0,
          )
        : selectedReportEntries.reduce((value, item) => value + item.amount, 0);
  const selectedBudgetSummary =
    selectedReport?.type === "budget"
      ? budgetSummary(s, selectedReport.month)
      : null;

  return { selectedReportEntries, selectedReportTotal, selectedBudgetSummary };
}
