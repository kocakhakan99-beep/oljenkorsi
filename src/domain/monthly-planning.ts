import { expenseType, metrics, sum, total } from "./calculations";
import type { State } from "./model";

export type BudgetCopyMode = "fill-missing" | "replace";

function validMonth(month: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) return false;
  const year = Number(month.slice(0, 4));
  return year >= 1900 && year <= 2200;
}

export function shiftMonth(month: string, offset: number) {
  if (!validMonth(month) || !Number.isInteger(offset)) {
    throw Error("Tarkista kuukaudet.");
  }
  const [year, monthNumber] = month.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, monthNumber - 1 + offset, 1));
  const result = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
  if (!validMonth(result)) throw Error("Kuukausi on sallitun aikavälin ulkopuolella.");
  return result;
}

export type MonthComparison = {
  month: string;
  previousMonth: string;
  income: { current: number; previous: number; change: number };
  consumption: { current: number; previous: number; change: number };
  afterConsumption: { current: number; previous: number; change: number };
  categories: Array<{ name: string; current: number; previous: number; change: number }>;
  currentConfirmed: boolean;
  previousConfirmed: boolean;
  currentIsOpen: boolean;
  isFuture: boolean;
};

export function monthComparison(
  state: State,
  month: string,
  asOf: string,
): MonthComparison {
  if (!validMonth(month) || !/^\d{4}-\d{2}-\d{2}$/.test(asOf)) {
    throw Error("Kuukausivertailua ei voitu laskea.");
  }
  const previousMonth = shiftMonth(month, -1);
  const currentMetrics = metrics(state, month);
  const previousMetrics = metrics(state, previousMonth);
  const currentCategoryAmounts = new Map<string, number>();
  const previousCategoryAmounts = new Map<string, number>();

  for (const item of state.expenses) {
    if (expenseType(item) !== "consumption") continue;
    currentCategoryAmounts.set(
      item.category,
      (currentCategoryAmounts.get(item.category) || 0) + total([item], month, true),
    );
    previousCategoryAmounts.set(
      item.category,
      (previousCategoryAmounts.get(item.category) || 0) + total([item], previousMonth, true),
    );
  }

  const categories = [...new Set([
    ...currentCategoryAmounts.keys(),
    ...previousCategoryAmounts.keys(),
  ])]
    .map((name) => {
      const current = currentCategoryAmounts.get(name) || 0;
      const previous = previousCategoryAmounts.get(name) || 0;
      return { name, current, previous, change: current - previous };
    })
    .filter((category) => category.change !== 0)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change) || a.name.localeCompare(b.name, "fi"))
    .slice(0, 3);

  const current = {
    income: currentMetrics.income,
    consumption: currentMetrics.consumption,
    afterConsumption: currentMetrics.income - currentMetrics.consumption,
  };
  const previous = {
    income: previousMetrics.income,
    consumption: previousMetrics.consumption,
    afterConsumption: previousMetrics.income - previousMetrics.consumption,
  };
  const nowMonth = asOf.slice(0, 7);
  return {
    month,
    previousMonth,
    income: { current: current.income, previous: previous.income, change: current.income - previous.income },
    consumption: { current: current.consumption, previous: previous.consumption, change: current.consumption - previous.consumption },
    afterConsumption: { current: current.afterConsumption, previous: previous.afterConsumption, change: current.afterConsumption - previous.afterConsumption },
    categories,
    currentConfirmed: state.coverage.incomeMonths.includes(month) && state.coverage.expenseMonths.includes(month),
    previousConfirmed: state.coverage.incomeMonths.includes(previousMonth) && state.coverage.expenseMonths.includes(previousMonth),
    currentIsOpen: month === nowMonth,
    isFuture: month > nowMonth,
  };
}

export function budgetCopyPreview(
  state: State,
  sourceMonth: string,
  targetMonth: string,
  mode: BudgetCopyMode,
) {
  if (!validMonth(sourceMonth) || !validMonth(targetMonth) || sourceMonth === targetMonth) {
    throw Error("Valitse kaksi eri kelvollista kuukautta.");
  }
  const source = state.budgets[sourceMonth] || {};
  const target = state.budgets[targetMonth] || {};
  const activeCategoryNames = new Set(
    state.categories
      .filter((category) => category.kind === "expenses" && !category.archived)
      .map((category) => category.name),
  );
  const copied: Record<string, number> = {};
  const skipped: string[] = [];
  const preserved: string[] = [];
  const overwritten: string[] = [];

  for (const [name, amount] of Object.entries(source)) {
    if (!activeCategoryNames.has(name)) {
      skipped.push(name);
      continue;
    }
    if (mode === "fill-missing" && Object.hasOwn(target, name)) {
      preserved.push(name);
      continue;
    }
    copied[name] = amount;
    if (Object.hasOwn(target, name)) overwritten.push(name);
  }

  const removed = mode === "replace"
    ? Object.keys(target).filter((name) => !Object.hasOwn(copied, name))
    : [];
  const next = mode === "replace"
    ? { ...state.budgets, [targetMonth]: copied }
    : { ...state.budgets, [targetMonth]: { ...target, ...copied } };
  const unchanged = JSON.stringify(next[targetMonth]) === JSON.stringify(target);

  return {
    sourceMonth,
    targetMonth,
    mode,
    copied,
    copiedCount: Object.keys(copied).length,
    copiedTotal: sum(Object.values(copied)),
    preserved,
    overwritten,
    skipped,
    removed,
    unchanged,
    budgets: next,
  };
}
