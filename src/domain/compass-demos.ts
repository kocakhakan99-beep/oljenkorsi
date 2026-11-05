import { metrics } from "./calculations";
import { empty, entry, type State } from "./model";

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
    debt: 1450000,
    rate: 7.4,
    payment: 48000,
  },
  everyday: {
    income: [322000, 341000, 329000, 356000, 318000, 347000],
    essential: [218000, 225000, 217000, 231000, 222000, 229000],
    flexible: [77000, 85000, 81000, 91000, 86000, 83000],
    liquid: 690000,
    debt: 980000,
    rate: 4.2,
    payment: 39000,
  },
  steady: {
    income: [574000, 601000, 619000, 589000, 625000, 611000],
    essential: [215000, 221000, 218000, 224000, 219000, 223000],
    flexible: [89000, 92000, 96000, 100000, 94000, 97000],
    liquid: 2200000,
    debt: 710000,
    rate: 2.9,
    payment: 44000,
  },
  shock: {
    income: [414000, 407000, 179400, 183400, 176900, 180500],
    essential: [254000, 258000, 261000, 256000, 265000, 260000],
    flexible: [81000, 76000, 67000, 72000, 64000, 69000],
    liquid: 26000,
    debt: 2180000,
    rate: 15.2,
    payment: 24000,
  },
};

function addMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function createCompassDemoCases(month: string): CompassDemoCase[] {
  return compassDemoProfiles.map((profile) => {
    const values = series[profile.id];
    const state = empty();
    state.settings.onboarded = true;
    state.settings.demo = true;
    state.settings.month = month;
    const months = Array.from({ length: 6 }, (_, index) =>
      addMonth(month, index - 5),
    );

    months.forEach((period, index) => {
      if (values.income[index] > 0) {
        const benefit = 9400;
        const householdWages = values.income[index] - benefit;
        const firstWage =
          profile.id === "shock" && index >= 2
            ? 0
            : Math.round(householdWages * 0.55);
        const secondWage = householdWages - firstWage;
        if (firstWage > 0)
          state.incomes.push(
            entry({
              id: `${profile.id}-income-adult-1-${period}`,
              name: "Aikuisen 1 nettopalkka",
              category: "Palkka",
              amount: firstWage,
              date: `${period}-01`,
            }),
          );
        if (secondWage > 0)
          state.incomes.push(
            entry({
              id: `${profile.id}-income-adult-2-${period}`,
              name: "Aikuisen 2 nettopalkka",
              category: "Palkka",
              amount: secondWage,
              date: `${period}-01`,
            }),
          );
        state.incomes.push(
          entry({
            id: `${profile.id}-benefit-${period}`,
            name: "Lapsilisä",
            category: "Etuudet",
            amount: benefit,
            date: `${period}-01`,
          }),
        );
      }
      state.expenses.push(
        entry({
          id: `${profile.id}-housing-${period}`,
          name: "Asuminen ja peruslaskut",
          category: "Asuminen",
          amount: Math.round(values.essential[index] * 0.56),
          date: `${period}-03`,
          essential: true,
        }),
        entry({
          id: `${profile.id}-food-${period}`,
          name: "Ruoka ja arjen hankinnat",
          category: "Ruoka",
          amount: Math.round(values.essential[index] * 0.28),
          date: `${period}-10`,
          essential: true,
        }),
        entry({
          id: `${profile.id}-child-${period}`,
          name: "Lasten menot ja päivähoito",
          category: "Lapset ja perhe",
          amount:
            values.essential[index] -
            Math.round(values.essential[index] * 0.56) -
            Math.round(values.essential[index] * 0.28),
          date: `${period}-12`,
          essential: true,
        }),
        entry({
          id: `${profile.id}-flexible-${period}`,
          name: "Harrastukset ja muu joustava meno",
          category: "Harrastukset",
          amount: values.flexible[index],
          date: `${period}-18`,
          essential: false,
        }),
      );
    });

    const homeId = `${profile.id}-home`;
    state.assets.push(
      entry({
        id: `${profile.id}-cash`,
        name: "Heti käytettävissä oleva säästö",
        category: "Talletukset",
        amount: values.liquid,
        date: `${month}-01`,
        liquid: true,
      }),
      entry({
        id: homeId,
        name: "Koti",
        category: "Asunto",
        amount: 28200000,
        date: `${month}-01`,
      }),
    );
    state.liabilities.push(
      entry({
        id: `${profile.id}-mortgage`,
        name: "Asuntolaina",
        category: "Asuntolaina",
        amount: values.debt,
        rate: values.rate,
        payment: values.payment,
        linkedAssetId: homeId,
      }),
    );
    if (profile.id === "steady")
      state.goals.push(
        entry({
          id: "steady-goal",
          name: "Pitkän aikavälin tavoite",
          category: "Säästäminen",
          amount: 560000,
          target: 1800000,
          monthly: 120000,
        }),
      );

    const last = months.length - 1;
    if (profile.id === "strained")
      state.budgets[month] = {
        Ruoka: Math.round(values.essential[last] * 0.28),
      };
    else if (profile.id === "everyday") state.budgets[month] = { Ruoka: 58000 };
    else if (profile.id === "steady")
      state.budgets[month] = {
        Asuminen: 150000,
        Ruoka: 90000,
        Harrastukset: 120000,
      };
    else state.budgets[month] = { Ruoka: 75000, Asuminen: 150000 };

    const timeline = months.map((period) => {
      const totals = metrics(state, period);
      return {
        month: period,
        income: totals.income,
        expense: totals.consumption,
        cash: totals.income - totals.consumption,
      };
    });

    return { profile, state, timeline };
  });
}
