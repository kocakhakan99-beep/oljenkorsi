import type { State } from '../domain/model';
import { backup, checksum, restore, validate } from './validation';

const FAMILY_BACKUP_FORMAT = 'TaloussuunnitteluFamilyBackup';

/** Keep a versioned backup envelope in the jsonb column. */
export function familyBackup(state: State) {
  const document = JSON.parse(backup(state)) as Record<string, unknown>;
  return {
    format: FAMILY_BACKUP_FORMAT,
    version: 1,
    checksum: checksum(canonicalJson(document.data)),
    backup: document,
  };
}

export type FamilyRestoreResult = {
  state: State;
  integrity: 'verified' | 'unverified-legacy';
};

/**
 * Family data is stored as jsonb, which can reorder object keys. Rebuild the
 * canonical app state before checking the backup checksum; never silently
 * accept an unverifiable copy.
 */
export function restoreFamilyBackup(value: unknown): FamilyRestoreResult {
  if (typeof value === 'string')
    return { state: restore(value), integrity: 'verified' };
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Perheen varmuuskopio ei ole kelvollinen.');
  }

  const envelope = value as Record<string, unknown>;
  if (
    envelope.format === FAMILY_BACKUP_FORMAT &&
    envelope.version === 1 &&
    envelope.backup &&
    typeof envelope.backup === 'object'
  ) {
    const backupDocument = envelope.backup as Record<string, unknown>;
    const state = validateBackupObject(backupDocument);
    if (
      typeof envelope.checksum !== 'string' ||
      checksum(canonicalJson(backupDocument.data)) !== envelope.checksum
    ) {
      throw new Error('Perheen varmuuskopion eheystarkistus ei täsmää.');
    }
    return { state, integrity: 'verified' };
  }

  // Backward compatibility for the original family format, which saved the
  // parsed backup as jsonb and therefore lost object insertion order.
  if (
    envelope.format === 'Taloussuunnittelu' &&
    envelope.schemaVersion === 1 &&
    typeof envelope.checksum === 'string'
  ) {
    const state = validateBackupObject(envelope);
    return {
      state,
      integrity:
        checksum(JSON.stringify(state)) === envelope.checksum
          ? 'verified'
          : 'unverified-legacy',
    };
  }

  throw new Error(
    'Perheen vanhan varmuuskopion eheyttä ei voitu tarkistaa. Tietoja ei ladattu eikä muutettu.',
  );
}

function validateBackupObject(value: unknown): State {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Perheen varmuuskopio ei ole kelvollinen.');
  }
  const document = value as Record<string, unknown>;
  if (
    document.format !== 'Taloussuunnittelu' ||
    document.schemaVersion !== 1 ||
    typeof document.checksum !== 'string'
  ) {
    throw new Error('Perheen varmuuskopio ei ole kelvollinen.');
  }
  const state = validate(document.data);
  return state;
}

export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const object = value as Record<string, unknown>;
    return `{${Object.keys(object)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}
