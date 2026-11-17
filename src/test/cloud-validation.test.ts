import { describe, expect, it } from 'vitest';
import { demo, empty } from '../domain/model';
import { canonicalJson, familyBackup } from '../services/family-backup';
import { checksum } from '../services/validation';
import { validateCloudWrite } from '../services/cloud-validation';
import { validateCloudWrite as validateBundledCloudWrite } from '../../supabase/functions/_shared/cloud-validation.mjs';

describe('cloud write validation', () => {
  it('accepts an application-generated snapshot', () => {
    expect(() => validateCloudWrite(familyBackup(empty()))).not.toThrow();
    expect(() => validateCloudWrite(familyBackup(demo()))).not.toThrow();
    expect(() => validateBundledCloudWrite(familyBackup(demo()))).not.toThrow();
  });

  it('rejects unknown envelope fields and content modified after checksum', () => {
    const data = familyBackup(empty());
    expect(() => validateCloudWrite({ ...data, token: 'synthetic-secret' })).toThrow();
    const tampered = structuredClone(data);
    (tampered.backup as { data: { settings: { month: string } } }).data.settings.month = '2026-12';
    expect(() => validateCloudWrite(tampered)).toThrow();
  });

  it('rejects oversized UTF-8 payload before parsing the state', () => {
    const data = familyBackup(empty());
    (data.backup as { data: { settings: Record<string, unknown> } }).data.settings.extra = 'ä'.repeat(2_500_001);
    expect(() => validateCloudWrite(data)).toThrow(/5 MB/);
  });

  it('rejects unknown settings even when the sender recomputes the checksum', () => {
    const data = familyBackup(empty());
    const state = (data.backup as { data: { settings: Record<string, unknown> } }).data;
    state.settings.apiKey = 'synthetic-secret';
    data.checksum = checksum(canonicalJson(state));
    expect(() => validateCloudWrite(data)).toThrow(/tuntemattomia kenttiä/);
    expect(() => validateBundledCloudWrite(data)).toThrow(/tuntemattomia kenttiä/);
  });
});
