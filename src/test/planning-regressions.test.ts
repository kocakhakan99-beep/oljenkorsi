import { describe, expect, it } from 'vitest';
import { annualReserveSummary } from '../domain/annual-planning';
import { budgetCopyPreview, shiftMonth } from '../domain/monthly-planning';
import { empty, entry } from '../domain/model';
import { familyBackup, restoreFamilyBackup } from '../services/family-backup';
import { validateCloudWrite } from '../services/cloud-validation';

describe('talouden suunnittelun regressiot', () => {
  it('jakaa vuosilaskun kahdelletoista kuukaudelle ja vähentää varauksen seuraavasta erästä', () => {
    const state = empty();
    const expense = entry({ name: 'Vakuutus', amount: 120000, date: '2027-12-01', recurrence: 'yearly', status: 'planned' });
    state.expenses = [expense];
    state.annualReservePlans = [expense.id];
    state.annualReservations = [{ expenseId: expense.id, occurrenceDate: '2027-12-01', amount: 20000 }];
    const summary = annualReserveSummary(state, '2027-01-01');
    expect(summary.monthlyReserve).toBe(10000);
    expect(summary.items[0].shortfallForNextDue).toBe(100000);
    expect(summary.items[0].savingsInstallments).toBe(11);
    expect(summary.items[0].neededPerMonth).toBe(9091);
  });

  it('säilyttää tietoisesti nollaksi asetetun budjetin täydennyksessä', () => {
    const state = empty();
    const category = state.categories.find(c => c.kind === 'expenses' && !c.archived)!;
    state.budgets['2026-12'] = { [category.name]: 5000 };
    state.budgets['2027-01'] = { [category.name]: 0 };
    const preview = budgetCopyPreview(state, '2026-12', '2027-01', 'fill-missing');
    expect(preview.budgets['2027-01'][category.name]).toBe(0);
    expect(preview.preserved).toContain(category.name);
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  });

  it('säilyttää vuosivarauksen ja hintahistorian pilvidokumentin palautuksessa', () => {
    const state = empty();
    const expense = entry({ name: 'Vakuutus', amount: 120000, date: '2027-12-01', recurrence: 'yearly', status: 'planned', priceHistory: [{ startDate: '2028-01-01', amount: 132000 }] });
    state.expenses = [expense];
    state.annualReservePlans = [expense.id];
    state.annualReservations = [{ expenseId: expense.id, occurrenceDate: '2027-12-01', amount: 20000, usedAmount: 5000 }];
    const document = familyBackup(state);
    expect(() => validateCloudWrite(document)).not.toThrow();
    const restored = restoreFamilyBackup(document).state;
    expect(restored.annualReservations).toEqual(state.annualReservations);
    expect(restored.expenses[0].priceHistory).toEqual(expense.priceHistory);
  });
});
