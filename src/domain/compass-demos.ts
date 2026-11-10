import { expenseType, previousFinnishBankDay, total } from "./calculations";
import { categoryIconFor, optionalCategoryDefinitions } from "./categories";
import { empty, entry, today, type State } from "./model";

export const compassDemoProfiles = [
  {
    id: "strained",
    rank: "1",
    label: "Haastava",
    title: "Menot kirivät tulojen ohi",
    story:
      "Kolmen hengen arjessa välttämättömät laskut vievät suuren osan tuloista. Useampi kuukausi päättyy miinukselle, vaikka menoja ei ole lisätty äkillisesti.",
    prompt:
      "Mikä on seuraavan kuukauden tärkein maksu, ja mitkä tiedot pitää tarkistaa ennen päätöksiä?",
    weather: "headwind",
    icon: "cloud-rain",
  },
  {
    id: "everyday",
    rank: "2",
    label: "Keskiverto",
    title: "Tavallinen arki, vaihtelevat viikot",
    story:
      "Tulot kattavat menot useimpina kuukausina. Ruokaostokset, lasten menot ja yksittäiset laskut heiluttavat summaa, joten yksi keskikuukausi ei kerro koko tarinaa.",
    prompt: "Mikä vaihtelee aidosti, ja mikä vain kirjautuu eri kuukaudelle?",
    weather: "clouds",
    icon: "cloud-sun",
  },
  {
    id: "steady",
    rank: "3",
    label: "Hyvä eteneminen",
    title: "Puskuri ja tavoite kulkevat rinnakkain",
    story:
      "Tulovirta on melko vakaa, likvidi puskuri on näkyvissä ja tavoitesäästö sopii kuukausittaiseen liikkumavaraan. Suunnitelmaa voi tarkistaa ilman, että jokainen euro on jo sidottu.",
    prompt:
      "Kestääkö suunnitelma myös heikomman tulokuukauden tai isomman vuosilaskun?",
    weather: "tailwind",
    icon: "sun",
  },
  {
    id: "shock",
    rank: "4",
    label: "Äkillinen kriisi",
    title: "Tulot katkeavat, laskut jatkuvat",
    story:
      "Yhden aikuisen palkkatulo katkeaa. Toisen palkka ja lapsilisä jatkuvat, mutta asuminen, ruoka ja velkojen eräpäivät jatkuvat. Puskuri on pieni, joten lähiviikkojen kassavirta on tärkein.",
    prompt:
      "Miten seuraavat 30 päivää järjestetään, ja kenen kanssa kannattaa olla ajoissa yhteydessä?",
    weather: "storm",
    icon: "lightning",
  },
] as const;

export type CompassDemoId = (typeof compassDemoProfiles)[number]["id"];

export interface CompassDemoCase {
  profile: (typeof compassDemoProfiles)[number];
  state: State;
  timeline: Array<{
    month: string;
    income: number;
    expense: number;
    cash: number;
  }>;
}

const series: Record<
  CompassDemoId,
  {
    income: number[];
    essential: number[];
    flexible: number[];
    liquid: number;
    investment: number;
    debt: number;
    rate: number;
    payment: number;
  }
> = {
  strained: {
    income: [344000, 337000, 342000, 329000, 338000, 331000],
    essential: [286000, 289000, 291000, 288000, 294000, 290000],
    flexible: [76000, 81000, 79000, 84000, 78000, 82000],
    liquid: 165000,
    investment: 180000,
    debt: 1450000,
    rate: 7.4,
    payment: 48000,
  },
  everyday: {
    income: [322000, 341000, 329000, 356000, 318000, 347000],
    essential: [218000, 225000, 217000, 231000, 222000, 229000],
    flexible: [77000, 85000, 81000, 91000, 86000, 83000],
    liquid: 690000,
    investment: 2450000,
    debt: 980000,
    rate: 4.2,
    payment: 39000,
  },
  steady: {
    income: [574000, 601000, 619000, 589000, 625000, 611000],
    essential: [215000, 221000, 218000, 224000, 219000, 223000],
    flexible: [89000, 92000, 96000, 100000, 94000, 97000],
    liquid: 2200000,
    investment: 9640000,
    debt: 710000,
    rate: 2.9,
    payment: 44000,
  },
  shock: {
    income: [414000, 407000, 179400, 183400, 176900, 180500],
    essential: [254000, 258000, 261000, 256000, 265000, 260000],
    flexible: [81000, 76000, 67000, 72000, 64000, 69000],
    liquid: 26000,
    investment: 850000,
    debt: 2180000,
    rate: 15.2,
    payment: 24000,
  },
};

