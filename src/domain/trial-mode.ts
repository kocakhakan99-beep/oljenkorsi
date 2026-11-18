import { expenseType, occurrenceAmount, occurrenceStatus, scheduledOccurrences } from "./calculations";
import type { Entry, State } from "./model";
import { shiftMonth } from "./monthly-planning";

export type TrialAdjustments = {
  monthlyIncomeDelta: number;
  monthlyConsumptionDelta: number;
  expense: null | { entryId: string; action: "remove" | "price"; amount: number };
};

export const emptyTrialAdjustments = (): TrialAdjustments => ({
  monthlyIncomeDelta: 0,
  monthlyConsumptionDelta: 0,
  expense: null,
});

function trialRelevantEntry(item: Entry) {
  return {
    id: item.id,
    amount: item.amount,
    category: item.category,
    expenseType: item.expenseType,
    date: item.date,
    endDate: item.endDate,
    recurrence: item.recurrence,
    status: item.status,
    adjustToPreviousBankDay: item.adjustToPreviousBankDay,
    occurrenceStatuses: item.occurrenceStatuses,
    occurrenceAmounts: item.occurrenceAmounts,
    active: item.active,
    priceHistory: item.priceHistory,
  };
}

export function trialBasisFingerprint(state: State) {
  const input = JSON.stringify({
    incomes: state.incomes.map(trialRelevantEntry),
    expenses: state.expenses.map(trialRelevantEntry),
  });
  let hash = 2166136261;
  for (let index = 0; index < input.length; index++) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function plannedTotal(entries: Entry[], months: string[], asOf: string, type: "income" | "consumption", adjustment?: TrialAdjustments["expense"]) {
  return months.map((month) => {
    const total = entries
      .filter(item => type === "income" || expenseType(item) === "consumption")
      .reduce((sum, item) => {
        if (adjustment?.entryId === item.id && adjustment.action === "remove") return sum;
        const occurrences = scheduledOccurrences(item, month).filter(date =>
          date >= asOf && occurrenceStatus(item, date) === "planned",
        );
        return sum + occurrences.reduce((itemTotal, date) => {
          const amount = adjustment?.entryId === item.id && adjustment.action === "price" &&
            !Object.hasOwn(item.occurrenceAmounts, date)
            ? [...(item.priceHistory || [])].reverse().find(change => change.startDate > asOf && change.startDate <= date)?.amount ?? adjustment.amount
            : occurrenceAmount(item, date);
          return itemTotal + amount;
        }, 0);
      }, 0);
    return total;
  });
}

export function trialProjection(state: State, asOf: string, adjustments: TrialAdjustments) {
  if (!Number.isSafeInteger(adjustments.monthlyIncomeDelta) || !Number.isSafeInteger(adjustments.monthlyConsumptionDelta) ||
      (adjustments.expense?.action === "price" && (!Number.isSafeInteger(adjustments.expense.amount) || adjustments.expense.amount < 0)))
    throw Error("Kokeilun summat ovat virheellisiä.");
  const months = Array.from({ length: 12 }, (_, index) => shiftMonth(asOf.slice(0, 7), index));
  const baseIncome = plannedTotal(state.incomes, months, asOf, "income");
  const baseConsumption = plannedTotal(state.expenses, months, asOf, "consumption");
  const changedConsumption = plannedTotal(state.expenses, months, asOf, "consumption", adjustments.expense);
  const scenarioIncome = baseIncome.map(value => Math.max(0, value + adjustments.monthlyIncomeDelta));
  const scenarioConsumption = changedConsumption.map(value => Math.max(0, value + adjustments.monthlyConsumptionDelta));
  const total = (values: number[]) => values.reduce((sum, value) => sum + value, 0);
  const baselineIncome = total(baseIncome);
  const baselineConsumption = total(baseConsumption);
  const adjustedIncome = total(scenarioIncome);
  const adjustedConsumption = total(scenarioConsumption);
  const baselineDisposable = baselineIncome - baselineConsumption;
  const adjustedDisposable = adjustedIncome - adjustedConsumption;
  const difference = adjustedDisposable - baselineDisposable;
  if (![baselineIncome, baselineConsumption, baselineDisposable, adjustedIncome, adjustedConsumption, adjustedDisposable, difference].every(Number.isSafeInteger))
    throw Error("Kokeilun laskettu summa ylittää turvallisen laskentarajan.");
  return {
    months,
    baseline: {
      income: baselineIncome,
      consumption: baselineConsumption,
      disposable: baselineDisposable,
      averageMonthlyDisposable: Math.round(baselineDisposable / 12),
      averageMonthlyIncome: Math.round(baselineIncome / 12),
      averageMonthlyConsumption: Math.round(baselineConsumption / 12),
    },
    adjusted: {
      income: adjustedIncome,
      consumption: adjustedConsumption,
      disposable: adjustedDisposable,
      averageMonthlyDisposable: Math.round(adjustedDisposable / 12),
      averageMonthlyIncome: Math.round(adjustedIncome / 12),
      averageMonthlyConsumption: Math.round(adjustedConsumption / 12),
    },
    maxIncomeReduction: Math.round(baselineIncome / 12),
    maxConsumptionReduction: Math.round(total(changedConsumption) / 12),
    difference,
  };
}
