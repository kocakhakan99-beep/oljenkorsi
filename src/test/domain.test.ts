import { describe, it, expect } from "vitest";
import {
  money,
  metrics,
  budgetSummary,
  occurrences,
  scheduledOccurrences,
  previousFinnishBankDay,
  occurrencesWithStatus,
  occurrenceStatus,
  occurrenceAmount,
  occurrenceSum,
  compound,
  goalMonths,
  payoff,
  paymentBreakdown,
  depreciation,
  validDate,
  expenseType,
  userTags,
  fiTarget,
  fiMonths,
  emergencyFund,
  confirmedIncomeAverage,
  incomeInterruptionStress,
  linkedAssetOutlook,
} from "../domain/calculations";
import { empty, entry, demo, uid, today } from "../domain/model";
import {
  categoryIconFor,
  defaultCategoryDefinitions,
  optionalCategoryDefinitions,
} from "../domain/categories";
import { backup, restore, validate } from "../services/validation";
import {
  parseCSV,
  exportCSV,
  csvEntry,
  csvFields,
  mapCSVHeaders,
} from "../services/csv";
describe("Raha ja laskelmat", () => {
  it("FI-tavoite käyttää vuotuista rahoitusvajetta ja erottaa pääoman kattavuuden", () => {
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
  it("FI-aika käyttää kuun lopun lisäsijoitusta ja ilmoittaa saavuttamattoman tavoitteen", () => {
    expect(fiMonths(0, 10000, 0, 120000, 1)).toBe(12);
    expect(fiMonths(120000, 0, 0, 120000, 1)).toBe(0);
    expect(fiMonths(0, 0, 0, 120000, 50)).toBeNull();
    expect(fiMonths(100000, 0, -50, 120000, 1)).toBeNull();
    expect(() => fiMonths(0, 10000, 0, 120000, 51)).toThrow();
  });
  it("kulutus, säästösiirto ja sijoitussiirto luokitellaan kategoriasta riippumatta", () => {
    const dated = { date: "2026-11-01", amount: 50000 };
    let s = empty();
    s.incomes = [entry({ amount: 300000, date: "2026-11-01" })];
    s.expenses = [
      entry({ ...dated, category: "Uusi nimi", name: "Kulutus" }),
      entry({
        ...dated,
        category: "Uusi nimi",
        name: "Säästö",
        expenseType: "saving",
      }),
      entry({
        ...dated,
        category: "Uusi nimi",
        name: "Sijoitus",
        expenseType: "investment",
        tags: "oma tunniste",
      }),
    ];
    const m = metrics(s, "2026-11");
    expect(m.expense).toBe(150000);
    expect(m.consumption).toBe(50000);
    expect(m.savingTransfers).toBe(50000);
    expect(m.investmentTransfers).toBe(50000);
    expect(m.surplus).toBe(250000);
    expect(m.savingRate).toBeCloseTo(83.333);
    expect(expenseType(s.expenses[2])).toBe("investment");
  });
  it("vanhat oletuskategoriat tunnistetaan ja omat tunnisteet säilyvät", () => {
    expect(expenseType(entry({ category: " sääSTäminen " }))).toBe("saving");
    expect(expenseType(entry({ category: "Sijoittaminen" }))).toBe(
      "investment",
    );
    expect(userTags("oma; talous:expense-type=saving")).toBe("oma");
  });
  it("vanha hidden menotyyppimerkintä migroituu omaksi kentäkseen", () => {
    const older = JSON.parse(JSON.stringify(demo())) as Record<string, unknown>;
    const expenses = older.expenses as Record<string, unknown>[];
    expenses[0].tags = "oma huomio;talous:expense-type=investment";
    for (const kind of [
      "incomes",
      "expenses",
      "assets",
      "liabilities",
      "investments",
      "goals",
    ])
      for (const item of older[kind] as Record<string, unknown>[])
        delete item.expenseType;
    const migrated = validate(older);
    expect(migrated.expenses[0].expenseType).toBe("investment");
    expect(migrated.expenses[0].tags).toBe("oma huomio");
  });
  it("sentit ja suomalainen muoto", () => {
    expect(money("1 234,56 €")).toBe(123456);
    expect(money("1.234,56 €")).toBe(123456);
    expect(money("12,50")).toBe(1250);
    expect(money("19.99")).toBe(1999);
    expect(money("-0,01")).toBe(-1);
    expect(money("-19,99")).toBe(-1999);
  });
  it("hylkää epätarkat ja äärettömät arvot", () => {
    for (let s of ["NaN", "Infinity", "1.234", "1e9", ""])
      expect(() => money(s)).toThrow();
  });
  it("kassavirta, käyttövara, säästöaste, nettovarallisuus, hätävara", () => {
    let s = empty();
    s.incomes = [entry({ name: "Tulo", amount: 300000, date: "2026-11-01" })];
    s.expenses = [
      entry({ name: "Meno", amount: 100000, date: "2026-11-01" }),
      entry({
        name: "Tuleva",
        amount: 50000,
        date: "2026-11-02",
        occurrenceStatuses: { "2026-11-02": "planned" },
      }),
    ];
    s.assets = [entry({ name: "Tili", amount: 600000, liquid: true })];
    s.liabilities = [entry({ name: "Velka", amount: 200000 })];
    s.investments = [entry({ name: "Salkku", amount: 10000, quantity: 2 })];
    s.budgets["2026-11"] = { Muu: 120000 };
    let m = metrics(s, "2026-11");
    expect(m.cash).toBe(200000);
    expect(m.available).toBe(150000);
    expect(m.savingRate).toBeCloseTo(66.666);
    expect(m.net).toBe(420000);
    expect(m.buffer).toBe(6);
    expect(m.budget - m.expense).toBe(20000);
  });
  it("budjetin yhteenveto vertaa vain budjetoituja kategorioita", () => {
    const state = empty();
    state.budgets["2026-11"] = { Ruoka: 60000, Asuminen: 0 };
    state.budgetActuals["2026-11"] = { Ruoka: 50000 };
    state.expenses = [
      entry({
        category: "Ruoka",
        amount: 70000,
        date: "2026-11-03",
      }),
      entry({
        category: "Asuminen",
        amount: 30000,
        date: "2026-11-04",
      }),
    ];
    expect(budgetSummary(state, "2026-11")).toMatchObject({
      planned: 60000,
      budgetedActual: 50000,
      difference: 10000,
      unbudgetedActual: 30000,
    });
  });
  it("nollatulot eivät aiheuta NaN-arvoa", () =>
    expect(metrics(empty(), "2026-11").savingRate).toBeNull());
  it("hätävaran keskiarvo käyttää vain vahvistettuja kokonaisia kulutuskuukausia", () => {
    const s = empty();
    s.assets = [entry({ amount: 600000, liquid: true })];
    s.coverage.expenseMonths = ["2026-01", "2026-03"];
    s.expenses = [
      entry({ date: "2026-01-12", amount: 100000, essential: true }),
      entry({ date: "2026-03-12", amount: 200000, essential: true }),
      entry({
        date: "2026-02-12",
        amount: 50000,
        essential: true,
        occurrenceStatuses: { "2026-02-12": "planned" },
      }),
      entry({
        date: "2026-02-12",
        amount: 50000,
        essential: true,
        expenseType: "saving",
      }),
    ];
    expect(emergencyFund(s, "2026-03", 3)).toEqual({
      requestedMonths: 3,
      observedMonths: 2,
      averageEssential: 150000,
      liquid: 600000,
      buffer: 4,
    });
    expect(emergencyFund(s, "2026-02", 1).buffer).toBeNull();
    expect(() => emergencyFund(s, "2026-03", 2)).toThrow();
    s.coverage.expenseMonths.push("2026-02");
    expect(emergencyFund(s, "2026-03", 3)).toMatchObject({
      observedMonths: 3,
      averageEssential: 100000,
      buffer: 6,
    });
  });
  it("toistuva meno lasketaan vasta, kun kuukaudet on vahvistettu", () => {
    const s = empty();
    s.coverage.expenseMonths = ["2026-01", "2026-02", "2026-03"];
    s.expenses = [
      entry({
        date: "2026-01-01",
        recurrence: "monthly",
        amount: 100000,
        essential: true,
      }),
    ];
    expect(emergencyFund(s, "2026-03", 3).observedMonths).toBe(3);
  });
  it("kuluvaa kuukautta ei koskaan käsitellä kokonaisena hätävarakuukautena", () => {
    const s = empty();
    const current = new Date();
    const month = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    s.coverage.expenseMonths = [month];
    s.expenses = [entry({ date: `${month}-01`, amount: 100000 })];
    expect(emergencyFund(s, month, 1).observedMonths).toBe(0);
  });
  it("tulokatkoksen arvio käyttää vain vahvistettua historiaa ja laskee puskurivajeen", () => {
    const state = empty();
    state.coverage.incomeMonths = ["2026-01", "2026-02", "2026-04"];
    state.incomes = [
      entry({ amount: 300000, date: "2026-01-01" }),
      entry({ amount: 900000, date: "2026-04-01" }),
    ];
    expect(confirmedIncomeAverage(state, "2026-04")).toEqual({
      months: 3,
      average: 400000,
    });
    expect(incomeInterruptionStress(250000, 300000, 50, 3, 600000)).toEqual({
      incomeAfterShock: 150000,
      monthlyShortfall: 100000,
      reserveNeeded: 300000,
      reserveGap: 0,
      remainingLiquid: 300000,
    });
    expect(
      incomeInterruptionStress(250000, 300000, 100, 3, 100000),
    ).toMatchObject({ reserveNeeded: 750000, reserveGap: 650000 });
    expect(() => incomeInterruptionStress(250000, 300000, 101, 3, 0)).toThrow();
  });
  it("arvonalenema", () => expect(depreciation(100000, -10, 2)).toBe(81000));
  it("tavoitteen kesto", () => {
    expect(
      goalMonths(entry({ target: 100000, amount: 10000, monthly: 30000 })),
    ).toBe(3);
    expect(goalMonths(entry({ target: 100000 }))).toBeNull();
  });
  it("velanmaksu", () => {
    expect(payoff(120000, 10000, 0)).toEqual({ months: 12, interest: 0 });
    expect(payoff(120000, 100, 12)).toBeNull();
  });
  it("jakaa seuraavan lainaerän korkoon ja pääoman lyhennykseen", () => {
    expect(paymentBreakdown(200000, 10000, 6)).toEqual({
      payment: 10000,
      interest: 1000,
      principal: 9000,
      remainingBalance: 191000,
    });
    expect(paymentBreakdown(5000, 10000, 0)).toEqual({
      payment: 5000,
      interest: 0,
      principal: 5000,
      remainingBalance: 0,
    });
    expect(paymentBreakdown(100000, 500, 12)).toMatchObject({
      principal: -500,
      remainingBalance: 100500,
    });
    expect(() => paymentBreakdown(-1, 10000, 6)).toThrow();
  });
  it("omaisuuserään linkitetty velka näyttää nykyisen ja arvioidun oman pääoman", () => {
    const asset = entry({ id: "home", amount: 20000000, ownership: 50 });
    const debt = entry({
      linkedAssetId: "home",
      amount: 2000000,
      payment: 100000,
      rate: 0,
    });
    const outlook = linkedAssetOutlook(asset, [debt], 0);
    expect(outlook?.ownedValue).toBe(10000000);
    expect(outlook?.debtBalance).toBe(2000000);
    expect(outlook?.currentEquity).toBe(8000000);
    expect(outlook?.payoffMonths).toBe(20);
    expect(outlook?.estimatedInterest).toBe(0);
    expect(outlook?.estimatedEquityAtPayoff).toBe(10000000);
    expect(
      linkedAssetOutlook(asset, [entry({ ...debt, payment: 0 })], 0)
        ?.payoffMonths,
    ).toBeNull();
  });
  it("korkoa korolle nollatuotolla", () => {
    let r = compound({
      id: uid(),
      name: "Testi",
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
  it("vuosituotto ja inflaatio", () => {
    let r = compound({
      id: uid(),
      name: "Testi",
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
  it("kulut vähentävät arvoa", () => {
    let r = compound({
      id: uid(),
      name: "Testi",
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
describe("Toistuvuus ja päivät", () => {
  it("kuukauden loppu ja karkausvuosi", () => {
    let e = entry({ date: "2024-01-31", recurrence: "monthly" });
    expect(occurrences(e, "2024-02")).toEqual(["2024-02-29"]);
    expect(occurrences(e, "2024-03")).toEqual(["2024-03-31"]);
  });
  it("viikkotoisto ja loppupäivä", () => {
    let e = entry({
      date: "2026-11-01",
      endDate: "2026-11-15",
      recurrence: "weekly",
    });
    expect(occurrences(e, "2026-11")).toEqual([
      "2026-11-01",
      "2026-11-08",
      "2026-11-15",
    ]);
  });
  it("kahden viikon toisto", () =>
    expect(
      occurrences(
        entry({ date: "2026-11-01", recurrence: "biweekly" }),
        "2026-11",
      ),
    ).toHaveLength(3));
  it("kaikki kuukausivälit", () => {
    for (let [rec, month] of [
      ["bimonthly", "2026-03"],
      ["quarterly", "2026-04"],
      ["semiannual", "2026-07"],
      ["yearly", "2027-01"],
    ] as const)
      expect(
        occurrences(entry({ date: "2026-01-31", recurrence: rec }), month),
      ).toHaveLength(1);
  });
  it("ei tapahtumia ennen alkua, keskeytettynä tai ohitettuna", () => {
    expect(
      occurrences(
        entry({ date: "2026-12-01", recurrence: "monthly" }),
        "2026-11",
      ),
    ).toEqual([]);
    expect(occurrences(entry({ active: false }), "2026-11")).toEqual([]);
    expect(occurrences(entry({ status: "skipped" }), "2026-11")).toEqual([]);
  });
  it("laskee menneet ja tulevat tapahtumat päivämäärästä ja säilyttää poikkeuksen", () => {
    const current = new Date(`${today()}T12:00:00`);
    const yesterday = new Date(current);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(current);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const item = entry({ status: "planned" });
    expect(occurrenceStatus(item, iso(yesterday))).toBe("actual");
    expect(occurrenceStatus(item, today())).toBe("actual");
    expect(occurrenceStatus(item, iso(tomorrow))).toBe("planned");
    item.occurrenceStatuses[iso(tomorrow)] = "skipped";
    expect(occurrenceStatus(item, iso(tomorrow))).toBe("skipped");
  });
  it("siirtää toistuvan tulon viikonlopulta ja Suomen pankkipyhästä edeltävään pankkipäivään", () => {
    expect(previousFinnishBankDay("2027-05-16")).toBe("2027-05-14");
    expect(previousFinnishBankDay("2026-11-16")).toBe("2026-11-16");
    expect(previousFinnishBankDay("2026-12-06")).toBe("2026-12-04");
    expect(previousFinnishBankDay("2026-04-03")).toBe("2026-04-02");
    expect(previousFinnishBankDay("2027-06-25")).toBe("2027-06-24");
    expect(previousFinnishBankDay("2028-01-01")).toBe("2027-12-30");
    expect(() => previousFinnishBankDay("2026-02-30")).toThrow();

    const salary = entry({
      date: "2027-05-16",
      recurrence: "monthly",
      adjustToPreviousBankDay: true,
    });
    expect(scheduledOccurrences(salary, "2027-05")).toEqual(["2027-05-14"]);
    expect(scheduledOccurrences(salary, "2027-06")).toEqual(["2027-06-16"]);
    const newYearPay = entry({
      date: "2028-01-01",
      recurrence: "monthly",
      adjustToPreviousBankDay: true,
    });
    expect(scheduledOccurrences(newYearPay, "2027-12")).toEqual([
      "2027-12-30",
    ]);
    expect(scheduledOccurrences(newYearPay, "2028-01")).toEqual([]);
  });
  it("toistuvan tapahtuman yksittäinen tila ei muuta sarjan muita kuukausia", () => {
    const item = entry({
      date: "2026-11-10",
      recurrence: "monthly",
      amount: 10000,
      occurrenceStatuses: { "2026-11-10": "actual" },
    });
    item.occurrenceStatuses = {
      "2026-11-10": "actual",
      "2026-12-10": "planned",
      "2027-01-10": "skipped",
    };
    expect(occurrencesWithStatus(item, "2026-11", "actual")).toEqual([
      "2026-11-10",
    ]);
    expect(occurrencesWithStatus(item, "2026-12", "actual")).toEqual([]);
    expect(occurrencesWithStatus(item, "2026-12", "planned")).toEqual([
      "2026-12-10",
    ]);
    expect(occurrenceStatus(item, "2027-01-10")).toBe("skipped");
    expect(scheduledOccurrences(item, "2027-01")).toEqual(["2027-01-10"]);
    expect(occurrences(item, "2027-01")).toEqual([]);
    const state = empty();
    state.expenses = [item];
    expect(metrics(state, "2026-11").expense).toBe(10000);
    expect(metrics(state, "2026-12").expense).toBe(0);
    expect(metrics(state, "2026-12").planned).toBe(10000);
    expect(metrics(state, "2027-01").planned).toBe(0);
  });
  it("toistuvan tapahtuman summa voi poiketa vain yhdellä päivällä", () => {
    const item = entry({
      date: "2026-11-10",
      recurrence: "monthly",
      amount: 10000,
      category: "Ruoka",
      occurrenceStatuses: {
        "2026-11-10": "actual",
        "2026-12-10": "actual",
      },
    });
    item.occurrenceAmounts = { "2026-12-10": 12500 };
    const state = empty();
    state.expenses = [item];
    state.budgets["2026-12"] = { Ruoka: 13000 };
    expect(occurrenceAmount(item, "2026-11-10")).toBe(10000);
    expect(occurrenceSum(item, "2026-11", "actual")).toBe(10000);
    expect(occurrenceSum(item, "2026-12", "actual")).toBe(12500);
    expect(metrics(state, "2026-11").expense).toBe(10000);
    expect(metrics(state, "2026-12").expense).toBe(12500);
    expect(budgetSummary(state, "2026-12")).toMatchObject({
      budgetedActual: 12500,
      difference: 500,
    });
    item.occurrenceStatuses["2026-12-10"] = "planned";
    expect(metrics(state, "2026-12").expense).toBe(0);
    expect(metrics(state, "2026-12").planned).toBe(12500);
  });
  it("virheelliset päivät", () => {
    expect(validDate("2026-02-29")).toBe(false);
    expect(validDate("2024-02-29")).toBe(true);
    expect(validDate("2026-13-01")).toBe(false);
  });
});
describe("Varmuuskopio ja validointi", () => {
  it("demotalous sisältää kahden aikuisen ja lapsen sekä vaihtelevia kuukausituloja ja menoja", () => {
    const s = demo();
    expect(
      s.incomes.filter((item) => item.name.includes("nettopalkka")),
    ).toHaveLength(2);
    expect(s.incomes.some((item) => item.name.includes("Lapsilisä"))).toBe(
      true,
    );
    expect(s.expenses.some((item) => item.category === "Lapset ja perhe")).toBe(
      true,
    );
    expect(
      new Set(
        s.expenses
          .filter((item) => item.category === "Ruoka")
          .map((item) => item.amount),
      ).size,
    ).toBeGreaterThan(3);
    expect(
      new Set(
        s.incomes
          .filter((item) => item.category === "Sivutulot")
          .map((item) => item.amount),
      ).size,
    ).toBeGreaterThan(1);
    expect(s.settings.demo).toBe(true);
  });
  it("esimerkkitalouden roundtrip", () => {
    let s = demo();
    expect(restore(backup(s))).toEqual(s);
  });
  it("vanha varmuuskopio saa tyhjät omaisuuslinkit ja kompassitilat", () => {
    const older = JSON.parse(JSON.stringify(demo())) as Record<string, unknown>;
    delete older.actionStates;
    delete older.coverage;
    delete (older.settings as Record<string, unknown>).essentialMonthlyEstimate;
    for (const kind of [
      "incomes",
      "expenses",
      "assets",
      "liabilities",
      "investments",
      "goals",
    ])
      for (const item of older[kind] as Record<string, unknown>[])
        delete item.linkedAssetId;
    for (const kind of [
      "incomes",
      "expenses",
      "assets",
      "liabilities",
      "investments",
      "goals",
    ])
      for (const item of older[kind] as Record<string, unknown>[])
        delete item.adjustToPreviousBankDay;
    for (const kind of [
      "incomes",
      "expenses",
      "assets",
      "liabilities",
      "investments",
      "goals",
    ])
      for (const item of older[kind] as Record<string, unknown>[])
        delete item.expenseType;
    for (const kind of [
      "incomes",
      "expenses",
      "assets",
      "liabilities",
      "investments",
      "goals",
    ])
      for (const item of older[kind] as Record<string, unknown>[])
        delete item.occurrenceStatuses;
    for (const kind of [
      "incomes",
      "expenses",
      "assets",
      "liabilities",
      "investments",
      "goals",
    ])
      for (const item of older[kind] as Record<string, unknown>[])
        delete item.occurrenceAmounts;
    const migrated = validate(older);
    expect(migrated.actionStates).toEqual({});
    expect(migrated.settings.essentialMonthlyEstimate).toBeNull();
    expect(migrated.coverage).toEqual({ incomeMonths: [], expenseMonths: [] });
    expect(
      migrated.incomes.every((item) => item.adjustToPreviousBankDay),
    ).toBe(true);
    expect(
      migrated.expenses.every((item) => !item.adjustToPreviousBankDay),
    ).toBe(true);
    expect(
      migrated.liabilities.every((item) => item.linkedAssetId === ""),
    ).toBe(true);
    expect(
      migrated.incomes.every(
        (item) => Object.keys(item.occurrenceStatuses).length === 0,
      ),
    ).toBe(true);
    expect(
      migrated.incomes.every(
        (item) => Object.keys(item.occurrenceAmounts).length === 0,
      ),
    ).toBe(true);
  });
  it("lisää uudet oletusmenokategoriat aiempaan tallennettuun talouteen", () => {
    const oldState = empty();
    const added = [
      "Päivittäistavara",
      "Kosmetiikka",
      "Hygieniatarvikkeet",
      "Luottokorttilasku",
    ];
    oldState.categories = oldState.categories.filter(
      (category) => !added.includes(category.name),
    );
    const restored = validate(oldState);
    for (const name of added)
      expect(
        restored.categories.find(
          (category) => category.kind === "expenses" && category.name === name,
        )?.archived,
      ).toBe(false);
  });
  it("tallentaa Ei onnistu nyt -tilan varmuuskopioon", () => {
    const state = empty();
    state.actionStates["one-step"] = {
      status: "blocked",
      until: "2026-12-05",
      updatedAt: "2026-11-05T10:00:00.000Z",
    };
    const restored = restore(backup(state));
    expect(restored.actionStates["one-step"]).toEqual(
      state.actionStates["one-step"],
    );
  });
  it("kategorioilla on yhtenäiset kuvat ja vanhat kategoriat saavat ikonin palautuksessa", () => {
    expect(defaultCategoryDefinitions.length).toBeLessThanOrEqual(24);
    for (const name of [
      "Päivittäistavara",
      "Kosmetiikka",
      "Hygieniatarvikkeet",
      "Luottokorttilasku",
    ])
      expect(
        defaultCategoryDefinitions.some(
          (category) => category.kind === "expenses" && category.name === name,
        ),
      ).toBe(true);
    expect(optionalCategoryDefinitions.length).toBeGreaterThan(10);
    expect(categoryIconFor("Asunto", "assets")).toBe(
      categoryIconFor("Asuntolaina", "liabilities"),
    );
    const old = JSON.parse(JSON.stringify(empty())) as {
      categories: Array<Record<string, unknown>>;
    } & Record<string, unknown>;
    old.categories.push({
      id: "old-car-category",
      name: "Autoilu",
      kind: "expenses",
      color: "#376eab",
      archived: false,
    });
    for (const item of old.categories) delete item.icon;
    const migrated = validate(old);
    const auto = migrated.categories.find(
      (category) => category.name === "Autoilu",
    );
    expect(auto?.icon).toBe("car");
    expect(auto?.archived).toBe(true);
    expect(
      migrated.categories.find((category) => category.name === "Ruoka")?.icon,
    ).toBe("food");
  });
  it("velan omaisuuslinkin on viitattava olemassa olevaan omaisuuserään", () => {
    const state = demo();
    state.liabilities[0].linkedAssetId = "missing-asset";
    expect(() => validate(state)).toThrow();
    state.liabilities[0].linkedAssetId = state.assets[0].id;
    expect(validate(state).liabilities[0].linkedAssetId).toBe(
      state.assets[0].id,
    );
  });
  it("vioittunut eheys", () => {
    let b = JSON.parse(backup(demo()));
    b.data.incomes[0].amount++;
    expect(() => restore(JSON.stringify(b))).toThrow();
  });
  it("tuntematon skeema hylätään eikä migroida arvaamalla", () =>
    expect(() => validate({ ...empty(), schemaVersion: 2 })).toThrow());
  it("prototyyppisaastuminen hylätään", () =>
    expect(() => restore('{"__proto__":{"x":1}}')).toThrow());
  it("negatiiviset, NaN ja duplikaatit hylätään", () => {
    let s = demo();
    s.incomes[0].amount = -1;
    expect(() => validate(s)).toThrow();
    s.incomes[0].amount = NaN;
    expect(() => validate(s)).toThrow();
    s = demo();
    s.incomes.push(s.incomes[0]);
    expect(() => validate(s)).toThrow();
    s = demo();
    s.expenses[0].expenseType = "unknown" as never;
    expect(() => validate(s)).toThrow("Virheellinen menon tyyppi.");
  });
  it("virheelliset yksittäisen toistuman tilat hylätään", () => {
    const state = demo();
    state.expenses[0].occurrenceStatuses = {
      "2026-02-30": "planned",
    };
    expect(() => validate(state)).toThrow();
    state.expenses[0].occurrenceStatuses = {
      "2026-02-28": "unknown" as never,
    };
    expect(() => validate(state)).toThrow();
  });
  it("virheelliset toistuman summat hylätään", () => {
    const state = demo();
    state.expenses[0].occurrenceAmounts = { "2026-02-30": 100 };
    expect(() => validate(state)).toThrow();
    state.expenses[0].occurrenceAmounts = { "2026-02-28": -1 };
    expect(() => validate(state)).toThrow();
  });
});
describe("CSV", () => {
  it("erottimet, lainaus ja rivinvaihto", () => {
    expect(parseCSV('name;amount\r\n"Ruoka; koti";"19,99"')).toEqual([
      ["name", "amount"],
      ["Ruoka; koti", "19,99"],
    ]);
    expect(parseCSV('a,b\n"x\ny",z', ",")[1]).toEqual(["x\ny", "z"]);
  });
  it("sulkematon lainaus hylätään", () =>
    expect(() => parseCSV('"abc')).toThrow());
  it("tunnistaa suomenkieliset pankkiotsikot", () => {
    expect(
      mapCSVHeaders(["Kirjauspäivä", "Saaja/maksaja", "Määrä", "Luokka"]),
    ).toMatchObject({ name: 1, amount: 2, category: 3, date: 0 });
  });
  it("formula injection suojataan", () =>
    expect(
      exportCSV([entry({ name: "=SUM(A1)", description: "@cmd" })]),
    ).toContain("'=SUM(A1)"));
  it("CSV roundtrip", () => {
    let e = entry({
      name: "Ruoka",
      amount: 1999,
      date: "2026-11-03",
      recurrence: "monthly",
      occurrenceStatuses: { "2026-12-03": "planned" },
      occurrenceAmounts: { "2026-12-03": 2250 },
      expenseType: "investment",
      tags: "eläkesalkku",
    });
    let rows = parseCSV(exportCSV([e]).replace(/^\ufeff/, ""));
    let map = Object.fromEntries(csvFields.map((k, i) => [k, i]));
    let r = csvEntry(rows[1], map);
    expect(r.amount).toBe(1999);
    expect(r.name).toBe("Ruoka");
    expect(r.expenseType).toBe("investment");
    expect(r.tags).toBe("eläkesalkku");
    expect(r.date).toBe("2026-11-03");
    expect(r.occurrenceStatuses).toEqual({ "2026-12-03": "planned" });
    expect(r.occurrenceAmounts).toEqual({ "2026-12-03": 2250 });
  });
  it("suomalainen päivämäärä", () =>
    expect(
      csvEntry(["Testi", "10,20", "3.11.2026"], { name: 0, amount: 1, date: 2 })
        .date,
    ).toBe("2026-11-03"));
  it("vaatii päivämäärän eikä sijoita puuttuvaa päivää vahingossa tälle päivälle", () => {
    expect(() => csvEntry(["Testi", "10,20"], { name: 0, amount: 1 })).toThrow(
      "Päivämääräsarake puuttuu",
    );
    expect(() =>
      csvEntry(["Testi", "10,20", ""], {
        name: 0,
        amount: 1,
        date: 2,
      }),
    ).toThrow("Päivämäärä puuttuu");
  });
  it("tulkitsee pankin miinusmerkkisen tapahtuman menoksi mutta ei tuloksi", () => {
    const map = { name: 0, amount: 1, category: 2, date: 3 };
    expect(
      csvEntry(["Ruoka", "-19,99", "Ruoka", "3.11.2026"], map, "expenses")
        .amount,
    ).toBe(1999);
    expect(() =>
      csvEntry(["Ruoka", "-19,99", "Ruoka", "3.11.2026"], map, "incomes"),
    ).toThrow("Miinusmerkkinen summa näyttää menolta");
  });
});
