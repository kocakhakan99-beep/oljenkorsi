import { describe, expect, it } from "vitest";
import { empty, entry } from "../domain/model";
import {
  reportHistory,
  reportBudgets,
  reportWealth,
  reportPeriod,
  reportCategories,
  reportFlow,
} from "../domain/report-series";
import { reportTables } from "../domain/report-tables";
import { reportSelection } from "../domain/report-selection";

function fixture() {
  const state = empty();
  state.incomes = [entry({ name: "Palkka", date: "2001-01-02", amount: 3000 })];
  state.expenses = [
    entry({
      name: "Ostos A",
      category: "Ruoka",
      date: "2001-01-01",
      amount: 1000,
    }),
    entry({
      name: "Ostos B",
      category: "Ruoka",
      date: "2001-01-03",
      amount: 500,
    }),
    entry({
      name: "Säästö",
      category: "Säästäminen",
      expenseType: "saving",
      date: "2001-01-03",
      amount: 700,
    }),
  ];
  state.budgets["2001-01"] = { Ruoka: 2000 };
  state.budgetActuals["2001-01"] = { Ruoka: 1800 };
  return state;
}
const january = [{ key: "2001-01" }];

describe("raporttidatan koostaminen", () => {
  it("erottaa budjetin manuaalisen toteuman kirjatuista menoista ja säästösiirrosta", () => {
    const state = fixture();
    const history = reportHistory(state, 2001 * 12, 2, "2001-02-10");
    const period = reportPeriod(history, 0, 4);
    const budget = reportBudgets(state, history);
    expect(period.periodTotals).toEqual({
      income: 3000,
      expense: 2200,
      consumption: 1500,
      cash: 800,
    });
    expect(period.periodSavingRate).toBe(50);
    expect(budget.budgetTotals).toEqual({
      planned: 2000,
      actual: 1800,
      unbudgetedActual: 0,
    });
    expect(reportCategories(state, ["2001-01"]).categoryReport).toEqual([
      ["Ruoka", 1500],
    ]);
  });

  it("ei tulkitse tyhjää kuukautta kuluttomaksi FIRE-havainnoksi", () => {
    const history = reportHistory(fixture(), 2001 * 12, 2, "2001-02-10");
    const result = reportPeriod(history, 100000, 4);
    expect(history.map((row) => row.key)).toEqual(["2001-01", "2001-02"]);
    expect(result.observedCashflowMonths).toHaveLength(1);
    expect(result.averageMonthlyConsumption).toBe(1500);
    expect(result.annualizedSpending).toBe(18000);
    expect(result.fireCalculation?.target).toBe(450000);
    expect(result.fireCalculation?.shortfall).toBe(350000);
  });

  it("yhdistää saman päivän tapahtumat ja löytää alijäämän palautumisen", () => {
    const result = reportFlow(fixture(), january);
    expect(result.dailyFlow).toEqual([
      { date: "2001-01-01", income: 0, expense: 1000, balance: -1000 },
      { date: "2001-01-02", income: 3000, expense: 0, balance: 2000 },
      { date: "2001-01-03", income: 0, expense: 1200, balance: 800 },
    ]);
    expect(result.firstShortfall?.date).toBe("2001-01-01");
    expect(result.recoveryDay?.date).toBe("2001-01-02");
    expect(result.maxFlowMagnitude).toBe(2000);
  });

  it("säilyttää budjettierittelyn ja kassavirran eri laskentapohjat", () => {
    const state = fixture();
    const cash = reportSelection(state, january, {
      type: "period",
      from: "2001-01",
      to: "2001-01",
      metric: "cash",
    });
    expect(cash.selectedReportTotal).toBe(800);
    expect(cash.selectedReportEntries).toHaveLength(4);
    const budget = reportSelection(state, january, {
      type: "budget",
      month: "2001-01",
      planned: 2000,
      actual: 1800,
      manualCategories: ["Ruoka"],
    });
    expect(budget.selectedReportTotal).toBe(1800);
    expect(
      budget.selectedReportEntries.reduce((sum, row) => sum + row.amount, 0),
    ).toBe(1500);
    expect(budget.selectedBudgetSummary?.budgetedActual).toBe(1800);
  });

  it("huomioi omistusosuuden, sijoitusmäärän ja linkitetyn velan", () => {
    const state = fixture();
    const asset = entry({ name: "Asunto", amount: 10000000, ownership: 50 });
    state.assets = [asset];
    state.investments = [entry({ amount: 100000, quantity: 2 })];
    state.liabilities = [
      entry({
        amount: 4000000,
        linkedAssetId: asset.id,
        payment: 50000,
        rate: 0,
      }),
    ];
    const wealth = reportWealth(state, 0);
    expect(wealth.assetBalance).toBe(5000000);
    expect(wealth.investmentBalance).toBe(200000);
    expect(wealth.netWorth).toBe(1200000);
    expect(wealth.linkedOutlooks[0].outlook?.currentEquity).toBe(1000000);
  });

  it("käyttää eksplisiittistä tarkastelupäivää kuluvan kuun arvostuksissa", () => {
    const state = empty();
    state.assets = [
      entry({ name: "Myöhempi arvo", date: "2001-01-20", amount: 10000 }),
    ];
    const rows = reportHistory(state, 2001 * 12, 2, "2001-01-15");
    expect(rows[0].assets).toBe(0);
    expect(rows[1].assets).toBe(10000);
  });

  it("suodattaa ja lajittelee muuttamatta lähtötilaa tai aikasarjan järjestystä", () => {
    const state = fixture();
    const before = JSON.stringify(state);
    const history = reportHistory(state, 2001 * 12, 2, "2001-02-10");
    const data = {
      history,
      ...reportCategories(state, ["2001-01"]),
      ...reportFlow(state, history),
      ...reportBudgets(state, history),
      ...reportWealth(state, 0),
      ...reportPeriod(history, 0, 4),
    };
    const categories = reportTables(
      data,
      " RUOKA ",
      "amount-desc",
      "categories",
    );
    expect(categories.reportTableVisibleCount).toBe(1);
    expect(categories.filteredCategoryReport).toEqual([["Ruoka", 1500]]);
    const months = reportTables(data, "", "date-desc", "overview");
    expect(months.filteredHistory.map((row) => row.key)).toEqual([
      "2001-02",
      "2001-01",
    ]);
    expect(history.map((row) => row.key)).toEqual(["2001-01", "2001-02"]);
    expect(JSON.stringify(state)).toBe(before);
  });

  it("palauttaa tyhjälle jaksolle nollat ja tyhjän kaaviopolun", () => {
    const result = reportPeriod([], 0, 4);
    expect(result.periodSavingRate).toBeNull();
    expect(result.fireCalculation).toBeNull();
    expect(result.reportHasData).toBe(false);
    expect(result.reportLine("income")).toBe("");
    expect(result.reportArea("expense")).toBe("");
    expect(reportFlow(empty(), []).dailyFlow).toEqual([]);
  });
});
