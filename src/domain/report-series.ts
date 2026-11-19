import type { State } from "./model";
import type { ReportMonth } from "./report-model";
import {
  metrics,
  budgetSummary,
  sum,
  expenseType,
  occurrenceSum,
  occurrenceAmount,
  occurrencesWithStatus,
  linkedAssetOutlook,
  fiTarget,
  MAX,
} from "./calculations";
import { datedState, selectedValuationDate } from "./dated-values";

export function reportHistory(
  s: State,
  startIndex: number,
  length: number,
  asOf: string,
): ReportMonth[] {
  return Array.from({ length }, (_, i) => {
    const index = startIndex + i;
    const key = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
    return {
      key,
      ...metrics(datedState(s, selectedValuationDate(key, asOf)), key),
    };
  });
}

export function reportBudgets(s: State, history: { key: string }[]) {
  const budgetReport = history
    .map(({ key }) => {
      const plannedByCategory = s.budgets[key] || {};
      const summary = budgetSummary(s, key);
      const planned = summary.planned;
      const actual = summary.budgetedActual;
      return {
        key,
        planned,
        hasPlan: planned > 0,
        actual,
        unbudgetedActual: summary.unbudgetedActual,
        plannedByCategory,
      };
    })
    .filter((row) => row.hasPlan || row.actual > 0 || row.unbudgetedActual > 0);
  const budgetTotals = budgetReport.reduce(
    (totals, row) => ({
      planned: totals.planned + row.planned,
      actual: totals.actual + row.actual,
      unbudgetedActual: totals.unbudgetedActual + row.unbudgetedActual,
    }),
    { planned: 0, actual: 0, unbudgetedActual: 0 },
  );
  const budgetReportScale = Math.max(
    ...budgetReport.flatMap((row) => [
      row.planned,
      row.actual,
      row.unbudgetedActual,
    ]),
    1,
  );

  return { budgetReport, budgetTotals, budgetReportScale };
}

export function reportWealth(snapshotState: State, assetChangeRate: number) {
  const currentAssets = snapshotState.assets.map((asset) => ({
    ...asset,
    ownedValue: Math.round((asset.amount * asset.ownership) / 100),
  }));
  const currentInvestments = snapshotState.investments.map((investment) => ({
    ...investment,
    marketValue: Math.round(investment.amount * investment.quantity),
  }));
  const currentDebts = snapshotState.liabilities;
  const debtBalance = sum(currentDebts.map((debt) => debt.amount));
  const assetBalance = sum(currentAssets.map((asset) => asset.ownedValue));
  const investmentBalance = sum(
    currentInvestments.map((investment) => investment.marketValue),
  );
  const netWorth = assetBalance + investmentBalance - debtBalance;
  const linkedOutlooks = currentAssets
    .map((asset) => ({
      asset,
      outlook: linkedAssetOutlook(asset, currentDebts, assetChangeRate),
    }))
    .filter((item) => item.outlook !== null);

  return {
    currentAssets,
    currentInvestments,
    currentDebts,
    debtBalance,
    assetBalance,
    investmentBalance,
    netWorth,
    linkedOutlooks,
  };
}

