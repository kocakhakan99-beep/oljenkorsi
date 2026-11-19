import { describe, expect, it } from "vitest";
import { empty, entry } from "../domain/model";
import { budgetCategoryPolicy } from "../domain/budget-guidance";
import { renameCategory } from "../domain/category-management";

function fixture() {
  const state = empty();
  state.categories = [
    { id: "expense-food", kind: "expenses", name: "Ruoka", icon: "other", color: "#17604d", archived: false },
    { id: "income-food", kind: "incomes", name: "Ruoka", icon: "other", color: "#17604d", archived: false },
    { id: "expense-home", kind: "expenses", name: "Koti", icon: "other", color: "#17604d", archived: false },
  ];
  state.expenses = [entry({ category: "Ruoka", amount: 1000 }), entry({ category: "Koti", amount: 2000 })];
  state.incomes = [entry({ category: "Ruoka", amount: 3000 })];
  state.budgets = { "2001-01": { Ruoka: 5000, Koti: 10000 }, "2001-02": { Ruoka: 0 } };
  state.budgetActuals = { "2001-01": { Ruoka: 1500 }, "2001-02": { Ruoka: 0 } };
  return state;
}

describe("kategorian nimeäminen", () => {
  it("säilyttää kirjausten, kuukausibudjettien ja nollatoteumien tiedot sekä kategorian identiteetin", () => {
    const state = fixture();
    const before = structuredClone(state);
    const policy = budgetCategoryPolicy(state, "Ruoka");
    const next = renameCategory(state, "expense-food", "  Ostokset  ");
    expect(next.categories[0]).toEqual({ ...state.categories[0], name: "Ostokset" });
    expect(next.expenses).toEqual([{ ...state.expenses[0], category: "Ostokset" }, state.expenses[1]]);
    expect(next.incomes).toEqual(state.incomes);
    expect(next.budgets).toEqual({ "2001-01": { Ostokset: 5000, Koti: 10000 }, "2001-02": { Ostokset: 0 } });
    expect(next.budgetActuals).toEqual({ "2001-01": { Ostokset: 1500 }, "2001-02": { Ostokset: 0 } });
    expect(budgetCategoryPolicy(next, "Ostokset")).toMatchObject({ group: policy.group, maxPercent: policy.maxPercent });
    expect(state).toEqual(before);
  });

  it("ei poista budjettia, kun nimeen lisätään vain reunavälilyöntejä", () => {
    const state = fixture();
    expect(renameCategory(state, "expense-food", " Ruoka ")).toBe(state);
    expect(state.budgets["2001-01"].Ruoka).toBe(5000);
    expect(state.budgetActuals["2001-01"].Ruoka).toBe(1500);
  });

  it("säilyttää summan myös kohdenimen vanhassa budjettiavaimessa", () => {
    const state = fixture();
    state.budgets["2001-01"].Ostokset = 700;
    state.budgetActuals["2001-01"].Ostokset = 300;
    const next = renameCategory(state, "expense-food", "Ostokset");
    expect(next.budgets["2001-01"]).toEqual({ Ostokset: 5700, Koti: 10000 });
    expect(next.budgetActuals["2001-01"]).toEqual({ Ostokset: 1800 });
  });

  it("rajaa tulokategorian muutoksen tuloihin, vaikka menokategoria on samanniminen", () => {
    const state = fixture();
    const next = renameCategory(state, "income-food", "Palkka");
    expect(next.incomes[0]).toEqual({ ...state.incomes[0], category: "Palkka" });
    expect(next.expenses).toBe(state.expenses);
    expect(next.budgets).toBe(state.budgets);
    expect(next.budgetActuals).toBe(state.budgetActuals);
    expect(next.settings).toBe(state.settings);
  });

  it.each(["", "  ", "Koti", "x".repeat(101)])("hylkää virheellisen tai saman lajin varatun nimen: %s", (name) => {
    const state = fixture();
    const before = structuredClone(state);
    expect(() => renameCategory(state, "expense-food", name)).toThrow("Anna yksilöllinen nimi");
    expect(state).toEqual(before);
  });

  it("hylkää tuntemattoman kategorian", () => {
    expect(() => renameCategory(fixture(), "missing", "Ostokset")).toThrow("Kategoriaa ei löytynyt");
  });
});
