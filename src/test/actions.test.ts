import { describe, expect, it } from "vitest";
import { planActions, visibleActions } from "../domain/actions";
import { createCompassDemoCases } from "../domain/compass-demos";
import { empty, entry, today } from "../domain/model";

describe("Talouden kompassi", () => {
  it("järjestää selittävät tarkistukset deterministisesti niiden kiireellisyyden mukaan", () => {
    const state = empty();
    state.expenses = [
      entry({
        id: "food",
        name: "Ruokaostokset",
        category: "Ruoka",
        amount: 100000,
        date: "2026-09-01",
        recurrence: "monthly",
      }),
    ];
    state.budgets["2026-11"] = { Ruoka: 50000 };
    state.budgetActuals["2026-11"] = { Ruoka: 100000 };

    const first = planActions(state, "2026-11");
    expect(first).toEqual(planActions(state, "2026-11"));
    expect(first[0].priority).toBe("high");
    const review = first.find(
      (action) => action.id === "budget-review-2026-11-Ruoka",
    );
    expect(review?.priority).toBe("high");
    expect(review?.evidence).toContain("€");
  });

  it("piilottaa valmiin tai siirretyn tehtävän siihen asti, kun siirto umpeutuu", () => {
    const state = empty();
    state.incomes = [entry({ name: "Palkka" })];
    state.actionStates["create-first-goal"] = {
      status: "snoozed",
      until: "2026-11-08",
      updatedAt: "2026-11-01T09:00:00.000Z",
    };
    expect(
      visibleActions(state, "2026-11", "2026-11-07").some(
        (item) => item.id === "create-first-goal",
      ),
    ).toBe(false);
    expect(
      visibleActions(state, "2026-11", "2026-11-08").some(
        (item) => item.id === "create-first-goal",
      ),
    ).toBe(true);
    state.actionStates["create-first-goal"] = {
      status: "done",
      updatedAt: "2026-11-08T09:00:00.000Z",
    };
    expect(
      visibleActions(state, "2026-11", "2026-11-09").some(
        (item) => item.id === "create-first-goal",
      ),
    ).toBe(false);
    state.actionStates["create-first-goal"] = {
      status: "blocked",
      until: "2026-12-01",
      updatedAt: "2026-11-01T09:00:00.000Z",
    };
    expect(
      visibleActions(state, "2026-11", "2026-11-30").some(
        (item) => item.id === "create-first-goal",
      ),
    ).toBe(false);
    expect(
      visibleActions(state, "2026-11", "2026-12-01").some(
        (item) => item.id === "create-first-goal",
      ),
    ).toBe(true);
  });

  it("nostaa asumisosuuden ja oman kuluhistorian esiin varauksin", () => {
    const state = empty();
    const currentMonth = today().slice(0, 7);
    const [year, monthNumber] = currentMonth.split("-").map(Number);
    const historyStart = new Date(year, monthNumber - 4, 1);
    const historyStartMonth = `${historyStart.getFullYear()}-${String(historyStart.getMonth() + 1).padStart(2, "0")}`;
    const currentDay = Number(today().slice(-2));
    const lastDay = new Date(year, monthNumber, 0).getDate();
    state.incomes = [
      entry({
        id: "salary",
        name: "Palkka",
        category: "Palkka",
        amount: 150000,
        date: `${historyStartMonth}-01`,
        recurrence: "monthly",
      }),
    ];
    state.expenses = [
      entry({
        id: "rent",
        name: "Vuokra",
        category: "Asuminen",
        amount: 70000,
        date: `${historyStartMonth}-01`,
        recurrence: "monthly",
        essential: true,
      }),
      entry({
        id: "food",
        name: "Ruokaostokset",
        category: "Ruoka",
        amount: 10000,
        date: `${historyStartMonth}-01`,
        recurrence: "monthly",
        essential: false,
      }),
      entry({
        id: "food-extra",
        name: "Juhlat",
        category: "Ruoka",
        amount: 8000,
        date: today(),
        essential: false,
      }),
    ];
    if (currentDay < lastDay)
      state.expenses.push(
        entry({
          id: "food-later-this-month",
          name: "Myöhemmin kuussa",
          category: "Ruoka",
          amount: 50000,
          date: `${currentMonth}-${String(lastDay).padStart(2, "0")}`,
          essential: false,
        }),
      );

    const actions = planActions(state, currentMonth);
    const housing = actions.find(
      (action) => action.id === `housing-cost-review-${currentMonth}`,
    );
    const ownBaseline = actions.find(
      (action) => action.id === `spending-pattern-${currentMonth}-Ruoka`,
    );
    expect(housing?.evidence).toContain("46,7 %");
    expect(housing?.sourceIds).toEqual(["R12"]);
    expect(housing?.boundary).toContain("henkilökohtainen vuokrakatto");
    expect(housing?.reportView).toBe("categories");
    expect(housing?.track).toBe("spending");
    expect(ownBaseline?.evidence).toContain("180,00");
    expect(ownBaseline?.reportView).toBe("categories");
    expect(ownBaseline?.impactNote).toContain("ei ole säästölupaus");
    expect(ownBaseline?.track).toBe("spending");
    expect(ownBaseline?.boundary).toContain("otos ei ole ennuste");
  });

  it("vertailuttaa FIRE-tavoitetta vain herkkyystestinä ja tarjoaa neuvontaa pitkittyneeseen alijäämään", () => {
    const state = empty();
    state.incomes = [
      entry({
        name: "Palkka",
        category: "Palkka",
        amount: 100000,
        date: "2026-08-01",
        recurrence: "monthly",
      }),
    ];
    state.expenses = [
      entry({
        name: "Perusmenot",
        category: "Asuminen",
        amount: 120000,
        date: "2026-08-02",
        recurrence: "monthly",
      }),
    ];
    state.goals = [entry({ name: "FIRE / taloudellinen riippumattomuus" })];
    state.investments = [entry({ name: "Indeksisalkku", amount: 100000 })];
    const actions = planActions(state, "2026-11");
    expect(
      actions.find((action) => action.id === "support-options-2026-11")
        ?.sourceIds,
    ).toEqual(["R13"]);
    const fire = actions.find(
      (action) => action.id === "fire-withdrawal-stress-test-2026-11",
    );
    expect(fire?.sourceIds).toEqual(["R7", "R8", "R9", "R10"]);
    expect(fire?.boundary).toContain("ei turvallisen nostoprosentin lupaus");
  });

  it("tunnistaa tavoitesäästön ja toistuvat menot oman kassavirran taustaa vasten", () => {
    const state = empty();
    state.incomes = [
      entry({
        name: "Palkka",
        category: "Palkka",
        amount: 200000,
        date: "2026-08-01",
        recurrence: "monthly",
      }),
    ];
    state.expenses = [
      entry({
        name: "Ruokaostokset",
        category: "Ruoka",
        amount: 180000,
        date: "2026-08-04",
        recurrence: "monthly",
        essential: true,
      }),
      entry({
        name: "Jäsenmaksu",
        category: "Harrastus",
        amount: 5000,
        date: "2026-08-05",
        recurrence: "monthly",
        essential: false,
      }),
    ];
    state.goals = [entry({ name: "Puskuri", monthly: 150000 })];
    state.liabilities = [
      entry({ name: "Korttiluotto", rate: 12, payment: 50000 }),
      entry({ name: "Opintolaina", rate: 3, payment: 30000 }),
    ];

    const actions = planActions(state, "2026-11");
    expect(
      actions.find((action) => action.id === "essential-cost-review-2026-11")
        ?.boundary,
    ).toContain("90 % on kompassin varhainen tarkistusraja");
    expect(
      actions.find((action) => action.id === "goal-pace-review-2026-11")
        ?.nextStep,
    ).toContain("pienempää kuukausisummaa");
    expect(
      actions.find((action) => action.id === "recurring-spend-review-2026-11")
        ?.boundary,
    ).toContain("ei tarkoita turhaa menoa");
    expect(
      actions.find((action) => action.id === "compare-debt-costs-2026-11")
        ?.boundary,
    ).toContain("ei yksin ratkaise");
    expect(
      actions.find((action) => action.id === "debt-payment-review-2026-11")
        ?.boundary,
    ).toContain("ei yleispätevä velkakatto");
  });

  it("erottaa kassavirtaa kiristävät säästösiirrot kulutusmenoista", () => {
    const state = empty();
    state.incomes = [
      entry({
        name: "Palkka",
        category: "Palkka",
        amount: 200000,
        date: "2026-08-01",
        recurrence: "monthly",
      }),
    ];
    state.expenses = [
      entry({
        name: "Arjen menot",
        category: "Ruoka",
        amount: 100000,
        date: "2026-08-04",
        recurrence: "monthly",
        essential: false,
      }),
      entry({
        name: "Automaattinen säästö",
        category: "Säästäminen",
        amount: 120000,
        date: "2026-08-05",
        recurrence: "monthly",
        essential: false,
      }),
    ];
    const action = planActions(state, "2026-11").find(
      (item) => item.id === "transfer-cashflow-review-2026-11",
    );
    expect(action?.nextStep).toContain("lähiajan laskuihin");
    expect(action?.boundary).toContain("ei tiedä muiden tilien saldoja");
  });

  it("nostaa esiin puskurin, tulovaihtelun ja vuosimenojen suunnittelun omilla rajauksillaan", () => {
    const state = empty();
    const months = [
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ];
    state.coverage.expenseMonths = ["2026-05", "2026-06"];
    state.coverage.incomeMonths = [...months];
    for (const [index, month] of months.entries()) {
      state.incomes.push(
        entry({
          id: `income-${month}`,
          name: "Palkka",
          category: "Palkka",
          amount: [100000, 400000, 110000, 450000, 90000, 420000][index],
          date: `${month}-01`,
        }),
      );
      state.expenses.push(
        entry({
          id: `essential-${month}`,
          name: "Perusmenot",
          category: "Asuminen",
          amount: 260000,
          date: `${month}-05`,
          essential: true,
        }),
      );
    }
    state.expenses.push(
      entry({
        id: "trip-1",
        name: "Matka",
        category: "Matkailu",
        amount: 40000,
        date: "2026-02-10",
        essential: false,
      }),
      entry({
        id: "trip-2",
        name: "Matka",
        category: "Matkailu",
        amount: 60000,
        date: "2026-05-10",
        essential: false,
      }),
    );
    state.assets.push(
      entry({
        id: "reserve",
        name: "Käyttötili",
        category: "Talletukset",
        amount: 100000,
        liquid: true,
      }),
    );

    const actions = planActions(state, "2026-07");
    const buffer = actions.find(
      (action) => action.id === "liquidity-review-2026-07",
    );
    const volatility = actions.find(
      (action) => action.id === "income-variation-2026-07",
    );
    const irregular = actions.find((action) =>
      action.id.includes("irregular-expense-2026-07-Matkailu"),
    );
    expect(buffer?.sourceIds).toEqual(["R2", "R3"]);
    expect(buffer?.boundary).toContain("ei suositeltu tavoite");
    expect(volatility?.boundary).toContain("tunnistuskynnys");
    expect(irregular?.nextStep).toContain("12 kuukauden keskiarvo");
  });

  it("tulojen vaihtelu käyttää vain vahvistettuja kuukausia ja laskee vahvistetun nollatulon mukaan", () => {
    const state = empty();
    const months = [
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
    ];
    state.coverage.incomeMonths = [...months];
    for (const [index, month] of months.slice(0, 5).entries())
      state.incomes.push(
        entry({
          id: `income-${month}`,
          amount: [100000, 400000, 110000, 450000, 90000][index],
          date: `${month}-01`,
        }),
      );

    const withConfirmedMonths = planActions(state, "2026-07").find((action) =>
      action.id.startsWith("income-variation-"),
    );
    expect(withConfirmedMonths?.evidence).toContain("6 havaintokuukautta");

    state.coverage.incomeMonths = [];
    expect(
      planActions(state, "2026-07").some((action) =>
        action.id.startsWith("income-variation-"),
      ),
    ).toBe(false);
  });

  it("tarjoaa neljä fiktiivistä, keskenään erilaista kompassireittiä tallennettua dataa muuttamatta", () => {
    const demos = createCompassDemoCases("2026-11");
    expect(demos).toHaveLength(4);
    expect(demos.map((scenario) => scenario.profile.id)).toEqual([
      "strained",
      "everyday",
      "steady",
      "shock",
    ]);
    expect(demos[0].timeline.some((month) => month.cash < 0)).toBe(true);
    expect(demos[2].timeline.every((month) => month.cash > 0)).toBe(true);
    expect(demos[3].timeline.slice(-3).every((month) => month.income > 0)).toBe(
      true,
    );
    expect(demos[3].timeline.find(point => point.month === "2026-08")!.income).toBeLessThan(
      demos[3].timeline.find(point => point.month === "2026-07")!.income,
    );
    const shockMonthIncome = demos[3].state.incomes.filter((income) =>
      income.date.startsWith("2026-11"),
    );
    expect(shockMonthIncome.map((income) => income.name)).toContain(
      "Aikuisen 2 nettopalkka",
    );
    expect(shockMonthIncome.map((income) => income.name)).toContain(
      "Lapsilisä",
    );
    expect(shockMonthIncome.map((income) => income.name)).not.toContain(
      "Aikuisen 1 nettopalkka",
    );
    expect(
      demos[3].state.expenses.some(
        (expense) => expense.category === "Lapset ja perhe",
      ),
    ).toBe(true);
    expect(
      demos.every((scenario) => scenario.state.investments.length === 1),
    ).toBe(true);
    expect(
      planActions(demos[3].state, "2026-11").some(
        (action) => action.id === "cashflow-check-2026-11",
      ),
    ).toBe(true);
    const currentMonth = today().slice(0, 7);
    expect(
      demos.every((scenario) =>
        scenario.state.coverage.incomeMonths.every(
          (period) => period < currentMonth,
        ),
      ),
    ).toBe(true);
    expect(
      demos.every((scenario) =>
        scenario.state.coverage.expenseMonths.every(
          (period) => period < currentMonth,
        ),
      ),
    ).toBe(true);
  });
});
