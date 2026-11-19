import type { State } from "./model";
import { budgetCategoryPolicy } from "./budget-guidance";

/** Rename the current name-based references together, without changing their totals. */
export function renameCategory(state: State, id: string, value: string): State {
  const category = state.categories.find((item) => item.id === id);
  if (!category) throw new Error("Kategoriaa ei löytynyt.");
  const name = value.trim();
  if (
    !name ||
    name.length > 100 ||
    state.categories.some(
      (item) => item.kind === category.kind && item.id !== id && item.name === name,
    )
  ) throw new Error("Anna yksilöllinen nimi (1–100 merkkiä).");
  // A whitespace-only edit must not move a budget key onto itself and delete it.
  if (name === category.name) return state;

  const moveReferences = (months: State["budgets"]) =>
    Object.fromEntries(Object.entries(months).map(([month, values]) => {
      if (!(category.name in values)) return [month, values];
      const next = { ...values, [name]: (values[name] || 0) + values[category.name] };
      delete next[category.name];
      return [month, next];
    }));
  const policy = budgetCategoryPolicy(state, category.name);
  return {
    ...state,
    categories: state.categories.map((item) => item.id === id ? { ...item, name } : item),
    [category.kind]: state[category.kind].map((item) =>
      item.category === category.name ? { ...item, category: name } : item,
    ),
    budgets: category.kind === "expenses" ? moveReferences(state.budgets) : state.budgets,
    budgetActuals: category.kind === "expenses" ? moveReferences(state.budgetActuals) : state.budgetActuals,
    settings: category.kind === "expenses" ? {
      ...state.settings,
      budgetGuidance: {
        ...state.settings.budgetGuidance,
        categories: {
          ...state.settings.budgetGuidance.categories,
          [id]: { group: policy.group, maxPercent: policy.maxPercent },
        },
      },
    } : state.settings,
  };
}
