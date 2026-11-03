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
    return t ? restore(t) : empty();
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
export const storage = new LocalStorageProvider();
