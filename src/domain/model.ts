export type Kind = 'incomes' | 'expenses' | 'assets' | 'liabilities' | 'investments' | 'goals';
export type Recurrence =
  | 'once'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'bimonthly'
  | 'quarterly'
  | 'semiannual'
  | 'yearly';
export interface Entry {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  endDate: string;
  recurrence: Recurrence;
  status: 'actual' | 'planned' | 'skipped';
  active: boolean;
  essential: boolean;
  description: string;
  tags: string;
  quantity: number;
  purchasePrice: number;
  ownership: number;
  liquid: boolean;
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
  kind: 'incomes' | 'expenses';
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
    currency: 'EUR';
    language: 'fi';
  };
  categories: Category[];
  incomes: Entry[];
  expenses: Entry[];
  assets: Entry[];
  liabilities: Entry[];
  investments: Entry[];
  goals: Entry[];
  budgets: Record<string, Record<string, number>>;
  investmentTransactions: unknown[];
  scenarios: Scenario[];
  themes: unknown[];
}
export const kinds: Kind[] = [
  'incomes',
  'expenses',
  'assets',
  'liabilities',
  'investments',
  'goals',
];
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
export const uid = () => crypto.randomUUID();
export function empty(): State {
  return {
    schemaVersion: 1,
    applicationVersion: '0.1.0',
    createdAt: new Date().toISOString(),
    settings: {
      onboarded: false,
      demo: false,
      theme: 'neutral',
      mode: 'system',
      private: false,
      accent: '#17604d',
      month: today().slice(0, 7),
      currency: 'EUR',
      language: 'fi',
    },
    categories: [
      ...[
        'Palkka',
        'Etuudet',
        'Eläke',
        'Sivutulot',
        'Yritystulot',
        'Vuokratulot',
        'Sijoitustulot',
        'Veronpalautukset',
        'Lahjat',
        'Muu tulo',
      ].map((name) => ({
        id: uid(),
        name,
        kind: 'incomes' as const,
        color: '#17604d',
        archived: false,
      })),
      ...[
        'Asuminen',
        'Sähkö',
        'Vesi',
        'Vakuutukset',
        'Ruoka',
        'Ravintolat ja kahvilat',
        'Liikenne',
        'Autoilu',
        'Julkinen liikenne',
        'Terveys',
        'Lääkkeet',
        'Puhelin',
        'Internet',
        'Tilaukset',
        'Vaatteet',
        'Harrastukset',
        'Viihde',
        'Lapset ja perhe',
        'Lemmikit',
        'Koulutus',
        'Matkailu',
        'Lahjat',
        'Hyväntekeväisyys',
        'Verot',
        'Lainat',
        'Korot',
        'Säästäminen',
        'Sijoittaminen',
        'Muu meno',
      ].map((name) => ({
        id: uid(),
        name,
        kind: 'expenses' as const,
        color: '#376eab',
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
    investmentTransactions: [],
    scenarios: [],
    themes: [],
  };
}
export function entry(v: Partial<Entry> = {}): Entry {
  return {
    id: uid(),
    name: '',
    amount: 0,
    category: 'Muu',
    date: today(),
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
  const d = today().slice(0, 7) + '-01';
  s.incomes = [
    entry({
      name: 'Palkka (netto)',
      amount: 310000,
      category: 'Palkka',
      date: d,
      recurrence: 'monthly',
    }),
  ];
  s.expenses = [
    ['Asuminen', 95000],
    ['Sähkö', 6500],
    ['Ruoka', 42000],
    ['Vakuutukset', 8500],
    ['Autoilu', 18000],
    ['Puhelin', 2500],
    ['Internet', 3000],
    ['Harrastukset', 6500],
  ].map(([name, amount]) =>
    entry({
      name: String(name),
      category: String(name),
      amount: Number(amount),
      date: d,
      recurrence: 'monthly',
    }),
  );
  s.assets = [
    entry({ name: 'Talletukset', category: 'Talletukset', amount: 850000, liquid: true }),
    entry({ name: 'Asunto', category: 'Asunto', amount: 21000000 }),
    entry({ name: 'Auto', category: 'Auto', amount: 1200000, rate: -12 }),
  ];
  s.liabilities = [
    entry({
      name: 'Asuntolaina',
      category: 'Asuntolaina',
      amount: 14500000,
      rate: 3.5,
      payment: 85000,
    }),
  ];
  s.investments = [
    entry({
      name: 'Esimerkkirahasto',
      category: 'Rahasto',
      amount: 12500,
      purchasePrice: 10000,
      quantity: 40,
    }),
  ];
  s.goals = [
    entry({
      name: 'Hätävara',
      category: 'Hätävara',
      amount: 850000,
      target: 1200000,
      monthly: 25000,
    }),
  ];
  s.budgets[s.settings.month] = Object.fromEntries(
    s.expenses.map((e) => [e.category, e.amount + 2000]),
  );
  return s;
}
