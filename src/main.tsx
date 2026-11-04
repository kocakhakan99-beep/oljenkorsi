import { useForm } from 'react-hook-form';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import {
  empty,
  demo,
  entry,
  uid,
  today,
  kinds,
  type State,
  type Entry,
  type Kind,
  type Scenario,
} from './domain/model';
import {
  metrics,
  money,
  total,
  occurrences,
  sum,
  compound,
  goalMonths,
  payoff,
  MAX,
  expenseType,
  setExpenseTypeTags,
  userTags,
  fiTarget,
  fiMonths,
  emergencyFund,
} from './domain/calculations';
import { storage } from './data/storage';
import { backup, restore, validate, validateEntry } from './services/validation';
import { parseCSV, exportCSV, csvEntry, csvFields, download } from './services/csv';
import './styles.css';
import homeIcon from './assets/home.svg';
import carIcon from './assets/car.svg';
import bankIcon from './assets/bank.svg';
import landIcon from './assets/land.svg';
import portfolioIcon from './assets/portfolio.svg';
import loanIcon from './assets/loan.svg';
import boatIcon from './assets/boat.svg';
import motorcycleIcon from './assets/motorcycle.svg';
import valuablesIcon from './assets/valuables.svg';
const names: Record<string, string> = {
  dashboard: 'Yhteenveto',
  budget: 'Budjetti',
  incomes: 'Tulot',
  expenses: 'Menot',
  assets: 'Omaisuus',
  liabilities: 'Velat',
  investments: 'Sijoitukset',
  goals: 'Tavoitteet',
  scenarios: 'Skenaariot',
  reports: 'Raportit',
  transfer: 'Tuonti ja vienti',
  settings: 'Asetukset',
  help: 'Ohje ja tietosuoja',
};
const navGroups = [
  { label: 'Aloitus', pages: ['dashboard'] },
  { label: 'Arki', pages: ['incomes', 'expenses', 'budget'] },
  { label: 'Varallisuus', pages: ['assets', 'liabilities', 'investments'] },
  { label: 'Tulevaisuus', pages: ['goals', 'scenarios', 'reports'] },
  { label: 'Hallinta', pages: ['transfer', 'settings', 'help'] },
];
const navIcons: Record<string, string> = {
  dashboard: '◫', budget: '▤', incomes: '↙', expenses: '↗', assets: '◇',
  liabilities: '≋', investments: '▥', goals: '◎', scenarios: '⌁', reports: '▦',
  transfer: '⇅', settings: '⚙', help: '?',
};
type ReportSelection =
  | { type: 'month'; month: string; metric: 'income' | 'expense' }
  | { type: 'category'; category: string }
  | { type: 'day'; date: string };
