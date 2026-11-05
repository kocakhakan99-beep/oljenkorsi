import {
  emergencyFund,
  expenseType,
  metrics,
  occurrences,
  sum,
  total,
} from "./calculations";
import type { GuidanceSourceId } from "./guidance";
import { today, type State } from "./model";

export type ActionPriority = "high" | "medium" | "low";
export interface PlannedAction {
  id: string;
  title: string;
  reason: string;
  evidence: string;
  priority: ActionPriority;
  score: number;
  destination: string;
  destinationLabel: string;
  nextStep?: string;
  sourceIds?: GuidanceSourceId[];
  boundary?: string;
  privateEvidence?: boolean;
}

const formatCents = (cents: number) =>
  new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(
    cents / 100,
  );

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

function hasActualEntries(state: State, month: string) {
  return [...state.incomes, ...state.expenses].some(
    (item) => item.status === "actual" && occurrences(item, month).length > 0,
  );
}

export function planActions(state: State, month: string): PlannedAction[] {
  const actions: PlannedAction[] = [];
  const monthBudget = state.budgets[month] || {};
  const budgetCategories = Object.keys(monthBudget);
  const hasExpenseHistory = state.expenses.some(
    (item) => item.status === "actual",
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
  const cashHistory = completedMonths.map((period) => ({
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
      evidence: `${deficitMonths.length}/3 kuukautta miinuksella · kirjattu erotus yhteensä ${formatCents(deficitTotal)}`,
      privateEvidence: true,
      priority,
      score:
        (priority === "high" ? 390 : 270) +
        Math.min(80, Math.round(deficitTotal / 25000)),
      destination: "reports",
      destinationLabel: "Avaa kassavirtaraportti",
      nextStep:
        "Avaa tulot ja eräpäivät päivä kerrallaan. Varmista tietojen kattavuus ja merkitse lähiajan välttämättömät maksut ennen pitkän aikavälin päätöksiä.",
      sourceIds: ["R1", "R2", "R3"],
      boundary:
        "Kolmen kuukauden näkymä on lyhyt otos. Se ei ennusta tuloja tai osoita yksin, että menoja pitäisi leikata.",
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
        destination: "assets",
        destinationLabel: "Tarkista helposti käytettävät varat",
        nextStep:
          "Varmista ensin, mitkä varat saa käyttöön nopeasti. Valitse sitten oma tavoite huomioiden tulojen vakaus, huollettavat ja tulevat maksut.",
        sourceIds: ["R2", "R3"],
        boundary:
          "Tutkimus ei anna kaikille sopivaa puskurikuukausien lukua. Alle yhden kuukauden merkintä on kompassin tarkistusraja, ei suositeltu tavoite. Laskelma ei käsittele luottoa tai tulevia tuloja puskurina.",
      });
    }
  } else if (state.expenses.some((item) => item.status === "actual")) {
    actions.push({
      id: `coverage-check-${month}`,
      title: "Täydennä välttämättömien menojen havaintoja",
      reason:
        "Puskurin kestoa ei voi arvioida vakaasti, koska viimeisiltä kolmelta kuukaudelta on alle kaksi kuluhavaintoa.",
      evidence: `${buffer.observedMonths}/3 kuukautta kirjattuna`,
      priority: "low",
      score: 150,
      destination: "expenses",
      destinationLabel: "Tarkista menokirjaukset",
      nextStep:
        "Lisää tavalliset välttämättömät kuukausikulut ja tarkista, ettei puuttuva kuukausi tarkoita nollamenoja.",
      sourceIds: ["R2", "R3", "R11"],
      boundary:
        "Laskuri käyttää valittuja välttämättömyysmerkintöjä. Puuttuva kirjaus ei ole sama kuin toteutunut nollameno.",
    });
  }

  const incomeHistory = recentMonths(month, 6).filter((period) =>
    hasActualEntries(state, period),
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
        destination: "reports",
        destinationLabel: "Tarkastele tulovirtaa",
        nextStep:
          "Kokeile kuukausibudjettia tavanomaista matalamman tulon varassa ja tarkista, mitkä kulut joustavat. Pidä satunnaiset tulot erillisenä skenaariona.",
        sourceIds: ["R2", "R3"],
        boundary:
          "30 % on tämän näkymän tunnistuskynnys, ei tutkimuksen riskiraja. Puuttuvat tulokirjaukset voivat näyttää vaihtelun todellista suurempana.",
      });
    }
  }

  const expenseHistory = recentMonths(month, 12).filter((period) =>
    state.expenses.some(
      (item) =>
        item.status === "actual" &&
        expenseType(item) === "consumption" &&
        occurrences(item, period).length > 0,
    ),
  );
  if (expenseHistory.length >= 6) {
    const irregularTotals = new Map<
      string,
      { amount: number; months: Set<string> }
    >();
    for (const item of state.expenses) {
      if (
        item.status !== "actual" ||
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
      current.amount += item.amount;
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
    .slice(0, 16);
}

export function visibleActions(state: State, month: string, date = today()) {
  return planActions(state, month).filter((action) => {
    const saved = state.actionStates[action.id];
    if (!saved) return true;
    if (saved.status === "done") return false;
    return !saved.until || saved.until <= date;
  });
}
