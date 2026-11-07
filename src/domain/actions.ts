import {
  emergencyFund,
  expenseType,
  metrics,
  occurrencesWithStatus,
  occurrenceStatus,
  occurrenceAmount,
  sum,
  total,
} from "./calculations";
import type { GuidanceSourceId } from "./guidance";
import { today, type State } from "./model";

export type ActionPriority = "high" | "medium" | "low";
export type ActionTrack = "cashflow" | "spending" | "resilience" | "future";
export const actionTrackLabels: Record<ActionTrack, string> = {
  cashflow: "Kassavirta",
  spending: "Menot",
  resilience: "Puskuri ja velat",
  future: "Tavoitteet ja FIRE",
};
export interface PlannedAction {
  id: string;
  title: string;
  reason: string;
  evidence: string;
  priority: ActionPriority;
  score: number;
  track: ActionTrack;
  destination: string;
  destinationLabel: string;
  reportView?:
    | "overview"
    | "categories"
    | "flow"
    | "budget"
    | "wealth"
    | "debt"
    | "fire";
  nextStep?: string;
  sourceIds?: GuidanceSourceId[];
  boundary?: string;
  impactNote?: string;
  privateEvidence?: boolean;
}

const formatCents = (cents: number) =>
  new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );
const formatPercent = (value: number) =>
  `${new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 }).format(value)} %`;

function normalized(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fi-FI");
}

// Keskeneräinen kuukausi vertautuu aiempien kuukausien samaan kalenteripäivään.
function dayForComparison(selectedMonth: string, period: string) {
  const [year, monthNumber] = period.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  if (selectedMonth !== today().slice(0, 7)) return lastDay;
  return Math.min(Number(today().slice(-2)), lastDay);
}

function actualTotalThrough(
  entries: State["expenses"],
  month: string,
  day: number,
) {
  const cutoff = `${month}-${String(day).padStart(2, "0")}`;
  return sum(
    entries.map((item) =>
      sum(
        occurrencesWithStatus(item, month, "actual")
          .filter((date) => date <= cutoff)
          .map((date) => occurrenceAmount(item, date)),
      ),
    ),
  );
}

