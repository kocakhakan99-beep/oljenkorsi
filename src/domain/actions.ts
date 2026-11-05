import { expenseType, metrics, total } from "./calculations";
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
    });
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
    .slice(0, 40);
}

export function visibleActions(state: State, month: string, date = today()) {
  return planActions(state, month).filter((action) => {
    const saved = state.actionStates[action.id];
    if (!saved) return true;
    if (saved.status === "done") return false;
    return !saved.until || saved.until <= date;
  });
}
