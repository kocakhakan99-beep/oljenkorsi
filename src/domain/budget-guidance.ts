import type { State } from "./model";
import { expenseType, occurrenceSum, total } from "./calculations";

export type BudgetGroup = "needs" | "wants" | "saving";
export interface BudgetGuidanceSettings {
  needs: number;
  wants: number;
  saving: number;
  categories: Record<string, { group: BudgetGroup | "unclassified"; maxPercent: number | null }>;
}
export const defaultBudgetGuidance = (): BudgetGuidanceSettings => ({ needs: 50, wants: 30, saving: 20, categories: {} });
export const budgetGroupNames = { needs: "Välttämättömät", wants: "Valinnaiset", saving: "Säästäminen ja sijoitukset", unclassified: "Luokittelematta" };
const defaults: Record<string, [BudgetGroup, number | null]> = {
  Asuminen: ["needs", 30], Sähkö: ["needs", 5], Vesi: ["needs", 2], Vakuutukset: ["needs", 5],
  Ruoka: ["needs", 15], Päivittäistavara: ["needs", 5], Kosmetiikka: ["wants", 2], Hygieniatarvikkeet: ["needs", 2],
  Liikenne: ["needs", 10], Terveys: ["needs", 5], Lääkkeet: ["needs", 5], "Lapset ja perhe": ["needs", 10],
  Puhelin: ["needs", 2], Internet: ["needs", 2], Tilaukset: ["wants", 3],
  Säästäminen: ["saving", null], Sijoittaminen: ["saving", null], Lisälyhennykset: ["saving", null],
  Autoilu: ["needs", 10], "Julkinen liikenne": ["needs", 5], "Ravintolat ja kahvilat": ["wants", 5],
  Vaatteet: ["wants", 5], Harrastukset: ["wants", 5], Viihde: ["wants", 3], Matkailu: ["wants", 5],
  Lemmikit: ["needs", 5], Lainat: ["needs", 15], Korot: ["needs", 5], Polttoaine: ["needs", 5],
};
export function budgetCategoryPolicy(state: State, name: string) {
  const category = state.categories.find((c) => c.kind === "expenses" && c.name === name);
  const key = category?.id || `name:${name}`;
  const override = state.settings.budgetGuidance.categories[key];
  const preset = defaults[name];
  return { key, group: override?.group ?? preset?.[0] ?? "unclassified", maxPercent: override ? override.maxPercent : preset?.[1] ?? null } as const;
}
export function budgetGuidance(state: State, month: string) {
  const rule = state.settings.budgetGuidance;
  const income = total(state.incomes, month);
  const actualIncome = total(state.incomes, month, true);
  const names = new Set([...state.categories.filter(c => c.kind === "expenses" && !c.archived).map(c => c.name), ...state.expenses.map(e => e.category), ...Object.keys(state.budgets[month] || {}), ...Object.keys(state.budgetActuals[month] || {})]);
  const groups = { needs: { actual: 0, allocated: 0 }, wants: { actual: 0, allocated: 0 }, saving: { actual: 0, allocated: 0 }, unclassified: { actual: 0, allocated: 0 } };
  const categories = [...names].map(name => {
    const policy = budgetCategoryPolicy(state, name);
    const entries = state.expenses.filter(e => e.category === name);
    let scheduled = 0, actual = 0;
    for (const e of entries) {
      const group = expenseType(e) !== "consumption" ? "saving" : policy.group;
      const expected = occurrenceSum(e, month);
      const paid = occurrenceSum(e, month, "actual");
      groups[group].allocated += expected;
      groups[group].actual += paid;
      scheduled += expected;
      actual += paid;
    }
    const manual = state.budgetActuals[month]?.[name];
    if (manual !== undefined) {
      const consumptionActual = total(entries.filter(e => expenseType(e) === "consumption"), month, true);
      groups[policy.group].actual += manual - consumptionActual;
      actual += manual - consumptionActual;
    }
    const planned = state.budgets[month]?.[name] || 0;
    const allocated = Math.max(planned, scheduled, actual);
    groups[policy.group].allocated += allocated - scheduled;
    const cap = income > 0 && policy.maxPercent !== null ? Math.round(income * policy.maxPercent / 100) : null;
    return { name, ...policy, actual, allocated, planned, cap, excess: cap === null ? 0 : Math.max(0, allocated - cap) };
  });
  const checks = (["needs", "wants", "saving"] as const).map(group => {
    const target = Math.round(income * rule[group] / 100);
    const amount = groups[group].allocated;
    const gap = income <= 0 ? 0 : group === "saving" ? Math.max(0, target - amount) : Math.max(0, amount - target);
    return { group, ...groups[group], percent: rule[group], target, gap, outside: gap > 0 };
  });
  return { income, actualIncome, categories, groups, checks, totalAllocated: Object.values(groups).reduce((sum, g) => sum + g.allocated, 0), coverageConfirmed: state.coverage.incomeMonths.includes(month) && state.coverage.expenseMonths.includes(month) };
}
