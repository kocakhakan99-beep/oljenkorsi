import { describe, expect, it } from 'vitest';
import { empty } from '../domain/model';
import { preferencesFromState, preferencesSchema } from '../services/user-preferences';

describe('personal preferences', () => {
  it('includes only allowed personal settings, not household data', () => {
    const state = empty();
    state.settings.theme = 'blue';
    const result = preferencesFromState(state, new Set(['dashboard-start']));
    expect(result.theme).toBe('blue');
    expect(result.dismissedHelp).toEqual(['dashboard-start']);
    expect(result).not.toHaveProperty('budgetGuidance');
    expect(result).not.toHaveProperty('incomes');
  });
  it('rejects extra fields, invalid values and oversized lists', () => {
    const value = preferencesFromState(empty(), new Set());
    expect(preferencesSchema.safeParse({ ...value, apiKey: 'secret' }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...value, month: '2026-13' }).success).toBe(false);
    expect(preferencesSchema.safeParse({ ...value, dismissedHelp: Array(101).fill('help') }).success).toBe(false);
  });
});
