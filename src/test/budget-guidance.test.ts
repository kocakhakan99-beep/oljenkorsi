import { describe, expect, it } from "vitest";
import { budgetGuidance, budgetCategoryPolicy } from "../domain/budget-guidance";
import { empty, entry } from "../domain/model";
import { planActions } from "../domain/actions";
import { backup, restore, validate } from "../services/validation";
const month = "2026-10";
function household() {
  const state = empty();
  state.incomes = [entry({ name: "Testi", amount: 300000, date: `${month}-01` })];
  state.expenses = [
    entry({ name: "Testi", amount: 150000, category: "Asuminen", date: `${month}-02` }),
    entry({ name: "Testi", amount: 90000, category: "Harrastukset", date: `${month}-02` }),
    entry({ name: "Testi", amount: 60000, category: "Sijoittaminen", expenseType: "investment", date: `${month}-02` }),
  ];
  return state;
}
describe("Budjetin raamit", () => {
  it("jakaa 3000 euron nettotulot 1500/900/600 ja säästöjä ei päätellä ylijäämästä", () => {
    const s = household();
    const r = budgetGuidance(s, month);
    expect(r.checks.map(c => [c.allocated, c.target, c.outside])).toEqual([[150000, 150000, false], [90000, 90000, false], [60000, 60000, false]]);
    s.expenses = [];
    expect(budgetGuidance(s, month).checks.find(c => c.group === "saving")?.gap).toBe(60000);
  });
  it("ei laske budjettia ja tapahtumia kahdesti ja huomioi suuremman manuaalisen toteuman", () => {
    const s = household();
    s.budgets[month] = { Asuminen: 160000 };
    expect(budgetGuidance(s, month).groups.needs.allocated).toBe(160000);
    s.budgetActuals[month] = { Asuminen: 170000 };
    const r = budgetGuidance(s, month);
    expect(r.groups.needs).toEqual({ actual: 170000, allocated: 170000 });
    expect(r.categories.find(c => c.name === "Asuminen")?.excess).toBe(80000);
  });
  it("tulevat ja ohitetut tapahtumat erotellaan toteumista", () => {
    const s = empty();
    s.incomes = [entry({ name: "Testi", date: "2199-01-01", amount: 300000 })];
    s.expenses = [entry({ name: "Testi", date: "2199-01-02", category: "Ruoka", amount: 40000 }), entry({ name: "Testi", date: "2199-01-03", category: "Ruoka", amount: 99999, status: "skipped" })];
    const r = budgetGuidance(s, "2199-01");
    expect(r.income).toBe(300000);
    expect(r.actualIncome).toBe(0);
    expect(r.groups.needs).toEqual({ actual: 0, allocated: 40000 });
  });
  it("ilman tulopohjaa ei anna prosenttiylityksiä", () => {
    const s = household(); s.incomes = [];
    const r = budgetGuidance(s, month);
    expect(r.checks.every(c => !c.outside)).toBe(true);
    expect(r.categories.every(c => c.cap === null && c.excess === 0)).toBe(true);
  });
  it("säästösiirto ohittaa kulutuskategorian ryhmän eikä manuaalinen kulutustoteuma korvaa siirtoa", () => {
    const s = household();
    s.expenses = [entry({ name: "Testi", date: `${month}-02`, category: "Ruoka", amount: 10000 }), entry({ name: "Testi", date: `${month}-02`, category: "Ruoka", amount: 20000, expenseType: "saving" })];
    s.budgetActuals[month] = { Ruoka: 15000 };
    const r = budgetGuidance(s, month);
    expect(r.groups.saving).toEqual({ actual: 20000, allocated: 20000 });
    expect(r.groups.needs).toEqual({ actual: 15000, allocated: 15000 });
    expect(r.totalAllocated).toBe(35000);
  });
  it("luokittelee omat kategoriat avoimesti ja asetukset kestävät nimeämisen ja varmuuskopion", () => {
    const s = household();
    s.expenses.push(entry({ name: "Testi", date: `${month}-02`, amount: 4000, category: "Oma meno" }));
    expect(budgetGuidance(s, month).groups.unclassified.allocated).toBe(4000);
    const c = s.categories.find(c => c.name === "Asuminen")!;
    s.settings.budgetGuidance.categories[c.id] = { group: "wants", maxPercent: 42 };
    c.name = "Koti";
    expect(budgetCategoryPolicy(s, "Koti")).toMatchObject({ group: "wants", maxPercent: 42 });
    const normalized = validate(s);
    expect(restore(backup(normalized))).toEqual(normalized);
  });
  it("vanha data saa 50/30/20 ja virheelliset prosentit hylätään", () => {
    const raw = JSON.parse(JSON.stringify(household()));
    delete raw.settings.budgetGuidance;
    expect(validate(raw).settings.budgetGuidance).toEqual({ needs: 50, wants: 30, saving: 20, categories: {} });
    raw.settings.budgetGuidance = { needs: 50, wants: 50, saving: 20, categories: {} };
    expect(() => validate(raw)).toThrow();
    raw.settings.budgetGuidance = { needs: 50, wants: 30, saving: 20, categories: { test: { group: "needs", maxPercent: -1 } } };
    expect(() => validate(raw)).toThrow();
  });
  it("kompassi suosittelee konkreettista kategorian tarkastusta ja ottaa omat rajat huomioon", () => {
    const s = household();
    const policy = budgetCategoryPolicy(s, "Asuminen");
    expect(planActions(s, month).some(a => a.id === `budget-category-review-${policy.key}-${month}` && a.nextStep?.includes("kilpailuttaa"))).toBe(true);
    s.settings.budgetGuidance.categories[policy.key] = { group: "needs", maxPercent: 60 };
    expect(planActions(s, month).some(a => a.id === `budget-category-review-${policy.key}-${month}`)).toBe(false);
  });
});