function monthOffset(month: string, offset: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function recentMonths(month: string, count: number, endOffset = -1) {
  return Array.from({ length: count }, (_, index) =>
    monthOffset(month, endOffset - count + index + 1),
  );
}

function hasCashEntries(state: State, month: string) {
  return (
    total(state.incomes, month, true) > 0 &&
    state.expenses.some(
      (item) => occurrencesWithStatus(item, month, "actual").length > 0,
    )
  );
}

export function planActions(state: State, month: string): PlannedAction[] {
  const actions: PlannedAction[] = [];
  const monthBudget = state.budgets[month] || {};
  const budgetCategories = Object.keys(monthBudget);
  const hasExpenseHistory = state.expenses.some(
    (item) =>
      item.status === "actual" ||
      Object.values(item.occurrenceStatuses).includes("actual"),
  );

  if (hasExpenseHistory && budgetCategories.length === 0) {
    actions.push({
      id: `budget-start-${month}`,
      title: "Aseta tälle kuulle menosuunnitelma",
      reason:
        "Sovelluksessa on kirjattuja menoja, mutta kuukaudelle ei ole vielä budjettisummaa.",
      evidence: `Valittu kuukausi ${month} · ei budjettikategorioita`,
      priority: "medium",
      score: 240,
      track: "cashflow",
      destination: "budget",
      destinationLabel: "Avaa budjetti",
      nextStep:
        "Valitse ensin yksi iso tai toistuva menoluokka. Käytä budjettia kokeiltavana suunnitelmana, älä suorituspisteenä.",
      sourceIds: ["R1", "R11"],
      boundary:
        "Budjetin tekeminen ei itsessään takaa säästöjä. Kirjausten kattavuus ratkaisee, mitä vertailusta voi päätellä.",
    });
  }

  for (const category of budgetCategories) {
    const planned = monthBudget[category] || 0;
    const observed = Object.hasOwn(state.budgetActuals[month] || {}, category)
      ? state.budgetActuals[month][category]
      : total(
          state.expenses.filter(
            (item) =>
              item.category === category && expenseType(item) === "consumption",
          ),
          month,
          true,
        );
    const over = observed - planned;
    if (planned > 0 && over >= 5000 && over / planned >= 0.08) {
      const high = over >= 100000 || over / planned >= 0.35;
      actions.push({
        id: `budget-review-${month}-${category}`,
        title: `Tarkista budjetti: ${category}`,
        reason:
          "Kirjattu toteuma on tämän kuun suunnitelmaa suurempi. Kuukausi voi olla kesken, joten tarkista ensin kirjaukset ja jäljellä olevat menot.",
        evidence: `Toteuma ${formatCents(observed)} · suunnitelma ${formatCents(planned)} · erotus ${formatCents(over)}`,
        privateEvidence: true,
        priority: high ? "high" : "medium",
        score: (high ? 360 : 230) + Math.min(100, Math.round(over / 10000)),
        track: "cashflow",
        destination: "budget",
        destinationLabel: "Tarkista budjetti",
        nextStep:
          "Tarkista ensin käsin syötetty toteuma, tapahtumat ja kuun jäljellä olevat laskut. Muuta suunnitelmaa vasta, jos se vastaa todellista arkea.",
        sourceIds: ["R1", "R11"],
        boundary:
          "Kynnys on sovelluksen tarkistussääntö, ei tutkimuksessa määritetty riskiraja. Keskeneräinen kuukausi voi ylittää suunnitelman tilapäisesti.",
      });
    }
  }

  const completedMonths = [-3, -2, -1].map((offset) =>
    monthOffset(month, offset),
  );
  const cashHistory = completedMonths
    .filter((period) => hasCashEntries(state, period))
    .map((period) => ({
      month: period,
      ...metrics(state, period),
    }));
  const deficitMonths = cashHistory.filter((period) => period.cash < 0);
  if (deficitMonths.length >= 2) {
    const deficitTotal = deficitMonths.reduce(
      (total, period) => total + Math.abs(period.cash),
      0,
    );
    const priority: ActionPriority =
      deficitMonths.length === 3 ? "high" : "medium";
    actions.push({
      id: `cashflow-check-${month}`,
      title: "Käy läpi viime kuukausien kassavirta",
      reason:
        "Usean kuukauden kirjattu menovirta ylittää tulot. Tarkista ensin tietojen kattavuus ja toistuvat erät.",
      evidence: `${deficitMonths.length}/${cashHistory.length} havaintokuukautta miinuksella · kirjattu erotus yhteensä ${formatCents(deficitTotal)}`,
      privateEvidence: true,
      priority,
      score:
        (priority === "high" ? 390 : 270) +
        Math.min(80, Math.round(deficitTotal / 25000)),
      track: "cashflow",
      impactNote: `Kirjattu kassavaje oli keskimäärin ${formatCents(deficitTotal / deficitMonths.length)}/havaintokuu.`,
      destination: "reports",
      destinationLabel: "Avaa kassavirtaraportti",
      reportView: "flow",
      nextStep:
        "Avaa tulot ja eräpäivät päivä kerrallaan. Varmista tietojen kattavuus ja merkitse lähiajan välttämättömät maksut ennen pitkän aikavälin päätöksiä.",
      sourceIds: ["R1", "R2", "R3"],
      boundary:
        "Kolmen kuukauden näkymä on lyhyt otos. Se ei ennusta tuloja tai osoita yksin, että menoja pitäisi leikata.",
    });
    if (cashHistory.length === 3 && deficitMonths.length === 3) {
      actions.push({
        id: `support-options-${month}`,
        title: "Selvitä ulkopuolinen apu ja maksujärjestelyt",
        reason:
          "Kirjattu kassavirta on ollut miinuksella kaikissa kolmessa tarkastellussa kuussa.",
        evidence: "3/3 havaintokuukautta miinuksella",
        priority: "high",
        score: 375,
        track: "resilience",
        destination: "liabilities",
        destinationLabel: "Tarkista laskut ja velat",
        nextStep:
          "Jos maksut uhkaavat viivästyä, ota yhteyttä laskuttajaan ajoissa ja kysy maksusuunnitelmaa. Suomessa talous- ja velkaneuvonta auttaa maksutta tilanteen selvittämisessä.",
        sourceIds: ["R13"],
        boundary:
          "Kompassi ei arvioi etuusoikeutta, maksuohjelman ehtoja eikä velkajärjestelyn soveltuvuutta. Varmista kirjaukset ja pyydä omaan tilanteeseen sopivaa neuvontaa.",
      });
    }
  }

  const housingExpenses = state.expenses.filter((item) => {
    const label = normalized(`${item.category} ${item.name}`);
    return (
      expenseType(item) === "consumption" &&
      /(asumis|asunt|vuokra|vastike|housing|rent|mortgage)/.test(label)
    );
  });
  const housingPeriods = completedMonths
    .map((period) => ({
      income: total(state.incomes, period, true),
      housing: total(housingExpenses, period, true),
    }))
    .filter((period) => period.income > 0 && period.housing > 0);
  if (housingPeriods.length >= 2) {
    const housingShare =
      (sum(housingPeriods.map((period) => period.housing)) /
        sum(housingPeriods.map((period) => period.income))) *
      100;
    if (housingShare > 40) {
      actions.push({
        id: `housing-cost-review-${month}`,
        title: "Tarkista asumismenojen osuus tuloista",
        reason:
          "Kirjatuissa kuukausissa asumiseksi tunnistetut menot ovat olleet suuri osuus kirjatuista tuloista.",
        evidence: `${housingPeriods.length} kk · kirjattu osuus noin ${formatPercent(housingShare)}`,
        privateEvidence: true,
        priority: housingShare >= 50 ? "high" : "medium",
        score: housingShare >= 50 ? 335 : 250,
        track: "spending",
        impactNote: `Asumismenoja kirjattu keskimäärin ${formatCents(sum(housingPeriods.map((period) => period.housing)) / housingPeriods.length)}/kk havaintokuukausina.`,
        destination: "reports",
        destinationLabel: "Tarkista menot ja tulot",
        reportView: "categories",
        nextStep:
          "Tarkista, mitä asumisen luokkaan on kirjattu. Erittele vuokra tai lainan kuukausierä, vastike, energia ja muut kulut; selvitä tarvittaessa etuudet tai sopimuksen vaihtoehdot ennen isoja päätöksiä.",
        sourceIds: ["R12"],
        boundary:
          "Eurostatin yli 40 %:n indikaattori on väestötason mittari. Sovelluksen luokittelu ja tulokäsite eivät vastaa sen laskentaa, joten tämä on suuntaa-antava tarkistussignaali eikä henkilökohtainen vuokrakatto. Yli 50 % nostaa vain sovelluksen näyttöprioriteettia; sekään ei ole yksilöllinen riskiraja.",
      });
    }
  }

  const essentialPeriods = completedMonths
    .map((period) => ({
      month: period,
      income: total(state.incomes, period, true),
      essential: total(
        state.expenses.filter(
          (item) => item.essential && expenseType(item) === "consumption",
        ),
        period,
        true,
      ),
    }))
    .filter(
      (period) => period.income > 0 && hasCashEntries(state, period.month),
    );
  if (essentialPeriods.length >= 2) {
    const essentialShare =
      (sum(essentialPeriods.map((period) => period.essential)) /
        sum(essentialPeriods.map((period) => period.income))) *
      100;
    if (essentialShare >= 90) {
      actions.push({
        id: `essential-cost-review-${month}`,
        title: "Tarkista välttämättömien menojen liikkumavara",
        reason:
          "Välttämättömiksi merkityt kirjaukset vievät suurimman osan kirjatuista tuloista.",
        evidence: `${essentialPeriods.length} kk · kirjattu osuus noin ${formatPercent(essentialShare)}`,
        privateEvidence: true,
        priority: essentialShare >= 100 ? "high" : "medium",
        score: essentialShare >= 100 ? 365 : 255,
        track: "spending",
        impactNote: `Välttämättömiä menoja kirjattu keskimäärin ${formatCents(sum(essentialPeriods.map((period) => period.essential)) / essentialPeriods.length)}/kk.`,
        destination: "expenses",
        destinationLabel: "Tarkista välttämättömät menot",
        nextStep:
          "Tarkista ensin, että pakolliset laskut ja tulot on kirjattu oikein. Listaa seuraavan kuukauden eräpäivät ja selvitä, onko laskutukseen, sopimuksiin tai tukiin saatavilla omaan tilanteeseen sopivia vaihtoehtoja.",
        sourceIds: ["R2", "R3"],
        boundary:
          "90 % on kompassin varhainen tarkistusraja, ei tutkimuksesta johdettu tavoite. Luokittelu, puuttuvat kirjaukset ja harvinaiset vuosimenot voivat muuttaa osuutta.",
      });
    }
  }

  const overPlanCategories = new Set(budgetCategories);
  const unusualCategories = [
    ...new Set(
      state.expenses
        .filter(
          (item) =>
            (item.status === "actual" ||
              Object.values(item.occurrenceStatuses).includes("actual")) &&
            expenseType(item) === "consumption",
        )
        .map((item) => item.category),
    ),
  ]
    .filter((category) => !overPlanCategories.has(category))
    .map((category) => {
      const priorPeriods = completedMonths
        .map((period) => {
          const day = dayForComparison(month, period);
          const categoryEntries = state.expenses.filter(
            (item) =>
              item.category === category && expenseType(item) === "consumption",
          );
          return {
            period,
            day,
            hasExpense: state.expenses.some(
              (item) =>
                item.category === category &&
                expenseType(item) === "consumption" &&
                occurrencesWithStatus(item, period, "actual").some(
                  (date) => date <= `${period}-${String(day).padStart(2, "0")}`,
                ),
            ),
            amount: actualTotalThrough(categoryEntries, period, day),
          };
        })
        .filter((item) => item.hasExpense);
      const currentDay = dayForComparison(month, month);
      const categoryEntries = state.expenses.filter(
        (item) =>
          item.category === category && expenseType(item) === "consumption",
      );
      const currentAmount = actualTotalThrough(
        categoryEntries,
        month,
        currentDay,
      );
      const average =
        priorPeriods.length > 0
          ? sum(priorPeriods.map((item) => item.amount)) / priorPeriods.length
          : 0;
      return {
        category,
        priorPeriods,
        currentAmount,
        currentDay,
        average,
      };
    })
    .filter(
      (item) =>
        item.priorPeriods.length >= 2 &&
        item.currentAmount - item.average >= 5000 &&
        item.currentAmount >= item.average * 1.3,
    )
    .sort((a, b) => b.currentAmount - b.average - (a.currentAmount - a.average))
    .slice(0, 2);
  for (const item of unusualCategories) {
    actions.push({
      id: `spending-pattern-${month}-${item.category}`,
      title: `Vertaa tämän kuun menoa: ${item.category}`,
      reason:
        "Kirjattu summa on tavallista suurempi verrattuna oman talouden aiempiin havaintokuukausiin.",
      evidence: `Tässä kuussa ${formatCents(item.currentAmount)} · aiempi keskiarvo ${formatCents(item.average)}`,
      privateEvidence: true,
      priority: item.currentAmount >= item.average * 1.75 ? "medium" : "low",
      score:
        190 +
        Math.min(50, Math.round((item.currentAmount - item.average) / 10000)),
      track: "spending",
      impactNote: `Jos poikkeama ei toistu, kirjattu erotus omaan keskiarvoon on ${formatCents(item.currentAmount - item.average)} tässä kuussa. Tämä ei ole säästölupaus.`,
      destination: "reports",
      destinationLabel: "Avaa kuluraportti",
      reportView: "categories",
      nextStep:
        "Avaa erän kirjaukset ja erottele kertaluonteinen meno, hintamuutos ja mahdollinen kirjausvirhe. Päätä vasta sitten, tarvitaanko suunnitelmaan muutos.",
      sourceIds: ["R11"],
      boundary:
        "50 €:n ja 30 %:n muutosrajat ovat sovelluksen omia huomiosääntöjä. Kuluvassa kuussa vertailu rajataan samaan kalenteripäivään myös aiemmissa kuukausissa; suljetuissa kuukausissa verrataan kokonaisia kuukausia. Kuukausi ilman kyseisen kategorian kirjausta tulkitaan puuttuvaksi havainnoksi, ei nollakuluksi; otos ei ole ennuste.",
    });
  }

  const buffer = emergencyFund(state, month, 3);
  if (buffer.observedMonths >= 2 && buffer.averageEssential !== null) {
    if (buffer.buffer !== null && buffer.buffer < 1) {
      actions.push({
        id: `liquidity-review-${month}`,
        title: "Tarkista puskurin riittävyys omaan tilanteeseen",
        reason:
          "Kirjatut heti käytettävissä olevat varat kattavat alle yhden kuukauden kirjatuista välttämättömistä menoista.",
        evidence: `${buffer.observedMonths}/3 kulukuukautta mukana · arvio ${buffer.buffer.toFixed(1).replace(".", ",")} kk`,
        privateEvidence: true,
        priority: buffer.buffer < 0.5 ? "high" : "medium",
        score: buffer.buffer < 0.5 ? 370 : 260,
        track: "resilience",
        impactNote: `Likvidejä varoja ${formatCents(buffer.liquid)} · välttämättömiä menoja keskimäärin ${formatCents(buffer.averageEssential)}/kk.`,
        destination: "assets",
        destinationLabel: "Tarkista helposti käytettävät varat",
        nextStep:
          "Varmista ensin, mitkä varat saa käyttöön nopeasti. Valitse sitten oma tavoite huomioiden tulojen vakaus, huollettavat ja tulevat maksut.",
        sourceIds: ["R2", "R3"],
        boundary:
          "Tutkimus ei anna kaikille sopivaa puskurikuukausien lukua. Alle yhden kuukauden merkintä on kompassin tarkistusraja, ei suositeltu tavoite. Laskelma ei käsittele luottoa tai tulevia tuloja puskurina.",
      });
    }
  } else if (
    state.expenses.some(
      (item) =>
        item.status === "actual" ||
        Object.values(item.occurrenceStatuses).includes("actual"),
    )
  ) {
    actions.push({
      id: `coverage-check-${month}`,
      title: "Täydennä välttämättömien menojen havaintoja",
      reason:
        "Puskurin kestoa ei voi arvioida vakaasti, koska viimeisiltä kolmelta kuukaudelta on alle kaksi kuluhavaintoa.",
      evidence: `${buffer.observedMonths}/3 kuukautta kirjattuna`,
      priority: "low",
      score: 150,
      track: "resilience",
      destination: "expenses",
      destinationLabel: "Tarkista menokirjaukset",
      nextStep:
        "Lisää tavalliset välttämättömät kuukausikulut ja tarkista, ettei puuttuva kuukausi tarkoita nollamenoja.",
      sourceIds: ["R2", "R3", "R11"],
      boundary:
        "Laskuri käyttää valittuja välttämättömyysmerkintöjä. Puuttuva kirjaus ei ole sama kuin toteutunut nollameno.",
    });
  }

  const incomeHistory = recentMonths(month, 6).filter(
    (period) => total(state.incomes, period, true) > 0,
  );
  if (incomeHistory.length >= 4) {
    const incomes = incomeHistory.map((period) =>
      total(state.incomes, period, true),
    );
    const averageIncome = sum(incomes) / incomes.length;
    const variance =
      averageIncome > 0
        ? sum(incomes.map((income) => (income - averageIncome) ** 2)) /
          incomes.length
        : 0;
    const coefficientOfVariation =
      averageIncome > 0 ? Math.sqrt(variance) / averageIncome : 0;
    if (averageIncome > 0 && coefficientOfVariation >= 0.3) {
      actions.push({
        id: `income-variation-${month}`,
        title: "Tee suunnitelmasta joustava vaihteleville tuloille",
        reason:
          "Kirjatut tulot vaihtelevat viime kuukausina selvästi. Välttämättömien menojen ajoitus voi silloin olla tärkeämpi kuin yhden keskiarvon tavoittelu.",
        evidence: `${incomeHistory.length} havaintokuukautta · vaihtelukerroin ${Math.round(coefficientOfVariation * 100)} %`,
        privateEvidence: true,
        priority: "medium",
        score: 245,
        track: "cashflow",
        destination: "reports",
        destinationLabel: "Tarkastele tulovirtaa",
        reportView: "flow",
        nextStep:
          "Kokeile kuukausibudjettia tavanomaista matalamman tulon varassa ja tarkista, mitkä kulut joustavat. Pidä satunnaiset tulot erillisenä skenaariona.",
        sourceIds: ["R2", "R3"],
        boundary:
          "30 % on tämän näkymän tunnistuskynnys, ei tutkimuksen riskiraja. Puuttuvat tulokirjaukset voivat näyttää vaihtelun todellista suurempana.",
      });
    }
  }

  const knownIncomeMonths = completedMonths.filter(
    (period) => total(state.incomes, period, true) > 0,
  );
  const observedCashMonths = cashHistory.map((period) => period.month);
  if (knownIncomeMonths.length >= 2) {
    const monthMetrics = observedCashMonths.map((period) =>
      metrics(state, period),
    );
    const averageSurplus =
      monthMetrics.length > 0
        ? sum(monthMetrics.map((period) => period.surplus)) /
          monthMetrics.length
        : null;
    const plannedGoalSaving = sum(state.goals.map((goal) => goal.monthly));
    if (
      averageSurplus !== null &&
      observedCashMonths.length >= 2 &&
      plannedGoalSaving > 0 &&
      plannedGoalSaving > Math.max(0, averageSurplus)
    ) {
      actions.push({
        id: `goal-pace-review-${month}`,
        title: "Sovita tavoitesäästö omaan kassavirtaan",
        reason:
          "Tavoitteisiin kirjattu kuukausisummaa on suurempi kuin viime kuukausien keskimääräinen tulojen ja kulutusmenojen erotus.",
        evidence: `Tavoitteet ${formatCents(plannedGoalSaving)}/kk · havaittu erotus ${formatCents(averageSurplus)}/kk`,
        privateEvidence: true,
        priority: averageSurplus < 0 ? "high" : "medium",
        score: averageSurplus < 0 ? 300 : 220,
        track: "future",
        impactNote: `Tavoitesäästön ja havaitun ylijäämän ero on ${formatCents(plannedGoalSaving - averageSurplus)}/kk.`,
        destination: "goals",
        destinationLabel: "Tarkista tavoitteet",
        nextStep:
          "Kokeile pienempää kuukausisummaa tai jätä tavoite hetkeksi ilman automaattista säästötahtia. Voit palata siihen, kun menot ja puskuri sallivat.",
        sourceIds: ["R2", "R4"],
        boundary:
          "Vertailu käyttää kirjattuja tuloja ja kulutusmenoja, ei tulevia laskuja, veroennustetta tai tuloturvaa. Negatiivinen tai pieni erotus voi johtua puuttuvista kirjauksista.",
      });
    }

    const recurringOptional = state.expenses.filter(
      (item) =>
        item.active &&
        item.recurrence !== "once" &&
        !item.essential &&
        expenseType(item) === "consumption",
    );
    const recurringAverage =
      sum(
        knownIncomeMonths.map((period) =>
          total(recurringOptional, period, true),
        ),
      ) / knownIncomeMonths.length;
    if (recurringOptional.length > 0 && recurringAverage >= 1000) {
      actions.push({
        id: `recurring-spend-review-${month}`,
        title: "Käy läpi toistuvat ei-välttämättömät maksut",
        reason:
          "Sovelluksessa on kirjattuja toistuvia menoja, joiden tarve tai käyttö voi muuttua ajan myötä.",
        evidence: `${recurringOptional.length} erää · kirjattu keskimäärin ${formatCents(recurringAverage)}/kk`,
        privateEvidence: true,
        priority: "low",
        score: 165,
        track: "spending",
        destination: "expenses",
        destinationLabel: "Tarkista toistuvat menot",
        nextStep:
          "Tarkista jokaisen palvelun käyttö, hinta, seuraava uusimispäivä ja irtisanomisehdot. Poista tai vaihda vain ne, joita et itse enää arvosta.",
        sourceIds: ["R11"],
        boundary:
          "10 €/kk on vain kompassin listauskynnys, ei suositus tai turhan menon raja. Toistuva kirjaus ei tarkoita turhaa menoa. Vuosiarvio on kuukausikeskiarvo kerrottuna kahdellatoista eikä huomioi hinnanmuutoksia tai sopimuskausia.",
      });
    }
  }

  const recentSavings = observedCashMonths.map((period) =>
    metrics(state, period),
  );
  const savingDrivenDeficits = recentSavings.filter(
    (period) => period.cash < 0 && period.surplus >= 0,
  );
  if (savingDrivenDeficits.length >= 2) {
    actions.push({
      id: `transfer-cashflow-review-${month}`,
      title: "Tarkista säästö- ja sijoitussiirtojen ajoitus",
      reason:
        "Joissakin kuukausissa kulutusmenot jäivät tuloja pienemmiksi, mutta kaikki tililtä lähtevät siirrot tekivät kassavirrasta miinusmerkkisen.",
      evidence: `${savingDrivenDeficits.length}/3 kuussa kulutusmenot alittivat tulot, vaikka kassavirta oli miinuksella`,
      priority: "medium",
      score: 235,
      track: "cashflow",
      privateEvidence: true,
      impactNote: `Säästö- ja sijoitussiirtojen jälkeen kassavaje oli keskimäärin ${formatCents(sum(savingDrivenDeficits.map((period) => Math.abs(period.cash))) / savingDrivenDeficits.length)}/havaintokuu.`,
      destination: "reports",
      destinationLabel: "Erittele kassavirta",
      reportView: "overview",
      nextStep:
        "Vertaa siirtoja lähiajan laskuihin ja heti käytettävissä olevaan puskurirahaan. Säästötahtia voi sovittaa, jos automaattinen siirto jättää maksutilin liian tiukalle.",
      sourceIds: ["R2", "R4"],
      boundary:
        "Siirtojen muuttaminen vaikuttaa pitkän aikavälin suunnitelmaan. Kompassi ei tiedä muiden tilien saldoja tai tulevia menoja.",
    });
  }

  const pricedDebts = state.liabilities.filter((item) => item.rate > 0);
  if (
    pricedDebts.length >= 2 &&
    Math.max(...pricedDebts.map((item) => item.rate)) >
      Math.min(...pricedDebts.map((item) => item.rate))
  ) {
    actions.push({
      id: `compare-debt-costs-${month}`,
      title: "Vertaa velkojen kirjattuja korkoja ja kuluja",
      reason:
        "Velkojen kirjatut korot eroavat toisistaan, joten lisälyhennyksen vaikutus voi vaihdella velasta toiseen.",
      evidence: `${pricedDebts.length} velkaa · korot ${Math.min(...pricedDebts.map((item) => item.rate))}–${Math.max(...pricedDebts.map((item) => item.rate))} %`,
      privateEvidence: true,
      priority: "medium",
      score: 225,
      track: "resilience",
      destination: "liabilities",
      destinationLabel: "Vertaa velkoja",
      nextStep:
        "Tarkista todellinen vuosikorko, jäljellä oleva laina-aika, lisälyhennyksen kulut ja vähimmäiserät. Vertaa ehtoja ennen kuin päätät ylimääräisestä maksusta.",
      sourceIds: ["R11"],
      boundary:
        "Sovelluksen korkokenttä ei välttämättä sisällä kaikkia maksuja. Korkein nimelliskorko ei yksin ratkaise, mikä sopimus kannattaa maksaa ensin.",
    });
  }

  if (state.liabilities.length > 0 && knownIncomeMonths.length >= 2) {
    const averageIncome =
      sum(
        knownIncomeMonths.map((period) => total(state.incomes, period, true)),
      ) / knownIncomeMonths.length;
    const debtPayments = sum(state.liabilities.map((item) => item.payment));
    const paymentShare =
      averageIncome > 0 ? (debtPayments / averageIncome) * 100 : 0;
    if (debtPayments > 0 && paymentShare >= 35) {
      actions.push({
        id: `debt-payment-review-${month}`,
        title: "Tarkista velkojen kuukausierien kuormitus",
        reason:
          "Velkoihin kirjattujen kuukausierien summa on suuri suhteessa viime kuukausien kirjattuihin tuloihin.",
        evidence: `${formatCents(debtPayments)}/kk · noin ${formatPercent(paymentShare)} keskituloista`,
        privateEvidence: true,
        priority: paymentShare >= 50 ? "high" : "medium",
        score: paymentShare >= 50 ? 320 : 230,
        track: "resilience",
        impactNote: `Kirjatut velkaerät yhteensä ${formatCents(debtPayments)}/kk suhteessa tuloihin.`,
        destination: "liabilities",
        destinationLabel: "Tarkista velkaerät",
        nextStep:
          "Varmista, että maksuerät ovat ajan tasalla. Jos arki kiristyy, selvitä velkojalta mahdolliset järjestelyt ja kysy maksutonta talous- ja velkaneuvontaa.",
        sourceIds: ["R13"],
        boundary:
          "35 % on sovelluksen huomioraja, ei yleispätevä velkakatto; 50 % nostaa vain näytön prioriteettia. Laskenta ei huomioi kotitalouden kokoa, asumismenoja, muita tuloja tai lainojen ehtoja.",
      });
    }
  }

  const fireGoal = state.goals.some((goal) =>
    /(fire|taloudellinen riippumattomuus|taloudellinen vapaus)/.test(
      normalized(goal.name),
    ),
  );
  if (fireGoal && state.investments.length > 0) {
    actions.push({
      id: `fire-withdrawal-stress-test-${month}`,
      title: "Stressitestaa FIRE-nostojen oletukset",
      reason:
        "FIRE-tavoite ja sijoitusvarallisuus on kirjattu, mutta nostotason vaikutus riippuu ajoituksesta, inflaatiosta ja joustosta.",
      evidence: `${state.investments.length} sijoituserää · tavoite “${state.goals.find((goal) => /(fire|taloudellinen riippumattomuus|taloudellinen vapaus)/.test(normalized(goal.name)))?.name}”`,
      priority: "low",
      score: 180,
      track: "future",
      destination: "scenarios",
      destinationLabel: "Avaa nostoskenaariot",
      nextStep:
        "Vertaa useita nosto-oletuksia ja pitkiä heikkojen tuottojen alkujaksoja. Lisää arvioon verot, kulut, eläke ja menojen jousto ennen johtopäätöksiä.",
      sourceIds: ["R7", "R8", "R9", "R10"],
      boundary:
        "Skenaario on herkkyystesti, ei turvallisen nostoprosentin lupaus. Historiallinen Yhdysvaltain aineisto ei ole Suomen tulevaisuusennuste.",
    });
  }

  const expenseHistory = recentMonths(month, 12).filter((period) =>
    state.expenses.some(
      (item) =>
        expenseType(item) === "consumption" &&
        occurrencesWithStatus(item, period, "actual").length > 0,
    ),
  );
  if (expenseHistory.length >= 6) {
    const irregularTotals = new Map<
      string,
      { amount: number; months: Set<string> }
    >();
    for (const item of state.expenses) {
      if (
        occurrenceStatus(item, item.date) !== "actual" ||
        item.recurrence !== "once" ||
        expenseType(item) !== "consumption"
      )
        continue;
      const period = item.date.slice(0, 7);
      if (!expenseHistory.includes(period)) continue;
      const current = irregularTotals.get(item.category) || {
        amount: 0,
        months: new Set<string>(),
      };
      current.amount += occurrenceAmount(item, item.date);
      current.months.add(period);
      irregularTotals.set(item.category, current);
    }
    const currentPlan = new Set(Object.keys(state.budgets[month] || {}));
    const irregular = [...irregularTotals.entries()]
      .filter(
        ([category, value]) =>
          !currentPlan.has(category) &&
          value.months.size >= 2 &&
          value.months.size <=
            Math.min(6, Math.floor(expenseHistory.length / 2)),
      )
      .sort((a, b) => b[1].amount - a[1].amount)
      .slice(0, 2);
    for (const [category, value] of irregular) {
      actions.push({
        id: `irregular-expense-${month}-${category}`,
        title: `Tee varaus epäsäännölliseen menoon: ${category}`,
        reason:
          "Kululuokassa on useita erillisiä menoja vuoden aikana, mutta sille ei ole tämän kuun suunnitelmaa.",
        evidence: `${value.months.size} kuukautta · vuoden kirjattu summa ${formatCents(value.amount)} · tasattuna ${formatCents(Math.ceil(value.amount / 12))}/kk`,
        privateEvidence: true,
        priority: "low",
        score: 155 + Math.min(40, Math.round(value.amount / 100000)),
        track: "spending",
        destination: "budget",
        destinationLabel: "Avaa budjetti",
        nextStep:
          "Tarkista, toistuuko meno tulevaisuudessa. Käytä 12 kuukauden keskiarvoa vain aloitusarviona ja päätä itse sopiva varaus.",
        sourceIds: ["R1", "R4"],
        boundary:
          "Viime vuoden menot eivät takaa seuraavan vuoden menoja. Tasajako ei huomioi laskujen todellisia eräpäiviä.",
      });
    }
  }

  if (state.assets.length > 0) {
    for (const liability of state.liabilities.filter(
      (item) => !item.linkedAssetId,
    )) {
      actions.push({
        id: `link-debt-${liability.id}`,
        title: `Yhdistä ${liability.name} omaisuuserään`,
        reason:
          "Linkitys näyttää lainan vaikutuksen siihen liittyvän omaisuuden omaan pääomaan.",
        evidence: `Lainasaldo ${formatCents(liability.amount)} · omaisuuserää on kirjattu`,
        privateEvidence: true,
        priority: "medium",
        score: 250,
        track: "resilience",
        destination: "liabilities",
        destinationLabel: "Avaa velat",
        nextStep:
          "Valitse velkatiedoista siihen liittyvä omaisuuserä. Linkitys muuttaa vain raportin oman pääoman laskentaa, ei saldoa tai maksueriä.",
        sourceIds: ["R1", "R11"],
        boundary:
          "Nykyarvo on käyttäjän arvio. Takaisinmaksuaika olettaa syötetyn koron ja maksuerän pysyvän vakiona.",
      });
    }
  }

  for (const liability of state.liabilities) {
    if (liability.rate === 0 || liability.payment === 0) {
      actions.push({
        id: `check-loan-terms-${liability.id}`,
        title: `Tarkista lainaehdot: ${liability.name}`,
        reason:
          "Korko tai kuukausierä on nolla, joten takaisinmaksuarviota ei voi muodostaa luotettavasti. Nolla voi olla oikein, jos laina on koroton tai erä ei ole tiedossa.",
        evidence: `Korko ${liability.rate} % · kuukausierä ${formatCents(liability.payment)}`,
        privateEvidence: true,
        priority: "low",
        score: 130,
        track: "resilience",
        destination: "liabilities",
        destinationLabel: "Tarkista velkatiedot",
        nextStep:
          "Tarkista velkojan viimeisin saldo, korko ja kuukausierä. Jos jokin on aidosti nolla, merkitse se kuvaukseen.",
        sourceIds: ["R1", "R3"],
        boundary:
          "Nolla voi olla oikea tieto. Kompassi ei vertaile lainan maksamista sijoitustuottoon eikä tee maksujärjestyssuositusta.",
      });
    }
  }

  const now = new Date(`${today()}T12:00:00`);
  for (const asset of state.assets) {
    const valuationDate = new Date(`${asset.date}T12:00:00`);
    const ageDays = Math.floor(
      (now.getTime() - valuationDate.getTime()) / 86400000,
    );
    if (ageDays > 365) {
      actions.push({
        id: `review-asset-${asset.id}`,
        title: `Tarkista arvostus: ${asset.name}`,
        reason:
          "Arvostuspäivästä on yli vuosi. Omaisuuden arvo vaikuttaa tämänhetkiseen nettovarallisuuteen.",
        evidence: `Arvostuspäivä ${asset.date} · noin ${Math.floor(ageDays / 30)} kk sitten`,
        priority: "low",
        score: 110,
        track: "future",
        destination: "assets",
        destinationLabel: "Tarkista omaisuus",
        nextStep:
          "Päivitä arvio vain, jos sinulla on tuoreempi ja perusteltu arvo. Voit myös kirjata arvion päivämäärän ja lähteen kuvaukseen.",
        sourceIds: ["R11"],
        boundary:
          "Vanha arvostuspäivä ei tarkoita, että arvo olisi muuttunut. Sovellus ei hae markkinahintoja.",
      });
    }
  }

  if (
    state.goals.length === 0 &&
    (state.incomes.length > 0 || state.assets.length > 0)
  ) {
    actions.push({
      id: "create-first-goal",
      title: "Valitse taloudelle seurattava tavoite",
      reason:
        "Tavoite tekee säästämisen etenemisestä näkyvää. Se voi olla esimerkiksi puskuri, velan vähentäminen tai itse määrittelemäsi virstanpylväs.",
      evidence: "Tavoitteita ei ole vielä tallennettu",
      priority: "low",
      score: 100,
      track: "future",
      destination: "goals",
      destinationLabel: "Luo tavoite",
      nextStep:
        "Valitse ensin tavoite, joka parantaisi sinun arkeasi. Aseta kuukausisummaa vain, jos se sopii myös vaihteleviin ja yllättäviin menoihin.",
      sourceIds: ["R4", "R11"],
      boundary:
        "Sitoumusta helpottava suunnitelma on käyttäjän valinta. Kompassi ei aseta säästöastetta eikä lupaa tutkimuksen vaikutusta tässä sovelluksessa.",
    });
  }

  const priorityOrder: Record<ActionPriority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  return actions
    .sort(
      (a, b) =>
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.score - a.score,
    )
    .slice(0, 20);
}

export function visibleActions(state: State, month: string, date = today()) {
  return planActions(state, month).filter((action) => {
    const saved = state.actionStates[action.id];
    if (!saved) return true;
    if (saved.status === "done") return false;
    return !saved.until || saved.until <= date;
  });
}