export function reportPeriod(
  history: ReportMonth[],
  investmentBalance: number,
  withdrawalRate: number,
) {
  const observedCashflowMonths = history.filter(
    (item) => item.income !== 0 || item.expense !== 0,
  );
  const averageMonthlyConsumption = observedCashflowMonths.length
    ? sum(observedCashflowMonths.map((item) => item.consumption)) /
      observedCashflowMonths.length
    : 0;
  const periodTotals = history.reduce(
    (totals, current) => ({
      income: totals.income + current.income,
      expense: totals.expense + current.expense,
      consumption: totals.consumption + current.consumption,
      cash: totals.cash + current.cash,
    }),
    { income: 0, expense: 0, consumption: 0, cash: 0 },
  );
  const periodSavingRate = periodTotals.income
    ? (100 * (periodTotals.income - periodTotals.consumption)) /
      periodTotals.income
    : null;
  const annualizedSpending = Math.round(averageMonthlyConsumption * 12);
  const fireCalculation = (() => {
    if (
      observedCashflowMonths.length === 0 ||
      !Number.isSafeInteger(annualizedSpending) ||
      annualizedSpending > MAX ||
      !Number.isSafeInteger(investmentBalance) ||
      investmentBalance > MAX
    )
      return null;
    try {
      return fiTarget(annualizedSpending, 0, investmentBalance, withdrawalRate);
    } catch {
      return null;
    }
  })();
  const formatPeriodMonth = (key: string) => {
    const [year, monthPart] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("fi-FI", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, monthPart - 1, 1));
  };
  const periodLabel =
    history.length === 0
      ? "Valitse voimassa oleva aikaväli"
      : history.length === 1
        ? formatPeriodMonth(history[0].key)
        : `${formatPeriodMonth(history[0].key)} – ${formatPeriodMonth(history[history.length - 1].key)}`;
  const reportHasData = history.some((h) => h.income !== 0 || h.expense !== 0);
  const reportMax = Math.max(
    ...history.flatMap((h) => [h.income, h.expense]),
    1,
  );
  const reportCoordinates = (key: "income" | "expense") =>
    history.map((h, index) => ({
      x: history.length === 1 ? 50 : 5 + index * (90 / (history.length - 1)),
      y: 95 - (h[key] / reportMax) * 85,
    }));
  const reportLine = (key: "income" | "expense") => {
    const points = reportCoordinates(key);
    if (points.length < 2)
      return points.length ? `M ${points[0].x} ${points[0].y}` : "";
    return points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const before = points[index - 2] ?? previous;
      const after = points[index + 1] ?? point;
      const controlOne = {
        x: previous.x + (point.x - before.x) / 6,
        y: previous.y + (point.y - before.y) / 6,
      };
      const controlTwo = {
        x: point.x - (after.x - previous.x) / 6,
        y: point.y - (after.y - previous.y) / 6,
      };
      return `${path} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${point.x} ${point.y}`;
    }, "");
  };
  const reportArea = (key: "income" | "expense") => {
    const points = reportCoordinates(key);
    const line = reportLine(key);
    if (!points.length) return "";
    return `${line} L ${points[points.length - 1].x} 95 L ${points[0].x} 95 Z`;
  };
  const incomeReportCoordinates = reportCoordinates("income");
  const expenseReportCoordinates = reportCoordinates("expense");

  return {
    observedCashflowMonths,
    averageMonthlyConsumption,
    periodTotals,
    periodSavingRate,
    annualizedSpending,
    fireCalculation,
    periodLabel,
    reportHasData,
    reportArea,
    reportLine,
    incomeReportCoordinates,
    expenseReportCoordinates,
  };
}

function expCatsForReport(s: State, months: string[]): [string, number][] {
  const totals = new Map<string, number>();
  const expenses = s.expenses.filter(
    (item) => expenseType(item) === "consumption",
  );
  for (const month of months)
    for (const item of expenses) {
      const amount = occurrenceSum(item, month, "actual");
      if (amount)
        totals.set(item.category, (totals.get(item.category) || 0) + amount);
    }
  return [...totals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
}

export function reportCategories(s: State, months: string[]) {
  const categoryReport = months.length ? expCatsForReport(s, months) : [];
  const categoryTotal = categoryReport.reduce(
    (value, [, amount]) => value + amount,
    0,
  );
  const maxCategoryExpense = Math.max(
    ...categoryReport.map(([, value]) => value),
    1,
  );
  const pieColors = [
    "#087f5b",
    "#d9480f",
    "#7048e8",
    "#ae7c00",
    "#1971c2",
    "#c2255c",
    "#495057",
    "#5c940d",
  ];
  let pieCursor = 0;
  const pieSlices = categoryReport.map(([category, value], index) => {
    const start = pieCursor;
    pieCursor += categoryTotal ? (value * 100) / categoryTotal : 0;
    return {
      category,
      value,
      start,
      end: pieCursor,
      color: pieColors[index % pieColors.length],
    };
  });

  return {
    categoryReport,
    categoryTotal,
    maxCategoryExpense,
    pieColors,
    pieSlices,
  };
}

export function reportFlow(s: State, history: { key: string }[]) {
  const map = new Map<string, { income: number; expense: number }>();
  const incomes = s.incomes;
  const expenses = s.expenses;
  for (const period of history) {
    for (const item of incomes)
      for (const date of occurrencesWithStatus(item, period.key, "actual")) {
        const value = map.get(date) || { income: 0, expense: 0 };
        value.income += occurrenceAmount(item, date);
        map.set(date, value);
      }
    for (const item of expenses)
      for (const date of occurrencesWithStatus(item, period.key, "actual")) {
        const value = map.get(date) || { income: 0, expense: 0 };
        value.expense += occurrenceAmount(item, date);
        map.set(date, value);
      }
  }
  const flowByDate = map;
  let runningFlow = 0;
  const dailyFlow = [...flowByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => {
      runningFlow += value.income - value.expense;
      return { date, ...value, balance: runningFlow };
    });
  const firstShortfall = dailyFlow.find((day) => day.balance < 0);
  const recoveryDay = firstShortfall
    ? dailyFlow.find(
        (day) => day.date > firstShortfall.date && day.balance >= 0,
      )
    : undefined;
  const maxFlowMagnitude = Math.max(
    ...dailyFlow.map((day) => Math.abs(day.balance)),
    1,
  );

  return { dailyFlow, firstShortfall, recoveryDay, maxFlowMagnitude };
}
