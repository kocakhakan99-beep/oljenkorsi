import { describe, expect, it } from "vitest";
import { planActions, visibleActions } from "../domain/actions";
import { createCompassDemoCases } from "../domain/compass-demos";
import { empty, entry } from "../domain/model";

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
    expect(demos[3].timeline[2].income).toBeLessThan(
      demos[3].timeline[1].income,
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
      planActions(demos[3].state, "2026-11").some(
        (action) => action.id === "cashflow-check-2026-11",
      ),
    ).toBe(true);
  });
});
