import type { ReportMonth, ReportView } from "./report-model";
import type {
  reportCategories,
  reportFlow,
  reportBudgets,
  reportWealth,
  reportPeriod,
} from "./report-series";

type ReportTableData = { history: ReportMonth[] } & Pick<
  ReturnType<typeof reportCategories>,
  "categoryReport"
> &
  Pick<ReturnType<typeof reportFlow>, "dailyFlow"> &
  Pick<ReturnType<typeof reportBudgets>, "budgetReport"> &
  Pick<
    ReturnType<typeof reportWealth>,
    "currentAssets" | "currentInvestments" | "currentDebts" | "linkedOutlooks"
  > &
  Pick<ReturnType<typeof reportPeriod>, "observedCashflowMonths">;

export function reportTables(
  data: ReportTableData,
  reportTableSearch: string,
  reportTableSort: string,
  reportView: ReportView,
) {
  const {
    history,
    categoryReport,
    dailyFlow,
    budgetReport,
    currentAssets,
    currentInvestments,
    currentDebts,
    linkedOutlooks,
    observedCashflowMonths,
  } = data;
  const normalizedTableSearch = reportTableSearch
    .trim()
    .toLocaleLowerCase("fi-FI");
  const matchesTableSearch = (
    ...values: Array<string | number | null | undefined>
  ) =>
    values
      .filter((value) => value !== null && value !== undefined)
      .join(" ")
      .toLocaleLowerCase("fi-FI")
      .includes(normalizedTableSearch);
  const filteredHistory = history
    .filter((row) => matchesTableSearch(row.key))
    .sort((a, b) => {
      if (reportTableSort === "income-desc") return b.income - a.income;
      if (reportTableSort === "expense-desc") return b.expense - a.expense;
      if (reportTableSort === "cash-asc") return a.cash - b.cash;
      if (reportTableSort === "saving-desc")
        return (b.savingRate ?? -Infinity) - (a.savingRate ?? -Infinity);
      return reportTableSort === "date-asc"
        ? a.key.localeCompare(b.key)
        : b.key.localeCompare(a.key);
    });
  const filteredCategoryReport = categoryReport
    .filter(([category]) => matchesTableSearch(category))
    .sort(([nameA, amountA], [nameB, amountB]) =>
      reportTableSort === "name-asc"
        ? nameA.localeCompare(nameB, "fi-FI")
        : reportTableSort === "amount-asc"
          ? amountA - amountB
          : amountB - amountA,
    );
  const filteredDailyFlow = dailyFlow
    .filter((day) => matchesTableSearch(day.date))
    .sort((a, b) => {
      if (reportTableSort === "income-desc") return b.income - a.income;
      if (reportTableSort === "expense-desc") return b.expense - a.expense;
      if (reportTableSort === "cash-asc") return a.balance - b.balance;
      return reportTableSort === "date-desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
    });
  const filteredBudgetReport = budgetReport
    .filter((row) => matchesTableSearch(row.key))
    .sort((a, b) => {
      if (reportTableSort === "actual-desc") return b.actual - a.actual;
      if (reportTableSort === "difference-asc")
        return a.planned - a.actual - (b.planned - b.actual);
      if (reportTableSort === "date-asc") return a.key.localeCompare(b.key);
      return b.key.localeCompare(a.key);
    });
  const wealthTableRows = [
    ...currentAssets.map((asset) => ({
      id: `asset-${asset.id}`,
      name: asset.name,
      category: `Omaisuus · ${asset.category}`,
      value: asset.ownedValue,
      date: asset.date,
    })),
    ...currentInvestments.map((investment) => ({
      id: `investment-${investment.id}`,
      name: investment.name,
      category: `Sijoitus · ${investment.category}`,
      value: investment.marketValue,
      date: investment.date,
    })),
    ...currentDebts.map((debt) => ({
      id: `debt-${debt.id}`,
      name: debt.name,
      category: `Velka · ${debt.category}`,
      value: -debt.amount,
      date: debt.date,
    })),
  ];
  const filteredWealthTableRows = wealthTableRows
    .filter((row) => matchesTableSearch(row.name, row.category))
    .sort((a, b) =>
      reportTableSort === "name-asc"
        ? a.name.localeCompare(b.name, "fi-FI")
        : reportTableSort === "date-desc"
          ? b.date.localeCompare(a.date)
          : Math.abs(b.value) - Math.abs(a.value),
    );
  const filteredLinkedOutlooks = linkedOutlooks
    .filter(({ asset }) => {
      const linkedNames = currentDebts
        .filter((debt) => debt.linkedAssetId === asset.id)
        .map((debt) => debt.name);
      return matchesTableSearch(asset.name, asset.category, ...linkedNames);
    })
    .sort((a, b) => {
      if (reportTableSort === "debt-desc")
        return b.outlook!.debtBalance - a.outlook!.debtBalance;
      if (reportTableSort === "equity-asc")
        return a.outlook!.currentEquity - b.outlook!.currentEquity;
      if (reportTableSort === "payoff-asc")
        return (
          (a.outlook!.payoffMonths ?? Number.MAX_SAFE_INTEGER) -
          (b.outlook!.payoffMonths ?? Number.MAX_SAFE_INTEGER)
        );
      return a.asset.name.localeCompare(b.asset.name, "fi-FI");
    });
  const filteredFireMonths = filteredHistory.filter(
    (item) => item.income !== 0 || item.expense !== 0,
  );
  const reportTableVisibleCount = {
    overview: filteredHistory.length,
    categories: filteredCategoryReport.length,
    flow: filteredDailyFlow.length,
    budget: filteredBudgetReport.length,
    wealth: filteredWealthTableRows.length,
    debt: filteredLinkedOutlooks.length,
    fire: filteredFireMonths.length,
  }[reportView];
  const reportTableTotalCount = {
    overview: history.length,
    categories: categoryReport.length,
    flow: dailyFlow.length,
    budget: budgetReport.length,
    wealth: wealthTableRows.length,
    debt: linkedOutlooks.length,
    fire: observedCashflowMonths.length,
  }[reportView];

  return {
    filteredHistory,
    filteredCategoryReport,
    filteredDailyFlow,
    filteredBudgetReport,
    filteredWealthTableRows,
    filteredLinkedOutlooks,
    filteredFireMonths,
    reportTableVisibleCount,
    reportTableTotalCount,
  };
}
