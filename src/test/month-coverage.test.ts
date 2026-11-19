import { describe, expect, it } from "vitest";
import { empty, entry, type State } from "../domain/model";
import { coverageAfterEntryChanges } from "../domain/month-coverage";

const months = ["2001-01", "2001-02", "2001-03", "2001-04"];
function fixture() {
  const state = empty();
  state.coverage = { incomeMonths: [...months], expenseMonths: [...months] };
  state.incomes = [entry({ date: "2001-02-01", amount: 300000 })];
  state.expenses = [entry({ date: "2001-02-10", amount: 10000 })];
  return state;
}
const updateExpense = (state: State, changes: Partial<State["expenses"][number]>): State => ({
  ...state, expenses: [{ ...state.expenses[0], ...changes }],
});

describe("vahvistettujen kuukausien avaaminen muutoksen jälkeen", () => {
  it("säilyttää vahvistuksen, kun vain taustatiedot muuttuvat", () => {
    const state = fixture();
    const next = updateExpense(state, {
      description: "Oma muistiinpano", tags: "tarkistettu", source: "csv",
      updatedAt: "2001-03-01T12:00:00.000Z", createdAt: "2001-02-01T12:00:00.000Z",
    });
    expect(coverageAfterEntryChanges(state, next)).toEqual(state.coverage);
  });

  it("avaa kertamenon vanhan ja uuden kuukauden muuttamatta tulojen vahvistusta", () => {
    const state = fixture();
    const original = structuredClone(state);
    const result = coverageAfterEntryChanges(state, updateExpense(state, { date: "2001-03-10", amount: 20000 }));
    expect(result).toEqual({ incomeMonths: months, expenseMonths: ["2001-01", "2001-04"] });
    expect(state).toEqual(original);
  });

  it("avaa vain poistettuun kertatuloon liittyvän kuukauden", () => {
    const state = fixture();
    expect(coverageAfterEntryChanges(state, { ...state, incomes: [] })).toEqual({
      incomeMonths: ["2001-01", "2001-03", "2001-04"], expenseMonths: months,
    });
  });

  it("avaa lisätyn toistuvan menon aloituskuukaudesta eteenpäin", () => {
    const state = fixture();
    const next = { ...state, expenses: [...state.expenses, entry({ date: "2001-03-01", recurrence: "monthly" })] };
    expect(coverageAfterEntryChanges(state, next).expenseMonths).toEqual(["2001-01", "2001-02"]);
  });

  it("avaa sarjan siirrossa kuukaudet aikaisemmasta aloituksesta alkaen", () => {
    const state = fixture();
    state.expenses[0].recurrence = "monthly";
    expect(coverageAfterEntryChanges(state, updateExpense(state, { date: "2001-03-10" })).expenseMonths)
      .toEqual(["2001-01"]);
  });

  it.each(["add", "edit", "remove"])("avaa hintahistorian muutoksen (%s) voimaantulosta eteenpäin", (action) => {
    const state = fixture();
    state.expenses[0].recurrence = "monthly";
    state.expenses[0].priceHistory = action === "add" ? [] : [{ startDate: "2001-03-01", amount: 15000 }];
    const priceHistory = action === "remove" ? [] : [{ startDate: "2001-03-01", amount: 20000 }];
    expect(coverageAfterEntryChanges(state, updateExpense(state, { priceHistory })).expenseMonths)
      .toEqual(["2001-01", "2001-02"]);
  });

  it("avaa vain tapahtumakohtaisen summa- tai tilapoikkeuksen kuukauden", () => {
    const state = fixture();
    state.expenses[0].recurrence = "monthly";
    const next = updateExpense(state, {
      occurrenceAmounts: { "2001-03-10": 12500 },
      occurrenceStatuses: { "2001-04-10": "planned" },
    });
    expect(coverageAfterEntryChanges(state, next).expenseMonths).toEqual(["2001-01", "2001-02"]);
    expect(coverageAfterEntryChanges(next, state).expenseMonths).toEqual(["2001-01", "2001-02"]);
  });

  it("avaa manuaalisen nollatoteuman lisäyksen ja poiston kuukauden", () => {
    const state = fixture();
    const next = { ...state, budgetActuals: { "2001-03": { Ruoka: 0 } } };
    const expected = { incomeMonths: months, expenseMonths: ["2001-01", "2001-02", "2001-04"] };
    expect(coverageAfterEntryChanges(state, next)).toEqual(expected);
    expect(coverageAfterEntryChanges(next, state)).toEqual(expected);
  });
});
