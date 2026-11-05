export type Kind =
  | "incomes"
  | "expenses"
  | "assets"
  | "liabilities"
  | "investments"
  | "goals";
export type Recurrence =
  | "once"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannual"
  | "yearly";
export interface Entry {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  endDate: string;
  recurrence: Recurrence;
  status: "actual" | "planned" | "skipped";
  active: boolean;
  essential: boolean;
  description: string;
  tags: string;
  quantity: number;
  purchasePrice: number;
  ownership: number;
  liquid: boolean;
  linkedAssetId: string;
  rate: number;
  payment: number;
  target: number;
  monthly: number;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 1;
}
export interface Category {
  id: string;
  name: string;
  kind: "incomes" | "expenses";
  color: string;
  archived: boolean;
}
export interface Scenario {
  id: string;
  name: string;
  initial: number;
  monthly: number;
  rate: number;
  fee: number;
  inflation: number;
  years: number;
}
export interface ActionState {
  status: "done" | "snoozed";
  until?: string;
  updatedAt: string;
}
export interface State {
  schemaVersion: 1;
  applicationVersion: string;
  createdAt: string;
  settings: {
    onboarded: boolean;
    demo: boolean;
    theme: string;
    mode: string;
    private: boolean;
    accent: string;
    month: string;
    currency: "EUR";
    language: "fi";
  };
  categories: Category[];
  incomes: Entry[];
  expenses: Entry[];
  assets: Entry[];
  liabilities: Entry[];
  investments: Entry[];
  goals: Entry[];
  budgets: Record<string, Record<string, number>>;
  budgetActuals: Record<string, Record<string, number>>;
  actionStates: Record<string, ActionState>;
  investmentTransactions: unknown[];
  scenarios: Scenario[];
  themes: unknown[];
}
export const kinds: Kind[] = [
  "incomes",
  "expenses",
  "assets",
  "liabilities",
  "investments",
  "goals",
];
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const uid = () => crypto.randomUUID();
export function empty(): State {
  return {
    schemaVersion: 1,
    applicationVersion: "0.1.0",
    createdAt: new Date().toISOString(),
    settings: {
      onboarded: false,
      demo: false,
      theme: "neutral",
      mode: "system",
      private: false,
      accent: "#17604d",
      month: today().slice(0, 7),
      currency: "EUR",
      language: "fi",
    },
    categories: [
      ...[
        "Palkka",
        "Etuudet",
        "Eläke",
        "Sivutulot",
        "Yritystulot",
        "Vuokratulot",
        "Sijoitustulot",
        "Veronpalautukset",
        "Lahjat",
        "Muu tulo",
      ].map((name) => ({
        id: uid(),
        name,
        kind: "incomes" as const,
        color: "#17604d",
        archived: false,
      })),
      ...[
        "Asuminen",
        "Sähkö",
        "Vesi",
        "Vakuutukset",
        "Ruoka",
        "Ravintolat ja kahvilat",
        "Liikenne",
        "Autoilu",
        "Julkinen liikenne",
        "Terveys",
        "Lääkkeet",
        "Puhelin",
        "Internet",
        "Tilaukset",
        "Vaatteet",
        "Harrastukset",
        "Viihde",
        "Lapset ja perhe",
        "Lemmikit",
        "Koulutus",
        "Matkailu",
        "Lahjat",
        "Hyväntekeväisyys",
        "Verot",
        "Lainat",
        "Korot",
        "Säästäminen",
        "Sijoittaminen",
        "Muu meno",
      ].map((name) => ({
        id: uid(),
        name,
        kind: "expenses" as const,
        color: "#376eab",
        archived: false,
      })),
    ],
    incomes: [],
    expenses: [],
    assets: [],
    liabilities: [],
    investments: [],
    goals: [],
    budgets: {},
    budgetActuals: {},
    actionStates: {},
    investmentTransactions: [],
    scenarios: [],
    themes: [],
  };
}
export function entry(v: Partial<Entry> = {}): Entry {
  return {
    id: uid(),
    name: "",
    amount: 0,
    category: "Muu",
    date: today(),
    endDate: "",
    recurrence: "once",
    status: "actual",
    active: true,
    essential: true,
    description: "",
    tags: "",
    quantity: 1,
    purchasePrice: 0,
    ownership: 100,
    liquid: false,
    linkedAssetId: "",
    rate: 0,
    payment: 0,
    target: 0,
    monthly: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    schemaVersion: 1,
    ...v,
  };
}
export function demo(): State {
  let s = empty();
  s.settings.onboarded = true;
  s.settings.demo = true;
  const now = new Date();
  const currentDay = now.getDate();
  const monthAt = (offset: number) => {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  };
  const dateAt = (offset: number, day: number) => {
    const date = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    const safeDay = Math.max(
      1,
      Math.min(day, lastDay, offset === 0 ? currentDay : lastDay),
    );
    return `${monthAt(offset)}-${String(safeDay).padStart(2, "0")}`;
  };
  const recurringExpense = (
    name: string,
    category: string,
    amount: number,
    description: string,
  ) =>
    entry({
      name,
      category,
      amount,
      date: `${s.settings.month}-01`,
      recurrence: "monthly",
      description,
    });
  s.incomes = [
    entry({
      name: "Aikuinen 1 · nettopalkka",
      amount: 338000,
      category: "Palkka",
      date: `${s.settings.month}-01`,
      recurrence: "monthly",
    }),
    entry({
      name: "Aikuinen 2 · nettopalkka",
      amount: 276000,
      category: "Palkka",
      date: `${s.settings.month}-01`,
      recurrence: "monthly",
    }),
    entry({
      name: "Lapsilisä · yksi lapsi",
      amount: 9488,
      category: "Etuudet",
      date: `${s.settings.month}-01`,
      recurrence: "monthly",
    }),
  ];
  s.expenses = [
    recurringExpense(
      "Asuntolainan kuukausierä",
      "Asuminen",
      112000,
      "Perheen yhteisen kodin lainan lyhennys ja korko.",
    ),
    recurringExpense(
      "Päiväkoti ja iltapäivätoiminta",
      "Lapset ja perhe",
      24800,
      "Yhden lapsen arjen kuukausikuluja.",
    ),
    recurringExpense(
      "Koti- ja henkilövakuutukset",
      "Vakuutukset",
      7200,
      "Kahden aikuisen ja yhden lapsen vakuutuksia.",
    ),
    recurringExpense(
      "Joukkoliikenteen kausikortit",
      "Julkinen liikenne",
      11600,
      "Kahden aikuisen työmatkoihin.",
    ),
    recurringExpense(
      "Puhelinliittymät",
      "Puhelin",
      5200,
      "Kaksi aikuisten liittymää.",
    ),
    recurringExpense(
      "Kodin internet",
      "Internet",
      3400,
      "Kuukausittainen laajakaista.",
    ),
    recurringExpense(
      "Suoratoisto ja pilvipalvelu",
      "Tilaukset",
      3100,
      "Muutama kotitalouden jatkuva tilaus.",
    ),
  ];
  const foodTotals = [
    78500, 83200, 74100, 90200, 76800, 85900, 81400, 73500, 92700, 80600, 88400,
    82500,
  ];
  const electricity = [
    8400, 11200, 6900, 9800, 7200, 12800, 10500, 7800, 9300, 11700, 8600, 10100,
  ];
  const water = [
    5100, 4900, 5600, 4700, 5200, 5300, 4800, 5500, 5000, 5700, 4900, 5200,
  ];
  const fuel = [
    13200, 18400, 15100, 22300, 12700, 19600, 17400, 14300, 24100, 16900, 20500,
    15800,
  ];
  const restaurants = [
    6200, 9800, 4400, 15100, 7600, 11200, 5400, 8300, 17200, 6800, 12600, 9200,
  ];
  const kidCosts = [
    0, 6800, 12400, 0, 35200, 8900, 0, 18400, 5700, 42600, 9100, 0,
  ];
  const sideIncome = [
    18200, 27400, 0, 39600, 0, 22100, 0, 34800, 0, 19500, 0, 26700,
  ];
  for (let index = 0; index < 12; index++) {
    const offset = index - 11;
    const food = foodTotals[index];
    const splitOne = Math.round((food * 0.48) / 100) * 100;
    const splitTwo = Math.round((food * 0.31) / 100) * 100;
    [2, 12, 23].forEach((day, visit) => {
      if (offset === 0 && day > currentDay) return;
      s.expenses.push(
        entry({
          name: ["Viikon ruokaostokset", "Ruokaostokset", "Täydennysostokset"][
            visit
          ],
          category: "Ruoka",
          amount:
            visit === 0
              ? splitOne
              : visit === 1
                ? splitTwo
                : food - splitOne - splitTwo,
          date: dateAt(offset, day),
          description:
            "Vaihtelevat ruokaostokset kolmen hengen kotitaloudelle.",
        }),
      );
    });
    const variable = [
      [
        "Sähkölasku",
        "Sähkö",
        electricity[index],
        8,
        "Sähkön kulutus ja hinta vaihtelevat.",
      ],
      [
        "Vesilasku",
        "Vesi",
        water[index],
        10,
        "Vedenkulutukseen perustuva lasku.",
      ],
      [
        "Polttoaine ja auton lataus",
        "Autoilu",
        fuel[index],
        14,
        "Perheen autoilukuluja.",
      ],
      [
        "Ravintola ja kahvila",
        "Ravintolat ja kahvilat",
        restaurants[index],
        18,
        "Yhteisiä ruokahetkiä kuukauden aikana.",
      ],
    ] as const;
    for (const [name, category, amount, day, description] of variable) {
      if (offset === 0 && day > currentDay) continue;
      s.expenses.push(
        entry({
          name,
          category,
          amount,
          date: dateAt(offset, day),
          description,
        }),
      );
    }
    if (kidCosts[index] > 0 && (offset < 0 || currentDay >= 4)) {
      s.expenses.push(
        entry({
          name:
            index % 2
              ? "Lapsen vaatteita ja varusteita"
              : "Lapsen harrastus ja varusteet",
          category: index % 2 ? "Vaatteet" : "Harrastukset",
          amount: kidCosts[index],
          date: dateAt(offset, 19),
          description:
            "Satunnainen lapsiperheen hankinta, summa ja ajankohta vaihtelevat.",
        }),
      );
    }
    if (sideIncome[index] > 0) {
      s.incomes.push(
        entry({
          name: "Aikuinen 2 · satunnainen sivutulo",
          category: "Sivutulot",
          amount: sideIncome[index],
          date: dateAt(offset, offset === 0 ? currentDay : 26),
          description:
            "Kuvitteellista keikkatuloa. Kaikissa kuukausissa sitä ei ole.",
        }),
      );
    }
    if (index === 4 || index === 10) {
      s.incomes.push(
        entry({
          name: "Tulospalkkio",
          category: "Palkka",
          amount: index === 4 ? 45000 : 32500,
          date: dateAt(offset, 26),
          description: "Satunnainen palkanlisä; kuukausitulot vaihtelevat.",
        }),
      );
    }
  }
  s.assets = [
    entry({
      name: "Perheen hätävara",
      category: "Talletukset",
      amount: 1650000,
      liquid: true,
    }),
    entry({ name: "Yhteinen koti", category: "Asunto", amount: 26800000 }),
    entry({
      name: "Perheen auto",
      category: "Auto",
      amount: 1480000,
      rate: -12,
    }),
  ];
  s.liabilities = [
    entry({
      name: "Asuntolaina",
      category: "Asuntolaina",
      amount: 18900000,
      rate: 3.5,
      payment: 112000,
    }),
  ];
  s.investments = [
    entry({
      name: "Perheen indeksirahasto",
      category: "Rahasto",
      amount: 14600,
      purchasePrice: 12100,
      quantity: 40,
    }),
  ];
  s.goals = [
    entry({
      name: "Kolmen hengen talouden hätävara",
      category: "Hätävara",
      amount: 1650000,
      target: 2400000,
      monthly: 35000,
    }),
  ];
  s.budgets[s.settings.month] = {
    Asuminen: 112000,
    "Lapset ja perhe": 31000,
    Vakuutukset: 8500,
    "Julkinen liikenne": 12000,
    Puhelin: 6000,
    Internet: 3500,
    Tilaukset: 4000,
    Ruoka: 85000,
    Sähkö: 11000,
    Vesi: 5500,
    Autoilu: 20000,
    "Ravintolat ja kahvilat": 12000,
    Vaatteet: 10000,
    Harrastukset: 10000,
  };
  return s;
}
