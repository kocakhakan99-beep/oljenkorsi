import { describe, expect, it } from 'vitest';
import { demo, empty } from '../domain/model';
import { backup, checksum, validate } from '../services/validation';
import { familyBackup, restoreFamilyBackup } from '../services/family-backup';

function postgresJsonbOrder(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(postgresJsonbOrder);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([a], [b]) => a.length - b.length || (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, item]) => [key, postgresJsonbOrder(item)]),
  );
}

describe('perheen varmuuskopiot', () => {
  it('ei vie tuntemattomia asetuksia kuten vahingossa lisättyä API-avainta', () => {
    const state = empty();
    Object.assign(state.settings, { apiKey: 'synthetic-secret' });
    expect(JSON.stringify(validate(state))).not.toContain('synthetic-secret');
    expect(JSON.stringify(familyBackup(state))).not.toContain('synthetic-secret');
    expect(validate(state).settings.theme).toBe(state.settings.theme);
  });

  it('hyväksyy alkuperäisen tarkistussumman ennen tuntemattomien asetusten siivousta', () => {
    const saved = familyBackup(empty());
    const data = (saved.backup as { data: { settings: Record<string, unknown> } }).data;
    data.settings.oldExtra = 'legacy';
    function canonical(value: unknown): string {
      if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
      if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
      return JSON.stringify(value);
    }
    saved.checksum = checksum(canonical(data));
    const restored = restoreFamilyBackup(postgresJsonbOrder(saved));
    expect(restored.integrity).toBe('verified');
    expect(restored.state.settings).not.toHaveProperty('oldExtra');
  });
  it('säilyttää tarkistettavan JSON-varmuuskopion jsonb-kierroksella', () => {
    const state = empty();
    state.budgets = { '2026-12': {}, '2026-01': {}, '2026-07': {} };
    const original = JSON.parse(backup(state));
    const stored = postgresJsonbOrder(familyBackup(state));

    expect(restoreFamilyBackup(stored)).toEqual({ state: original.data, integrity: 'verified' });
  });

  it('tarkistaa myös monipuolisen talouden JSONB-järjestyksen jälkeen', () => {
    const state = demo();
    const original = JSON.parse(backup(state));

    expect(restoreFamilyBackup(postgresJsonbOrder(familyBackup(state)))).toEqual({
      state: original.data,
      integrity: 'verified',
    });
  });

  it('hylkää uuden formaatin muuttuneella sisällöllä', () => {
    const stored = familyBackup(empty());
    stored.backup = JSON.parse(JSON.stringify(stored.backup));
    (stored.backup as { data: { settings: { month: string } } }).data.settings.month = '2026-12';

    expect(() => restoreFamilyBackup(stored)).toThrow(/eheystarkistus ei täsmää/);
  });

  it('palauttaa vanhan jsonb-tallennuksen, jos normalisoitu eheystarkistus täsmää', () => {
    const legacy = JSON.parse(backup(empty()));

    expect(restoreFamilyBackup(postgresJsonbOrder(legacy))).toEqual({ state: legacy.data, integrity: 'verified' });
  });

  it('ei lataa vanhaa sisältöä, jos eheystarkistus ei täsmää', () => {
    const legacy = JSON.parse(backup(empty()));
    legacy.data.settings.month = '2026-12';

    expect(restoreFamilyBackup(postgresJsonbOrder(legacy))).toEqual({ state: legacy.data, integrity: 'unverified-legacy' });
  });

  it('merkitsee vanhan järjestyksestä riippuvan tarkistuksen epävarmaksi, ei hylkää dataa', () => {
    const state = empty();
    state.budgets = { '2026-12': {}, '2026-01': {}, '2026-07': {} };
    const legacy = JSON.parse(backup(state));

    expect(restoreFamilyBackup(postgresJsonbOrder(legacy))).toEqual({
      state: legacy.data,
      integrity: 'unverified-legacy',
    });
  });
});
