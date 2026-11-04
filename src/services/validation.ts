import { z } from 'zod';
import { empty, kinds, type State, type Entry } from '../domain/model';
import { MAX, validDate } from '../domain/calculations';
const shellSchema = z.object({
  schemaVersion: z.literal(1),
  applicationVersion: z.string().max(50),
  createdAt: z.string().max(50),
  settings: z.object({
    onboarded: z.boolean(),
    demo: z.boolean(),
    private: z.boolean(),
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    theme: z.enum(['neutral', 'blue', 'green', 'contrast', 'custom']),
    mode: z.enum(['light', 'dark', 'system']),
    accent: z.string().regex(/^#[0-9a-f]{6}$/i),
    currency: z.literal('EUR'),
    language: z.literal('fi'),
  }),
  categories: z.array(z.unknown()).max(500),
  incomes: z.array(z.unknown()).max(20000),
  expenses: z.array(z.unknown()).max(20000),
  assets: z.array(z.unknown()).max(20000),
  liabilities: z.array(z.unknown()).max(20000),
  investments: z.array(z.unknown()).max(20000),
  goals: z.array(z.unknown()).max(20000),
  budgets: z.record(z.string(), z.record(z.string(), z.number().int().nonnegative().max(MAX))),
  budgetActuals: z.record(z.string(), z.record(z.string(), z.number().int().nonnegative().max(MAX))).optional(),
  scenarios: z.array(z.unknown()).max(100),
  investmentTransactions: z.array(z.unknown()).max(0),
  themes: z.array(z.unknown()).max(0),
});
export function validate(raw: unknown): State {
  let check = shellSchema.safeParse(raw);
  if (!check.success)
    throw Error(
      'Tietomallin validointi epäonnistui: ' +
        check.error.issues[0].path.join('.') +
        ' ' +
        check.error.issues[0].message,
    );
  let text = JSON.stringify(raw);
  if (text.length > 10000000) throw Error('Data ylittää 10 Mt rajan.');
  JSON.parse(text, (k, v) => {
    if (['__proto__', 'constructor', 'prototype'].includes(k))
      throw Error('Kielletty avain tuontidatassa.');
    return v;
  });
  let x = raw as State;
  if (!x || x.schemaVersion !== 1) throw Error('Tuntematon skeemaversio. Vain versio 1 tuetaan.');
  let defaults = empty();
  if (
    !x.settings ||
    typeof x.settings.onboarded !== 'boolean' ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(x.settings.month)
  )
    throw Error('Virheelliset asetukset.');
  for (let k of ['demo', 'private'] as const)
    if (typeof x.settings[k] !== 'boolean') throw Error('Virheelliset asetukset.');
  if (
    !['neutral', 'blue', 'green', 'contrast', 'custom'].includes(x.settings.theme) ||
    !['light', 'dark', 'system'].includes(x.settings.mode) ||
    !/^#[0-9a-f]{6}$/i.test(x.settings.accent)
  )
    throw Error('Virheellinen teema.');
  let s: State = {
    ...defaults,
    settings: { ...defaults.settings, ...x.settings, currency: 'EUR', language: 'fi' },
    createdAt: String(x.createdAt),
    applicationVersion: String(x.applicationVersion),
  };
  let ids = new Set<string>();
  for (let k of kinds) {
    if (!Array.isArray(x[k]) || x[k].length > 20000) throw Error('Virheellinen tietuelista: ' + k);
    s[k] = x[k].map((e) => {
      validateEntry(e);
      if (ids.has(e.id)) throw Error('Päällekkäinen tunniste.');
      ids.add(e.id);
      let allowed = Object.keys(defaultsEntry);
      return Object.fromEntries(
        allowed.map((key) => [key, e[key as keyof Entry]]),
      ) as unknown as Entry;
    });
  }
  if (!Array.isArray(x.categories) || x.categories.length > 500)
    throw Error('Virheelliset kategoriat.');
  s.categories = x.categories.map((c) => {
    if (
      typeof c.id !== 'string' ||
      typeof c.name !== 'string' ||
      !c.name.trim() ||
      c.name.length > 100 ||
      !['incomes', 'expenses'].includes(c.kind) ||
      typeof c.archived !== 'boolean' ||
      !/^#[0-9a-f]{6}$/i.test(c.color)
    )
      throw Error('Virheellinen kategoria.');
    return { id: c.id, name: c.name, kind: c.kind, color: c.color, archived: c.archived };
  });
  if (
    !x.budgets ||
    typeof x.budgets !== 'object' ||
    Array.isArray(x.budgets) ||
    Object.keys(x.budgets).length > 1200
  )
    throw Error('Virheelliset budjetit.');
  s.budgets = {};
  for (let [m, b] of Object.entries(x.budgets)) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m) || !b || typeof b !== 'object' || Array.isArray(b))
      throw Error('Virheellinen budjettijakso.');
    s.budgets[m] = {};
    for (let [c, n] of Object.entries(b)) {
      if (c.length > 100 || !Number.isSafeInteger(n) || n < 0 || n > MAX)
        throw Error('Virheellinen budjettisummaa.');
      s.budgets[m][c] = n;
    }
  }
  s.budgetActuals = {};
  for (let [m, b] of Object.entries(x.budgetActuals || {})) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(m) || !b || typeof b !== 'object' || Array.isArray(b))
      throw Error('Virheellinen toteutunut budjetti.');
    s.budgetActuals[m] = {};
    for (let [c, n] of Object.entries(b)) {
      if (c.length > 100 || !Number.isSafeInteger(n) || n < 0 || n > MAX)
        throw Error('Virheellinen toteumasumma.');
      s.budgetActuals[m][c] = n;
    }
  }
  if (!Array.isArray(x.scenarios) || x.scenarios.length > 100)
    throw Error('Virheelliset skenaariot.');
  s.scenarios = x.scenarios.map((q) => {
    if (
      typeof q.id !== 'string' ||
      typeof q.name !== 'string' ||
      q.name.length > 100 ||
      !Number.isSafeInteger(q.initial) ||
      q.initial < 0 ||
      q.initial > MAX ||
      !Number.isSafeInteger(q.monthly) ||
      q.monthly < 0 ||
      q.monthly > MAX ||
      !Number.isInteger(q.years) ||
      q.years < 1 ||
      q.years > 50 ||
      !Number.isFinite(q.rate) ||
      q.rate <= -100 ||
      q.rate > 50 ||
      !Number.isFinite(q.fee) ||
      q.fee < 0 ||
      q.fee >= 100 ||
      !Number.isFinite(q.inflation) ||
      q.inflation <= -100 ||
      q.inflation > 50
    )
      throw Error('Virheellinen skenaario.');
    if (
      !Number.isSafeInteger(
        Math.round(
          (q.initial + q.monthly * q.years * 12) * Math.pow(1 + Math.max(0, q.rate) / 100, q.years),
        ),
      )
    )
      throw Error('Skenaarion arvo ylittää turvallisen laskentarajan.');
    return {
      id: q.id,
      name: q.name,
      initial: q.initial,
      monthly: q.monthly,
      years: q.years,
      rate: q.rate,
      fee: q.fee,
      inflation: q.inflation,
    };
  });
  for (let k of ['investmentTransactions', 'themes'] as const) {
    if (!Array.isArray(x[k]) || x[k].length)
      throw Error('Tämä versio ei tue erillisiä sijoitustapahtumia tai teemaluetteloa.');
    s[k] = [];
  }
  let values = [...s.incomes, ...s.expenses, ...s.assets, ...s.liabilities, ...s.goals].map(
    (e) => e.amount,
  );
  values.push(...s.investments.map((e) => Math.round(e.amount * e.quantity)));
  if (values.reduce((a, b) => a + b, 0) > Number.MAX_SAFE_INTEGER / 100)
    throw Error('Kokonaisarvo ylittää turvallisen laskentarajan.');
  return s;
}
const defaultsEntry = {
  id: '',
  name: '',
  amount: 0,
  category: '',
  date: '',
  endDate: '',
  recurrence: 'once',
  status: 'actual',
  active: true,
  essential: true,
  description: '',
  tags: '',
  quantity: 1,
  purchasePrice: 0,
  ownership: 100,
  liquid: false,
  rate: 0,
  payment: 0,
  target: 0,
  monthly: 0,
  createdAt: '',
  updatedAt: '',
  schemaVersion: 1,
};
export function validateEntry(e: Entry) {
  if (!e || e.schemaVersion !== 1) throw Error('Virheellinen tietue.');
  for (let k of [
    'id',
    'name',
    'category',
    'description',
    'tags',
    'createdAt',
    'updatedAt',
  ] as const)
    if (typeof e[k] !== 'string' || e[k].length > (k === 'description' ? 2000 : 200))
      throw Error('Virheellinen tekstikenttä: ' + k);
  if (
    !e.id ||
    !e.name.trim() ||
    !e.category.trim() ||
    !validDate(e.date) ||
    (e.endDate && (!validDate(e.endDate) || e.endDate < e.date))
  )
    throw Error('Tarkista nimi, kategoria ja päivämäärät.');
  for (let k of ['amount', 'purchasePrice', 'payment', 'target', 'monthly'] as const)
    if (!Number.isSafeInteger(e[k]) || e[k] < 0 || e[k] > MAX)
      throw Error('Virheellinen rahasumma: ' + k);
  for (let k of ['active', 'essential', 'liquid'] as const)
    if (typeof e[k] !== 'boolean') throw Error('Virheellinen valinta.');
  if (
    ![
      'once',
      'weekly',
      'biweekly',
      'monthly',
      'bimonthly',
      'quarterly',
      'semiannual',
      'yearly',
    ].includes(e.recurrence) ||
    !['actual', 'planned', 'skipped'].includes(e.status)
  )
    throw Error('Virheellinen toistuvuus tai tila.');
  if (
    !Number.isFinite(e.quantity) ||
    e.quantity < 0 ||
    e.quantity > 100000000 ||
    !Number.isFinite(e.ownership) ||
    e.ownership < 0 ||
    e.ownership > 100 ||
    !Number.isFinite(e.rate) ||
    e.rate <= -100 ||
    e.rate > 100
  )
    throw Error('Virheellinen määrä tai prosentti.');
  if (e.amount * e.quantity > Number.MAX_SAFE_INTEGER)
    throw Error('Sijoituksen arvo on liian suuri.');
}
export function checksum(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}
export function backup(s: State) {
  let data = validate(s);
  return JSON.stringify(
    {
      format: 'Taloussuunnittelu',
      schemaVersion: 1,
      applicationVersion: '0.1.0',
      createdAt: new Date().toISOString(),
      checksumAlgorithm: 'FNV-1a-32 (ei kryptografinen)',
      checksum: checksum(JSON.stringify(data)),
      data,
    },
    null,
    2,
  );
}
export function restore(text: string) {
  if (text.length > 10000000) throw Error('Varmuuskopio on liian suuri (10 Mt).');
  let x = JSON.parse(text, (k, v) => {
    if (['__proto__', 'constructor', 'prototype'].includes(k)) throw Error('Kielletty avain.');
    return v;
  });
  if (
    x.format !== 'Taloussuunnittelu' ||
    x.schemaVersion !== 1 ||
    x.checksum !== checksum(JSON.stringify(x.data))
  )
    throw Error('Varmuuskopion muoto tai eheystarkistus ei täsmää.');
  return validate(x.data);
}