export const demoMonths = Array.from({ length: 24 }, (_, index) => `${2025 + Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, "0")}`);

export function demoMonthSummary(state: State, month: string) {
  const income = total(state.incomes, month);
  const expense = total(state.expenses.filter(item => expenseType(item) === "consumption"), month);
  return { month, income, expense, cash: income - expense };
}

export function createCompassDemoCases(requestedMonth: string): CompassDemoCase[] {
  const month = requestedMonth < "2025-01" ? "2025-01" : requestedMonth > "2026-12" ? "2026-12" : requestedMonth;
  return compassDemoProfiles.map((profile) => {
    const values = series[profile.id];
    const state = empty();
    state.settings.onboarded = true;
    state.settings.demo = true;
    state.settings.month = month;
    state.settings.essentialMonthlyEstimate = values.essential[5];
    const mortgagePayment = { strained: 85000, everyday: 60000, steady: 55000, shock: 85000 }[profile.id];
    const saving = { strained: 1000, everyday: 12000, steady: 120000, shock: 0 }[profile.id];
    // One actual recurring series demonstrates editing without double-counting monthly rows.
    state.expenses.push(entry({ id: `${profile.id}-internet`, name: "Kodin internet", category: "Internet", amount: 3400, date: "2025-01-05", endDate: "2026-12-31", recurrence: "monthly", essential: true, description: "Kuvitteellinen kahden vuoden sopimus." }));
    demoMonths.forEach((period, ordinal) => {
      const m = Number(period.slice(5));
      const index = (ordinal + 1) % 6;
      const shock = profile.id === "shock" && period >= "2026-08";
      const yearFactor = period.startsWith("2025") ? 0.96 : 1;
      let income = Math.round(values.income[index] * yearFactor);
      if (profile.id === "shock") income = shock ? values.income[2 + ((ordinal - 19) % 4)] : Math.round((410000 + [4000, -3000, 9000, -6000, 2000, 0][index]) * yearFactor);
      const benefit = 9400;
      const bonus = !shock && (m === 6 || m === 12) ? Math.round(income * 0.06) : 0;
      const sideIncome = !shock && m % 3 === 0 ? 8000 + index * 1200 : 0;
      const wageTotal = income - benefit - sideIncome;
      const firstWage = shock ? 0 : Math.round(wageTotal * 0.55);
      const secondWage = wageTotal - firstWage;
      const addIncome = (key: string, name: string, category: string, amount: number, day: number) => {
        if (amount > 0) state.incomes.push(entry({ id: `${profile.id}-${key}-${period}`, name, category, amount, date: previousFinnishBankDay(`${period}-${String(day).padStart(2, "0")}`), description: "Fiktiivinen nettotulo. Päivä on aikaistettu tarvittaessa edeltävään pankkipäivään." }));
      };
      addIncome("adult-1", "Aikuisen 1 nettopalkka", "Palkka", firstWage, 15);
      addIncome("adult-2", "Aikuisen 2 nettopalkka", "Palkka", secondWage, 5);
      addIncome("benefit", "Lapsilisä", "Etuudet", benefit, 26);
      addIncome("side-income", "Satunnainen keikkatulo", "Sivutulot", sideIncome, 22);
      addIncome("bonus", m === 6 ? "Lomaraha" : "Tulospalkkio", "Palkka", bonus, 20);
      const essential = Math.round(values.essential[index] * yearFactor * ([1, 2, 12].includes(m) ? 1.04 : 1));
      const flexible = Math.round(values.flexible[index] * yearFactor * (m === 12 ? 1.2 : m === 7 ? 1.1 : 1));
      const plans: Record<string, number> = { Internet: 3400 };
      const addExpense = (key: string, name: string, category: string, amount: number, day: number, necessary: boolean, type: "consumption" | "saving" | "investment" = "consumption") => {
        state.expenses.push(entry({ id: `${profile.id}-${key}-${period}`, name, category, amount, date: `${period}-${String(day).padStart(2, "0")}`, essential: necessary, expenseType: type, description: "Fiktiivinen esimerkkitapahtuma, ei todellinen lasku." }));
      };
      const essentialCategories: Array<[string, string, number, number]> = [
        ["Asuminen", "Asuntolainan erä ja vastike", .50, 3], ["Sähkö", "Sähkölasku", .05, 12],
        ["Vesi", "Vesimaksu", .02, 8], ["Vakuutukset", "Koti- ja henkilövakuutukset", .04, 17],
        ["Ruoka", "Ruokaostokset", .21, 2], ["Lapset ja perhe", "Päivähoito ja lapsen arki", .10, 14],
        ["Liikenne", "Työmatkat", .06, 4], ["Puhelin", "Kaksi puhelinliittymää", .02, 21],
      ];
      let allocated = 0;
      essentialCategories.forEach(([category, name, share, day], i) => {
        const part = i === essentialCategories.length - 1 ? essential - allocated : Math.round(essential * share);
        allocated += part;
        const amount = part - (category === "Asuminen" ? 3400 : 0);
        plans[category] = Math.round(amount * (category === "Ruoka" ? .96 : 1));
        if (category === "Asuminen") {
          plans.Asuminen = amount - values.payment;
          plans.Lainat = values.payment;
          addExpense("mortgage-payment", "Asuntolainan kuukausierä", "Asuminen", mortgagePayment, 3, true);
          addExpense("housing-maintenance", "Vastike ja kodin ylläpito", "Asuminen", amount - mortgagePayment - values.payment, 3, true);
          addExpense("consumer-payment", "Kulutusluoton kuukausierä", "Lainat", values.payment, 11, true);
        } else if (category === "Ruoka") {
          const weekly = Math.floor(amount / 4);
          [2, 9, 16, 23].forEach((d, week) => addExpense(`food-${week}`, name, category, week === 3 ? amount - weekly * 3 : weekly, d, true));
        } else addExpense(`essential-${i}`, name, category, amount, day, true);
      });
      let flexibleAllocated = 0;
      const flexibleCategories: Array<[string, string, number]> = [["Harrastukset", "Perheen harrastukset", .45], ["Ravintolat ja kahvilat", "Yhteinen ravintolakäynti", .25], ["Tilaukset", "Suoratoisto ja tilaukset", .12], ["Kosmetiikka", "Kosmetiikkaostokset", .08], ["Vaatteet", m === 12 ? "Talvivaatteet ja juhlat" : "Vaatteet", .10]];
      flexibleCategories.forEach(([category, name, share], i) => {
        const amount = i === flexibleCategories.length - 1 ? flexible - flexibleAllocated : Math.round(flexible * share);
        flexibleAllocated += amount;
        plans[category] = Math.round(amount * (profile.id === "strained" || shock ? .9 : 1.03));
        addExpense(`flexible-${i}`, name, category, amount, 7 + i * 4, false);
      });
      const monthlySaving = profile.id === "shock" && !shock ? 15000 : saving;
      if (monthlySaving) {
        const investmentPart = Math.round(monthlySaving * (profile.id === "steady" ? .75 : .25));
        addExpense("saving", "Siirto puskuritilille", "Säästäminen", monthlySaving - investmentPart, 27, false, "saving");
        addExpense("investment", "Kuukausisijoitus indeksirahastoon", "Sijoittaminen", investmentPart, 28, false, "investment");
        plans.Säästäminen = monthlySaving - investmentPart;
        plans.Sijoittaminen = investmentPart;
      }
      state.budgets[period] = plans;
    });
    const completeMonths = demoMonths.filter(period => period < today().slice(0, 7));
    state.coverage.incomeMonths = [...completeMonths];
    state.coverage.expenseMonths = [...completeMonths];
    const homeId = `${profile.id}-home`;
    state.assets = [
      entry({ id: `${profile.id}-cash`, name: "Heti käytettävissä oleva puskuri", category: "Talletukset", amount: values.liquid, date: `${month}-01`, liquid: true }),
      entry({ id: homeId, name: "Perheen koti", category: "Asunto", amount: 28200000, date: `${month}-01` }),
      entry({ id: `${profile.id}-car`, name: "Perheen käytetty auto", category: "Auto", amount: 980000, date: `${month}-01` }),
    ];
    state.liabilities = [
      entry({ id: `${profile.id}-mortgage`, name: "Asuntolaina", category: "Asuntolaina", amount: profile.id === "steady" ? 7100000 : profile.id === "everyday" ? 12000000 : 16000000, rate: 3.4, payment: mortgagePayment, linkedAssetId: homeId, date: `${month}-01` }),
      entry({ id: `${profile.id}-consumer-loan`, name: "Kulutusluotto", category: "Kulutusluotto", amount: values.debt, rate: values.rate, payment: values.payment, date: `${month}-01`, description: "Kirjattu esimerkkisaldo säilyy. Rivin valitun päivän saldoarvio olettaa kuukausierät maksetuiksi." }),
    ];
    const investmentPrices: Record<CompassDemoId, [number, number]> = { strained: [9000, 8100], everyday: [24500, 22000], steady: [48200, 42500], shock: [17000, 15100] };
    const [investmentPrice, purchasePrice] = investmentPrices[profile.id];
    state.investments = [entry({ id: `${profile.id}-index-fund`, name: "Laajasti hajautettu indeksirahasto", category: "Rahastot", amount: investmentPrice, purchasePrice, quantity: values.investment / investmentPrice, date: `${month}-01`, description: "Kuvitteellinen manuaalinen omistus, ei arvostushistoria." })];
    state.goals = [entry({ createdAt: "2025-01-01T00:00:00.000Z", id: `${profile.id}-buffer-goal`, name: profile.id === "shock" ? "Ensimmäinen 1 000 euron turva" : "Perheen puskuritavoite", category: "Hätävara", amount: profile.id === "shock" ? values.liquid : Math.min(values.liquid, values.essential[5] * 3), target: profile.id === "shock" ? 100000 : Math.max(values.essential[5] * 3, values.liquid + 100000), monthly: saving || 5000, date: "2026-12-31" })];
    state.scenarios = [
      { id: `${profile.id}-scenario-base`, name: "Esimerkki · maltillinen tuotto-oletus", initial: values.investment, monthly: saving, rate: 3, fee: .2, inflation: 2, years: 15 },
      { id: `${profile.id}-scenario-stress`, name: "Esimerkki · nollatuotto ja inflaatio", initial: values.investment, monthly: saving, rate: 0, fee: .2, inflation: 3, years: 15 },
    ];
    // Optional categories used in the demo must also exist in its category editor.
    for (const name of new Set(state.expenses.map(item => item.category))) {
      if (!state.categories.some(category => category.kind === "expenses" && category.name === name)) {
        const preset = optionalCategoryDefinitions.find(category => category.kind === "expenses" && category.name === name);
        state.categories.push({ id: `${profile.id}-category-${name}`, kind: "expenses", name, icon: preset?.icon || categoryIconFor(name, "expenses"), color: preset?.color || "#245c78", archived: false });
      }
    }
    return { profile, state, timeline: demoMonths.map(period => demoMonthSummary(state, period)) };
  });
}
