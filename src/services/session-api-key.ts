import { useSyncExternalStore } from 'react';
import type { InvoiceProvider } from './invoice-ai';

const memory = new Map<InvoiceProvider, string>();
const listeners = new Set<() => void>();
const storageKey = (provider: InvoiceProvider) => `oljenkorsi.ai-session.${provider}`;
function read(provider: InvoiceProvider) {
  if (memory.has(provider)) return memory.get(provider)!;
  try { return sessionStorage.getItem(storageKey(provider)) || ''; } catch { return ''; }
}
export function setSessionAPIKey(provider: InvoiceProvider, value: string) {
  const key = value.trim().replace(/^Bearer\s+/i, '').trim();
  memory.set(provider, key);
  try { if (key) sessionStorage.setItem(storageKey(provider), key); else sessionStorage.removeItem(storageKey(provider)); } catch { /* In-memory fallback when browser storage is unavailable. */ }
  for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function useSessionAPIKey(provider: InvoiceProvider) {
  return useSyncExternalStore(subscribe, () => read(provider), () => '');
}
