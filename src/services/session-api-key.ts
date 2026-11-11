import { useSyncExternalStore } from 'react';

let memory: string | undefined;
const listeners = new Set<() => void>();
const storageKey = 'oljenkorsi.ai-session.worker';
function read() {
  if (memory !== undefined) return memory;
  try { return sessionStorage.getItem(storageKey) || ''; } catch { return ''; }
}
export function setSessionAPIKey(value: string) {
  const key = value.trim().replace(/^Bearer\s+/i, '').trim();
  memory = key;
  try { if (key) sessionStorage.setItem(storageKey, key); else sessionStorage.removeItem(storageKey); } catch { /* In-memory fallback when browser storage is unavailable. */ }
  for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useSessionAPIKey() {
  return useSyncExternalStore(subscribe, read, () => '');
}
