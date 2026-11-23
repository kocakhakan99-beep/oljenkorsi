import { MAX } from "./calculations";
import type { State } from "./model";

export function transferBudget(state: State, month: string, from: string, to: string, amount: number): State {
  if (!from || !to || from === to) throw new Error("Valitse kaksi eri kategoriaa.");
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Anna nollaa suurempi summa.");
  const budgets = state.budgets[month] || {};
  const source = budgets[from] || 0;
  const target = budgets[to] || 0;
  if (amount > source) throw new Error("Siirto ylittää lähdekategorian budjetin.");
  if (target + amount > MAX) throw new Error("Kohdekategorian budjetti ylittää sallitun enimmäismäärän.");
  return { ...state, budgets: { ...state.budgets, [month]: { ...budgets, [from]: source - amount, [to]: target + amount } } };
}