function pieSlicePath(startPercent: number, endPercent: number) {
  const point = (percent: number, radius: number) => {
    const angle = (percent * 3.6 - 90) * Math.PI / 180;
    return [50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius];
  };
  const end = endPercent - startPercent > 99.99 ? startPercent + 99.99 : endPercent;
  const [x1, y1] = point(startPercent, 48);
  const [x2, y2] = point(end, 48);
  const [x3, y3] = point(end, 27);
  const [x4, y4] = point(startPercent, 27);
  const large = end - startPercent > 50 ? 1 : 0;
  return `M ${x1} ${y1} A 48 48 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A 27 27 0 ${large} 0 ${x4} ${y4} Z`;
}
function expCatsForReport(s: State, month: string): [string, number][] {
  const categories = [...new Set(s.expenses.filter((e) => expenseType(e) === 'consumption').map((e) => e.category))];
  return categories
    .map((category) => [category, total(s.expenses.filter((e) => e.category === category && expenseType(e) === 'consumption'), month, true)] as [string, number])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
}
const singular: Record<Kind, string> = {
  incomes: 'tulo',
  expenses: 'meno',
  assets: 'omaisuuserä',
  liabilities: 'velka',
  investments: 'sijoitus',
  goals: 'tavoite',
};
const recNames = {
  once: 'Kerran',
  weekly: 'Viikoittain',
  biweekly: 'Joka toinen viikko',
  monthly: 'Kuukausittain',
  bimonthly: 'Joka toinen kuukausi',
  quarterly: 'Neljännesvuosittain',
  semiannual: 'Puolivuosittain',
  yearly: 'Vuosittain',
};
const otherCategories: Record<string, string[]> = {
  assets: [
    'Käteinen',
    'Talletukset',
    'Asunto',
    'Sijoitusasunto',
    'Vapaa-ajan asunto',
    'Auto',
    'Moottoripyörä',
    'Vene',
    'Metsä',
    'Maa',
    'Yritysomistus',
    'Arvoesineet',
    'Muu',
  ],
  liabilities: [
    'Asuntolaina',
    'Autolaina',
    'Opintolaina',
    'Kulutusluotto',
    'Luottokorttivelka',
    'Muu velka',
  ],
  investments: ['Osake', 'ETF', 'Rahasto', 'Korkosijoitus', 'Käteinen', 'Kryptovara', 'Muu'],
  goals: [
    'Hätävara',
    'Loma',
    'Auto',
    'Asunnon käsiraha',
    'Velan maksaminen',
    'Eläkesäästäminen',
    'Opiskelu',
    'Muu',
  ],
};
function load() {
  try {
    return { data: storage.get(), error: '' };
  } catch (e) {
    return {
      data: empty(),
      error:
        'Tallennettua dataa ei voitu lukea. Sitä ei ylikirjoiteta automaattisesti. Vie alkuperäinen tallennus Asetuksista ja palauta kelvollinen varmuuskopio. ' +
        String(e),
    };
  }
}
const loaded = load();
function Modal({
  title,
  onClose,
  children,
  dismissible = true,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    let previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && dismissible) onClose();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        {dismissible && (
          <button aria-label="Sulje" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      {children}
    </dialog>
  );
}
function App() {
  const [s, setS] = useState<State>(loaded.data),
    [page, setPage] = useState(location.hash.slice(1) || 'dashboard'),
    [notice, setNotice] = useState(loaded.error),
    [storageOk, setStorageOk] = useState(storage.healthCheck().ok),
    [edit, setEdit] = useState<{ kind: Kind; item: Entry } | null>(null),
    [quick, setQuick] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [search, setSearch] = useState(''),
    [categoryFilter, setCategoryFilter] = useState(''),
    [statusFilter, setStatusFilter] = useState(''),
    [sort, setSort] = useState('date'),
    [limit, setLimit] = useState(100),
    [pending, setPending] = useState<State | null>(null),
    [deleteOpen, setDeleteOpen] = useState(false),
    [deleteText, setDeleteText] = useState(''),
    [categoryEdit, setCategoryEdit] = useState(false),
    [undo, setUndo] = useState<State | null>(null),
    [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set()),
    [reportMonths, setReportMonths] = useState(6),
    [reportView, setReportView] = useState<'overview' | 'categories' | 'flow'>('overview'),
    [overviewChart, setOverviewChart] = useState<'bars' | 'line'>('bars'),
    [categoryChart, setCategoryChart] = useState<'bars' | 'pie'>('bars'),
    [selectedReport, setSelectedReport] = useState<ReportSelection | null>(null),
    [bufferMonths, setBufferMonths] = useState(3);
  const menuButton = useRef<HTMLButtonElement>(null);
  const reportDetailRef = useRef<HTMLElement>(null);
  const month = s.settings.month,
    m = useMemo(() => metrics(s, month), [s, month]);
  const buffer = useMemo(() => emergencyFund(s, month, bufferMonths), [s, month, bufferMonths]);
  const euro = (n: number) =>
    s.settings.private
      ? '•••••• €'
      : new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(n / 100);
  const pct = (n: number | null) =>
    n === null
      ? 'Ei laskettavissa'
      : s.settings.private
        ? '••• %'
        : new Intl.NumberFormat('fi-FI', { maximumFractionDigits: 1 }).format(n) + ' %';
  function commit(next: State) {
    try {
      let valid = validate(next);
      try {
        storage.update(valid);
        setStorageOk(true);
      } catch (e) {
        setStorageOk(false);
        setNotice(
          'Tallennus epäonnistui. Tiedot ovat vain tämän välilehden muistissa: vie varmuuskopio nyt. ' +
            String(e),
        );
      }
      setS(valid);
      return true;
    } catch (e) {
      setNotice(String(e));
      return false;
    }
  }
  function settings(v: Partial<State['settings']>) {
    commit({ ...s, settings: { ...s.settings, ...v } });
  }
  function navigate(p: string) {
    setPage(p);
    location.hash = p;
    setCategoryFilter('');
    setStatusFilter('');
    setLimit(100);
    setQuick(false);
    setMenuOpen(false);
    setTimeout(() => document.querySelector<HTMLElement>('main h1')?.focus(), 0);
  }
  useEffect(() => {
    let f = () => {
      setPage(location.hash.slice(1) || 'dashboard');
      setMenuOpen(false);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  useEffect(() => {
    let f = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuOpen && !document.querySelector('dialog[open]')) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuick((v) => !v);
      }
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [menuOpen]);
  useEffect(() => {
    if (menuOpen) document.querySelector<HTMLElement>('#main-navigation button')?.focus();
  }, [menuOpen]);
  useEffect(() => {
    if (selectedReport) {
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      setTimeout(() => reportDetailRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), 0);
    }
  }, [selectedReport]);
  useEffect(() => {
    let f = (e: BeforeUnloadEvent) => {
      if (!storageOk) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', f);
    return () => window.removeEventListener('beforeunload', f);
  }, [storageOk]);
  const dark =
    s.settings.mode === 'dark' ||
    (s.settings.mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    document.documentElement.dataset.theme = s.settings.theme;
    document.documentElement.dataset.mode = dark ? 'dark' : 'light';
    document.documentElement.style.setProperty('--custom', s.settings.accent);
  }, [s.settings.theme, dark, s.settings.accent]);
  function saveEntry(kind: Kind, item: Entry) {
    let exists = s[kind].some((e) => e.id === item.id);
    if (
      commit({
        ...s,
        [kind]: exists ? s[kind].map((e) => (e.id === item.id ? item : e)) : [...s[kind], item],
      })
    ) {
      setEdit(null);
      setNotice('Tiedot päivitetty.');
    }
  }
  function remove(kind: Kind, id: string) {
    if (confirm('Poistetaanko tietue? Voit kumota viimeisimmän poiston tämän istunnon aikana.')) {
      setUndo(s);
      commit({ ...s, [kind]: s[kind].filter((e) => e.id !== id) });
      setNotice('Tietue poistettu.');
    }
  }
  function exportBackup() {
    download(backup(s), 'taloussuunnittelu-backup-' + today() + '.json');
    setNotice('Varmuuskopio muodostettu. Tarkista, että tiedosto tallentui selaimen latauksiin.');
  }
  async function importBackup(file: File) {
    try {
      if (file.size > 10000000) throw Error('Enimmäiskoko on 10 Mt.');
      setPending(restore(await file.text()));
    } catch (e) {
      setNotice('Palautus hylätty: ' + String(e));
    }
  }
  function budgetChange(cat: string, text: string) {
    try {
      let n = money(text);
      if (n < 0) throw Error('Budjetti ei voi olla negatiivinen.');
      commit({ ...s, budgets: { ...s.budgets, [month]: { ...s.budgets[month], [cat]: n } } });
    } catch (e) {
      setNotice(String(e));
    }
  }
  function actualChange(cat: string, text: string) {
    try {
      if (!text.trim()) {
        const actuals = { ...s.budgetActuals };
        actuals[month] = { ...actuals[month] };
        delete actuals[month][cat];
        commit({ ...s, budgetActuals: actuals });
        return;
      }
      const n = money(text);
      if (n < 0) throw Error('Toteuma ei voi olla negatiivinen.');
      commit({
        ...s,
        budgetActuals: { ...s.budgetActuals, [month]: { ...s.budgetActuals[month], [cat]: n } },
      });
    } catch (e) {
      setNotice(String(e));
    }
  }
  const cats = (kind: Kind) =>
    kind === 'incomes' || kind === 'expenses'
      ? s.categories.filter((c) => c.kind === kind && !c.archived).map((c) => c.name)
      : otherCategories[kind];
  const rows = kinds.includes(page as Kind)
    ? s[page as Kind]
        .filter(
          (e) =>
            (e.name + ' ' + e.category + ' ' + e.description + ' ' + e.tags)
              .toLocaleLowerCase('fi')
              .includes(search.toLocaleLowerCase('fi')) &&
            (!categoryFilter || e.category === categoryFilter) &&
            (!statusFilter || e.status === statusFilter),
        )
        .sort((a, b) =>
          sort === 'amount'
            ? b.amount - a.amount
            : sort === 'name'
              ? a.name.localeCompare(b.name, 'fi')
              : b.date.localeCompare(a.date),
        )
    : [];
  function stat(label: string, value: string, note?: string) {
    return (
      <article className="stat">
        <span>{label}</span>
        <strong>{value}</strong>
        {note && <small>{note}</small>}
      </article>
    );
  }
  const history = Array.from({ length: reportMonths }, (_, i) => {
    let [y, mo] = month.split('-').map(Number),
      d = new Date(y, mo - reportMonths + i, 1),
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { key, ...metrics(s, key) };
  });
  const reportHasData = history.some((h) => h.income !== 0 || h.expense !== 0);
  const reportMax = Math.max(...history.flatMap((h) => [h.income, h.expense]), 1);
  const reportPoints = (key: 'income' | 'expense') => history.map((h, index) => {
    const x = history.length === 1 ? 50 : 5 + index * (90 / (history.length - 1));
    const y = 95 - h[key] / reportMax * 85;
    return `${x},${y}`;
  }).join(' ');
  const categoryReport = expCatsForReport(s, month);
  const maxCategoryExpense = Math.max(...categoryReport.map(([, value]) => value), 1);
  const pieColors = ['#087f5b', '#d9480f', '#7048e8', '#ae7c00', '#1971c2', '#c2255c', '#495057', '#5c940d'];
  let pieCursor = 0;
  const pieSlices = categoryReport.map(([category, value], index) => {
    const start = pieCursor;
    pieCursor += m.consumption ? value * 100 / m.consumption : 0;
    return { category, value, start, end: pieCursor, color: pieColors[index % pieColors.length] };
  });
  const flowByDate = new Map<string, { income: number; expense: number }>();
  for (const e of s.incomes.filter((e) => e.status === 'actual'))
    for (const date of occurrences(e, month)) {
      const value = flowByDate.get(date) || { income: 0, expense: 0 };
      value.income += e.amount;
      flowByDate.set(date, value);
    }
  for (const e of s.expenses.filter((e) => e.status === 'actual'))
    for (const date of occurrences(e, month)) {
      const value = flowByDate.get(date) || { income: 0, expense: 0 };
      value.expense += e.amount;
      flowByDate.set(date, value);
    }
  let runningFlow = 0;
  const dailyFlow = [...flowByDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => {
    runningFlow += value.income - value.expense;
    return { date, ...value, balance: runningFlow };
  });
  const firstShortfall = dailyFlow.find((day) => day.balance < 0);
  const recoveryDay = firstShortfall
    ? dailyFlow.find((day) => day.date > firstShortfall.date && day.balance >= 0)
    : undefined;
  const maxFlowMagnitude = Math.max(...dailyFlow.map((day) => Math.abs(day.balance)), 1);
  const selectedReportEntries = selectedReport?.type === 'month'
    ? (selectedReport.metric === 'income' ? s.incomes : s.expenses)
        .filter((e) => e.status === 'actual' && occurrences(e, selectedReport.month).length > 0)
        .map((e) => ({ entry: e, kind: selectedReport.metric, amount: e.amount * occurrences(e, selectedReport.month).length }))
    : selectedReport?.type === 'category'
      ? s.expenses.filter((e) => e.status === 'actual' && e.category === selectedReport.category && expenseType(e) === 'consumption' && occurrences(e, month).length > 0)
          .map((e) => ({ entry: e, kind: 'expense' as const, amount: e.amount * occurrences(e, month).length }))
      : selectedReport?.type === 'day'
        ? [...s.incomes.filter((e) => e.status === 'actual' && occurrences(e, month).includes(selectedReport.date)).map((e) => ({ entry: e, kind: 'income' as const, amount: e.amount })),
           ...s.expenses.filter((e) => e.status === 'actual' && occurrences(e, month).includes(selectedReport.date)).map((e) => ({ entry: e, kind: 'expense' as const, amount: e.amount }))]
        : [];
  const expCats = Array.from(
    new Set([
      ...s.categories.filter((c) => c.kind === 'expenses' && !c.archived).map((c) => c.name),
      ...s.expenses.map((e) => e.category),
      ...Object.keys(s.budgets[month] || {}),
    ]),
  );
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main')?.focus();
        }}
      >
        Siirry sisältöön
      </a>
      <div className="shell">
        <aside>
          <div className="brand">
            <span className="brand-mark">T</span>
            <div>
              Taloussuunnittelu<small>Oma talous. Omalla laitteella.</small>
            </div>
          </div>
          <button
            ref={menuButton}
            className="mobile-menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="main-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Valikko · {names[page] || 'Yhteenveto'}
          </button>
          <nav id="main-navigation" aria-label="Päänavigaatio" className={menuOpen ? 'menu-open' : ''}>
            {navGroups.map((group) => (
              <div className="nav-group" key={group.label} role="group" aria-label={group.label}>
                <span className="nav-group-label">{group.label}</span>
                {group.pages.map((key) => (
                  <button
                    key={key}
                    className={page === key ? 'selected' : ''}
                    aria-current={page === key ? 'page' : undefined}
                    onClick={() => navigate(key)}
                  >
                    <span className="nav-icon" aria-hidden="true">{navIcons[key]}</span>
                    {names[key]}
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="aside-bottom">
            <span className="dot" /> Täysin paikallinen<small>Ei tiliä. Ei seurantaa.</small>
            <button onClick={() => setQuick(true)}>
              Pikatoiminnot <kbd>Ctrl K</kbd>
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header>
            <div className="header-label">RAUHALLISEMPI SUHDE RAHAAN</div>
            <div className="toolbar">
              <button className="mobile-quick" onClick={() => setQuick(true)}>Pikatoiminnot</button>
              <label>
                Kuukausi
                <input
                  type="month"
                  value={month}
                  min="1900-01"
                  max="2200-12"
                  onChange={(e) => e.target.value && settings({ month: e.target.value })}
                />
              </label>
              <button
                aria-pressed={s.settings.private}
                onClick={() => settings({ private: !s.settings.private })}
              >
                {s.settings.private ? 'Näytä summat' : 'Piilota summat'}
              </button>
              <button className="primary" onClick={exportBackup}>
                Vie varmuuskopio
              </button>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            <div className="page-head">
              <div>
                <p className="eyebrow">
                  {s.settings.demo ? 'ESIMERKKIDATA · FIKTIIVINEN TALOUS' : 'SINUN TALOUDESI'}
                </p>
                <h1 tabIndex={-1}>{names[page] || 'Yhteenveto'}</h1>
              </div>
              {kinds.includes(page as Kind) && (
                <button
                  className="primary"
                  onClick={() =>
                    setEdit({
                      kind: page as Kind,
                      item: entry({ category: cats(page as Kind)[0] }),
                    })
                  }
                >
                  + Lisää {singular[page as Kind]}
                </button>
              )}
            </div>
            {(!storageOk || loaded.error) && (
              <div className="alert warning">
                {loaded.error ||
                  'Selain ei takaa pysyvää tallennusta. Vie JSON-varmuuskopio ennen sulkemista.'}
              </div>
            )}
            {notice && (
              <div className="alert" role="status">
                <span>{notice}</span>
                <button aria-label="Sulje ilmoitus" onClick={() => setNotice('')}>
                  ×
                </button>
              </div>
            )}
            {undo && (
              <div className="alert">
                Viimeisin poisto tai CSV-tuonti voidaan kumota.{' '}
                <button
                  onClick={() => {
                    commit(undo);
                    setUndo(null);
                    setNotice('Muutos kumottu.');
                  }}
                >
                  Kumoa
                </button>
              </div>
            )}
            {page === 'dashboard' && (
              <>
                <div className="hero">
                  <div>
                    <span className="eyebrow">KUUKAUDEN KASSAVIRTA</span>
                    <div className="hero-value">{euro(m.cash)}</div>
                    <p>Toteutuneet tulot − toteutuneet menot</p>
                  </div>
                  <div>
                    <span>Käyttövara suunniteltujen menojen jälkeen</span>
                    <strong>{euro(m.available)}</strong>
                    <small>Ei sisällä erillistä säästövarausta.</small>
                  </div>
                </div>
                <section className="metric-group metric-group-cash" aria-labelledby="cash-heading">
                  <h2 id="cash-heading">Kuukauden rahavirta</h2>
                  <div className="stats">
                    {stat('Tulot tässä kuussa', euro(m.income))}
                    {stat('Menot tässä kuussa', euro(m.expense))}
                    {stat('Kulutusmenot', euro(m.consumption), 'Menon tyypiksi merkityt siirrot sivuutetaan')}
                    {stat('Tulot kulutuksen jälkeen', euro(m.surplus), 'Ei ole sama kuin todennettu sijoitussumma')}
                    {stat('Säästöaste', pct(m.savingRate), 'Tulot kulutuksen jälkeen / tulot')}
                  </div>
                </section>
                <section className="metric-group metric-group-wealth" aria-labelledby="wealth-heading">
                  <h2 id="wealth-heading">Varallisuus</h2>
                  <div className="stats">
                    {stat('Nettovarallisuus', euro(m.net), 'Omaisuus + sijoitukset − velat')}
                    {stat('Omaisuus', euro(m.assets), 'Käyttäjän syöttämät arvot')}
                    {stat('Velat', euro(m.debts))}
                    {stat('Sijoitussalkku', euro(m.investments), 'Manuaaliset EUR-hinnat')}
                  </div>
                </section>
                <section className="metric-group metric-group-plan" aria-labelledby="plan-heading">
                  <h2 id="plan-heading">Suunnitelma ja siirrot</h2>
                  <div className="stats">
                    {stat('Säästösiirrot', euro(m.savingTransfers))}
                    {stat('Sijoitussiirrot', euro(m.investmentTransfers))}
                    {stat('Budjetista käytetty', m.budget ? pct((m.consumption / m.budget) * 100) : 'Ei budjettia')}
                  </div>
                </section>
                <div className="grid-two">
                  <section className="panel">
                    <h2>Kulutuksen kokonaiskuva</h2>
                    <p className="muted">Toteutuneet kulutusmenot valitussa kuussa</p>
                    {expCats
                      .filter(
                        (c) =>
                          total(
                            s.expenses.filter((e) => e.category === c && expenseType(e) === 'consumption'),
                            month,
                            true,
                          ) > 0,
                      )
                      .map((c) => {
                        let n = total(
                          s.expenses.filter((e) => e.category === c && expenseType(e) === 'consumption'),
                          month,
                          true,
                        );
                        return (
                          <div className="bar-row" key={c}>
                            <div>
                              <span>{c}</span>
                              <strong>{euro(n)}</strong>
                            </div>
                            <progress max={m.consumption || 1} value={n} aria-label={c} />
                          </div>
                        );
                      })}
                    {!m.consumption && (
                      <Empty text="Lisää ensimmäinen kulutusmeno nähdäksesi, mihin rahat kuluvat." />
                    )}
                  </section>
                  <section className="panel">
                    <h2>Hätävara ja tavoitteet</h2>
                    <label className="buffer-period">
                      Tarkastelujakso
                      <select
                        value={bufferMonths}
                        onChange={(e) => setBufferMonths(Number(e.target.value))}
                      >
                        <option value={1}>1 kuukausi</option>
                        <option value={3}>3 kuukautta</option>
                        <option value={6}>6 kuukautta</option>
                        <option value={12}>12 kuukautta</option>
                      </select>
                    </label>
                    <div className="buffer">
                      <strong>
                        {buffer.buffer === null
                          ? '—'
                          : s.settings.private
                            ? '•••'
                            : buffer.buffer.toLocaleString('fi-FI', { maximumFractionDigits: 1 })}
                      </strong>
                      <span>kuukautta välttämättömiä menoja</span>
                    </div>
                    <p className="muted">
                      Likvidiksi merkitty omaisuus / kirjattujen kuukausien välttämättömien
                      kulutusmenojen keskiarvo. Havaintoja {buffer.observedMonths}/
                      {buffer.requestedMonths} kuukaudelta.
                    </p>
                    {buffer.observedMonths < buffer.requestedMonths && (
                      <p className="muted">
                        Puuttuvia kuukausia ei lasketa nollamenoiksi. Tarkista kirjausten kattavuus
                        ennen päätöksiä.
                      </p>
                    )}
                    {buffer.averageEssential === 0 && (
                      <p className="muted">
                        Kirjattuja välttämättömiä menoja on 0 €. Hätävaran kestoa ei voi laskea.
                      </p>
                    )}
                    <p className="muted">
                      Valittu kuukausi voi olla vielä kesken; havainto ei takaa kaikkien menojen
                      kirjaamista.
                    </p>
                    {s.goals.map((e) => (
                      <Goal key={e.id} e={e} euro={euro} privateMode={s.settings.private} />
                    ))}
                    {!s.goals.length && (
                      <button
                        onClick={() =>
                          setEdit({ kind: 'goals', item: entry({ category: 'Hätävara' }) })
                        }
                      >
                        Luo oma tavoite
                      </button>
                    )}
                  </section>
                </div>
                <section className="panel">
                  <h2>Tulevat suunnitellut menot</h2>
                  <p>
                    Valitussa kuussa yhteensä <strong>{euro(m.planned)}</strong>. Suunniteltuja
                    tapahtumia ei lasketa toteutuneeseen kassavirtaan.
                  </p>
                  {s.expenses
                    .filter((e) => e.status === 'planned' && occurrences(e, month).length)
                    .map((e) => (
                      <div className="simple-row" key={e.id}>
                        <span>
                          {e.name} ·{' '}
                          {occurrences(e, month)
                            .map((d) => d.split('-').reverse().join('.'))
                            .join(', ')}
                        </span>
                        <strong>{euro(e.amount * occurrences(e, month).length)}</strong>
                      </div>
                    ))}
                </section>
              </>
            )}
            {page === 'budget' && (
              <>
                <div className="stats summary-strip summary-strip-plan">
                  {stat('Kuukauden tulot', euro(m.income))}
                  {stat('Budjetti yhteensä', euro(m.budget))}
                  {stat('Budjetista jäljellä', euro(m.budget - m.consumption))}
                  {stat(
                    'Päiväkohtainen budjettivara',
                    euro(
                      Math.round(
                        (m.budget - m.consumption) /
                          (month === today().slice(0, 7)
                            ? new Date(
                                Number(month.slice(0, 4)),
                                Number(month.slice(5)),
                                0,
                              ).getDate() -
                              Number(today().slice(8)) +
                              1
                            : new Date(
                                Number(month.slice(0, 4)),
                                Number(month.slice(5)),
                                0,
                              ).getDate()),
                      ),
                    ),
                  )}
                </div>
                <section className="panel">
                  <div className="section-head">
                    <h2>Kategoriabudjetti</h2>
                    <button
                      onClick={() => {
                        let [y, mo] = month.split('-').map(Number),
                          d = new Date(y, mo - 2, 1),
                          prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                        if (!s.budgets[prev])
                          setNotice('Edellisellä kuukaudella ei ole budjettia.');
                        else if (
                          confirm(
                            'Korvataanko tämän kuukauden budjetti edellisen kuukauden kopiolla?',
                          )
                        )
                          commit({
                            ...s,
                            budgets: { ...s.budgets, [month]: { ...s.budgets[prev] } },
                          });
                      }}
                    >
                      Kopioi edellinen kuukausi
                    </button>
                  </div>
                  <p className="muted">
                    Syötä suunniteltu budjetti ja halutessasi toteutunut kulutus käsin. Jos toteumaa
                    ei ole syötetty, näytetään tapahtumista laskettu summa. Budjetin toteuma ei muuta
                    kassavirtaa.
                  </p>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Kategoria</th>
                          <th>Suunniteltu €</th>
                          <th>Toteutunut kulutus €</th>
                          <th>Jäljellä</th>
                          <th>Toteuma</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expCats.map((c) => {
                          let b = s.budgets[month]?.[c] || 0,
                            observed = total(
                              s.expenses.filter((e) => e.category === c && expenseType(e) === 'consumption'),
                              month,
                              true,
                            ),
                            hasManual = Object.hasOwn(s.budgetActuals[month] || {}, c),
                            a = hasManual ? s.budgetActuals[month][c] : observed;
                          return (
                            <tr key={month + c}>
                              <th scope="row">{c}</th>
                              <td>
                                <input
                                  className="budget-input"
                                  aria-label={c + ' budjetti euroina'}
                                  key={b}
                                  defaultValue={(b / 100).toFixed(2).replace('.', ',')}
                                  onBlur={(e) => budgetChange(c, e.target.value)}
                                  inputMode="decimal"
                                />
                              </td>
                              <td>
                                <input
                                  className="budget-input"
                                  aria-label={c + ' toteuma euroina'}
                                  key={`${month}-${c}-${hasManual ? 'manual' : 'entries'}`}
                                  defaultValue={hasManual ? (a / 100).toFixed(2).replace('.', ',') : ''}
                                  placeholder={euro(observed)}
                                  onBlur={(e) => actualChange(c, e.target.value)}
                                  inputMode="decimal"
                                />
                                <small>{hasManual ? 'Manuaalinen toteuma' : 'Tapahtumista / syötä toteuma'}</small>
                              </td>
                              <td className={a > b ? 'negative' : ''}>{euro(b - a)}</td>
                              <td>{b ? pct((a / b) * 100) : 'Ei budjettia'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p>
                    Budjetoimaton osa tuloista: <strong>{euro(m.income - m.budget)}</strong>. Tämä
                    versio tukee kategoriabudjettia; ei nollapohjaisen budjetin automaattista jakoa.
                  </p>
                </section>
              </>
            )}
            {kinds.includes(page as Kind) && (
              <>
                <section className="panel entry-panel">
                  <div className="filters">
                    <label>
                      Hae
                      <input
                        type="search"
                        placeholder="Nimi, kuvaus tai tunniste"
                        value={search}
                        onChange={(e) => {
                          setSearch(e.target.value);
                          setLimit(100);
                        }}
                      />
                    </label>
                    <label>
                      Kategoria
                      <select
                        aria-label="Kategoria"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                      >
                        <option value="">Kaikki</option>
                        {Array.from(
                          new Set([
                            ...cats(page as Kind),
                            ...s[page as Kind].map((e) => e.category),
                          ]),
                        ).map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Tila
                      <select
                        aria-label="Tila"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                      >
                        <option value="">Kaikki</option>
                        <option value="actual">Toteutunut</option>
                        <option value="planned">Suunniteltu</option>
                        <option value="skipped">Ohitettu</option>
                      </select>
                    </label>
                    <label>
                      Lajittelu
                      <select
                        aria-label="Lajittelu"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                      >
                        <option value="date">Uusin päivämäärä</option>
                        <option value="amount">Suurin summa</option>
                        <option value="name">Nimi</option>
                      </select>
                    </label>
                  </div>
                  {page === 'investments' && (
                    <p className="muted">
                      Sijoitushinnat syötetään käsin euroina. Sijoituksia ei tule kirjata uudelleen
                      omaisuuteen. Salkun arvo {euro(m.investments)}; hankinta-arvo{' '}
                      {euro(
                        sum(s.investments.map((e) => Math.round(e.purchasePrice * e.quantity))),
                      )}
                      .
                    </p>
                  )}
                  {page === 'assets' && (
                    <p className="muted">
                      Nykyarvo on käyttäjän syöttämä arvio. Nettovarallisuudessa huomioidaan
                      omistusosuus.
                    </p>
                  )}
                  {page === 'liabilities' && (
                    <p className="muted">
                      Saldo on manuaalinen. Kuukausierä ei luo automaattisesti menotapahtumaa;
                      kirjaa maksut erikseen.
                    </p>
                  )}
                  {rows.length ? (
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Nimi / kategoria</th>
                            <th>{page === 'investments' ? 'Yksikköhinta' : 'Summa'}</th>
                            <th>{page === 'goals' ? 'Tavoite' : 'Päivämäärä'}</th>
                            <th>
                              {page === 'incomes' || page === 'expenses'
                                ? 'Toistuvuus / tila'
                                : 'Lisätiedot'}
                            </th>
                            <th>Toiminnot</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.slice(0, limit).map((e) => (
                            <React.Fragment key={e.id}>
                            <tr>
                              <td>
                                <div className="row-title">
                                  <button
                                    className="row-expand"
                                    aria-label={`${expandedRows.has(e.id) ? 'Piilota' : 'Näytä'} ${e.name} lisätiedot`}
                                    aria-expanded={expandedRows.has(e.id)}
                                    onClick={() => setExpandedRows((current) => {
                                      const next = new Set(current);
                                      next.has(e.id) ? next.delete(e.id) : next.add(e.id);
                                      return next;
                                    })}
                                  >
                                    <span aria-hidden="true">{expandedRows.has(e.id) ? '⌄' : '›'}</span>
                                  </button>
                                  {page === 'assets' || page === 'liabilities' ? <CategoryIcon category={e.category} debt={page === 'liabilities'} /> : null}
                                  <strong>{e.name}</strong>
                                </div>
                                <small>
                                  {e.category}
                                  {userTags(e.tags) ? ' · ' + userTags(e.tags) : ''}
                                </small>
                              </td>
                              <td>
                                {euro(e.amount)}
                                {page === 'investments' && (
                                  <small>
                                    {e.quantity} kpl · arvo{' '}
                                    {euro(Math.round(e.amount * e.quantity))}
                                  </small>
                                )}
                              </td>
                              <td>
                                {page === 'goals'
                                  ? euro(e.target)
                                  : e.date.split('-').reverse().join('.')}
                              </td>
                              <td>
                                {page === 'incomes' || page === 'expenses' ? (
                                  <>
                                    {recNames[e.recurrence]}
                                    <small>
                                      {e.status === 'actual'
                                        ? 'Toteutunut'
                                        : e.status === 'planned'
                                          ? 'Suunniteltu'
                                          : 'Ohitettu'}
                                      {!e.active ? ' · Keskeytetty' : ''}
                                      {page === 'expenses'
                                        ? ' · ' + ({ consumption: 'Kulutus', saving: 'Säästösiirto', investment: 'Sijoitussiirto' } as const)[expenseType(e)]
                                        : ''}
                                    </small>
                                  </>
                                ) : page === 'assets' ? (
                                  `${e.ownership} % · ${e.liquid ? 'Likvidi' : 'Ei likvidi'}`
                                ) : page === 'liabilities' ? (
                                  `${e.rate} % · erä ${euro(e.payment)}`
                                ) : page === 'goals' ? (
                                  <Goal e={e} euro={euro} privateMode={s.settings.private} />
                                ) : (
                                  e.category
                                )}
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    aria-label={'Muokkaa ' + e.name}
                                    onClick={() => setEdit({ kind: page as Kind, item: e })}
                                  >
                                    Muokkaa
                                  </button>
                                  <button
                                    aria-label={'Poista ' + e.name}
                                    onClick={() => remove(page as Kind, e.id)}
                                  >
                                    Poista
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {expandedRows.has(e.id) && (
                              <tr className="expanded-row">
                                <td colSpan={5}>
                                  <div className="expanded-content">
                                    <span>Kuvaus: {e.description || 'Ei kuvausta'}</span>
                                    <span>Päiväys: {e.date.split('-').reverse().join('.')}</span>
                                    {(page === 'incomes' || page === 'expenses') && <span>Toistuvuus: {recNames[e.recurrence]}</span>}
                                    {userTags(e.tags) && <span>Tunnisteet: {userTags(e.tags)}</span>}
                                    <span>{page === 'assets' ? `Omistus ${e.ownership} % · ${e.liquid ? 'Likvidi' : 'Ei likvidi'}` : page === 'liabilities' ? `Korko ${e.rate} % · kuukausierä ${euro(e.payment)}` : e.status === 'planned' ? 'Suunniteltu' : e.status === 'skipped' ? 'Ohitettu' : 'Toteutuneeksi merkitty'}</span>
                                  </div>
                                </td>
                              </tr>
                            )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                      {rows.length > limit && (
                        <button onClick={() => setLimit(limit + 100)}>Näytä seuraavat 100</button>
                      )}
                    </div>
                  ) : (
                    <Empty text="Ei tietueita. Lisää uusi tai muuta hakuehtoja." />
                  )}
                </section>
                {(page === 'incomes' || page === 'expenses') && (
                  <button onClick={() => setCategoryEdit(true)}>Hallitse kategorioita</button>
                )}
              </>
            )}
            {page === 'scenarios' && (
              <ScenarioView
                scenarios={s.scenarios}
                euro={euro}
                pct={pct}
                onSave={(q) => commit({ ...s, scenarios: [...s.scenarios, q] })}
                onDelete={(id) =>
                  commit({ ...s, scenarios: s.scenarios.filter((q) => q.id !== id) })
                }
                liabilities={s.liabilities}
              />
            )}
            {page === 'reports' && (
              <>
                <div className="report-tabs" role="tablist" aria-label="Raporttinäkymä">
                  {([
                    ['overview', 'Kokonaiskuva'],
                    ['categories', 'Kulurakenne'],
                    ['flow', 'Rahavirran ajoitus'],
                  ] as const).map(([view, label]) => (
                    <button key={view} role="tab" aria-selected={reportView === view} onClick={() => { setReportView(view); setSelectedReport(null); }}>{label}</button>
                  ))}
                </div>
                {reportView === 'overview' && (
                <section className="panel report-panel">
                  <label>
                    Raportin pituus (päättyy valittuun kuukauteen)
                    <select
                      aria-label="Raportin pituus (päättyy valittuun kuukauteen)"
                      value={reportMonths}
                      onChange={(e) => setReportMonths(Number(e.target.value))}
                    >
                      {[1, 3, 6, 12].map((n) => (
                        <option key={n} value={n}>
                          {n} kuukautta
                        </option>
                      ))}
                    </select>
                  </label>
                  <h2>Tulot ja menot</h2>
                  <div className="chart-switch" role="group" aria-label="Kaavion tyyppi">
                    <button aria-pressed={overviewChart === 'bars'} onClick={() => setOverviewChart('bars')}>Pylväät</button>
                    <button aria-pressed={overviewChart === 'line'} onClick={() => setOverviewChart('line')}>Viiva</button>
                  </div>
                  {reportHasData ? (
                    <>
                      {overviewChart === 'bars' ? <div
                        className="chart report-canvas"
                      >
                        {history.map((h) => (
                          <div
                            className="chart-col"
                            key={h.key}
                          >
                            <div className="chart-bars">
                              <button
                                type="button"
                                className={`income-bar chart-mark${selectedReport?.type === 'month' && selectedReport.month === h.key && selectedReport.metric === 'income' ? ' selected-mark' : ''}`}
                                aria-label={`${h.key}: tulot ${euro(h.income)}. Avaa tietueet.`}
                                title={`Tulot ${euro(h.income)} · Näytä tietueet`}
                                onClick={() => setSelectedReport({ type: 'month', month: h.key, metric: 'income' })}
                                style={{
                                  height: Math.max(
                                    2,
                                    (h.income /
                                      Math.max(
                                        ...history.map((x) => Math.max(x.income, x.expense)),
                                        1,
                                      )) *
                                      140,
                                  ),
                                }}
                              />
                              <button
                                type="button"
                                className={`expense-bar chart-mark${selectedReport?.type === 'month' && selectedReport.month === h.key && selectedReport.metric === 'expense' ? ' selected-mark' : ''}`}
                                aria-label={`${h.key}: menot ${euro(h.expense)}. Avaa tietueet.`}
                                title={`Menot ${euro(h.expense)} · Näytä tietueet`}
                                onClick={() => setSelectedReport({ type: 'month', month: h.key, metric: 'expense' })}
                                style={{
                                  height: Math.max(
                                    2,
                                    (h.expense /
                                      Math.max(
                                        ...history.map((x) => Math.max(x.income, x.expense)),
                                        1,
                                      )) *
                                      140,
                                  ),
                                }}
                              />
                            </div>
                            <small>{h.key.slice(5)}</small>
                          </div>
                        ))}
                      </div> : <div className="line-chart-wrap">
                        <svg className="line-chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Kuukausittaiset tulojen ja menojen viivakaaviot. Tarkat luvut alla taulukossa.">
                          <line x1="0" y1="95" x2="100" y2="95" className="chart-axis" />
                          <polyline points={reportPoints('income')} className="income-line" />
                          <polyline points={reportPoints('expense')} className="expense-line" />
                          {history.map((h, index) => {
                            const x = history.length === 1 ? 50 : 5 + index * (90 / (history.length - 1));
                            return <React.Fragment key={h.key}><circle role="button" tabIndex={0} aria-label={`${h.key} tulot ${euro(h.income)}. Avaa tietueet.`} onClick={() => setSelectedReport({ type: 'month', month: h.key, metric: 'income' })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedReport({ type: 'month', month: h.key, metric: 'income' }); } }} cx={x} cy={95 - h.income / reportMax * 85} r="2.5" className={`income-point${selectedReport?.type === 'month' && selectedReport.month === h.key && selectedReport.metric === 'income' ? ' selected-point' : ''}`} /><circle role="button" tabIndex={0} aria-label={`${h.key} menot ${euro(h.expense)}. Avaa tietueet.`} onClick={() => setSelectedReport({ type: 'month', month: h.key, metric: 'expense' })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedReport({ type: 'month', month: h.key, metric: 'expense' }); } }} cx={x} cy={95 - h.expense / reportMax * 85} r="2.5" className={`expense-point${selectedReport?.type === 'month' && selectedReport.month === h.key && selectedReport.metric === 'expense' ? ' selected-point' : ''}`} /></React.Fragment>;
                          })}
                        </svg>
                        <div className="line-chart-labels">{history.map((h) => <small key={h.key}>{h.key.slice(5)}</small>)}</div>
                      </div>}
                      <div className="chart-legend" aria-hidden="true">
                        <span><i className="legend-swatch income-bar" /> Tulot</span>
                        <span><i className="legend-swatch expense-bar" /> Menot</span>
                      </div>
                    </>
                  ) : (
                    <div className="chart-empty">Ei toteutuneita tuloja tai menoja valitulla jaksolla.</div>
                  )}
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Kuukausi</th>
                          <th>Tulot</th>
                          <th>Menot</th>
                          <th>Kulutus</th>
                          <th>Säästö- ja sijoitussiirrot</th>
                          <th>Kassavirta</th>
                          <th>Säästöaste</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((h) => (
                          <tr key={h.key}>
                            <th>{h.key}</th>
                            <td>{euro(h.income)}</td>
                            <td>{euro(h.expense)}</td>
                            <td>{euro(h.consumption)}</td>
                            <td>{euro(h.savingTransfers + h.investmentTransfers)}</td>
                            <td>{euro(h.cash)}</td>
                            <td>{pct(h.savingRate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="muted">
                    Toistuvat toteutuneiksi merkityt tapahtumat lasketaan jokaiselle esiintymälle.
                    Tämä ei ole pankkitapahtumien toteumavarmistus. Nettovarallisuuden
                    historiaseuranta ei kuulu tähän versioon.
                  </p>
                </section>
                )}
                {reportView === 'categories' && (
                  <section className="panel report-panel">
                    <h2>Kulutusmenot kategorioittain</h2>
                    <p className="muted">Valittu kuukausi · toteutuneiksi merkityt kulutusmenot. Säästö- ja sijoitussiirrot on jätetty pois.</p>
                    <div className="chart-switch" role="group" aria-label="Kulurakenteen kaavion tyyppi">
                      <button aria-pressed={categoryChart === 'bars'} onClick={() => setCategoryChart('bars')}>Pylväät</button>
                      <button aria-pressed={categoryChart === 'pie'} onClick={() => setCategoryChart('pie')}>Piirakka</button>
                    </div>
                    {categoryChart === 'pie' && categoryReport.length > 0 && (
                      <div className="pie-layout">
                        <div className="pie-chart">
                          <svg className="pie-svg" viewBox="0 0 100 100" role="group" aria-label="Valitse piirakan kululuokka">
                            {pieSlices.map((slice) => <path key={slice.category} d={pieSlicePath(slice.start, slice.end)} fill={slice.color} className={`pie-slice${selectedReport?.type === 'category' && selectedReport.category === slice.category ? ' selected-slice' : ''}`} role="button" tabIndex={0} aria-label={`${slice.category}: ${euro(slice.value)}, ${pct(m.consumption ? slice.value * 100 / m.consumption : null)}. Avaa kirjaukset.`} aria-pressed={selectedReport?.type === 'category' && selectedReport.category === slice.category} onClick={() => setSelectedReport({ type: 'category', category: slice.category })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedReport({ type: 'category', category: slice.category }); } }} />)}
                          </svg>
                          <div className="pie-center"><strong>{euro(m.consumption)}</strong><small>Kulutus yhteensä</small></div>
                        </div>
                        <div className="pie-legend">{categoryReport.map(([category, value], index) => <button key={category} className={selectedReport?.type === 'category' && selectedReport.category === category ? 'selected-legend' : ''} onClick={() => setSelectedReport({ type: 'category', category })}><i style={{ backgroundColor: pieColors[index % pieColors.length] }} /><span>{category}</span><strong>{pct(m.consumption ? value * 100 / m.consumption : null)}</strong></button>)}</div>
                      </div>
                    )}
                    {categoryChart === 'bars' && categoryReport.length ? categoryReport.map(([category, value]) => (
                      <button className={`category-report-row${selectedReport?.type === 'category' && selectedReport.category === category ? ' selected-report-row' : ''}`} key={category} aria-label={`${category}, ${euro(value)}. Avaa kirjaukset.`} onClick={() => setSelectedReport({ type: 'category', category })}>
                        <div><span>{category}</span><strong>{euro(value)} · {pct(m.consumption ? value * 100 / m.consumption : null)}</strong></div>
                        <progress max={maxCategoryExpense} value={value} aria-label={`${category}: ${euro(value)}`} />
                      </button>
                    )) : categoryReport.length === 0 ? <Empty text="Valitussa kuussa ei ole toteutuneita kulutusmenoja." /> : null}
                  </section>
                )}
                {reportView === 'flow' && (
                  <section className="panel report-panel">
                    <h2>Tulojen ja menojen ajoitus</h2>
                    <p className="muted">Kumulatiivinen kassavirta alkaa kuun alussa nollasta. Alkusaldoa ja maksujen kellonaikoja ei tunneta; saman päivän tapahtumia ei järjestetä keskenään.</p>
                    {dailyFlow.length ? <>
                      <div className="flow-summary">
                        <strong>{firstShortfall ? `Kertymä käy miinuksella ${firstShortfall.date.split('-').reverse().join('.')}` : 'Kertymä ei käy miinuksella kirjattuina tapahtumapäivinä'}</strong>
                        <span>{recoveryDay ? `Kertymä palautuu plussalle ${recoveryDay.date.split('-').reverse().join('.')}` : firstShortfall ? 'Kertymä jää negatiiviseksi kirjatuissa tapahtumapäivissä' : `Jakson lopun kertymä ${euro(dailyFlow.at(-1)!.balance)}`}</span>
                      </div>
                      <div className="flow-visual" role="img" aria-label="Päiväkohtainen kumulatiivinen kassavirta. Alapuolella on tarkka päivätaulukko.">
                        {dailyFlow.map((day) => (
                          <button type="button" className={`flow-day${selectedReport?.type === 'day' && selectedReport.date === day.date ? ' selected-flow-day' : ''}`} key={day.date} aria-label={`${day.date.split('-').reverse().join('.')}: tulot ${euro(day.income)}, menot ${euro(day.expense)}, kertymä ${euro(day.balance)}. Avaa tietueet.`} title={`${day.date}: ${euro(day.balance)}`} onClick={() => setSelectedReport({ type: 'day', date: day.date })}>
                            <div className="flow-day-plot">
                              <span className={`flow-bar ${day.balance < 0 ? 'below-zero' : 'above-zero'}`} style={{ height: `${Math.max(2, Math.abs(day.balance) / maxFlowMagnitude * 46)}%`, ...(day.balance < 0 ? { top: '50%' } : { bottom: '50%' }) }} />
                              <i />
                            </div>
                            <small>{Number(day.date.slice(-2))}</small>
                          </button>
                        ))}
                      </div>
                      <p className="muted flow-caption">Päivän lopun kumulatiivinen tulojen ja menojen erotus · positiivinen ylös, alijäämä alas. Päivät, joina ei ole kirjauksia, eivät näy.</p>
                      <div className="table-wrap"><table><thead><tr><th>Päivä</th><th>Tulot</th><th>Menot</th><th>Kumulatiivinen kassavirta</th></tr></thead><tbody>
                        {dailyFlow.map((day) => <tr key={day.date}><th>{day.date.split('-').reverse().join('.')}</th><td>{euro(day.income)}</td><td>{euro(day.expense)}</td><td className={day.balance < 0 ? 'negative' : ''}>{euro(day.balance)}</td></tr>)}
                      </tbody></table></div>
                    </> : <Empty text="Valitussa kuussa ei ole toteutuneita tapahtumia." />}
                  </section>
                )}
                {selectedReport && (
                  <section ref={reportDetailRef} className="panel report-panel report-detail" aria-live="polite">
                    <div className="report-detail-head">
                      <div>
                        <p className="eyebrow">VALITTU RAPORTTIKOHTA</p>
                        <h2>{selectedReport.type === 'month'
                          ? `${selectedReport.month} · ${selectedReport.metric === 'income' ? 'Tulot' : 'Menot'}`
                          : selectedReport.type === 'category'
                            ? `${selectedReport.category} · ${month}`
                            : `${selectedReport.date.split('-').reverse().join('.')} · tapahtumat`}</h2>
                      </div>
                      <button aria-label="Sulje raportin tietokortti" onClick={() => setSelectedReport(null)}>Sulje</button>
                    </div>
                    <p><strong>{euro(selectedReportEntries.reduce((sum, item) => sum + item.amount, 0))}</strong> · {selectedReportEntries.length} tietuetta</p>
                    {selectedReportEntries.length ? (
                      <div className="report-detail-list">
                        {selectedReportEntries.map(({ entry: record, kind, amount }) => (
                          <div className="report-detail-row" key={`${kind}-${record.id}`}>
                            <span className={`report-kind-dot ${kind}`} aria-hidden="true" />
                            <span><strong>{record.name}</strong><small>{record.category} · {record.date.split('-').reverse().join('.')}</small></span>
                            <strong>{euro(amount)}</strong>
                          </div>
                        ))}
                      </div>
                    ) : <p className="muted">Valintaan ei löydy toteutuneita kirjauksia.</p>}
                  </section>
                )}
              </>
            )}
            {page === 'transfer' && (
              <Transfer
                s={s}
                onBackup={exportBackup}
                onRestore={importBackup}
                onImport={(kind, es) => {
                  setUndo(s);
                  if (commit({ ...s, [kind]: [...s[kind], ...es] }))
                    setNotice(`${es.length} tietuetta tuotu. Tuonnin voi kumota.`);
                }}
              />
            )}
            {page === 'settings' && (
              <>
                <section className="panel panel-plan">
                  <h2>Ulkoasu ja yksityisyys</h2>
                  <div className="form-grid">
                    <label>
                      Teema
                      <select
                        aria-label="Teema"
                        value={s.settings.theme}
                        onChange={(e) => settings({ theme: e.target.value })}
                      >
                        <option value="neutral">Selkeä / neutraali</option>
                        <option value="blue">Rauhallinen sininen</option>
                        <option value="green">Luonnollinen vihreä</option>
                        <option value="contrast">Korkea kontrasti</option>
                        <option value="custom">Oma korostusväri</option>
                      </select>
                    </label>
                    <label>
                      Väritila
                      <select
                        aria-label="Väritila"
                        value={s.settings.mode}
                        onChange={(e) => settings({ mode: e.target.value })}
                      >
                        <option value="system">Järjestelmä</option>
                        <option value="light">Vaalea</option>
                        <option value="dark">Tumma</option>
                      </select>
                    </label>
                    {s.settings.theme === 'custom' && (
                      <label>
                        Korostusväri
                        <input
                          type="color"
                          value={s.settings.accent}
                          onChange={(e) => settings({ accent: e.target.value })}
                        />
                        <small>
                          Oman värin kontrastia ei ole automaattisesti tarkistettu. Käytä korkean
                          kontrastin teemaa tarvittaessa.
                        </small>
                      </label>
                    )}
                  </div>
                  <p>Valuutta EUR · kieli Suomi. Summat tallennetaan kokonaislukusentteinä.</p>
                </section>
                <section className="panel panel-notice">
                  <h2>Esimerkkitalous testailuun</h2>
                  <p>
                    Lataa fiktiiviset tulot, menot, budjetit, omaisuus, velka, sijoitus ja tavoite.
                    Esimerkkitalous korvaa tämän selaimen nykyisen talouden. Vie omista tiedoista
                    varmuuskopio ensin, jos haluat palauttaa ne myöhemmin.
                  </p>
                  <div className="actions">
                    <button onClick={exportBackup}>Vie nykyisen talouden varmuuskopio</button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            'Korvataanko nykyinen talous fiktiivisellä esimerkkitaloudella? Nykyiset tiedot voi palauttaa vain aiemmin viedystä JSON-varmuuskopiosta.',
                          ) && commit(demo())
                        ) {
                          navigate('dashboard');
                          setNotice('Esimerkkitalous ladattu. Voit testata toimintoja fiktiivisillä tiedoilla.');
                        }
                      }}
                    >
                      Lataa esimerkkitalous
                    </button>
                  </div>
                </section>
                <section className="panel">
                  <h2>Tallennus ja datan hallinta</h2>
                  <p>
                    {storageOk
                      ? 'Paikallinen tallennus on käytettävissä.'
                      : 'Tallennus ei ole käytettävissä.'}{' '}
                    Selaimen asetukset, yksityinen selaus, tiedoston siirtäminen tai selaindatan
                    poisto voivat hävittää tallennuksen. JSON-varmuuskopio on siirrettävä kopio
                    tiedoistasi.
                  </p>
                  <div className="actions">
                    <button onClick={exportBackup}>Vie varmuuskopio</button>
                    <button
                      onClick={() => {
                        try {
                          let t = localStorage.getItem(storage.key);
                          if (t) download(t, 'talous-alkuperainen-tallennus.json');
                          else setNotice('Alkuperäistä tallennusta ei löytynyt.');
                        } catch (e) {
                          setNotice('Selaintallennusta ei voi lukea: ' + String(e));
                        }
                      }}
                    >
                      Vie alkuperäinen selaintallennus
                    </button>
                  </div>
                  <div className="danger-zone">
                    <h3>Kaikkien tietojen poisto</h3>
                    <p>Poisto tyhjentää tämän selaimen talouden. Vie JSON-varmuuskopio ennen poistamista, jos haluat säilyttää tiedot.</p>
                    <button
                      className="danger"
                      onClick={() => {
                        setDeleteText('');
                        setDeleteOpen(true);
                      }}
                    >
                      Poista kaikki tietoni
                    </button>
                  </div>
                  {s.settings.demo && (
                    <p>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'Poistetaanko koko esimerkkitalous? Myös siihen tekemäsi muutokset poistuvat.',
                            )
                          ) {
                            let n = empty();
                            n.settings.onboarded = true;
                            commit(n);
                          }
                        }}
                      >
                        Poista esimerkkitalous
                      </button>
                    </p>
                  )}
                </section>
              </>
            )}
            {page === 'help' && (
              <section className="panel prose">
                <h2>Talous haltuun ilman käyttäjätiliä</h2>
                <p>
                  Tämä sovellus toimii yhdestä HTML-tiedostosta. Talousdataasi ei lähetetä
                  sovelluksesta verkkoon. Ei pankkiyhteyksiä, analytiikkaa, mainoksia tai
                  käyttäjätiliä.
                </p>
                <h3>Aloita näin</h3>
                <ol>
                  <li>Lisää nettotulot ja menot. Valitse toistuvuus ja tila.</li>
                  <li>Aseta kuukausikohtaiset kategoriabudjetit.</li>
                  <li>Kirjaa omaisuus, velat ja sijoitukset ilman päällekkäisiä kirjauksia.</li>
                  <li>Aseta tavoite ja kuukausisäästö.</li>
                  <li>Vie varmuuskopio aina tärkeiden muutosten jälkeen.</li>
                </ol>
                <h3>Mitä laskelmat tarkoittavat?</h3>
                <p>
                  Kassavirta = toteutuneet tulot − toteutuneet menot. Käyttövara vähentää lisäksi
                  suunnitellut menot. Säästöaste = (tulot − kulutusmenot) / tulot. Menon tyyppi
                  ratkaisee, kuuluuko kirjaus kulutukseen vai säästö- tai sijoitussiirtoihin.
                  Vanhojen kirjausten Säästäminen- ja Sijoittaminen-kategoriat tunnistetaan
                  automaattisesti. Kaikki kirjaukset sisältyvät kassavirtaan.
                  Nettovarallisuus
                  = omaisuuden omistusosuuden mukaiset arvot + sijoitusten määrä × hinta −
                  velkasaldot.
                </p>
                <p>
                  Toistuvuus lasketaan aloituspäivästä. Kuukauden 31. päivän tapahtuma siirtyy
                  lyhyessä kuukaudessa sen viimeiselle päivälle. Toistuva toteutunut tietue
                  oletetaan toteutuneeksi jokaisessa esiintymässä. Poikkeuspäivien hallinta ei vielä
                  ole käytettävissä.
                </p>
                <h3>Yksityisyys ja turvallisuus</h3>
                <p>
                  Tiedot ja JSON-varmuuskopiot eivät ole salattuja. Laitteen muut käyttäjät,
                  selainlaajennukset tai haittaohjelmat voivat päästä niihin. Käytä laitteen
                  suojausta ja säilytä varmuuskopiot turvallisesti. Summien piilottaminen on
                  näyttösuoja, ei salaus.
                </p>
                <h3>Arviot, eivät lupaukset</h3>
                <p>
                  Skenaariot perustuvat itse määrittämiisi oletuksiin. Ne eivät ole
                  sijoitussuosituksia tai varmoja ennusteita. Verot, valuuttakurssit ja markkinoiden
                  vaihtelu eivät sisälly laskelmiin.
                </p>
                <h3>Näppäimistö</h3>
                <p>
                  Tab siirtyy seuraavaan toimintoon. Enter aktivoi painikkeen. Escape sulkee
                  valintaikkunan. Ctrl/Cmd + K avaa pikatoiminnot.
                </p>
                <h3>Version rajaus</h3>
                <p>
                  Versio 0.1.0 on toimiva paikallinen ensimmäinen toimitus, ei koko laajan
                  V1-määrittelyn hyväksytty lopputulos. Edistyneet arvostushistoriat,
                  sijoitustapahtumat, monivaluutat, kaikki budjetointitavat ja täydellinen
                  saavutettavuusauditointi ovat jatkokehitystä.
                </p>
              </section>
            )}
          </main>
          <footer>Yksityinen, paikallinen ja ilmainen · 0.1.0 · Muista varmuuskopioida</footer>
        </div>
      </div>
      {!s.settings.onboarded && (
        <Modal title="Talous haltuun ilman käyttäjätiliä" onClose={() => {}} dismissible={false}>
          <p>
            Kaikki tiedot käsitellään paikallisesti. Talousdataasi ei lähetetä sovelluksesta
            mihinkään.
          </p>
          <p>Selaintallennus ei korvaa varmuuskopiota. Pidä JSON-kopio tallessa.</p>
          {loaded.error && (
            <>
              <p className="negative">{loaded.error}</p>
              <button
                onClick={() => {
                  try {
                    let t = localStorage.getItem(storage.key);
                    if (t) download(t, 'talous-alkuperainen-tallennus.json');
                  } catch (e) {
                    setNotice(String(e));
                  }
                }}
              >
                Pelasta alkuperäinen tallennus
              </button>
            </>
          )}
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                if (
                  !loaded.error ||
                  confirm(
                    'Alkuperäinen tallennus on vioittunut. Aloittaminen korvaa sen. Oletko tallentanut siitä kopion?',
                  )
                )
                  settings({ onboarded: true });
              }}
            >
              Aloita tyhjästä
            </button>
            <button
              onClick={() => {
                if (
                  !loaded.error ||
                  confirm('Esimerkkidata korvaa alkuperäisen tallennuksen. Jatketaanko?')
                )
                  commit(demo());
              }}
            >
              Kokeile esimerkkidatalla
            </button>
          </div>
          <label className="file-label">
            Palauta varmuuskopio
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                if (e.target.files?.[0]) importBackup(e.target.files[0]);
                e.target.value = '';
              }}
            />
          </label>
        </Modal>
      )}
      {edit && (
        <Modal title={'Muokkaa / lisää ' + singular[edit.kind]} onClose={() => setEdit(null)}>
          <EntryForm
            kind={edit.kind}
            item={edit.item}
            categories={cats(edit.kind)}
            onSave={(e) => saveEntry(edit.kind, e)}
            onCancel={() => setEdit(null)}
          />
        </Modal>
      )}
      {quick && (
        <Modal title="Pikatoiminnot ja yleishaku" onClose={() => setQuick(false)}>
          <label>
            Hae kaikesta datasta
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nimi, kategoria, tunniste"
            />
          </label>
          <div className="quick-list">
            {kinds.map((k) => (
              <button
                key={k}
                onClick={() => {
                  setQuick(false);
                  setEdit({ kind: k, item: entry({ category: cats(k)[0] }) });
                }}
              >
                + Lisää {singular[k]}
              </button>
            ))}
            <button onClick={() => navigate('budget')}>Siirry budjettiin</button>
            <button
              onClick={() => {
                exportBackup();
                setQuick(false);
              }}
            >
              Vie varmuuskopio
            </button>
            {search &&
              kinds.flatMap((k) =>
                s[k]
                  .filter((e) =>
                    (e.name + ' ' + e.category + ' ' + e.tags)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .slice(0, 20)
                  .map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setQuick(false);
                        navigate(k);
                        setEdit({ kind: k, item: e });
                      }}
                    >
                      {names[k]} · {e.name}
                    </button>
                  )),
              )}
          </div>
        </Modal>
      )}
      {pending && (
        <Modal title="Vahvista varmuuskopion palautus" onClose={() => setPending(null)}>
          <p>
            Palautus korvaa nykyiset tiedot. Vie nykyisestä tilanteesta varmuuskopio ennen
            jatkamista.
          </p>
          <ul>
            {kinds.map((k) => (
              <li key={k}>
                {names[k]}: {pending[k].length} tietuetta
              </li>
            ))}
            <li>Budjettikuukausia: {Object.keys(pending.budgets).length}</li>
            <li>Skenaarioita: {pending.scenarios.length}</li>
          </ul>
          <div className="actions">
            <button onClick={exportBackup}>Vie nykyinen varmuuskopio</button>
            <button
              className="primary"
              onClick={() => {
                if (confirm('Korvataanko nykyinen talous vahvistetulla varmuuskopiolla?')) {
                  let n = { ...pending, settings: { ...pending.settings, onboarded: true } };
                  if (commit(n)) {
                    setPending(null);
                    setNotice('Varmuuskopio palautettu ja tietomalli validoitu.');
                  }
                }
              }}
            >
              Korvaa ja palauta
            </button>
            <button onClick={() => setPending(null)}>Peruuta</button>
          </div>
        </Modal>
      )}
      {deleteOpen && (
        <Modal title="Poista kaikki tietoni" onClose={() => setDeleteOpen(false)}>
          <p>
            Poistaa tämän sovelluksen selaintallennuksen. Ladatut varmuuskopiot eivät poistu. Ota
            ensin varmuuskopio.
          </p>
          <button onClick={exportBackup}>Vie varmuuskopio</button>
          <label>
            Kirjoita POISTA
            <input
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              autoComplete="off"
            />
          </label>
          <button
            className="danger"
            disabled={deleteText !== 'POISTA'}
            onClick={() => {
              try {
                storage.clear();
                setS(empty());
                setUndo(null);
                setDeleteOpen(false);
                setNotice('Paikallinen data poistettu ja poisto tarkistettu.');
              } catch (e) {
                setNotice(String(e));
              }
            }}
          >
            Poista pysyvästi
          </button>
        </Modal>
      )}
      {categoryEdit && (
        <Modal title="Kategoriat" onClose={() => setCategoryEdit(false)}>
          <Categories s={s} kind={page as 'incomes' | 'expenses'} commit={commit} />
        </Modal>
      )}
    </>
  );
}
function CategoryIcon({ category, debt }: { category: string; debt: boolean }) {
  const key = category.toLocaleLowerCase('fi-FI');
  const icon = /asunt|koti|asunto/.test(key)
    ? homeIcon
    : /vene|boat/.test(key)
      ? boatIcon
      : /moottoripyör|moottorikelkka|mopo/.test(key)
        ? motorcycleIcon
      : /auto|ajoneuvo/.test(key)
      ? carIcon
      : /käte|tallet|pankki/.test(key)
        ? bankIcon
        : /metsä|maa|tontti/.test(key)
          ? landIcon
          : /rahasto|osake|sijoit|etf/.test(key)
            ? portfolioIcon
            : /opinto|kortti|luotto/.test(key)
              ? loanIcon
              : debt
                ? loanIcon
              : /arvoesine|yritys|muu/.test(key)
                ? valuablesIcon
                : bankIcon;
  return <img className={`category-icon${debt ? ' category-icon-debt' : ''}`} src={icon} alt="" aria-hidden="true" />;
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <span aria-hidden="true">◇</span>
      <p>{text}</p>
    </div>
  );
}
function Goal({
  e,
  euro,
  privateMode,
}: {
  e: Entry;
  euro: (n: number) => string;
  privateMode: boolean;
}) {
  let months = goalMonths(e),
    progress = e.target ? Math.min(100, (e.amount / e.target) * 100) : 100;
  return (
    <div className="goal">
      <div>
        <strong>{e.name}</strong>
        <span>
          {privateMode
            ? '••• %'
            : progress.toLocaleString('fi-FI', { maximumFractionDigits: 0 }) + ' %'}
        </span>
      </div>
      <progress value={progress} max={100} aria-label={e.name + ' eteneminen'} />
      <small>
        {euro(e.amount)} / {euro(e.target)} ·{' '}
        {months === null
          ? 'Aseta kuukausisäästö'
          : months === 0
            ? 'Tavoite saavutettu'
            : `Arviolta ${months} kk ilman tuottoa`}
      </small>
    </div>
  );
}
function EntryForm({
  kind,
  item,
  categories,
  onSave,
  onCancel,
}: {
  kind: Kind;
  item: Entry;
  categories: string[];
  onSave: (e: Entry) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, setValue } = useForm<Record<string, string>>();
  const [error, setError] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const recurring = kind === 'incomes' || kind === 'expenses';
  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    try {
      let f = new FormData(ev.target as HTMLFormElement),
        v = { ...item, updatedAt: new Date().toISOString() };
      for (let k of ['name', 'category', 'date', 'endDate', 'description', 'tags'] as const)
        if (f.has(k)) v[k] = String(f.get(k));
      for (let k of ['amount', 'purchasePrice', 'payment', 'target', 'monthly'] as const)
        if (f.has(k)) v[k] = money(String(f.get(k)));
      for (let k of ['quantity', 'ownership', 'rate'] as const)
        if (f.has(k)) v[k] = Number(String(f.get(k)).replace(',', '.'));
      if (recurring) {
        v.recurrence = String(f.get('recurrence')) as Entry['recurrence'];
        v.status = String(f.get('status')) as Entry['status'];
        v.active = f.has('active');
      }
      if (kind === 'expenses') v.essential = f.has('essential');
      if (kind === 'expenses')
        v.tags = setExpenseTypeTags(v.tags, String(f.get('expenseType')) as 'consumption' | 'saving' | 'investment');
      if (kind === 'assets') v.liquid = f.has('liquid');
      validateEntry(v);
      onSave(v);
    } catch (e) {
      setError(String(e));
    }
  }
  const field = (
    label: string,
    key: string,
    value: string | number,
    type = 'text',
    required = false,
  ) => (
    <label>
      {label}
      <input
        {...register(key)}
        defaultValue={value}
        type={type}
        required={required}
        maxLength={type === 'text' ? 200 : undefined}
        inputMode={
          ['amount', 'purchasePrice', 'payment', 'target', 'monthly'].includes(key)
            ? 'decimal'
            : undefined
        }
      />
    </label>
  );
  return (
    <form
      onSubmit={handleSubmit((_values, event) => submit(event as React.FormEvent<HTMLFormElement>))}
    >
      {error && (
        <div role="alert" className="alert warning">
          {error}
        </div>
      )}
      <div className="form-grid">
        {field('Nimi', 'name', item.name, 'text', true)}
        <label>
          Kategoria
          <div className="category-picker">
            <input
              {...register('category')}
              defaultValue={item.category}
              required
              maxLength={100}
              autoComplete="off"
              aria-expanded={categoryOpen}
              aria-controls={`category-options-${kind}`}
              aria-autocomplete="list"
              onFocus={() => setCategoryOpen(true)}
            />
            <button
              type="button"
              className="category-picker-toggle"
              aria-label={categoryOpen ? 'Sulje kategoriat' : 'Avaa kategoriat'}
              aria-expanded={categoryOpen}
              aria-controls={`category-options-${kind}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setCategoryOpen((open) => !open)}
            >
              <span aria-hidden="true">{categoryOpen ? '⌃' : '⌄'}</span>
            </button>
            {categoryOpen && (
              <div id={`category-options-${kind}`} className="category-options" role="listbox" aria-label="Kategoriat">
                {categories.length ? categories.map((category) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={category === item.category}
                    key={category}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      setValue('category', category, { shouldDirty: true, shouldValidate: true });
                      setCategoryOpen(false);
                    }}
                  >
                    {category}
                  </button>
                )) : <span className="category-options-empty">Ei ehdotuksia. Voit kirjoittaa oman kategorian.</span>}
              </div>
            )}
          </div>
        </label>
        {field(
          kind === 'investments'
            ? 'Nykyinen yksikköhinta (€)'
            : kind === 'goals'
              ? 'Nykyinen säästösumma (€)'
              : kind === 'liabilities'
                ? 'Jäljellä oleva pääoma (€)'
                : 'Summa / nykyarvo (€)',
          'amount',
          (item.amount / 100).toFixed(2),
          'text',
          true,
        )}
        {field(
          kind === 'assets' || kind === 'investments'
            ? 'Arvostuspäivä'
            : kind === 'goals'
              ? 'Tavoitepäivä (informatiivinen)'
              : 'Päivämäärä / aloituspäivä',
          'date',
          item.date,
          'date',
          true,
        )}
        {recurring && (
          <>
            <label>
              Toistuvuus
              <select aria-label="Toistuvuus" name="recurrence" defaultValue={item.recurrence}>
                {Object.entries(recNames).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tila
              <select aria-label="Tila" name="status" defaultValue={item.status}>
                <option value="actual">Toteutunut</option>
                <option value="planned">Suunniteltu</option>
                <option value="skipped">Ohitettu</option>
              </select>
            </label>
            {field('Lopetuspäivä (valinnainen)', 'endDate', item.endDate, 'date')}
            <label className="check">
              <input type="checkbox" name="active" defaultChecked={item.active} />
              Aktiivinen
            </label>
          </>
        )}
        {kind === 'expenses' && (
          <>
            <label>
              Menon tyyppi
              <select aria-label="Menon tyyppi" name="expenseType" defaultValue={expenseType(item)}>
                <option value="consumption">Kulutus</option>
                <option value="saving">Säästösiirto</option>
                <option value="investment">Sijoitussiirto</option>
              </select>
            </label>
            <label className="check">
              <input type="checkbox" name="essential" defaultChecked={item.essential} />
              Välttämätön meno
            </label>
          </>
        )}
        {kind === 'assets' && (
          <>
            {field('Omistusosuus (%)', 'ownership', item.ownership, 'number', true)}
            <label className="check">
              <input type="checkbox" name="liquid" defaultChecked={item.liquid} />
              Likvidi vara (hätävaralaskuri)
            </label>
          </>
        )}
        {kind === 'investments' && (
          <>
            {field('Määrä', 'quantity', item.quantity, 'text', true)}
            {field(
              'Hankintahinta / yksikkö (€)',
              'purchasePrice',
              (item.purchasePrice / 100).toFixed(2),
            )}
          </>
        )}
        {kind === 'liabilities' && (
          <>
            {field('Vuosikorko (%)', 'rate', item.rate, 'text', true)}
            {field('Kuukausierä (€)', 'payment', (item.payment / 100).toFixed(2))}
          </>
        )}
        {kind === 'goals' && (
          <>
            {field('Tavoitesumma (€)', 'target', (item.target / 100).toFixed(2), 'text', true)}
            {field('Kuukausisäästö (€)', 'monthly', (item.monthly / 100).toFixed(2))}
          </>
        )}
        {field('Tunnisteet (pilkulla eroteltuna)', 'tags', userTags(item.tags))}
      </div>
      <label>
        Kuvaus
        <textarea name="description" defaultValue={item.description} maxLength={2000} />
      </label>
      {recurring && (
        <p className="muted">
          Toteutunut toistuva tietue lasketaan jokaiselle esiintymälle. Merkitse tulevat maksut
          suunnitelluiksi tarvittaessa.
        </p>
      )}
      <div className="actions">
        <button type="submit" className="primary">
          Tallenna
        </button>
        <button type="button" onClick={onCancel}>
          Peruuta
        </button>
      </div>
    </form>
  );
}
function Categories({
  s,
  kind,
  commit,
}: {
  s: State;
  kind: 'incomes' | 'expenses';
  commit: (s: State) => boolean;
}) {
  const [name, setName] = useState(''),
    [error, setError] = useState('');
  function rename(id: string, value: string) {
    value = value.trim();
    let old = s.categories.find((c) => c.id === id)!;
    if (
      !value ||
      value.length > 100 ||
      s.categories.some((c) => c.kind === kind && c.id !== id && c.name === value)
    ) {
      setError('Anna yksilöllinen nimi (1–100 merkkiä).');
      return;
    }
    let budgets = { ...s.budgets };
    if (kind === 'expenses')
      for (let [m, b] of Object.entries(budgets)) {
        let n = { ...b };
        if (old.name in n) {
          n[value] = n[old.name];
          delete n[old.name];
        }
        budgets[m] = n;
      }
    commit({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, name: value } : c)),
      [kind]: s[kind].map((e) => (e.category === old.name ? { ...e, category: value } : e)),
      budgets,
    });
  }
  return (
    <>
      <p>
        Kategorian uudelleennimeäminen päivittää myös tietueet ja budjetit. Arkistointi piilottaa
        kategorian valintalistasta, ei poista historiaa.
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="category-list">
        {s.categories
          .filter((c) => c.kind === kind)
          .map((c) => (
            <div className="simple-row" key={c.id}>
              <input
                aria-label={'Kategorian ' + c.name + ' nimi'}
                defaultValue={c.name}
                key={c.name}
                onBlur={(e) => e.target.value !== c.name && rename(c.id, e.target.value)}
              />
              <button
                onClick={() =>
                  commit({
                    ...s,
                    categories: s.categories.map((x) =>
                      x.id === c.id ? { ...x, archived: !x.archived } : x,
                    ),
                  })
                }
              >
                {c.archived ? 'Palauta' : 'Arkistoi'}
              </button>
              <button
                onClick={() => {
                  if (
                    s[kind].some((e) => e.category === c.name) ||
                    Object.values(s.budgets).some((b) => c.name in b)
                  ) {
                    setError('Kategoria on käytössä. Arkistoi se poistamisen sijaan.');
                    return;
                  }
                  commit({ ...s, categories: s.categories.filter((x) => x.id !== c.id) });
                }}
              >
                Poista
              </button>
            </div>
          ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !name.trim() ||
            name.length > 100 ||
            s.categories.some((c) => c.kind === kind && c.name === name.trim())
          ) {
            setError('Anna yksilöllinen nimi.');
            return;
          }
          if (
            commit({
              ...s,
              categories: [
                ...s.categories,
                { id: uid(), name: name.trim(), kind, color: '#17604d', archived: false },
              ],
            })
          )
            setName('');
        }}
      >
        <label>
          Uusi kategoria
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </label>
        <button>Lisää kategoria</button>
      </form>
    </>
  );
}
function ScenarioView({
  scenarios,
  euro,
  pct,
  onSave,
  onDelete,
  liabilities,
}: {
  scenarios: Scenario[];
  euro: (n: number) => string;
  pct: (n: number | null) => string;
  onSave: (q: Scenario) => boolean;
  onDelete: (id: string) => boolean;
  liabilities: Entry[];
}) {
  const [q, setQ] = useState<Scenario>({
      id: uid(),
      name: 'Oma skenaario',
      initial: 100000,
      monthly: 20000,
      rate: 4,
      fee: 0.5,
      inflation: 2,
      years: 10,
    }),
    [error, setError] = useState(''),
    [fi, setFi] = useState({ annualExpenses: 3000000, annualOutsideIncome: 0, capital: 0, withdrawalRate: 4, monthlySaving: 20000, realAnnualReturn: 3, maxYears: 50 }),
    [fiError, setFiError] = useState('');
  let result = compound(q);
  const fiResult = fiTarget(fi.annualExpenses, fi.annualOutsideIncome, fi.capital, fi.withdrawalRate);
  const monthsToFi = fiMonths(fi.capital, fi.monthlySaving, fi.realAnnualReturn, fiResult.target, fi.maxYears);
  const updateFi = (key: keyof typeof fi, value: string) => {
    try {
      const parsed = ['withdrawalRate', 'realAnnualReturn', 'maxYears'].includes(key)
        ? Number(value.replace(',', '.')) : money(value);
      const next = { ...fi, [key]: parsed };
      const target = fiTarget(next.annualExpenses, next.annualOutsideIncome, next.capital, next.withdrawalRate).target;
      fiMonths(next.capital, next.monthlySaving, next.realAnnualReturn, target, next.maxYears);
      setFi(next);
      setFiError('');
    } catch (e) {
      setFiError(String(e));
    }
  };
  const update = (k: string, v: string) => {
    try {
      let n = ['initial', 'monthly'].includes(k) ? money(v) : Number(v.replace(',', '.'));
      let next = { ...q, [k]: n };
      validate({ ...empty(), scenarios: [next] });
      setQ(next);
      setError('');
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <>
      <section className="panel panel-plan">
        <h2>FI-pääomatavoite</h2>
        <p className="muted">
          Yhden vaiheen havainnollistus omilla oletuksillasi. Syötä vuosikulut ja muut vuosittaiset
          nettotulot nykyrahassa. Pääoma tarkoittaa nostettavissa olevaa sijoituspääomaa; jätä
          hätävara ja asunto pois, ellei niitä aiota käyttää kulutukseen.
        </p>
        <div className="form-grid">
          {([
            ['Vuosikulut (€)', 'annualExpenses'],
            ['Muut nettotulot vuodessa (€)', 'annualOutsideIncome'],
            ['Nostettavissa oleva pääoma (€)', 'capital'],
            ['Alkunostoprosentti (% / vuosi)', 'withdrawalRate'],
            ['Kuukausittainen lisäsijoitus (€)', 'monthlySaving'],
            ['Reaalituotto kulujen jälkeen (% / vuosi)', 'realAnnualReturn'],
            ['Tarkastelujakso (vuotta, 1–50)', 'maxYears'],
          ] as const).map(([label, key]) => (
            <label key={key}>
              {label}
              <input
                defaultValue={['withdrawalRate', 'realAnnualReturn', 'maxYears'].includes(key)
                  ? fi[key] : (fi[key] / 100).toFixed(2)}
                onBlur={(e) => updateFi(key, e.target.value)}
                inputMode="decimal"
              />
            </label>
          ))}
        </div>
        {fiError && <p role="alert" className="negative">{fiError}</p>}
        <div className="stats">
          <article className="stat"><span>Vuotuinen rahoitusvaje</span><strong>{euro(fiResult.gap)}</strong></article>
          <article className="stat"><span>FI-pääomatavoite</span><strong>{fiResult.target ? euro(fiResult.target) : 'Ei rahoitusvajetta'}</strong></article>
          <article className="stat"><span>Pääomaa puuttuu</span><strong>{euro(fiResult.shortfall)}</strong></article>
          <article className="stat"><span>Tavoitteen kattavuus</span><strong>{fiResult.coverage === null ? '—' : pct(fiResult.coverage)}</strong></article>
          <article className="stat"><span>Arvioitu aika FI-tavoitteeseen</span><strong>{monthsToFi === null ? 'Ei saavuta jaksolla' : monthsToFi === 0 ? 'Tavoite saavutettu' : `${Math.floor(monthsToFi / 12)} v ${monthsToFi % 12} kk`}</strong></article>
        </div>
        <h3>Vuosikulujen herkkyys</h3>
        <p className="muted">Samat muut nettotulot ja nostoprosentti kaikissa riveissä. Kulut muuttuvat ±10 %.</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Kulutusoletus</th><th>Vuosikulut</th><th>Rahoitusvaje</th><th>FI-pääomatavoite</th></tr>
            </thead>
            <tbody>
              {([['−10 %', 0.9], ['Oma oletus', 1], ['+10 %', 1.1]] as const).map(([label, factor]) => {
                const expenses = Math.round(fi.annualExpenses * factor);
                const gap = Math.max(0, expenses - fi.annualOutsideIncome);
                const target = Math.ceil(gap / (fi.withdrawalRate / 100));
                return (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{euro(expenses)}</td>
                    <td>{euro(gap)}</td>
                    <td>{target <= MAX ? euro(target) : 'Yli laskentarajan'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Tavoite = max(0, vuosikulut − muut nettotulot) / (alkunostoprosentti / 100).
          Nostoprosentti on käyttäjän oletus, ei turvallisuusraja tai ennuste. Verot,
          eläketulojen alkamisajat, tuottojärjestys ja kulujen muutokset eivät sisälly laskelmaan.
          Aika-arviossa sama reaalituotto toistuu kuukausittain ja lisäsijoitus tehdään kuun lopussa.
          Reaalituotto-oletuksen on sisällettävä sijoituskulut; tulos ei ole luvattu päivämäärä.
        </p>
      </section>
      <section className="panel panel-cash">
        <h2>Korkoa korolle ja kulujen vaikutus</h2>
        <p className="muted">
          Oletukset ovat muokattavia arvioita, eivät historiallisia tuottoja tai
          sijoitussuosituksia.
        </p>
        <div className="form-grid">
          <label>
            Nimi
            <input
              value={q.name}
              maxLength={100}
              onChange={(e) => setQ({ ...q, name: e.target.value })}
            />
          </label>
          {[
            ['Alkupääoma (€)', 'initial'],
            ['Kuukausisijoitus (€)', 'monthly'],
            ['Tuotto-oletus (% / vuosi)', 'rate'],
            ['Vuosikulut (%)', 'fee'],
            ['Inflaatio (% / vuosi)', 'inflation'],
            ['Aika (vuotta, 1–50)', 'years'],
          ].map(([label, k]) => (
            <label key={k}>
              {label}
              <input
                key={k + q.id}
                defaultValue={
                  ['initial', 'monthly'].includes(k)
                    ? (q[k as 'initial'] / 100).toFixed(2)
                    : q[k as 'rate']
                }
                onBlur={(e) => update(k, e.target.value)}
                inputMode="decimal"
              />
            </label>
          ))}
        </div>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
        <div className="stats">
          {[
            ['Sijoitettu pääoma', result.invested],
            ['Laskennallinen kokonaisarvo', result.value],
            ['Laskennallinen tuotto', result.gain],
            ['Kulujen vaikutus', result.feeImpact],
            ['Inflaatiokorjattu arvo', result.real],
          ].map(([n, v]) => (
            <article className="stat" key={String(n)}>
              <span>{n}</span>
              <strong>{euro(Number(v))}</strong>
            </article>
          ))}
        </div>
        <p className="muted">
          Kuukausituotto = (1 + vuosituotto)^(1/12) − 1. Kulukerroin = (1 − vuosikulu)^(1/12).
          Tuotto ja kulut lasketaan kuukauden alussa, lisäsijoitus lopussa; tulos pyöristetään
          sentteihin kuukausittain. Reaaliarvo = loppuarvo / (1 + inflaatio)^vuodet. Verot ja
          markkinavaihtelu eivät sisälly.
        </p>
        <button
          className="primary"
          disabled={!!error || !Number.isSafeInteger(result.value)}
          onClick={() => {
            if (onSave({ ...q, id: uid() })) setError('');
          }}
        >
          Tallenna vertailuun
        </button>
      </section>
      <section className="panel">
        <h2>Skenaarioiden vertailu</h2>
        <p>Voit tallentaa ja vertailla useita omia oletuksia.</p>
        {scenarios.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nimi</th>
                  <th>Oletukset</th>
                  <th>Pääoma</th>
                  <th>Nimellisarvo</th>
                  <th>Reaaliarvo</th>
                  <th>Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((v) => {
                  let r = compound(v);
                  return (
                    <tr key={v.id}>
                      <th>{v.name}</th>
                      <td>
                        {v.years} v · tuotto {v.rate} % · kulut {v.fee} % · inflaatio {v.inflation}{' '}
                        %
                        <small>
                          {euro(v.initial)} + {euro(v.monthly)} / kk
                        </small>
                      </td>
                      <td>{euro(r.invested)}</td>
                      <td>{euro(r.value)}</td>
                      <td>{euro(r.real)}</td>
                      <td>
                        <button onClick={() => setQ({ ...v, id: uid() })}>Lataa laskuriin</button>
                        <button onClick={() => onDelete(v.id)}>Poista</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Tallenna ensimmäinen skenaario vertailuun." />
        )}
      </section>
      <section className="panel">
        <h2>Velanmaksuskenaariot</h2>
        <p className="muted">
          Vakioitu vuosikorko, kuukausittainen korko ja erä. Ei muita kuluja eikä koron muutoksia.
          Ei luotonottosuositus.
        </p>
        {liabilities.map((e) => {
          let r = payoff(e.amount, e.payment, e.rate);
          return (
            <p key={e.id}>
              <strong>{e.name}</strong>:{' '}
              {r
                ? `${r.months} kuukautta, korkoja ${euro(r.interest)}`
                : 'Erä ei riitä tai maksuaika ylittää 100 vuotta.'}
            </p>
          );
        })}
        {!liabilities.length && <p>Lisää velka ja kuukausierä nähdäksesi arvion.</p>}
      </section>
    </>
  );
}
function Transfer({
  s,
  onBackup,
  onRestore,
  onImport,
}: {
  s: State;
  onBackup: () => void;
  onRestore: (f: File) => void;
  onImport: (k: Kind, e: Entry[]) => void;
}) {
  const [kind, setKind] = useState<Kind>('expenses'),
    [text, setText] = useState(''),
    [delimiter, setDelimiter] = useState(';'),
    [map, setMap] = useState<Record<string, number>>({}),
    [error, setError] = useState(''),
    [encoding, setEncoding] = useState('utf-8'),
    [bytes, setBytes] = useState<ArrayBuffer | null>(null),
    [skipErrors, setSkipErrors] = useState(false),
    [skipDuplicates, setSkipDuplicates] = useState(true);
  let rows: string[][] = [];
  try {
    rows = text ? parseCSV(text, delimiter) : [];
  } catch (e) {
    error || queueMicrotask(() => setError(String(e)));
  }
  const evaluated = rows.slice(1).map((r, i) => {
    try {
      let e = csvEntry(r, map),
        duplicate = s[kind].some(
          (x) =>
            x.name === e.name &&
            x.date === e.date &&
            x.amount === e.amount &&
            x.category === e.category,
        );
      return { e, duplicate, line: i + 2, error: '' };
    } catch (e) {
      return { e: null, duplicate: false, line: i + 2, error: String(e) };
    }
  });
  let seen = new Set<string>();
  for (let r of evaluated)
    if (r.e) {
      let key = JSON.stringify([r.e.name, r.e.date, r.e.amount, r.e.category]);
      if (seen.has(key)) r.duplicate = true;
      seen.add(key);
    }
  let errors = evaluated.filter((r) => r.error),
    dups = evaluated.filter((r) => r.duplicate),
    accepted = evaluated.filter((r) => r.e && (!skipDuplicates || !r.duplicate)).map((r) => r.e!);
  function decode(b: ArrayBuffer, enc: string) {
    try {
      let t = new TextDecoder(enc, { fatal: enc === 'utf-8' }).decode(b).replace(/^\ufeff/, '');
      setText(t);
      let sep = t.split(/\r?\n/)[0].includes(';') ? ';' : ',';
      setDelimiter(sep);
      let header = parseCSV(t, sep)[0] || [];
      setMap(
        Object.fromEntries(
          csvFields.map((k) => [k, header.findIndex((x) => x.trim().toLowerCase() === k)]),
        ),
      );
      setError('');
    } catch (e) {
      setError('Merkistöä ei voitu lukea. Kokeile Windows-1252:ta. ' + String(e));
    }
  }
  return (
    <>
      <section className="panel">
        <h2>JSON-varmuuskopio</h2>
        <p>
          Varmuuskopio sisältää koko talouden. Palautus validoidaan ja vahvistetaan ennen nykyisten
          tietojen korvaamista. Eheystarkistus tunnistaa tahattomia muutoksia, ei todista tiedoston
          aitoutta.
        </p>
        <button className="primary" onClick={onBackup}>
          Vie varmuuskopio
        </button>
        <label className="file-label">
          Palauta varmuuskopio
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) onRestore(e.target.files[0]);
              e.target.value = '';
            }}
          />
        </label>
      </section>
      <section className="panel">
        <h2>CSV-tuonti ja vienti</h2>
        <p className="muted">
          Tuonti lisää tietueita. Tuonnin voi kumota tämän istunnon aikana. Summat ovat CSV:ssä
          euroina, sisäisesti sentteinä.
        </p>
        <div className="form-grid">
          <label>
            Tietotyyppi
            <select
              aria-label="Tietotyyppi"
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {names[k]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Merkistö
            <select
              aria-label="Merkistö"
              value={encoding}
              onChange={(e) => {
                setEncoding(e.target.value);
                if (bytes) decode(bytes, e.target.value);
              }}
            >
              <option value="utf-8">UTF-8</option>
              <option value="windows-1252">Windows-1252</option>
            </select>
          </label>
          <label>
            Erotin
            <select
              aria-label="Erotin"
              value={delimiter}
              onChange={(e) => {
                setDelimiter(e.target.value);
                setError('');
              }}
            >
              <option value=";">Puolipiste</option>
              <option value=",">Pilkku</option>
            </select>
          </label>
        </div>
        <div className="actions">
          <button
            onClick={() =>
              download(
                exportCSV(s[kind]),
                'talous-' + kind + '-' + today() + '.csv',
                'text/csv;charset=utf-8',
              )
            }
          >
            Vie {names[kind].toLowerCase()} CSV:nä
          </button>
          <button
            onClick={() =>
              download(exportCSV([]), 'talous-csv-pohja.csv', 'text/csv;charset=utf-8')
            }
          >
            Lataa CSV-pohja
          </button>
        </div>
        <label className="file-label">
          Valitse CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              let f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 5000000) {
                setError('Enimmäiskoko 5 Mt.');
                return;
              }
              let b = await f.arrayBuffer();
              setBytes(b);
              decode(b, encoding);
              e.target.value = '';
            }}
          />
        </label>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
        {rows.length > 0 && (
          <>
            <h3>Yhdistä sarakkeet</h3>
            <p>
              Nimi ja summa ovat pakollisia. Päivämäärä voi olla dd.mm.yyyy tai yyyy-mm-dd. Puuttuva
              päivämäärä on tänään.
            </p>
            <div className="form-grid">
              {csvFields.map((k) => (
                <label key={k}>
                  {k}
                  {['name', 'amount'].includes(k) ? ' *' : ''}
                  <select
                    value={map[k] ?? -1}
                    onChange={(e) => setMap({ ...map, [k]: Number(e.target.value) })}
                  >
                    <option value={-1}>Ei saraketta</option>
                    {rows[0].map((h, i) => (
                      <option key={i} value={i}>
                        {h || 'Sarake ' + (i + 1)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <h3>Esikatselu (enintään 5 riviä)</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {rows[0].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1, 6).map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td key={j}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              {evaluated.length} riviä · {errors.length} virheellistä · {dups.length} mahdollista
              duplikaattia · {accepted.length} tuotavaa.
            </p>
            {errors.slice(0, 10).map((r) => (
              <p key={r.line} className="negative">
                Rivi {r.line}: {r.error}
              </p>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
              />
              Ohita virheelliset rivit (tai korjaa CSV ja valitse uudelleen)
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              Ohita mahdolliset duplikaatit
            </label>
            <button
              className="primary"
              disabled={
                !accepted.length ||
                !!error ||
                (!!errors.length && !skipErrors) ||
                !(map.name >= 0) ||
                !(map.amount >= 0)
              }
              onClick={() => {
                if (confirm(`Tuodaanko ${accepted.length} tietuetta?`)) {
                  onImport(kind, accepted);
                  setText('');
                  setBytes(null);
                }
              }}
            >
              Vahvista ja tuo {accepted.length} tietuetta
            </button>
          </>
        )}
      </section>
    </>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
