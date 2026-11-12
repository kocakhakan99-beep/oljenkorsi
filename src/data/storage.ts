import { empty, type State } from '../domain/model';
import { validate, backup, restore } from '../services/validation';
export interface StorageProvider {
  get(): State;
  getAll(): State;
  create(s: State): void;
  update(s: State): void;
  delete(): void;
  clear(): void;
  export(): string;
  import(text: string): State;
  healthCheck(): { ok: boolean; message: string };
}
export class LocalStorageProvider implements StorageProvider {
  key = 'taloussuunnittelu.v1';
  expected: string | null = null;
  get() {
    let t = localStorage.getItem(this.key);
    this.expected = t;
    if (!t) return empty();
    const state = restore(t);
    const raw = JSON.parse(t) as { data?: { receiptImports?: unknown; expenses?: { description?: unknown }[] } };
    const hasImportedReceiptHistory = !!raw.data && (
      Object.hasOwn(raw.data, 'receiptImports') ||
      raw.data.expenses?.some(e => typeof e.description === 'string' && /^Kuittituonti [0-9a-f-]{36}\. /i.test(e.description))
    );
    if (hasImportedReceiptHistory) {
      try {
        const cleaned = backup(state);
        if (localStorage.getItem(this.key) === t) {
          localStorage.setItem(this.key, cleaned);
          if (localStorage.getItem(this.key) === cleaned) this.expected = cleaned;
        }
      } catch {
        // Keep the validated, cleaned data in memory; the next successful save retries cleanup.
      }
    }
    return state;
  }
  getAll() {
    return this.get();
  }
  create(s: State) {
    this.update(s);
  }
  update(s: State) {
    if (localStorage.getItem(this.key) !== this.expected)
      throw Error(
        'Tallennus muuttui toisessa välilehdessä. Vie muistissa oleva talous varmuuskopioksi ja avaa sovellus uudelleen.',
      );
    let t = backup(validate(s));
    localStorage.setItem(this.key, t);
    if (localStorage.getItem(this.key) !== t) throw Error('Tallennuksen tarkistus epäonnistui.');
    this.expected = t;
  }
  delete() {
    this.clear();
  }
  clear() {
    localStorage.removeItem(this.key);
    this.expected = null;
    if (localStorage.getItem(this.key) !== null) throw Error('Poisto epäonnistui.');
  }
  export() {
    return backup(this.get());
  }
  import(text: string) {
    let s = restore(text);
    this.update(s);
    return s;
  }
  healthCheck() {
    try {
      let k = this.key + '.probe';
      localStorage.setItem(k, 'ok');
      let ok = localStorage.getItem(k) === 'ok';
      localStorage.removeItem(k);
      return {
        ok,
        message: ok ? 'Paikallinen tallennus käytettävissä' : 'Tallennuksen tarkistus epäonnistui',
      };
    } catch {
      return {
        ok: false,
        message: 'Selain ei salli paikallista tallennusta. Vie varmuuskopio ennen sulkemista.',
      };
    }
  }
}
/** Talous on kirjautumattomana vain tämän sivun muistissa. */
export class MemoryStorageProvider implements StorageProvider {
  readonly key = 'taloussuunnittelu.v1'; // Aiemman version tietojen vapaaehtoinen vienti.
  private text: string | null = null;
  get() { return this.text ? restore(this.text) : empty(); }
  getAll() { return this.get(); }
  create(s: State) { this.update(s); }
  update(s: State) { this.text = backup(validate(s)); }
  delete() { this.clear(); }
  clear() { this.text = null; }
  export() { return backup(this.get()); }
  import(text: string) { const state = restore(text); this.update(state); return state; }
  healthCheck() { return { ok: true, message: 'Tiedot ovat vain muistissa' }; }
}
export const storage = new MemoryStorageProvider();
