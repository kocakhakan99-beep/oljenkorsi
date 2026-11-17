import { canonicalJson, restoreFamilyBackup } from './family-backup';

export const MAX_CLOUD_DOCUMENT_BYTES = 5_000_000;

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Virheellinen pilvitallennus.');
  return value as Record<string, unknown>;
}

function exactKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every(key => keys.includes(key));
}

/** Validate an untrusted write without normalizing it into a different request. */
export function validateCloudWrite(input: unknown): void {
  const envelope = record(input);
  if (!exactKeys(envelope, ['format', 'version', 'checksum', 'backup'])) throw new Error('Virheellinen pilvitallennuksen rakenne.');
  const backup = record(envelope.backup);
  if (!exactKeys(backup, ['format', 'schemaVersion', 'applicationVersion', 'createdAt', 'checksumAlgorithm', 'checksum', 'data']))
    throw new Error('Virheellinen varmuuskopion rakenne.');
  if (backup.applicationVersion !== '0.1.0' || typeof backup.createdAt !== 'string' || backup.createdAt.length > 50 ||
      backup.checksumAlgorithm !== 'FNV-1a-32 (ei kryptografinen)') throw new Error('Virheellinen varmuuskopion metatieto.');
  const serialized = JSON.stringify(input);
  if (new TextEncoder().encode(serialized).byteLength > MAX_CLOUD_DOCUMENT_BYTES) throw new Error('Pilvitallennus ylittää 5 MB rajan.');
  const restored = restoreFamilyBackup(input);
  if (restored.integrity !== 'verified' || canonicalJson(backup.data) !== canonicalJson(restored.state))
    throw new Error('Pilvitallennus sisältää virheellisiä tai tuntemattomia kenttiä.');
}
