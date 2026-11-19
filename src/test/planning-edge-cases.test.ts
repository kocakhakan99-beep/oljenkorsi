import { describe, expect, it } from 'vitest';
import { annualReserveSummary } from '../domain/annual-planning';
import { budgetCopyPreview } from '../domain/monthly-planning';
import { occurrenceAmount } from '../domain/calculations';
import { emptyTrialAdjustments, trialBasisFingerprint, trialProjection } from '../domain/trial-mode';
import { empty, entry } from '../domain/model';

describe('suunnittelun reunatapaukset', () => {
  it('kertameno ei synnytä vuosittaista kuukausivarausta', () => {
    const state = empty();
    const item = entry({ date: '2090-03-01', amount: 10000, recurrence: 'once', status: 'planned' });
    state.expenses = [item]; state.annualReservePlans = [item.id];
    const result = annualReserveSummary(state, '2090-01-01');
    expect(result.monthlyReserve).toBe(0);
    expect(result.items[0].neededPerMonth).toBe(5000);
  });
  it('käytetty varaus ei kata uutta tarvetta eikä muuta menokirjausta', () => {
    const state = empty();
    const item = entry({ date: '2090-03-01', amount: 10000, recurrence: 'yearly', status: 'planned' });
    state.expenses = [item]; state.annualReservePlans = [item.id];
    state.annualReservations = [{ expenseId: item.id, occurrenceDate: item.date, amount: 8000, usedAmount: 3000 }];
    const before = JSON.stringify(state);
    const result = annualReserveSummary(state, '2090-01-01');
    expect(result.items[0].reservedForNextDue).toBe(5000);
    expect(result.items[0].shortfallForNextDue).toBe(5000);
    expect(result.items[0].neededPerMonth).toBe(2500);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('poistetun menon varaus säilyy näkyvänä orpona', () => {
    const state = empty(); state.annualReservePlans = ['missing'];
    expect(annualReserveSummary(state, '2090-01-01').orphanPlans).toEqual(['missing']);
  });
  it('hintamuutos alkaa voimaantulopäivänä ja päiväkohtainen summa ohittaa sen', () => {
    const item = entry({ amount: 10000, recurrence: 'monthly', priceHistory: [{ startDate: '2090-03-01', amount: 12000 }], occurrenceAmounts: { '2090-04-01': 9000 } });
    expect(occurrenceAmount(item, '2090-02-28')).toBe(10000);
    expect(occurrenceAmount(item, '2090-03-01')).toBe(12000);
    expect(occurrenceAmount(item, '2090-04-01')).toBe(9000);
  });
  it('korvaava budjettikopio ohittaa arkistoidut kategoriat ja kertoo poistuvat kohteet', () => {
    const state = empty();
    const category = state.categories.find(c => c.kind === 'expenses')!;
    category.archived = true;
    state.budgets['2090-01'] = { [category.name]: 20000 };
    state.budgets['2090-02'] = { 'Vanha': 5000 };
    const result = budgetCopyPreview(state, '2090-01', '2090-02', 'replace');
    expect(result.skipped).toContain(category.name);
    expect(result.removed).toContain('Vanha');
    expect(result.budgets['2090-02']).toEqual({});
    expect(state.budgets['2090-02']).toEqual({ 'Vanha': 5000 });
  });
  it('kokeilu laskee 12 kuukautta ja jättää lähtötilan muuttumattomaksi', () => {
    const state = empty();
    state.incomes = [entry({ amount: 200000, date: '2090-01-15', recurrence: 'monthly', status: 'planned' })];
    state.expenses = [entry({ amount: 50000, date: '2090-01-15', recurrence: 'monthly', status: 'planned' })];
    const before = JSON.stringify(state);
    const result = trialProjection(state, '2090-01-01', { ...emptyTrialAdjustments(), monthlyConsumptionDelta: -10000 });
    expect(result.months).toHaveLength(12);
    expect(result.baseline.income).toBe(2400000);
    expect(result.baseline.consumption).toBe(600000);
    expect(result.adjusted.consumption).toBe(480000);
    expect(result.difference).toBe(120000);
    expect(JSON.stringify(state)).toBe(before);
  });
  it('hintahistorian muutos vanhentaa kokeilun lähtötilan tunnisteen', () => {
    const state = empty(); state.expenses = [entry({ recurrence: 'monthly' })];
    const before = trialBasisFingerprint(state);
    state.expenses[0].priceHistory = [{ startDate: '2090-01-01', amount: 5000 }];
    expect(trialBasisFingerprint(state)).not.toBe(before);
  });
});
