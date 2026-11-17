import { describe, expect, it } from 'vitest';
import { empty } from '../domain/model';
import { sharedCloudState, withLocalDisplaySettings } from '../services/cloud-state';
import { canonicalJson, familyBackup } from '../services/family-backup';
import { validateCloudWrite } from '../services/cloud-validation';

describe('shared cloud state', () => {
  it('does not make display-only changes into shared financial changes', () => {
    const state = empty();
    const otherView = structuredClone(state);
    otherView.settings.month = '2026-12';
    otherView.settings.theme = 'blue';
    otherView.settings.private = true;
    expect(canonicalJson(sharedCloudState(otherView))).toBe(canonicalJson(sharedCloudState(state)));
    expect(state.settings.theme).toBe('neutral');
    expect(() => validateCloudWrite(familyBackup(sharedCloudState(otherView)))).not.toThrow();
  });

  it('preserves financial settings and restores each browser’s own display choices', () => {
    const local = empty();
    local.settings.month = '2026-11';
    local.settings.theme = 'green';
    const shared = sharedCloudState(local);
    shared.settings.budgetGuidance.needs = 40;
    shared.settings.budgetGuidance.wants = 40;
    const restored = withLocalDisplaySettings(shared, local);
    expect(restored.settings.month).toBe('2026-11');
    expect(restored.settings.theme).toBe('green');
    expect(restored.settings.budgetGuidance.needs).toBe(40);
    expect(restored.settings.budgetGuidance.wants).toBe(40);
  });
});
