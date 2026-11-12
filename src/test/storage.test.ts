import { it, expect, vi, afterEach } from 'vitest';
import { LocalStorageProvider, MemoryStorageProvider } from '../data/storage';
import { demo, empty } from '../domain/model';
function memory() {
  let map = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
  });
  return map;
}
afterEach(() => vi.unstubAllGlobals());
it('vieraan tiedot pysyvät vain muistissa ja vanhaa tallennusta ei muuteta', () => {
  const map = memory();
  map.set('taloussuunnittelu.v1', 'vanha tallennus');
  const guest = new MemoryStorageProvider();
  const state = demo();
  guest.update(state);
  expect(guest.get()).toEqual(state);
  expect(map.get(guest.key)).toBe('vanha tallennus');
  expect(new MemoryStorageProvider().get().incomes).toEqual([]);
  guest.clear();
  expect(map.get(guest.key)).toBe('vanha tallennus');
});
it('tallennus ja uudelleenluku', () => {
  memory();
  let a = new LocalStorageProvider();
  a.get();
  let s = demo();
  a.update(s);
  let b = new LocalStorageProvider();
  expect(b.get()).toEqual(s);
});
it('poisto tarkistetaan', () => {
  memory();
  let a = new LocalStorageProvider();
  a.update(demo());
  a.clear();
  expect(a.get().settings.onboarded).toBe(false);
});
it('toisen välilehden muutos ei ylikirjoitu', () => {
  memory();
  let a = new LocalStorageProvider(),
    b = new LocalStorageProvider();
  a.get();
  b.get();
  a.update(demo());
  expect(() => b.update(empty())).toThrow('toisessa välilehdessä');
});
it('kiintiövirhe ei korvaa aiempaa dataa', () => {
  let map = memory();
  let a = new LocalStorageProvider();
  a.update(demo());
  let old = map.get(a.key);
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: () => {
      throw Error('QuotaExceededError');
    },
    removeItem: () => {},
  });
  expect(() => a.update(empty())).toThrow();
  expect(map.get(a.key)).toBe(old);
});
it('tallennuksen esto tunnistetaan', () => {
  vi.stubGlobal('localStorage', {
    setItem: () => {
      throw Error('SecurityError');
    },
  });
  expect(new LocalStorageProvider().healthCheck().ok).toBe(false);
});
