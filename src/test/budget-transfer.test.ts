import { describe, expect, it } from "vitest";
import { empty } from "../domain/model";
import { transferBudget } from "../domain/budget-transfer";

describe("budjettisiirto", () => {
  it("siirtää sentit samassa kuussa säilyttäen alkuperäisen tilan ja toteumat", () => {
    const state = empty();
    state.budgets = { "2026-01": { Ruoka: 30000, Vapaa: 10000 }, "2026-02": { Ruoka: 500 } };
    state.budgetActuals = { "2026-01": { Ruoka: 20000 } };
    const result = transferBudget(state, "2026-01", "Vapaa", "Ruoka", 2000);
    expect(result.budgets).toEqual({ "2026-01": { Ruoka: 32000, Vapaa: 8000 }, "2026-02": { Ruoka: 500 } });
    expect(state.budgets["2026-01"].Vapaa).toBe(10000);
    expect(result.budgetActuals).toEqual(state.budgetActuals);
  });
  it("hylkää liian suuren, nollan, saman kategorian ja virheellisen summan", () => {
    const state = empty();
    state.budgets = { "2026-01": { Ruoka: 100 } };
    for (const [from, to, amount] of [["Ruoka", "Muu", 101], ["Ruoka", "Muu", 0], ["Ruoka", "Ruoka", 10], ["Ruoka", "Muu", NaN]] as const)
      expect(() => transferBudget(state, "2026-01", from, to, amount)).toThrow();
    expect(state.budgets["2026-01"]).toEqual({ Ruoka: 100 });
  });
});
