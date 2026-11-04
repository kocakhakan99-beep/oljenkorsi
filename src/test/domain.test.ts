import { describe, it, expect } from 'vitest';
import {
  money,
  metrics,
  occurrences,
  compound,
  goalMonths,
  payoff,
  depreciation,
  validDate,
  expenseType,
  setExpenseTypeTags,
  fiTarget,
  fiMonths,
  emergencyFund,
} from '../domain/calculations';
import { empty, entry, demo, uid } from '../domain/model';
import { backup, restore, validate } from '../services/validation';
import { parseCSV, exportCSV, csvEntry, csvFields } from '../services/csv';
describe('Raha ja laskelmat', () => {
  it('FI-tavoite käyttää vuotuista rahoitusvajetta ja erottaa pääoman kattavuuden', () => {
    expect(fiTarget(3000000, 600000, 15000000, 4)).toEqual({
      gap: 2400000,
      target: 60000000,
      shortfall: 45000000,
      coverage: 25,
    });
    expect(fiTarget(1000000, 1200000, 0, 4)).toEqual({
      gap: 0,
      target: 0,
      shortfall: 0,
      coverage: null,
    });
    expect(() => fiTarget(1000000, 0, 0, 0)).toThrow();
  });
  it('FI-aika käyttää kuun lopun lisäsijoitusta ja ilmoittaa saavuttamattoman tavoitteen', () => {
    expect(fiMonths(0, 10000, 0, 120000, 1)).toBe(12);
    expect(fiMonths(120000, 0, 0, 120000, 1)).toBe(0);
    expect(fiMonths(0, 0, 0, 120000, 50)).toBeNull();
    expect(fiMonths(100000, 0, -50, 120000, 1)).toBeNull();
    expect(() => fiMonths(0, 10000, 0, 120000, 51)).toThrow();
  });
  it('kulutus, säästösiirto ja sijoitussiirto luokitellaan kategoriasta riippumatta', () => {
    const dated = { date: '2026-11-01', amount: 50000 };
    let s = empty();
    s.incomes = [entry({ amount: 300000, date: '2026-11-01' })];
    s.expenses = [
      entry({ ...dated, category: 'Uusi nimi', name: 'Kulutus' }),
      entry({ ...dated, category: 'Uusi nimi', name: 'Säästö', tags: setExpenseTypeTags('', 'saving') }),
      entry({ ...dated, category: 'Uusi nimi', name: 'Sijoitus', tags: setExpenseTypeTags('oma tunniste', 'investment') }),
    ];
    const m = metrics(s, '2026-11');
    expect(m.expense).toBe(150000);
    expect(m.consumption).toBe(50000);
    expect(m.savingTransfers).toBe(50000);
    expect(m.investmentTransfers).toBe(50000);
    expect(m.surplus).toBe(250000);
    expect(m.savingRate).toBeCloseTo(83.333);
    expect(expenseType(s.expenses[2])).toBe('investment');
  });
  it('vanhat oletuskategoriat tunnistetaan ja omat tunnisteet säilyvät', () => {
    expect(expenseType(entry({ category: ' sääSTäminen ' }))).toBe('saving');
    expect(expenseType(entry({ category: 'Sijoittaminen' }))).toBe('investment');
    expect(setExpenseTypeTags('oma; talous:expense-type=saving', 'consumption')).toBe(
      'oma;talous:expense-type=consumption',
    );
  });
  it('sentit ja suomalainen muoto', () => {
    expect(money('1 234,56 €')).toBe(123456);
    expect(money('19.99')).toBe(1999);
    expect(money('-0,01')).toBe(-1);
  });
  it('hylkää epätarkat ja äärettömät arvot', () => {
    for (let s of ['NaN', 'Infinity', '1.234', '1e9', '']) expect(() => money(s)).toThrow();
  });
  it('kassavirta, käyttövara, säästöaste, nettovarallisuus, hätävara', () => {
    let s = empty();
    s.incomes = [entry({ name: 'Tulo', amount: 300000, date: '2026-11-01' })];
    s.expenses = [
      entry({ name: 'Meno', amount: 100000, date: '2026-11-01' }),
      entry({ name: 'Tuleva', amount: 50000, date: '2026-11-02', status: 'planned' }),
    ];
    s.assets = [entry({ name: 'Tili', amount: 600000, liquid: true })];
    s.liabilities = [entry({ name: 'Velka', amount: 200000 })];
    s.investments = [entry({ name: 'Salkku', amount: 10000, quantity: 2 })];
    s.budgets['2026-11'] = { Muu: 120000 };
    let m = metrics(s, '2026-11');
    expect(m.cash).toBe(200000);
    expect(m.available).toBe(150000);
    expect(m.savingRate).toBeCloseTo(66.666);
    expect(m.net).toBe(420000);
    expect(m.buffer).toBe(6);
    expect(m.budget - m.expense).toBe(20000);
  });
  it('nollatulot eivät aiheuta NaN-arvoa', () =>
    expect(metrics(empty(), '2026-11').savingRate).toBeNull());
  it('hätävaran keskiarvo käyttää vain havaittuja välttämättömiä kulutuskuukausia', () => {
    const s = empty();
    s.assets = [entry({ amount: 600000, liquid: true })];
    s.expenses = [
      entry({ date: '2026-01-12', amount: 100000, essential: true }),
      entry({ date: '2026-03-12', amount: 200000, essential: true }),
      entry({ date: '2026-02-12', amount: 50000, essential: true, status: 'planned' }),
      entry({ date: '2026-02-12', amount: 50000, essential: true, tags: setExpenseTypeTags('', 'saving') }),
    ];
    expect(emergencyFund(s, '2026-03', 3)).toEqual({
      requestedMonths: 3,
      observedMonths: 2,
      averageEssential: 150000,
      liquid: 600000,
      buffer: 4,
    });
    expect(emergencyFund(s, '2026-02', 1).buffer).toBeNull();
    expect(() => emergencyFund(s, '2026-03', 2)).toThrow();
  });
  it('toistuva välttämätön meno kattaa jokaisen toteutuneeksi merkityn kuukauden', () => {
    const s = empty();
    s.expenses = [entry({ date: '2026-01-01', recurrence: 'monthly', amount: 100000, essential: true })];
    expect(emergencyFund(s, '2026-03', 3).observedMonths).toBe(3);
  });
  it('arvonalenema', () => expect(depreciation(100000, -10, 2)).toBe(81000));
  it('tavoitteen kesto', () => {
    expect(goalMonths(entry({ target: 100000, amount: 10000, monthly: 30000 }))).toBe(3);
    expect(goalMonths(entry({ target: 100000 }))).toBeNull();
  });
  it('velanmaksu', () => {
    expect(payoff(120000, 10000, 0)).toEqual({ months: 12, interest: 0 });
    expect(payoff(120000, 100, 12)).toBeNull();
  });
  it('korkoa korolle nollatuotolla', () => {
    let r = compound({
      id: uid(),
      name: 'Testi',
      initial: 100000,
      monthly: 10000,
      rate: 0,
      fee: 0,
      inflation: 0,
      years: 1,
    });
    expect(r.value).toBe(220000);
    expect(r.gain).toBe(0);
    expect(r.real).toBe(220000);
  });
  it('vuosituotto ja inflaatio', () => {
    let r = compound({
      id: uid(),
      name: 'Testi',
      initial: 100000,
      monthly: 0,
      rate: 10,
      fee: 0,
      inflation: 10,
      years: 1,
    });
    expect(r.value).toBeCloseTo(110000, -1);
    expect(r.real).toBeCloseTo(100000, -1);
  });
  it('kulut vähentävät arvoa', () => {
    let r = compound({
      id: uid(),
      name: 'Testi',
      initial: 100000,
      monthly: 0,
      rate: 0,
      fee: 1,
      inflation: 0,
      years: 1,
    });
    expect(r.value).toBeCloseTo(99000, -1);
    expect(r.feeImpact).toBeGreaterThan(0);
  });
});
describe('Toistuvuus ja päivät', () => {
  it('kuukauden loppu ja karkausvuosi', () => {
    let e = entry({ date: '2024-01-31', recurrence: 'monthly' });
    expect(occurrences(e, '2024-02')).toEqual(['2024-02-29']);
    expect(occurrences(e, '2024-03')).toEqual(['2024-03-31']);
  });
  it('viikkotoisto ja loppupäivä', () => {
    let e = entry({ date: '2026-11-01', endDate: '2026-11-15', recurrence: 'weekly' });
    expect(occurrences(e, '2026-11')).toEqual(['2026-11-01', '2026-11-08', '2026-11-15']);
  });
  it('kahden viikon toisto', () =>
    expect(
      occurrences(entry({ date: '2026-11-01', recurrence: 'biweekly' }), '2026-11'),
    ).toHaveLength(3));
  it('kaikki kuukausivälit', () => {
    for (let [rec, month] of [
      ['bimonthly', '2026-03'],
      ['quarterly', '2026-04'],
      ['semiannual', '2026-07'],
      ['yearly', '2027-01'],
    ] as const)
      expect(occurrences(entry({ date: '2026-01-31', recurrence: rec }), month)).toHaveLength(1);
  });
  it('ei tapahtumia ennen alkua, keskeytettynä tai ohitettuna', () => {
    expect(occurrences(entry({ date: '2026-12-01', recurrence: 'monthly' }), '2026-11')).toEqual(
      [],
    );
    expect(occurrences(entry({ active: false }), '2026-11')).toEqual([]);
    expect(occurrences(entry({ status: 'skipped' }), '2026-11')).toEqual([]);
  });
  it('virheelliset päivät', () => {
    expect(validDate('2026-02-29')).toBe(false);
    expect(validDate('2024-02-29')).toBe(true);
    expect(validDate('2026-13-01')).toBe(false);
  });
});
describe('Varmuuskopio ja validointi', () => {
  it('esimerkkitalouden roundtrip', () => {
    let s = demo();
    expect(restore(backup(s))).toEqual(s);
  });
  it('vioittunut eheys', () => {
    let b = JSON.parse(backup(demo()));
    b.data.incomes[0].amount++;
    expect(() => restore(JSON.stringify(b))).toThrow();
  });
  it('tuntematon skeema hylätään eikä migroida arvaamalla', () =>
    expect(() => validate({ ...empty(), schemaVersion: 2 })).toThrow());
  it('prototyyppisaastuminen hylätään', () =>
    expect(() => restore('{"__proto__":{"x":1}}')).toThrow());
  it('negatiiviset, NaN ja duplikaatit hylätään', () => {
    let s = demo();
    s.incomes[0].amount = -1;
    expect(() => validate(s)).toThrow();
    s.incomes[0].amount = NaN;
    expect(() => validate(s)).toThrow();
    s = demo();
    s.incomes.push(s.incomes[0]);
    expect(() => validate(s)).toThrow();
  });
});
describe('CSV', () => {
  it('erottimet, lainaus ja rivinvaihto', () => {
    expect(parseCSV('name;amount\r\n"Ruoka; koti";"19,99"')).toEqual([
      ['name', 'amount'],
      ['Ruoka; koti', '19,99'],
    ]);
    expect(parseCSV('a,b\n"x\ny",z', ',')[1]).toEqual(['x\ny', 'z']);
  });
  it('sulkematon lainaus hylätään', () => expect(() => parseCSV('"abc')).toThrow());
  it('formula injection suojataan', () =>
    expect(exportCSV([entry({ name: '=SUM(A1)', description: '@cmd' })])).toContain("'=SUM(A1)"));
  it('CSV roundtrip', () => {
    let e = entry({ name: 'Ruoka', amount: 1999, date: '2026-11-03' });
    let rows = parseCSV(exportCSV([e]).replace(/^\ufeff/, ''));
    let map = Object.fromEntries(csvFields.map((k, i) => [k, i]));
    let r = csvEntry(rows[1], map);
    expect(r.amount).toBe(1999);
    expect(r.name).toBe('Ruoka');
    expect(r.date).toBe('2026-11-03');
  });
  it('suomalainen päivämäärä', () =>
    expect(csvEntry(['Testi', '10,20', '3.11.2026'], { name: 0, amount: 1, date: 2 }).date).toBe(
      '2026-11-03',
    ));
});
