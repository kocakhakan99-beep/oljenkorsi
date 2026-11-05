import { describe, expect, it } from "vitest";
import { planActions, visibleActions } from "../domain/actions";
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
    expect(
      first.some((action) => action.id === "budget-review-2026-11-Ruoka"),
    ).toBe(true);
    expect(first[0].evidence).toContain("€");
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
});
