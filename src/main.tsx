import { useForm } from "react-hook-form";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  empty,
  entry,
  uid,
  today,
  kinds,
  type State,
  type Entry,
  type EntryStatus,
  type Kind,
  type Category,
  type Scenario,
} from "./domain/model";
import {
  categoryIconFor,
  categoryIconOptions,
  defaultCategoryDefinitions,
  optionalCategoryDefinitions,
  type CategoryIconId,
} from "./domain/categories";
import { categoryIconSources } from "./assets/category-icons";
import {
  metrics,
  budgetSummary,
  money,
  total,
  scheduledOccurrences,
  occurrencesWithStatus,
  occurrenceStatus,
  sum,
  compound,
  goalMonths,
  payoff,
  MAX,
  expenseType,
  setExpenseTypeTags,
  userTags,
  validDate,
  fiTarget,
  fiMonths,
  emergencyFund,
  linkedAssetOutlook,
} from "./domain/calculations";
import {
  actionTrackLabels,
  planActions,
  visibleActions,
  type ActionTrack,
  type PlannedAction,
} from "./domain/actions";
import { guidanceSources } from "./domain/guidance";
import { contrastForeground } from "./domain/color";
import {
  compassDemoProfiles,
  createCompassDemoCases,
  type CompassDemoId,
  type CompassDemoCase,
} from "./domain/compass-demos";
import { storage } from "./data/storage";
import {
  backup,
  restore,
  validate,
  validateEntry,
} from "./services/validation";
import {
  parseCSV,
  exportCSV,
  csvEntry,
  csvFields,
  download,
} from "./services/csv";
import "./styles.css";
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  ChartPie,
  ChartNoAxesCombined,
  CircleDollarSign,
  CircleHelp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  FileChartColumn,
  Goal as GoalIcon,
  House,
  Landmark,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Settings,
  Wallet,
  ChartSpline,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Zap,
  Plus,
  Minus,
  X,
  Compass,
  Blocks,
  CircleGauge,
  Scale,
  CloudRain,
  CloudSun,
  Sun,
} from "lucide-react";
const names: Record<string, string> = {
  dashboard: "Yhteenveto",
  compass: "Talouden kompassi",
  budget: "Budjetti",
  incomes: "Tulot",
  expenses: "Menot",
  assets: "Omaisuus",
  liabilities: "Velat",
  investments: "Sijoitukset",
  goals: "Tavoitteet",
  scenarios: "Skenaariot",
  reports: "Raportit",
  transfer: "Tuonti ja vienti",
  settings: "Asetukset",
  help: "Ohje ja tietosuoja",
};
const entryStatusName = (status: EntryStatus) =>
  status === "actual"
    ? "Toteutunut"
    : status === "planned"
      ? "Suunniteltu"
      : "Ohitettu";
const expenseTypeName = (type: "consumption" | "saving" | "investment") =>
  type === "consumption"
    ? "Kulutus"
    : type === "saving"
      ? "Säästösiirto"
      : "Sijoitussiirto";
const navGroups = [
  { label: "Aloitus", pages: ["dashboard", "compass"] },
  { label: "Arki", pages: ["incomes", "expenses", "budget"] },
  { label: "Varallisuus", pages: ["assets", "liabilities", "investments"] },
  { label: "Tulevaisuus", pages: ["goals", "scenarios", "reports"] },
  { label: "Hallinta", pages: ["transfer", "settings", "help"] },
];
const navIcons = {
  dashboard: LayoutDashboard,
  compass: Compass,
  budget: Wallet,
  incomes: CircleDollarSign,
  expenses: ReceiptText,
  assets: House,
  liabilities: Landmark,
  investments: ChartNoAxesCombined,
  goals: GoalIcon,
  scenarios: PiggyBank,
  reports: FileChartColumn,
  transfer: ArrowLeftRight,
  settings: Settings,
  help: CircleHelp,
};
const reportTabs = [
  { id: "overview", label: "Tulot ja menot", Icon: ChartNoAxesCombined },
  { id: "categories", label: "Kulurakenne", Icon: ChartPie },
  { id: "flow", label: "Rahavirran ajoitus", Icon: CalendarClock },
  { id: "budget", label: "Budjetti", Icon: Wallet },
  { id: "wealth", label: "Varallisuus", Icon: Blocks },
  { id: "debt", label: "Velat ja oma pääoma", Icon: Scale },
  { id: "fire", label: "Säästöaste ja FIRE", Icon: CircleGauge },
] as const;
const compassTrackOptions: { id: ActionTrack | "all"; label: string }[] = [
  { id: "all", label: "Kaikki askeleet" },
  { id: "cashflow", label: actionTrackLabels.cashflow },
  { id: "spending", label: actionTrackLabels.spending },
  { id: "resilience", label: actionTrackLabels.resilience },
  { id: "future", label: actionTrackLabels.future },
];
const helpPreferencesKey = "taloussuunnittelu.dismissed-help.v1";
const compassWeatherIcons = {
  "cloud-rain": CloudRain,
  "cloud-sun": CloudSun,
  sun: Sun,
  lightning: Zap,
} as const;
function readDismissedHelp() {
  try {
    const saved = JSON.parse(localStorage.getItem(helpPreferencesKey) || "[]");
    return new Set<string>(
      Array.isArray(saved)
        ? saved.filter((id): id is string => typeof id === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}
type ReportView = (typeof reportTabs)[number]["id"];
const reportFormats: Record<ReportView, { value: string; label: string }[]> = {
  overview: [
    { value: "bars", label: "Pylväät" },
    { value: "line", label: "Viiva" },
    { value: "area", label: "Alue" },
    { value: "table", label: "Taulukko" },
  ],
  categories: [
    { value: "bars", label: "Pylväät" },
    { value: "pie", label: "Piirakka" },
    { value: "table", label: "Taulukko" },
  ],
  flow: [
    { value: "timeline", label: "Aikajana" },
    { value: "table", label: "Taulukko" },
  ],
  budget: [
    { value: "bars", label: "Pylväät" },
    { value: "table", label: "Taulukko" },
  ],
  wealth: [
    { value: "breakdown", label: "Erittely" },
    { value: "table", label: "Taulukko" },
  ],
  debt: [
    { value: "outlook", label: "Laskelma" },
    { value: "table", label: "Taulukko" },
  ],
  fire: [
    { value: "bars", label: "Pylväät" },
    { value: "table", label: "Taulukko" },
  ],
};
type ReportSelection =
  | { type: "month"; month: string; metric: "income" | "expense" }
  | {
      type: "budget";
      month: string;
      planned: number;
      actual: number;
      manualCategories: string[];
    }
  | {
      type: "period";
      from: string;
      to: string;
      metric: "income" | "expense" | "cash";
    }
  | { type: "category"; category: string; from: string; to: string }
  | { type: "day"; date: string };
type ReportDetailEntry = {
  entry: Entry;
  kind: "income" | "expense";
  amount: number;
  occurrences?: number;
};
type CategoryChoice = { name: string; icon: CategoryIconId };
function pieSlicePath(startPercent: number, endPercent: number) {
  const point = (percent: number, radius: number) => {
    const angle = ((percent * 3.6 - 90) * Math.PI) / 180;
    return [50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius];
  };
  const end =
    endPercent - startPercent > 99.99 ? startPercent + 99.99 : endPercent;
  const [x1, y1] = point(startPercent, 48);
  const [x2, y2] = point(end, 48);
  const [x3, y3] = point(end, 27);
  const [x4, y4] = point(startPercent, 27);
  const large = end - startPercent > 50 ? 1 : 0;
  return `M ${x1} ${y1} A 48 48 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A 27 27 0 ${large} 0 ${x4} ${y4} Z`;
}
function expCatsForReport(s: State, months: string[]): [string, number][] {
  const totals = new Map<string, number>();
  const expenses = s.expenses.filter(
    (item) => expenseType(item) === "consumption",
  );
  for (const month of months)
    for (const item of expenses) {
      const count = occurrencesWithStatus(item, month, "actual").length;
      if (count)
        totals.set(
          item.category,
          (totals.get(item.category) || 0) + item.amount * count,
        );
    }
  return [...totals.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1]);
}
const singular: Record<Kind, string> = {
  incomes: "tulo",
  expenses: "meno",
  assets: "omaisuuserä",
  liabilities: "velka",
  investments: "sijoitus",
  goals: "tavoite",
};
const recNames = {
  once: "Kerran",
  weekly: "Viikoittain",
  biweekly: "Joka toinen viikko",
  monthly: "Kuukausittain",
  bimonthly: "Joka toinen kuukausi",
  quarterly: "Neljännesvuosittain",
  semiannual: "Puolivuosittain",
  yearly: "Vuosittain",
};
const otherCategories: Record<string, string[]> = {
  assets: [
    "Käteinen",
    "Talletukset",
    "Asunto",
    "Sijoitusasunto",
    "Vapaa-ajan asunto",
    "Auto",
    "Moottoripyörä",
    "Vene",
    "Metsä",
    "Maa",
    "Yritysomistus",
    "Arvoesineet",
    "Muu",
  ],
  liabilities: [
    "Asuntolaina",
    "Autolaina",
    "Opintolaina",
    "Kulutusluotto",
    "Luottokorttivelka",
    "Muu velka",
  ],
  investments: [
    "Osake",
    "ETF",
    "Rahasto",
    "Korkosijoitus",
    "Käteinen",
    "Kryptovara",
    "Muu",
  ],
  goals: [
    "Hätävara",
    "Loma",
    "Auto",
    "Asunnon käsiraha",
    "Velan maksaminen",
    "Eläkesäästäminen",
    "Opiskelu",
    "Muu",
  ],
};
function load() {
  try {
    return { data: storage.get(), error: "" };
  } catch (e) {
    return {
      data: empty(),
      error:
        "Tallennettua dataa ei voitu lukea. Sitä ei ylikirjoiteta automaattisesti. Vie alkuperäinen tallennus Asetuksista ja palauta kelvollinen varmuuskopio. " +
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
  const titleId = React.useId();
  useEffect(() => {
    let previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && dismissible) onClose();
      }}
    >
      <div className="dialog-head">
        <h2 id={titleId}>{title}</h2>
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
function DemoCashflowSparkline({
  timeline,
}: {
  timeline: CompassDemoCase["timeline"];
}) {
  const maxCash = Math.max(1, ...timeline.map((point) => Math.abs(point.cash)));
  const points = timeline
    .map((point, index) => {
      const x = 10 + (index * 200) / Math.max(1, timeline.length - 1);
      const y = 24 - (point.cash / maxCash) * 17;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg
      className="demo-cashflow-sparkline"
      viewBox="0 0 220 48"
      role="img"
      aria-label="Kuuden kuukauden kassavirran suunta"
      preserveAspectRatio="none"
    >
      <line x1="7" y1="24" x2="213" y2="24" />
      <polyline points={points} />
      {timeline.length > 0 && (
        <circle
          cx="210"
          cy={24 - (timeline[timeline.length - 1].cash / maxCash) * 17}
          r="3.5"
        />
      )}
    </svg>
  );
}
function DemoHouseholdGrid({
  scenarios,
  hideNumbers,
  onChoose,
  buttonText = "Käytä tätä esimerkkiä",
}: {
  scenarios: CompassDemoCase[];
  hideNumbers: boolean;
  onChoose: (id: CompassDemoId) => void;
  buttonText?: string;
}) {
  return (
    <div className="demo-household-grid">
      {scenarios.map(({ profile, timeline }) => {
        const WeatherIcon = compassWeatherIcons[profile.icon];
        const latest = timeline[timeline.length - 1];
        const cashLabel = hideNumbers
          ? "•••• €"
          : new Intl.NumberFormat("fi-FI", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(latest.cash / 100);
        return (
          <article
            className={`demo-household-card weather-${profile.weather}${latest.cash < 0 ? " has-deficit" : ""}`}
            key={profile.id}
          >
            <header className="demo-household-header">
              <span className="demo-household-emblem" aria-hidden="true">
                <WeatherIcon size={23} strokeWidth={1.8} />
              </span>
              <div>
                <span className="demo-household-kicker">
                  REITTI {profile.rank} / 4 · {profile.label}
                </span>
                <h3>{profile.title}</h3>
              </div>
            </header>
            <p>{profile.story}</p>
            <div className="demo-household-snapshot">
              <span>
                <small>Viimeisin kuukausi</small>
                <strong className={latest.cash < 0 ? "negative" : "positive"}>
                  {cashLabel}
                </strong>
              </span>
              <DemoCashflowSparkline timeline={timeline} />
            </div>
            <button
              type="button"
              className="primary demo-household-load"
              aria-label={`Lataa esimerkkitalous: ${profile.label}`}
              onClick={() => onChoose(profile.id)}
            >
              {buttonText}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          </article>
        );
      })}
    </div>
  );
}
function HelpBox({
  id,
  title,
  children,
  onDismiss,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  onDismiss: (id: string) => void;
}) {
  return (
    <aside className="help-box" aria-labelledby={`help-${id}-title`}>
      <CircleHelp size={20} aria-hidden="true" />
      <div className="help-box-copy">
        <strong id={`help-${id}-title`}>{title}</strong>
        <p>{children}</p>
      </div>
      <button
        type="button"
        className="help-box-dismiss"
        aria-label={`Piilota ohje: ${title}`}
        onClick={() => onDismiss(id)}
      >
        <X size={18} aria-hidden="true" />
      </button>
    </aside>
  );
}
function monthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}
function monthIndexKey(index: number) {
  return monthKey(Math.floor(index / 12), index % 12);
}
function formatMoneyCents(cents: number) {
  if (!Number.isSafeInteger(cents) || cents < 0) return "";
  const euros = Math.floor(cents / 100);
  const centsPart = String(cents % 100).padStart(2, "0");
  return `${new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 0 }).format(euros)},${centsPart}`;
}
function formatMoneyDigits(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 13);
  return digits ? formatMoneyCents(Number(digits)) : "";
}
function caretAfterDigits(value: string, count: number) {
  if (count <= 0) return 0;
  let digits = 0;
  for (let index = 0; index < value.length; index++) {
    if (/\d/.test(value[index])) digits++;
    if (digits >= count) return index + 1;
  }
  return value.length;
}
type MoneyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "defaultValue" | "onChange"
> & {
  defaultCents: number | null;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
};
function MoneyInput({ defaultCents, onChange, ...props }: MoneyInputProps) {
  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const input = event.currentTarget;
    const raw = input.value;
    const caret = input.selectionStart ?? raw.length;
    const digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
    const formatted = formatMoneyDigits(raw);
    input.value = formatted;
    onChange?.(event);
    requestAnimationFrame(() => {
      if (document.activeElement === input) {
        const nextCaret =
          caret >= raw.length
            ? formatted.length
            : caretAfterDigits(formatted, digitsBeforeCaret);
        input.setSelectionRange(nextCaret, nextCaret);
      }
    });
  };
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      title={
        props.title ||
        "Kirjoita numerot senttijärjestyksessä (1250 = 12,50 €) tai liitä koko summa."
      }
      className={`money-input${props.className ? ` ${props.className}` : ""}`}
      defaultValue={defaultCents === null ? "" : formatMoneyCents(defaultCents)}
      onChange={handleChange}
    />
  );
}
function percentText(value: number) {
  return new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 2 }).format(
    value,
  );
}
function PercentField({
  label,
  value,
  onChange,
  name,
  min = -99.9,
  max = 100,
  step = 0.1,
  hint = true,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
  hint?: boolean;
}) {
  const [draft, setDraft] = useState(percentText(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const drag = useRef<{ x: number; y: number; value: number } | null>(null);
  const clamp = (next: number) => {
    const bounded = Math.min(max, Math.max(min, next));
    return Number((Math.round(bounded / step) * step).toFixed(2));
  };
  useEffect(() => {
    if (document.activeElement !== inputRef.current)
      setDraft(percentText(value));
  }, [value]);
  const update = (next: number) => {
    const bounded = clamp(next);
    setDraft(percentText(bounded));
    onChange(bounded);
  };
  const handleTextChange = (text: string) => {
    setDraft(text);
    if (!/^-?\d*(?:[.,]\d*)?$/.test(text) || !text.trim() || /[.,]$/.test(text))
      return;
    const parsed = Number(text.replace(",", "."));
    if (Number.isFinite(parsed)) onChange(clamp(parsed));
  };
  const handleBlur = () => {
    const parsed = Number(draft.replace(",", "."));
    if (!draft.trim() || !Number.isFinite(parsed)) {
      setDraft(percentText(value));
      return;
    }
    const bounded = clamp(parsed);
    setDraft(percentText(bounded));
    onChange(bounded);
  };
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    let next: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowUp")
      next = value + step;
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown")
      next = value - step;
    else if (event.key === "PageUp") next = value + 1;
    else if (event.key === "PageDown") next = value - 1;
    else if (event.key === "Home") next = min;
    else if (event.key === "End") next = max;
    if (next !== null) {
      event.preventDefault();
      update(next);
    }
  };
  const position = max > min ? ((clamp(value) - min) / (max - min)) * 100 : 0;
  return (
    <div className="percent-control">
      <label htmlFor={name ? `${name}-percent-input` : undefined}>
        {label}
      </label>
      <div className="percent-input-wrap">
        <input
          ref={inputRef}
          id={name ? `${name}-percent-input` : undefined}
          type="text"
          inputMode="decimal"
          value={draft}
          aria-label={label}
          onChange={(event) => handleTextChange(event.target.value)}
          onBlur={handleBlur}
        />
        <span className="percent-suffix" aria-hidden="true">
          %
        </span>
      </div>
      {name && <input type="hidden" name={name} value={value} />}
      <div
        className="percent-slider"
        role="slider"
        tabIndex={0}
        aria-label={`${label}, säädin`}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamp(value)}
        aria-valuetext={`${percentText(value)} prosenttia`}
        onKeyDown={handleKeyDown}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          const bounds = event.currentTarget.getBoundingClientRect();
          const ratio = Math.min(
            1,
            Math.max(0, (event.clientX - bounds.left) / bounds.width),
          );
          const origin = min + ratio * (max - min);
          update(origin);
          drag.current = {
            x: event.clientX,
            y: event.clientY,
            value: clamp(origin),
          };
          event.currentTarget.focus();
          event.currentTarget.classList.add("dragging");
        }}
        onPointerMove={(event) => {
          if (!drag.current) return;
          const dx = event.clientX - drag.current.x;
          const dy = event.clientY - drag.current.y;
          const fine = dy < -Math.max(5, Math.abs(dx) * 0.18);
          update(drag.current.value + dx * (fine ? 0.01 : 0.25));
        }}
        onPointerUp={(event) => {
          drag.current = null;
          event.currentTarget.classList.remove("dragging");
        }}
        onPointerCancel={(event) => {
          drag.current = null;
          event.currentTarget.classList.remove("dragging");
        }}
      >
        <span className="percent-slider-track" />
        <span
          className="percent-slider-fill"
          style={{ width: `calc(${position}% - ${position * 0.18}px)` }}
        />
        <span
          className="percent-slider-thumb"
          style={{ left: `calc(${position}% + ${9 - position * 0.18}px)` }}
        />
      </div>
      {hint && (
        <small>
          Vedä vaakaan nopeasti, viistoon ylös tarkasti. Nuolinäppäimillä säädät
          0,1 %-yksikköä.
        </small>
      )}
    </div>
  );
}
function MonthPicker({
  value,
  label,
  ariaLabel,
  onChange,
  compact = false,
}: {
  value: string;
  label: string;
  ariaLabel?: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(
    Number(value.slice(0, 4)) || new Date().getFullYear(),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [selectedYear, selectedMonth] = value.split("-").map(Number);
  const textLabel = ariaLabel || label;
  const monthName = (year: number, index: number) =>
    new Intl.DateTimeFormat("fi-FI", { month: "long" }).format(
      new Date(year, index, 1),
    );
  const display = new Intl.DateTimeFormat("fi-FI", {
    month: "long",
    year: "numeric",
  }).format(new Date(selectedYear, selectedMonth - 1, 1));
  useEffect(() => {
    if (open) setViewYear(selectedYear);
  }, [open, selectedYear]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  useEffect(() => {
    if (open)
      rootRef.current
        ?.querySelector<HTMLButtonElement>(
          '.month-grid-button[aria-pressed="true"]',
        )
        ?.focus();
  }, [open]);
  const choose = (next: string) => {
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  return (
    <div
      className={`month-select${compact ? " month-select-compact" : ""}`}
      ref={rootRef}
    >
      {!compact && <span className="month-select-label">{label}</span>}
      <button
        ref={triggerRef}
        type="button"
        className={compact ? "month-choice" : "month-select-trigger"}
        aria-label={`${textLabel}: ${display}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`${textLabel}: ${display}`}
        onClick={() => setOpen((current) => !current)}
      >
        <CalendarDays size={compact ? 18 : 17} aria-hidden="true" />
        {compact ? (
          <span className="month-choice-copy">
            <small>VALITTU KUUKAUSI</small>
            <strong>{display}</strong>
          </span>
        ) : (
          <span>{display}</span>
        )}
        <ChevronDown
          className={compact ? "month-choice-chevron" : undefined}
          size={compact ? 15 : 16}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div
          className="month-popover"
          role="dialog"
          aria-label={`${textLabel} kalenterivalitsin`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div className="month-popover-heading">
            <button
              type="button"
              aria-label="Edellinen vuosi"
              disabled={viewYear <= 1900}
              onClick={() => setViewYear((year) => Math.max(1900, year - 1))}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <strong>{viewYear}</strong>
            <button
              type="button"
              aria-label="Seuraava vuosi"
              disabled={viewYear >= 2200}
              onClick={() => setViewYear((year) => Math.min(2200, year + 1))}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div
            className="month-picker-grid"
            role="group"
            aria-label={`Kuukaudet ${viewYear}`}
          >
            {Array.from({ length: 12 }, (_, index) => {
              const key = monthKey(viewYear, index);
              return (
                <button
                  type="button"
                  key={key}
                  className="month-grid-button"
                  aria-pressed={key === value}
                  onClick={() => choose(key)}
                >
                  {monthName(viewYear, index)}
                </button>
              );
            })}
          </div>
          <label className="month-native-fallback">
            Jos valitsin ei toimi, syötä kuukausi
            <input
              type="month"
              aria-label={`${textLabel}, syötä kuukausi`}
              min="1900-01"
              max="2200-12"
              value={value}
              onChange={(event) =>
                event.target.value && choose(event.target.value)
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
function ReportRangeControl({
  start,
  end,
  startIndex,
  endIndex,
  valid,
  length,
  months,
  firstMonthIndex,
  lastMonthIndex,
  onStart,
  onEnd,
  onShift,
  onRailEnd,
}: {
  start: string;
  end: string;
  startIndex: number | null;
  endIndex: number | null;
  valid: boolean;
  length: number;
  months: string[];
  firstMonthIndex: number;
  lastMonthIndex: number;
  onStart: (month: string) => void;
  onEnd: (month: string) => void;
  onShift: (offset: number) => void;
  onRailEnd: (index: number) => void;
}) {
  const railRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!end) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() =>
      railRef.current
        ?.querySelector<HTMLElement>('[aria-pressed="true"]')
        ?.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "nearest",
          inline: "center",
        }),
    );
  }, [end]);
  const monthNumber = (value: string) => {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
  };
  const monthLabel = (value: string) => {
    const [year, month] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("fi-FI", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, month - 1, 1));
  };
  return (
    <div className="report-range-control">
      <div className="report-range-heading">
        <div>
          <span className="eyebrow">RAPORTOINTIJAKSO</span>
          <strong>
            {valid
              ? `${monthLabel(start)} – ${monthLabel(end)}`
              : "Tarkista aikaväli"}
          </strong>
        </div>
        <small>
          {valid
            ? `${length} ${length === 1 ? "kuukausi" : "kuukautta"}`
            : "Valitse alku ja loppu"}
        </small>
      </div>
      <div
        className="report-range-navigator"
        role="group"
        aria-label="Valitse raportin alku ja loppu"
      >
        <button
          type="button"
          aria-label="Siirrä aikaväliä kuukausi taaksepäin"
          title="Siirrä aikaväliä kuukausi taaksepäin"
          disabled={
            !valid || startIndex === null || startIndex <= firstMonthIndex
          }
          onClick={() => onShift(-1)}
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
        <div className="report-range-fields">
          <MonthPicker
            value={start}
            label="Alku"
            ariaLabel="Raportin alkukuukausi"
            onChange={onStart}
          />
          <MonthPicker
            value={end}
            label="Loppu"
            ariaLabel="Raportin loppukuukausi"
            onChange={onEnd}
          />
        </div>
        <button
          type="button"
          aria-label="Siirrä aikaväliä kuukausi eteenpäin"
          title="Siirrä aikaväliä kuukausi eteenpäin"
          disabled={!valid || endIndex === null || endIndex >= lastMonthIndex}
          onClick={() => onShift(1)}
        >
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>
      <div
        className="report-month-rail"
        role="group"
        aria-label="Siirry raportin päättymiskuukauteen"
        ref={railRef}
      >
        {months.map((key) => {
          const [year, monthPart] = key.split("-").map(Number);
          const date = new Date(year, monthPart - 1, 1);
          const short = new Intl.DateTimeFormat("fi-FI", {
            month: "short",
          }).format(date);
          const label = monthLabel(key);
          const index = monthNumber(key);
          return (
            <button
              type="button"
              key={key}
              aria-label={`Päättymiskuukausi ${label}`}
              aria-pressed={key === end}
              title={label}
              onClick={() => index !== null && onRailEnd(index)}
            >
              <span>{short}</span>
              <small>{year}</small>
            </button>
          );
        })}
      </div>
      <p className="report-range-hint">
        Valitse alku ja loppu, siirrä aikaväliä nuolilla tai vieritä
        kuukausilistaa.
      </p>
      {!valid && (
        <p className="alert warning" role="alert">
          Aikavälin pitää olla enintään 120 kuukautta ja loppukuukausi ei voi
          olla ennen alkua.
        </p>
      )}
    </div>
  );
}
function dateTextToIso(text: string) {
  const value = text.trim();
  let iso = value;
  const finnish = /^(\d{1,2})[.\-/ ](\d{1,2})[.\-/ ](\d{4})$/.exec(value);
  if (finnish)
    iso = `${finnish[3]}-${String(finnish[2]).padStart(2, "0")}-${String(finnish[1]).padStart(2, "0")}`;
  return validDate(iso) ? iso : "";
}
function isoDateToFinnish(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : "";
}
function DatePickerField({
  label,
  name,
  value,
  required = false,
  minDate = "1900-01-01",
  maxDate = "2200-12-31",
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  onChange: (value: string) => void;
}) {
  const [selected, setSelected] = useState(value);
  const [draft, setDraft] = useState(isoDateToFinnish(value));
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => {
    const parsed = value ? new Date(`${value}T12:00:00`) : new Date();
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setSelected(value);
    setDraft(isoDateToFinnish(value));
    if (value) setView(new Date(`${value}T12:00:00`));
  }, [value]);
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);
  useEffect(() => {
    if (open)
      rootRef.current
        ?.querySelector<HTMLButtonElement>('.calendar-day[aria-pressed="true"]')
        ?.focus();
  }, [open]);
  const updateDraft = (text: string) => {
    setDraft(text);
    const iso = dateTextToIso(text);
    setSelected(iso);
    onChange(iso);
    if (iso) setView(new Date(`${iso}T12:00:00`));
  };
  const selectDate = (iso: string) => {
    setSelected(iso);
    setDraft(isoDateToFinnish(iso));
    onChange(iso);
    setOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const dayCount = new Date(year, month + 1, 0).getDate();
  const days: Array<number | null> = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
  ];
  const weekdayNames = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat("fi-FI", { weekday: "short" }).format(
      new Date(2024, 0, index + 1),
    ),
  );
  const monthLabel = new Intl.DateTimeFormat("fi-FI", {
    month: "long",
    year: "numeric",
  }).format(view);
  const error = draft.trim() !== "" && !selected;
  return (
    <div className="date-picker-field" ref={rootRef}>
      <label className="date-picker-label" htmlFor={`${name}-date-input`}>
        {label}
      </label>
      <div className="date-picker-control">
        <input
          id={`${name}-date-input`}
          name={name}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={draft}
          placeholder="pp.kk.vvvv"
          required={required}
          aria-label={label}
          aria-invalid={error}
          aria-describedby={`${name}-date-hint`}
          onChange={(event) => updateDraft(event.target.value)}
        />
        <button
          ref={triggerRef}
          type="button"
          className="date-picker-toggle"
          aria-label={`${label}: avaa kalenteri`}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarDays size={18} aria-hidden="true" />
        </button>
      </div>
      <small
        id={`${name}-date-hint`}
        className={error ? "negative" : undefined}
      >
        {error
          ? "Tarkista päivämäärän muoto (pp.kk.vvvv)."
          : "Päivämäärä muodossa pp.kk.vvvv."}
      </small>
      {open && (
        <div
          className="date-calendar-popover"
          role="dialog"
          aria-label={`${label} kalenteri`}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              triggerRef.current?.focus();
            }
          }}
        >
          <div className="date-calendar-heading">
            <button
              type="button"
              aria-label="Edellinen kuukausi"
              disabled={month === 0 && year <= 1900}
              onClick={() => setView(new Date(year, month - 1, 1))}
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <strong>{monthLabel}</strong>
            <button
              type="button"
              aria-label="Seuraava kuukausi"
              disabled={month === 11 && year >= 2200}
              onClick={() => setView(new Date(year, month + 1, 1))}
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
          <div
            className="date-calendar-grid"
            role="group"
            aria-label={monthLabel}
          >
            {weekdayNames.map((weekday, index) => (
              <span className="date-weekday" key={`${weekday}-${index}`}>
                {weekday}
              </span>
            ))}
            {days.map((day, index) => {
              if (day === null)
                return (
                  <span
                    className="date-day-empty"
                    aria-hidden="true"
                    key={`empty-${index}`}
                  />
                );
              const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const labelText = new Intl.DateTimeFormat("fi-FI", {
                dateStyle: "full",
              }).format(new Date(year, month, day, 12));
              const disabled = iso < minDate || iso > maxDate;
              return (
                <button
                  type="button"
                  className="calendar-day"
                  key={iso}
                  aria-label={labelText}
                  aria-pressed={iso === selected}
                  disabled={disabled}
                  onClick={() => selectDate(iso)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className="date-calendar-footer">
            <span>Valitse päivä tai kirjoita se kenttään.</span>
            <button
              type="button"
              disabled={today() < minDate || today() > maxDate}
              onClick={() => selectDate(today())}
            >
              Tänään
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function App() {
  const [s, setS] = useState<State>(loaded.data),
    [page, setPage] = useState(location.hash.slice(1) || "dashboard"),
    [notice, setNotice] = useState(loaded.error),
    [storageOk, setStorageOk] = useState(storage.healthCheck().ok),
    [edit, setEdit] = useState<{ kind: Kind; item: Entry } | null>(null),
    [quick, setQuick] = useState(false),
    [menuOpen, setMenuOpen] = useState(false),
    [search, setSearch] = useState(""),
    [categoryFilter, setCategoryFilter] = useState(""),
    [statusFilter, setStatusFilter] = useState(""),
    [sort, setSort] = useState("date"),
    [limit, setLimit] = useState(100),
    [pending, setPending] = useState<State | null>(null),
    [deleteOpen, setDeleteOpen] = useState(false),
    [demoPickerOpen, setDemoPickerOpen] = useState(false),
    [deleteText, setDeleteText] = useState(""),
    [categoryEdit, setCategoryEdit] = useState(false),
    [undo, setUndo] = useState<State | null>(null),
    [expandedRows, setExpandedRows] = useState<Set<string>>(() => new Set()),
    [showAllBudgetCategories, setShowAllBudgetCategories] = useState(false),
    [reportStart, setReportStart] = useState(loaded.data.settings.month),
    [reportEnd, setReportEnd] = useState(loaded.data.settings.month),
    [reportZoom, setReportZoom] = useState(1),
    [reportView, setReportView] = useState<ReportView>("overview"),
    [reportFormat, setReportFormat] = useState("bars"),
    [assetChangeRate, setAssetChangeRate] = useState(0),
    [withdrawalRate, setWithdrawalRate] = useState(4),
    [showCompletedActions, setShowCompletedActions] = useState(false),
    [showAllCompassTasks, setShowAllCompassTasks] = useState(false),
    [compassTrack, setCompassTrack] = useState<ActionTrack | "all">("all"),
    [compassRefreshAt, setCompassRefreshAt] = useState<string | null>(null),
    [compassRefreshMessage, setCompassRefreshMessage] = useState(""),
    [selectedReport, setSelectedReport] = useState<ReportSelection | null>(
      null,
    ),
    [bufferMonths, setBufferMonths] = useState(3),
    [selectedCompassDemo, setSelectedCompassDemo] =
      useState<CompassDemoId>("everyday"),
    [dismissedHelp, setDismissedHelp] =
      useState<Set<string>>(readDismissedHelp),
    [systemPrefersDark, setSystemPrefersDark] = useState(
      () => matchMedia("(prefers-color-scheme: dark)").matches,
    );
  const menuButton = useRef<HTMLButtonElement>(null);
  const reportDetailRef = useRef<HTMLElement>(null);
  const month = s.settings.month,
    m = useMemo(() => metrics(s, month), [s, month]);
  const hasDashboardData = kinds.some((kind) => s[kind].length > 0);
  const [selectedYear, selectedMonthNumber] = month.split("-").map(Number);
  const canGoPreviousMonth = month > "1900-01";
  const canGoNextMonth = month < "2200-12";
  const changeMonth = (offset: number) => {
    const next = new Date(selectedYear, selectedMonthNumber - 1 + offset, 1);
    settings({
      month: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`,
    });
    setSelectedReport(null);
  };
  const buffer = useMemo(
    () => emergencyFund(s, month, bufferMonths),
    [s, month, bufferMonths],
  );
  const euro = (n: number) =>
    s.settings.private
      ? "•••••• €"
      : new Intl.NumberFormat("fi-FI", {
          style: "currency",
          currency: "EUR",
        }).format(n / 100);
  const pct = (n: number | null) =>
    n === null
      ? "Ei laskettavissa"
      : s.settings.private
        ? "••• %"
        : new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 }).format(
            n,
          ) + " %";
  function commit(next: State) {
    try {
      let valid = validate(next);
      try {
        storage.update(valid);
        setStorageOk(true);
      } catch (e) {
        setStorageOk(false);
        setNotice(
          "Tallennus epäonnistui. Tiedot ovat vain tämän välilehden muistissa: vie varmuuskopio nyt. " +
            String(e),
        );
      }
      if (
        next.incomes !== s.incomes ||
        next.expenses !== s.expenses ||
        next.assets !== s.assets ||
        next.liabilities !== s.liabilities ||
        next.investments !== s.investments ||
        next.goals !== s.goals ||
        next.budgets !== s.budgets ||
        next.budgetActuals !== s.budgetActuals ||
        next.categories !== s.categories ||
        next.settings.month !== s.settings.month
      ) {
        setCompassRefreshAt(null);
        setCompassRefreshMessage("");
      }
      setS(valid);
      return true;
    } catch (e) {
      setNotice(String(e));
      return false;
    }
  }
  function settings(v: Partial<State["settings"]>) {
    commit({ ...s, settings: { ...s.settings, ...v } });
  }
  function dismissHelp(id: string) {
    setDismissedHelp((current) => {
      const next = new Set(current).add(id);
      try {
        localStorage.setItem(helpPreferencesKey, JSON.stringify([...next]));
      } catch {
        // Dismissing a tip remains available for this session if storage is unavailable.
      }
      return next;
    });
  }
  function restoreHelp() {
    setDismissedHelp(new Set());
    try {
      localStorage.removeItem(helpPreferencesKey);
    } catch {
      // The visible tips are restored for this session.
    }
  }
  function navigate(p: string) {
    setPage(p);
    location.hash = p;
    setCategoryFilter("");
    setStatusFilter("");
    setLimit(100);
    setQuick(false);
    setMenuOpen(false);
    setTimeout(
      () => document.querySelector<HTMLElement>("main h1")?.focus(),
      0,
    );
  }
  function selectReportView(view: ReportView) {
    setReportView(view);
    setReportFormat(reportFormats[view][0].value);
    setSelectedReport(null);
  }
  function onReportTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    view: ReportView,
  ) {
    const current = reportTabs.findIndex((tab) => tab.id === view);
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (current + 1) % reportTabs.length;
    if (event.key === "ArrowLeft")
      next = (current + reportTabs.length - 1) % reportTabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = reportTabs.length - 1;
    if (next === null) return;
    event.preventDefault();
    const nextView = reportTabs[next].id;
    selectReportView(nextView);
    document.getElementById(`report-tab-${nextView}`)?.focus();
  }
  useEffect(() => {
    let f = () => {
      setPage(location.hash.slice(1) || "dashboard");
      setMenuOpen(false);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    let f = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        menuOpen &&
        !document.querySelector("dialog[open]")
      ) {
        setMenuOpen(false);
        menuButton.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setQuick((v) => !v);
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [menuOpen]);
  useEffect(() => {
    if (menuOpen)
      document.querySelector<HTMLElement>("#main-navigation button")?.focus();
  }, [menuOpen]);
  useEffect(() => {
    if (selectedReport) {
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      setTimeout(() => {
        const detail = reportDetailRef.current;
        detail?.scrollIntoView({
          behavior: reduced ? "auto" : "smooth",
          block: "center",
        });
        detail?.focus({ preventScroll: true });
      }, 0);
    }
  }, [selectedReport]);
  useEffect(() => {
    let f = (e: BeforeUnloadEvent) => {
      if (!storageOk) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", f);
    return () => window.removeEventListener("beforeunload", f);
  }, [storageOk]);
  useEffect(() => {
    const colorScheme = matchMedia("(prefers-color-scheme: dark)");
    const update = (event: MediaQueryListEvent) =>
      setSystemPrefersDark(event.matches);
    colorScheme.addEventListener("change", update);
    return () => colorScheme.removeEventListener("change", update);
  }, []);
  const dark =
    s.settings.mode === "dark" ||
    (s.settings.mode === "system" && systemPrefersDark);
  useEffect(() => {
    document.documentElement.dataset.theme = s.settings.theme;
    document.documentElement.dataset.mode = dark ? "dark" : "light";
    document.documentElement.style.setProperty("--custom", s.settings.accent);
    document.documentElement.style.setProperty(
      "--custom-on",
      contrastForeground(s.settings.accent),
    );
  }, [s.settings.theme, dark, s.settings.accent]);
  function saveEntry(kind: Kind, item: Entry) {
    let exists = s[kind].some((e) => e.id === item.id);
    if (
      commit({
        ...s,
        [kind]: exists
          ? s[kind].map((e) => (e.id === item.id ? item : e))
          : [...s[kind], item],
      })
    ) {
      setEdit(null);
      setNotice("Tiedot päivitetty.");
    }
  }
  function updateOccurrenceStatus(
    kind: "incomes" | "expenses",
    id: string,
    date: string,
    status: EntryStatus,
  ) {
    const current = s[kind].find((item) => item.id === id);
    if (!current) return;
    const occurrenceStatuses = { ...current.occurrenceStatuses };
    if (status === current.status) delete occurrenceStatuses[date];
    else occurrenceStatuses[date] = status;
    commit({
      ...s,
      [kind]: s[kind].map((item) =>
        item.id === id ? { ...item, occurrenceStatuses } : item,
      ),
    });
  }
  function remove(kind: Kind, id: string) {
    if (
      kind === "assets" &&
      s.liabilities.some((item) => item.linkedAssetId === id)
    ) {
      setNotice(
        "Omaisuuserää ei voi poistaa, koska siihen on linkitetty velkoja. Poista linkitys ensin velan muokkauksesta.",
      );
      return;
    }
    if (
      confirm(
        "Poistetaanko tietue? Voit kumota viimeisimmän poiston tämän istunnon aikana.",
      )
    ) {
      setUndo(s);
      commit({ ...s, [kind]: s[kind].filter((e) => e.id !== id) });
      setNotice("Tietue poistettu.");
    }
  }
  function exportBackup() {
    download(backup(s), "taloussuunnittelu-backup-" + today() + ".json");
    setNotice(
      "Varmuuskopio muodostettu. Tarkista, että tiedosto tallentui selaimen latauksiin.",
    );
  }
  async function importBackup(file: File) {
    try {
      if (file.size > 10000000) throw Error("Enimmäiskoko on 10 Mt.");
      setPending(restore(await file.text()));
    } catch (e) {
      setNotice("Palautus hylätty: " + String(e));
    }
  }
  function budgetChange(cat: string, text: string) {
    try {
      let n = money(text);
      if (n < 0) throw Error("Budjetti ei voi olla negatiivinen.");
      commit({
        ...s,
        budgets: { ...s.budgets, [month]: { ...s.budgets[month], [cat]: n } },
      });
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
      if (n < 0) throw Error("Toteuma ei voi olla negatiivinen.");
      commit({
        ...s,
        budgetActuals: {
          ...s.budgetActuals,
          [month]: { ...s.budgetActuals[month], [cat]: n },
        },
      });
    } catch (e) {
      setNotice(String(e));
    }
  }
  function setCompassAction(
    id: string,
    status: "done" | "snoozed" | "blocked" | null,
  ) {
    const next = { ...s.actionStates };
    if (!status) delete next[id];
    else if (status === "snoozed" || status === "blocked") {
      const until = new Date(`${today()}T12:00:00`);
      until.setDate(until.getDate() + (status === "blocked" ? 30 : 7));
      next[id] = {
        status,
        updatedAt: new Date().toISOString(),
        until: until.toISOString().slice(0, 10),
      };
    } else next[id] = { status, updatedAt: new Date().toISOString() };
    commit({ ...s, actionStates: next });
  }
  function refreshCompass() {
    const freshTasks = planActions(s, month);
    const activeIds = new Set(freshTasks.map((task) => task.id));
    const reopened = freshTasks.filter(
      (task) =>
        s.actionStates[task.id]?.status === "done" ||
        s.actionStates[task.id]?.status === "blocked",
    ).length;
    const nextStates = Object.fromEntries(
      Object.entries(s.actionStates).filter(
        ([id, saved]) =>
          activeIds.has(id) &&
          saved.status !== "done" &&
          saved.status !== "blocked",
      ),
    );
    const changed =
      Object.keys(nextStates).length !== Object.keys(s.actionStates).length;
    const saved = changed ? commit({ ...s, actionStates: nextStates }) : true;
    setShowAllCompassTasks(false);
    if (saved) {
      setCompassRefreshAt(new Date().toISOString());
      setCompassRefreshMessage(
        reopened
          ? `Tilanne tarkistettu · ${reopened} aiemmin kuitattua tai siirrettyä askelta arvioitiin uudelleen.`
          : "Tilanne tarkistettu tämänhetkisillä kirjauksilla.",
      );
    }
  }
  const cats = (kind: Kind) =>
    kind === "incomes" || kind === "expenses"
      ? s.categories
          .filter((c) => c.kind === kind && !c.archived)
          .map((c) => c.name)
      : otherCategories[kind];
  const categoryChoices = (kind: Kind) =>
    kind === "incomes" || kind === "expenses"
      ? s.categories
          .filter((category) => category.kind === kind && !category.archived)
          .map((category) => ({ name: category.name, icon: category.icon }))
      : otherCategories[kind].map((name) => ({
          name,
          icon: categoryIconFor(name, kind),
        }));
  const rows = kinds.includes(page as Kind)
    ? s[page as Kind]
        .filter(
          (e) =>
            (e.name + " " + e.category + " " + e.description + " " + e.tags)
              .toLocaleLowerCase("fi")
              .includes(search.toLocaleLowerCase("fi")) &&
            (!categoryFilter || e.category === categoryFilter) &&
            (!statusFilter || e.status === statusFilter),
        )
        .sort((a, b) =>
          sort === "amount"
            ? b.amount - a.amount
            : sort === "name"
              ? a.name.localeCompare(b.name, "fi")
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
  const monthNumber = (value: string) => {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);
    return match ? Number(match[1]) * 12 + Number(match[2]) - 1 : null;
  };
  const reportStartNumber = monthNumber(reportStart);
  const reportEndNumber = monthNumber(reportEnd);
  const customRangeLength =
    reportStartNumber !== null && reportEndNumber !== null
      ? reportEndNumber - reportStartNumber + 1
      : 0;
  const customRangeValid =
    reportStartNumber !== null &&
    reportEndNumber !== null &&
    customRangeLength >= 1 &&
    customRangeLength <= 120;
  const firstMonthIndex = 1900 * 12;
  const lastMonthIndex = 2200 * 12 + 11;
  const rangeWindow = customRangeValid ? Math.max(1, customRangeLength) : 1;
  const shiftCustomRange = (offset: number) => {
    if (
      reportStartNumber === null ||
      reportEndNumber === null ||
      !customRangeValid
    )
      return;
    const nextEnd = reportEndNumber + offset;
    if (nextEnd < firstMonthIndex + rangeWindow - 1 || nextEnd > lastMonthIndex)
      return;
    setReportStart(monthIndexKey(nextEnd - rangeWindow + 1));
    setReportEnd(monthIndexKey(nextEnd));
    setSelectedReport(null);
  };
  const setRangeEnd = (endIndex: number) => {
    const nextEnd = Math.min(
      lastMonthIndex,
      Math.max(firstMonthIndex + rangeWindow - 1, endIndex),
    );
    setReportStart(monthIndexKey(nextEnd - rangeWindow + 1));
    setReportEnd(monthIndexKey(nextEnd));
    setSelectedReport(null);
  };
  const rangeNavigationMonths =
    reportEndNumber === null
      ? []
      : Array.from({ length: 13 }, (_, index) => reportEndNumber + index - 6)
          .filter(
            (end) =>
              end >= firstMonthIndex + rangeWindow - 1 && end <= lastMonthIndex,
          )
          .map(monthIndexKey);
  const history = useMemo(
    () =>
      page === "reports" && customRangeValid
        ? Array.from({ length: customRangeLength }, (_, i) => {
            const index = reportStartNumber! + i;
            const year = Math.floor(index / 12);
            const monthIndex = index % 12;
            const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
            return { key, ...metrics(s, key) };
          })
        : [],
    [s, page, customRangeValid, customRangeLength, reportStartNumber],
  );
  const budgetReport = useMemo(
    () =>
      page === "reports" && reportView === "budget"
        ? history
            .map(({ key }) => {
              const plannedByCategory = s.budgets[key] || {};
              const summary = budgetSummary(s, key);
              const planned = summary.planned;
              const actual = summary.budgetedActual;
              return {
                key,
                planned,
                hasPlan: planned > 0,
                actual,
                unbudgetedActual: summary.unbudgetedActual,
                plannedByCategory,
              };
            })
            .filter(
              (row) =>
                row.hasPlan || row.actual > 0 || row.unbudgetedActual > 0,
            )
        : [],
    [s, page, reportView, history],
  );
  const budgetTotals = budgetReport.reduce(
    (totals, row) => ({
      planned: totals.planned + row.planned,
      actual: totals.actual + row.actual,
      unbudgetedActual: totals.unbudgetedActual + row.unbudgetedActual,
    }),
    { planned: 0, actual: 0, unbudgetedActual: 0 },
  );
  const budgetReportScale = Math.max(
    ...budgetReport.flatMap((row) => [
      row.planned,
      row.actual,
      row.unbudgetedActual,
    ]),
    1,
  );
  const currentAssets = s.assets.map((asset) => ({
    ...asset,
    ownedValue: Math.round((asset.amount * asset.ownership) / 100),
  }));
  const currentInvestments = s.investments.map((investment) => ({
    ...investment,
    marketValue: Math.round(investment.amount * investment.quantity),
  }));
  const currentDebts = s.liabilities;
  const debtBalance = sum(currentDebts.map((debt) => debt.amount));
  const assetBalance = sum(currentAssets.map((asset) => asset.ownedValue));
  const investmentBalance = sum(
    currentInvestments.map((investment) => investment.marketValue),
  );
  const netWorth = assetBalance + investmentBalance - debtBalance;
  const linkedOutlooks = currentAssets
    .map((asset) => ({
      asset,
      outlook: linkedAssetOutlook(asset, currentDebts, assetChangeRate),
    }))
    .filter((item) => item.outlook !== null);
  const observedCashflowMonths = history.filter(
    (item) => item.income !== 0 || item.expense !== 0,
  );
  const averageMonthlyConsumption = observedCashflowMonths.length
    ? sum(observedCashflowMonths.map((item) => item.consumption)) /
      observedCashflowMonths.length
    : 0;
  const periodTotals = history.reduce(
    (totals, current) => ({
      income: totals.income + current.income,
      expense: totals.expense + current.expense,
      consumption: totals.consumption + current.consumption,
      cash: totals.cash + current.cash,
    }),
    { income: 0, expense: 0, consumption: 0, cash: 0 },
  );
  const periodSavingRate = periodTotals.income
    ? (100 * (periodTotals.income - periodTotals.consumption)) /
      periodTotals.income
    : null;
  const annualizedSpending = Math.round(averageMonthlyConsumption * 12);
  const fireCalculation = (() => {
    if (
      observedCashflowMonths.length === 0 ||
      !Number.isSafeInteger(annualizedSpending) ||
      annualizedSpending > MAX ||
      !Number.isSafeInteger(investmentBalance) ||
      investmentBalance > MAX
    )
      return null;
    try {
      return fiTarget(annualizedSpending, 0, investmentBalance, withdrawalRate);
    } catch {
      return null;
    }
  })();
  const formatPeriodMonth = (key: string) => {
    const [year, monthPart] = key.split("-").map(Number);
    return new Intl.DateTimeFormat("fi-FI", {
      month: "long",
      year: "numeric",
    }).format(new Date(year, monthPart - 1, 1));
  };
  const periodLabel =
    history.length === 0
      ? "Valitse voimassa oleva aikaväli"
      : history.length === 1
        ? formatPeriodMonth(history[0].key)
        : `${formatPeriodMonth(history[0].key)} – ${formatPeriodMonth(history[history.length - 1].key)}`;
  const reportHasData = history.some((h) => h.income !== 0 || h.expense !== 0);
  const reportMax = Math.max(
    ...history.flatMap((h) => [h.income, h.expense]),
    1,
  );
  const reportCoordinates = (key: "income" | "expense") =>
    history.map((h, index) => ({
      x: history.length === 1 ? 50 : 5 + index * (90 / (history.length - 1)),
      y: 95 - (h[key] / reportMax) * 85,
    }));
  const reportLine = (key: "income" | "expense") => {
    const points = reportCoordinates(key);
    if (points.length < 2)
      return points.length ? `M ${points[0].x} ${points[0].y}` : "";
    return points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const before = points[index - 2] ?? previous;
      const after = points[index + 1] ?? point;
      const controlOne = {
        x: previous.x + (point.x - before.x) / 6,
        y: previous.y + (point.y - before.y) / 6,
      };
      const controlTwo = {
        x: point.x - (after.x - previous.x) / 6,
        y: point.y - (after.y - previous.y) / 6,
      };
      return `${path} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${point.x} ${point.y}`;
    }, "");
  };
  const reportArea = (key: "income" | "expense") => {
    const points = reportCoordinates(key);
    const line = reportLine(key);
    if (!points.length) return "";
    return `${line} L ${points[points.length - 1].x} 95 L ${points[0].x} 95 Z`;
  };
  const incomeReportCoordinates = reportCoordinates("income");
  const expenseReportCoordinates = reportCoordinates("expense");
  const categoryReport = useMemo(
    () =>
      page === "reports" && reportView === "categories"
        ? expCatsForReport(
            s,
            history.map((item) => item.key),
          )
        : [],
    [s, page, reportView, history],
  );
  const categoryTotal = categoryReport.reduce(
    (value, [, amount]) => value + amount,
    0,
  );
  const maxCategoryExpense = Math.max(
    ...categoryReport.map(([, value]) => value),
    1,
  );
  const pieColors = [
    "#087f5b",
    "#d9480f",
    "#7048e8",
    "#ae7c00",
    "#1971c2",
    "#c2255c",
    "#495057",
    "#5c940d",
  ];
  let pieCursor = 0;
  const pieSlices = categoryReport.map(([category, value], index) => {
    const start = pieCursor;
    pieCursor += categoryTotal ? (value * 100) / categoryTotal : 0;
    return {
      category,
      value,
      start,
      end: pieCursor,
      color: pieColors[index % pieColors.length],
    };
  });
  const flowByDate = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    if (page !== "reports" || reportView !== "flow") return map;
    const incomes = s.incomes;
    const expenses = s.expenses;
    for (const period of history) {
      for (const item of incomes)
        for (const date of occurrencesWithStatus(item, period.key, "actual")) {
          const value = map.get(date) || { income: 0, expense: 0 };
          value.income += item.amount;
          map.set(date, value);
        }
      for (const item of expenses)
        for (const date of occurrencesWithStatus(item, period.key, "actual")) {
          const value = map.get(date) || { income: 0, expense: 0 };
          value.expense += item.amount;
          map.set(date, value);
        }
    }
    return map;
  }, [s, history, page, reportView]);
  let runningFlow = 0;
  const dailyFlow = [...flowByDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => {
      runningFlow += value.income - value.expense;
      return { date, ...value, balance: runningFlow };
    });
  const firstShortfall = dailyFlow.find((day) => day.balance < 0);
  const recoveryDay = firstShortfall
    ? dailyFlow.find(
        (day) => day.date > firstShortfall.date && day.balance >= 0,
      )
    : undefined;
  const maxFlowMagnitude = Math.max(
    ...dailyFlow.map((day) => Math.abs(day.balance)),
    1,
  );
  const periodEntries = (
    items: Entry[],
    kind: "income" | "expense",
  ): ReportDetailEntry[] => {
    const grouped = new Map<string, ReportDetailEntry>();
    for (const period of history) {
      for (const record of items) {
        const count = occurrencesWithStatus(
          record,
          period.key,
          "actual",
        ).length;
        if (!count) continue;
        const key = `${kind}-${record.id}`;
        const previous = grouped.get(key);
        grouped.set(key, {
          entry: record,
          kind,
          amount: (previous?.amount || 0) + record.amount * count,
          occurrences: (previous?.occurrences || 0) + count,
        });
      }
    }
    return [...grouped.values()];
  };
  const selectedReportEntries: ReportDetailEntry[] =
    selectedReport?.type === "period"
      ? selectedReport.metric === "income"
        ? periodEntries(s.incomes, "income")
        : selectedReport.metric === "expense"
          ? periodEntries(s.expenses, "expense")
          : [
              ...periodEntries(s.incomes, "income"),
              ...periodEntries(s.expenses, "expense"),
            ]
      : selectedReport?.type === "month" || selectedReport?.type === "budget"
        ? (selectedReport.type === "budget"
            ? s.expenses.filter(
                (item) =>
                  expenseType(item) === "consumption" &&
                  (s.budgets[selectedReport.month]?.[item.category] || 0) > 0,
              )
            : selectedReport.metric === "income"
              ? s.incomes
              : s.expenses
          )
            .filter(
              (e) =>
                occurrencesWithStatus(e, selectedReport.month, "actual")
                  .length > 0,
            )
            .map((e) => {
              const count = occurrencesWithStatus(
                e,
                selectedReport.month,
                "actual",
              ).length;
              return {
                entry: e,
                kind:
                  selectedReport.type === "budget"
                    ? ("expense" as const)
                    : selectedReport.metric,
                amount: e.amount * count,
              };
            })
        : selectedReport?.type === "category"
          ? s.expenses
              .filter(
                (e) =>
                  e.category === selectedReport.category &&
                  expenseType(e) === "consumption",
              )
              .map((e) => {
                const count = history.reduce(
                  (sum, period) =>
                    sum + occurrencesWithStatus(e, period.key, "actual").length,
                  0,
                );
                return {
                  entry: e,
                  kind: "expense" as const,
                  amount: e.amount * count,
                  occurrences: count,
                };
              })
              .filter((item) => item.occurrences > 0)
          : selectedReport?.type === "day"
            ? [
                ...s.incomes
                  .filter((e) =>
                    history.some((period) =>
                      occurrencesWithStatus(e, period.key, "actual").includes(
                        selectedReport.date,
                      ),
                    ),
                  )
                  .map((e) => ({
                    entry: e,
                    kind: "income" as const,
                    amount: e.amount,
                  })),
                ...s.expenses
                  .filter((e) =>
                    history.some((period) =>
                      occurrencesWithStatus(e, period.key, "actual").includes(
                        selectedReport.date,
                      ),
                    ),
                  )
                  .map((e) => ({
                    entry: e,
                    kind: "expense" as const,
                    amount: e.amount,
                  })),
              ]
            : [];
  const selectedReportTotal =
    selectedReport?.type === "budget"
      ? selectedReport.actual
      : selectedReport?.type === "period" && selectedReport.metric === "cash"
        ? selectedReportEntries.reduce(
            (value, item) =>
              value + (item.kind === "income" ? item.amount : -item.amount),
            0,
          )
        : selectedReportEntries.reduce((value, item) => value + item.amount, 0);
  const selectedBudgetSummary =
    selectedReport?.type === "budget"
      ? budgetSummary(s, selectedReport.month)
      : null;
  const expCats = Array.from(
    new Set([
      ...s.categories
        .filter((c) => c.kind === "expenses" && !c.archived)
        .map((c) => c.name),
      ...s.expenses.map((e) => e.category),
      ...Object.keys(s.budgets[month] || {}),
    ]),
  );
  const monthBudgetSummary = budgetSummary(s, month);
  const monthBudgets = s.budgets[month] || {};
  const budgetCategoriesByName = new Map(
    monthBudgetSummary.categories.map((category) => [
      category.category,
      category,
    ]),
  );
  const actualForBudgetCategory = (category: string) =>
    budgetCategoriesByName.get(category)?.actual || 0;
  const budgetedCategories = monthBudgetSummary.categories
    .filter((category) => category.planned > 0)
    .map((category) => category.category);
  const budgetedActual = monthBudgetSummary.budgetedActual;
  const budgetDifference = monthBudgetSummary.difference;
  const unbudgetedActual = monthBudgetSummary.unbudgetedActual;
  const relevantBudgetCategories = expCats.filter(
    (category) =>
      (monthBudgets[category] || 0) > 0 ||
      actualForBudgetCategory(category) > 0 ||
      Object.hasOwn(s.budgetActuals[month] || {}, category),
  );
  const visibleBudgetCategories = showAllBudgetCategories
    ? expCats
    : relevantBudgetCategories.length
      ? relevantBudgetCategories
      : expCats.slice(0, 4);
  const compassTasks = planActions(s, month);
  const visibleCompassTasks = visibleActions(s, month);
  const filteredCompassTasks =
    compassTrack === "all"
      ? visibleCompassTasks
      : visibleCompassTasks.filter((task) => task.track === compassTrack);
  const displayedCompassTasks = showAllCompassTasks
    ? filteredCompassTasks
    : filteredCompassTasks.slice(0, 5);
  const compassDemos = useMemo(() => createCompassDemoCases(month), [month]);
  const activeCompassDemo =
    compassDemos.find(
      (scenario) => scenario.profile.id === selectedCompassDemo,
    ) || compassDemos[1];
  const activeCompassDemoMetrics = metrics(activeCompassDemo.state, month);
  const activeCompassDemoBuffer = emergencyFund(
    activeCompassDemo.state,
    month,
    3,
  );
  const activeCompassDemoActions = planActions(
    activeCompassDemo.state,
    month,
  ).slice(0, 3);
  function loadDemoHousehold(id: CompassDemoId) {
    const scenario = compassDemos.find((item) => item.profile.id === id);
    if (!scenario) return;
    if (
      (s.settings.onboarded || loaded.error) &&
      !confirm(
        `Ladataanko “${scenario.profile.title}” tähän selaimeen? Nykyinen talous korvataan. Voit palauttaa sen vain varmuuskopiosta.`,
      )
    )
      return;
    const household = {
      ...scenario.state,
      settings: {
        ...scenario.state.settings,
        theme: s.settings.theme,
        mode: s.settings.mode,
        private: s.settings.private,
        accent: s.settings.accent,
      },
    };
    if (commit(household)) {
      setDemoPickerOpen(false);
      setSelectedCompassDemo(id);
      navigate("dashboard");
      setNotice(
        `“${scenario.profile.title}” ladattu. Tämä on sama demotalous kuin Talouden kompassissa.`,
      );
    }
  }
  const parkedCompassTasks = compassTasks.filter((task) => {
    const saved = s.actionStates[task.id];
    return (
      saved &&
      (saved.status === "done" || (saved.until && saved.until > today()))
    );
  });
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
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
            Valikko · {names[page] || "Yhteenveto"}
          </button>
          <nav
            id="main-navigation"
            aria-label="Päänavigaatio"
            className={menuOpen ? "menu-open" : ""}
          >
            {navGroups.map((group) => (
              <div
                className="nav-group"
                key={group.label}
                role="group"
                aria-label={group.label}
              >
                <span className="nav-group-label">{group.label}</span>
                {group.pages.map((key) => {
                  const Icon = navIcons[key as keyof typeof navIcons];
                  return (
                    <button
                      key={key}
                      className={page === key ? "selected" : ""}
                      aria-current={page === key ? "page" : undefined}
                      onClick={() => navigate(key)}
                    >
                      <span className="nav-icon" aria-hidden="true">
                        <Icon size={18} strokeWidth={1.8} />
                      </span>
                      {names[key]}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="aside-bottom">
            <span className="dot" /> Täysin paikallinen
            <small>Ei tiliä. Ei seurantaa.</small>
            <button onClick={() => setQuick(true)}>
              Pikatoiminnot <kbd>Ctrl K</kbd>
            </button>
          </div>
        </aside>
        <div className="workspace">
          <header>
            <div className="header-label">RAUHALLISEMPI SUHDE RAHAAN</div>
            <div className="toolbar">
              <div
                className="month-picker"
                role="group"
                aria-label="Kuukauden valinta"
              >
                <button
                  type="button"
                  className="month-step"
                  aria-label="Edellinen kuukausi"
                  title="Edellinen kuukausi"
                  disabled={!canGoPreviousMonth}
                  onClick={() => changeMonth(-1)}
                >
                  <ChevronLeft size={19} aria-hidden="true" />
                </button>
                <MonthPicker
                  value={month}
                  label="Valitse kuukausi"
                  compact
                  onChange={(value) => {
                    settings({ month: value });
                    setSelectedReport(null);
                  }}
                />
                <button
                  type="button"
                  className="month-step"
                  aria-label="Seuraava kuukausi"
                  title="Seuraava kuukausi"
                  disabled={!canGoNextMonth}
                  onClick={() => changeMonth(1)}
                >
                  <ChevronRight size={19} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                className="toolbar-icon-button"
                aria-label="Pikatoiminnot"
                title="Pikatoiminnot · Ctrl K"
                onClick={() => setQuick(true)}
              >
                <Zap size={19} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="toolbar-icon-button"
                aria-pressed={s.settings.private}
                aria-label={
                  s.settings.private ? "Näytä summat" : "Piilota summat"
                }
                title={s.settings.private ? "Näytä summat" : "Piilota summat"}
                onClick={() => settings({ private: !s.settings.private })}
              >
                {s.settings.private ? (
                  <Eye size={19} aria-hidden="true" />
                ) : (
                  <EyeOff size={19} aria-hidden="true" />
                )}
              </button>
            </div>
          </header>
          <main id="main" tabIndex={-1}>
            <div className="page-head">
              <div>
                <p className="eyebrow">
                  {s.settings.demo
                    ? "ESIMERKKIDATA · FIKTIIVINEN TALOUS"
                    : "SINUN TALOUDESI"}
                </p>
                <h1 tabIndex={-1}>{names[page] || "Yhteenveto"}</h1>
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
                  "Selain ei takaa pysyvää tallennusta. Vie JSON-varmuuskopio ennen sulkemista."}
              </div>
            )}
            {notice && (
              <div className="alert" role="status">
                <span>{notice}</span>
                <button
                  aria-label="Sulje ilmoitus"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            )}
            {undo && (
              <div className="alert">
                Viimeisin poisto tai CSV-tuonti voidaan kumota.{" "}
                <button
                  onClick={() => {
                    commit(undo);
                    setUndo(null);
                    setNotice("Muutos kumottu.");
                  }}
                >
                  Kumoa
                </button>
              </div>
            )}
            {page === "compass" && (
              <section className="compass-page" aria-labelledby="compass-title">
                <div className="compass-hero">
                  <div className="compass-mark" aria-hidden="true">
                    <Compass size={38} strokeWidth={1.6} />
                  </div>
                  <div>
                    <span className="eyebrow">KURSSIN TARKISTUS · {month}</span>
                    <h2 id="compass-title">Seuraava hyvä askel</h2>
                    <p>
                      Kompassi etsii kirjatuista tiedoista pieniä, perusteltuja
                      tarkistuksia. Se ei tee päätöksiä puolestasi eikä oleta,
                      että puuttuva tieto tarkoittaa ongelmaa.
                    </p>
                  </div>
                  <div className="compass-hero-tools">
                    <div className="compass-count">
                      <strong>{filteredCompassTasks.length}</strong>
                      <small>
                        {filteredCompassTasks.length === 1
                          ? "askel näkyvissä"
                          : "askelta näkyvissä"}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="compass-refresh"
                      onClick={refreshCompass}
                      aria-label="Päivitä Talouden kompassin tilanne"
                    >
                      <RotateCcw size={16} aria-hidden="true" />
                      Päivitä tilanne
                    </button>
                    <small
                      className="compass-refresh-caption"
                      aria-live="polite"
                    >
                      {compassRefreshMessage ||
                        "Ehdotukset päivittyvät myös, kun muokkaat kirjauksia."}
                      {compassRefreshAt && (
                        <>
                          {" "}
                          ·{" "}
                          {new Intl.DateTimeFormat("fi-FI", {
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(compassRefreshAt))}
                        </>
                      )}
                    </small>
                  </div>
                </div>
                <div
                  className="compass-track-filters"
                  role="group"
                  aria-label="Rajaa kompassin askelia aiheittain"
                >
                  {compassTrackOptions.map((track) => {
                    const count =
                      track.id === "all"
                        ? visibleCompassTasks.length
                        : visibleCompassTasks.filter(
                            (task) => task.track === track.id,
                          ).length;
                    return (
                      <button
                        type="button"
                        key={track.id}
                        className="compass-track-filter"
                        aria-pressed={compassTrack === track.id}
                        onClick={() => {
                          setCompassTrack(track.id);
                          setShowAllCompassTasks(false);
                        }}
                      >
                        {track.label}
                        <span>{count}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="compass-route" aria-hidden="true">
                  <span>Havainnot</span>
                  <i />
                  <span>Prioriteetti</span>
                  <i />
                  <span>Sinun päätöksesi</span>
                </div>
                {filteredCompassTasks.length ? (
                  <div className="compass-task-list">
                    {displayedCompassTasks.map((task, index) => (
                      <article
                        key={task.id}
                        className={`compass-task priority-${task.priority}`}
                      >
                        <div className="compass-task-index">
                          {String(index + 1).padStart(2, "0")}
                        </div>
                        <div className="compass-task-copy">
                          <div className="compass-task-meta">
                            <span>
                              {task.priority === "high"
                                ? "Korkea prioriteetti"
                                : task.priority === "medium"
                                  ? "Kannattaa tarkistaa"
                                  : "Kun sinulle sopii"}
                            </span>
                            <span
                              className={`compass-task-track track-${task.track}`}
                            >
                              {actionTrackLabels[task.track]}
                            </span>
                            <span>{task.destinationLabel}</span>
                          </div>
                          <h3>{task.title}</h3>
                          <p>{task.reason}</p>
                          <small>
                            {s.settings.private && task.privateEvidence
                              ? "Summat piilotettu"
                              : task.evidence}
                          </small>
                          {task.impactNote && (
                            <p className="compass-impact-note">
                              <ChartSpline size={15} aria-hidden="true" />
                              {s.settings.private && task.privateEvidence
                                ? "Vaikutusarvion summat piilotettu"
                                : task.impactNote}
                            </p>
                          )}
                          {task.nextStep && (
                            <div className="compass-next-step">
                              <strong>Pienin kokeiltava askel</strong>
                              <p>{task.nextStep}</p>
                            </div>
                          )}
                          <CompassResearchDetails task={task} />
                          <div className="compass-task-actions">
                            <button
                              type="button"
                              className="primary"
                              onClick={() => {
                                navigate(task.destination);
                                if (task.destination === "reports")
                                  selectReportView(task.reportView || "flow");
                              }}
                            >
                              {task.destinationLabel}{" "}
                              <ArrowRight size={15} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setCompassAction(task.id, "done")}
                            >
                              Merkitse tehdyksi
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCompassAction(task.id, "snoozed")
                              }
                            >
                              Siirrä viikolla
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCompassAction(task.id, "blocked")
                              }
                              aria-label={`Ei onnistu nyt: ${task.title}`}
                            >
                              Ei onnistu nyt
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="compass-empty">
                    <CircleGauge size={28} aria-hidden="true" />
                    <h3>
                      {compassTrack === "all"
                        ? "Reitti näyttää selkeältä"
                        : `${actionTrackLabels[compassTrack]}: ei avointa askelta`}
                    </h3>
                    <p>
                      {compassTrack !== "all" && visibleCompassTasks.length
                        ? "Tässä aiheessa ei ole nyt avointa ehdotusta. Voit tarkistaa muut aiheet."
                        : "Tähän kuukauteen ei löytynyt automaattisia tarkistuksia. Kun lisäät budjetin, kirjauksia, tavoitteita tai omaisuustietoja, kompassi nostaa olennaisia asioita esiin."}
                    </p>
                    {compassTrack !== "all" && visibleCompassTasks.length ? (
                      <button
                        type="button"
                        className="primary"
                        onClick={() => setCompassTrack("all")}
                      >
                        Näytä kaikki aiheet
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="primary"
                        onClick={() => navigate("budget")}
                      >
                        Avaa budjetti
                      </button>
                    )}
                  </div>
                )}
                {filteredCompassTasks.length > 5 && (
                  <button
                    className="compass-toggle"
                    type="button"
                    aria-expanded={showAllCompassTasks}
                    onClick={() => setShowAllCompassTasks((value) => !value)}
                  >
                    {showAllCompassTasks
                      ? "Näytä vain 5 tärkeintä"
                      : `Näytä kaikki ${filteredCompassTasks.length} askelta`}
                  </button>
                )}
                <section
                  className="compass-scenario-lab"
                  aria-labelledby="compass-scenarios-title"
                >
                  <div className="compass-scenario-heading">
                    <span className="eyebrow">NELJÄ FIKTIIVISTÄ REITTIÄ</span>
                    <h2 id="compass-scenarios-title">
                      Kokeile, miten tilanne muuttaa seuraavaa askelta
                    </h2>
                    <p>
                      Valitse esimerkkitalous ja seuraa sen kassavirtaa sekä
                      kompassin huomioita. Voit myös ladata valitun reitin
                      samana demotaloutena muihin näkymiin.
                    </p>
                  </div>
                  <div
                    className="compass-scenario-picker"
                    role="group"
                    aria-label="Valitse talouden demotilanne"
                  >
                    {compassDemos.map(({ profile }) => {
                      const Icon = compassWeatherIcons[profile.icon];
                      return (
                        <button
                          type="button"
                          key={profile.id}
                          aria-pressed={selectedCompassDemo === profile.id}
                          className={`compass-scenario-choice weather-${profile.weather}${selectedCompassDemo === profile.id ? " selected" : ""}`}
                          onClick={() => setSelectedCompassDemo(profile.id)}
                        >
                          <span className="compass-scenario-rank">
                            {profile.rank}
                          </span>
                          <Icon size={22} aria-hidden="true" />
                          <span>
                            <small>{profile.label}</small>
                            <strong>{profile.title}</strong>
                          </span>
                          <ArrowRight size={17} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                  <article
                    className={`compass-story weather-${activeCompassDemo.profile.weather}`}
                  >
                    <header>
                      <div className="compass-story-icon" aria-hidden="true">
                        {React.createElement(
                          compassWeatherIcons[activeCompassDemo.profile.icon],
                          { size: 32, strokeWidth: 1.8 },
                        )}
                      </div>
                      <div>
                        <span className="eyebrow">
                          REITTI {activeCompassDemo.profile.rank} / 4 ·{" "}
                          {activeCompassDemo.profile.label.toLocaleUpperCase(
                            "fi-FI",
                          )}
                        </span>
                        <h3>{activeCompassDemo.profile.title}</h3>
                        <p>{activeCompassDemo.profile.story}</p>
                      </div>
                    </header>
                    <div className="compass-story-metrics">
                      <div>
                        <small>Tulot tässä kuussa</small>
                        <strong>{euro(activeCompassDemoMetrics.income)}</strong>
                      </div>
                      <div>
                        <small>Menot</small>
                        <strong>
                          {euro(activeCompassDemoMetrics.consumption)}
                        </strong>
                      </div>
                      <div>
                        <small>Kassavirta</small>
                        <strong
                          className={
                            activeCompassDemoMetrics.cash < 0
                              ? "negative"
                              : "positive"
                          }
                        >
                          {euro(activeCompassDemoMetrics.cash)}
                        </strong>
                      </div>
                      <div>
                        <small>Likvidi puskuri</small>
                        <strong>
                          {activeCompassDemoBuffer.buffer === null
                            ? "Ei laskettavissa"
                            : `${new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 }).format(activeCompassDemoBuffer.buffer)} kk`}
                        </strong>
                      </div>
                    </div>
                    <div className="compass-story-body">
                      <section
                        className="compass-story-chart"
                        aria-labelledby="compass-demo-chart-title"
                      >
                        <div className="compass-story-section-heading">
                          <div>
                            <span className="eyebrow">KUUSI KUUKAUTTA</span>
                            <h4 id="compass-demo-chart-title">
                              Tulovirta ja menot
                            </h4>
                          </div>
                          <div className="compass-chart-legend">
                            <span>
                              <i className="legend-income" />
                              Tulot
                            </span>
                            <span>
                              <i className="legend-expense" />
                              Menot
                            </span>
                          </div>
                        </div>
                        <div
                          className="compass-story-bars"
                          role="group"
                          aria-label="Kuukausittaiset tulo- ja menopylväät"
                        >
                          {activeCompassDemo.timeline.map((point) => {
                            const max = Math.max(
                              1,
                              ...activeCompassDemo.timeline.flatMap((row) => [
                                row.income,
                                row.expense,
                              ]),
                            );
                            return (
                              <div
                                className={`compass-story-period${point.cash < 0 ? " deficit" : ""}`}
                                key={point.month}
                              >
                                <div
                                  className="compass-story-bar-pair"
                                  aria-label={`${point.month}: tulot ${euro(point.income)}, menot ${euro(point.expense)}`}
                                >
                                  <span
                                    className="legend-income"
                                    style={{
                                      height: `${Math.max(point.income ? 7 : 2, (point.income / max) * 100)}%`,
                                    }}
                                  />
                                  <span
                                    className="legend-expense"
                                    style={{
                                      height: `${Math.max(7, (point.expense / max) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <small>{point.month.slice(5)}</small>
                                <strong>{euro(point.cash)}</strong>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                      <aside className="compass-story-question">
                        <span className="eyebrow">POHDI SEURAAVAKSI</span>
                        <p>{activeCompassDemo.profile.prompt}</p>
                        <small>
                          Esimerkkilaskelma käyttää samoja näkyviä sääntöjä kuin
                          oma kompassisi.
                        </small>
                      </aside>
                    </div>
                    <section
                      className="compass-demo-guidance"
                      aria-label="Tämän esimerkin kompassivinkit"
                    >
                      <div className="compass-story-section-heading">
                        <div>
                          <span className="eyebrow">TIEDOSTA TOIMINTAAN</span>
                          <h4>Kompassi nostaa esiin</h4>
                        </div>
                        <span>{activeCompassDemoActions.length} huomioita</span>
                      </div>
                      {activeCompassDemoActions.length ? (
                        <div className="compass-demo-tip-grid">
                          {activeCompassDemoActions.map((task, index) => (
                            <article key={task.id}>
                              <span
                                className={`priority-dot priority-${task.priority}`}
                                aria-hidden="true"
                              >
                                {index + 1}
                              </span>
                              <div>
                                <h5>{task.title}</h5>
                                <p>{task.reason}</p>
                                {task.privateEvidence && (
                                  <small>
                                    {s.settings.private
                                      ? "Summat piilotettu"
                                      : task.evidence}
                                  </small>
                                )}
                                {task.nextStep && (
                                  <p className="compass-demo-next">
                                    <strong>Kokeile:</strong> {task.nextStep}
                                  </p>
                                )}
                                <CompassResearchDetails task={task} compact />
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="compass-demo-calm">
                          Tähän esimerkkiin ei nouse kiireellistä tarkistusta.
                          Hyvä tilanne saa myös näyttää rauhalliselta.
                        </p>
                      )}
                    </section>
                    <div className="compass-demo-load">
                      <div>
                        <span className="eyebrow">
                          KOKEILE KOKO SOVELLUKSESSA
                        </span>
                        <strong>
                          Sama{" "}
                          {activeCompassDemo.profile.label.toLocaleLowerCase(
                            "fi-FI",
                          )}{" "}
                          esimerkki kuin tässä näkymässä
                        </strong>
                        <p>
                          Lataa tämän reitin tulot, menot, budjetti, omaisuus ja
                          velat sovelluksen muihin näkymiin.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="primary"
                        onClick={() =>
                          loadDemoHousehold(activeCompassDemo.profile.id)
                        }
                      >
                        Lataa demotalous
                        <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                </section>
                {showCompletedActions && parkedCompassTasks.length > 0 && (
                  <section className="compass-parked">
                    <h3>Siirretyt ja valmiit</h3>
                    {parkedCompassTasks.map((task) => (
                      <article key={task.id}>
                        <span>
                          <strong>{task.title}</strong>
                          <small>
                            {s.actionStates[task.id].status === "done"
                              ? "Merkitty tehdyksi"
                              : s.actionStates[task.id].status === "blocked"
                                ? `Ei mahdollista juuri nyt · palaa ${s.actionStates[task.id].until}`
                                : `Siirretty · palaa ${s.actionStates[task.id].until}`}
                          </small>
                        </span>
                        <button
                          type="button"
                          onClick={() => setCompassAction(task.id, null)}
                        >
                          Palauta kompassiin
                        </button>
                      </article>
                    ))}
                  </section>
                )}
                <button
                  className="compass-toggle"
                  type="button"
                  onClick={() => setShowCompletedActions((value) => !value)}
                >
                  {showCompletedActions
                    ? "Piilota siirretyt ja valmiit"
                    : `Näytä siirretyt ja valmiit (${parkedCompassTasks.length})`}
                </button>
                <p className="compass-note">
                  Prioriteetit muodostuvat paikallisesti tallennetuista
                  budjeteista, tuloista, menoista, varoista, veloista ja
                  tavoitteista. Säännöt ovat selittäviä ja muuttuvat, kun tiedot
                  muuttuvat.
                </p>
              </section>
            )}
            {page === "dashboard" &&
              (!hasDashboardData ? (
                <section className="empty-dashboard panel">
                  <span className="eyebrow">ALOITA OMASTA TILANTEESTASI</span>
                  <h2>Ota talous haltuun yksi asia kerrallaan</h2>
                  <p>
                    Lisää ensin tulot ja tavallisimmat menot. Budjetin ja
                    raporttien luvut tarkentuvat niiden perusteella.
                  </p>
                  <ol className="empty-dashboard-steps">
                    <li>
                      <span>1</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEdit({
                            kind: "incomes",
                            item: entry({ category: cats("incomes")[0] }),
                          })
                        }
                      >
                        Lisää tulo
                      </button>
                    </li>
                    <li>
                      <span>2</span>
                      <button
                        type="button"
                        onClick={() =>
                          setEdit({
                            kind: "expenses",
                            item: entry({ category: cats("expenses")[0] }),
                          })
                        }
                      >
                        Lisää meno
                      </button>
                    </li>
                    <li>
                      <span>3</span>
                      <button type="button" onClick={() => navigate("budget")}>
                        Avaa budjetti
                      </button>
                    </li>
                  </ol>
                  <div className="empty-dashboard-actions">
                    <button type="button" onClick={() => navigate("compass")}>
                      Tutki neljää esimerkkitaloutta
                    </button>
                    <button type="button" onClick={() => navigate("help")}>
                      Avaa ohje ja tietosuoja
                    </button>
                  </div>
                </section>
              ) : (
                <>
                  <div className="hero">
                    <div>
                      <span className="eyebrow">KUUKAUDEN KASSAVIRTA</span>
                      <div className="hero-value">{euro(m.cash)}</div>
                      <p>Toteutuneet tulot − toteutuneet menot</p>
                    </div>
                    <div>
                      <span>
                        Arvio kuukauden kirjatuista tuloista ja menoista
                      </span>
                      <strong>{euro(m.available)}</strong>
                      <small>
                        Tulot − toteutuneet ja suunnitellut menot. Ei tilisaldo.
                      </small>
                    </div>
                  </div>
                  <section
                    className="dashboard-actions grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6"
                    aria-label="Pikatoiminnot"
                  >
                    <button
                      aria-label="Lisää tulo"
                      className="dashboard-action group flex min-h-16 items-center gap-3"
                      onClick={() =>
                        setEdit({
                          kind: "incomes",
                          item: entry({ category: cats("incomes")[0] }),
                        })
                      }
                    >
                      <CircleDollarSign
                        size={21}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="dashboard-action-copy">
                        <strong>Lisää tulo</strong>
                        <small>Palkka tai muu tulo</small>
                      </span>
                      <ArrowRight
                        className="dashboard-action-arrow"
                        size={17}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      aria-label="Lisää meno"
                      className="dashboard-action group flex min-h-16 items-center gap-3"
                      onClick={() =>
                        setEdit({
                          kind: "expenses",
                          item: entry({ category: cats("expenses")[0] }),
                        })
                      }
                    >
                      <ReceiptText
                        size={21}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="dashboard-action-copy">
                        <strong>Lisää meno</strong>
                        <small>Kuukausittainen tai kertameno</small>
                      </span>
                      <ArrowRight
                        className="dashboard-action-arrow"
                        size={17}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      aria-label="Avaa budjetti"
                      className="dashboard-action group flex min-h-16 items-center gap-3"
                      onClick={() => navigate("budget")}
                    >
                      <Wallet size={21} strokeWidth={1.8} aria-hidden="true" />
                      <span className="dashboard-action-copy">
                        <strong>Avaa budjetti</strong>
                        <small>Suunnittele kuukauden kulut</small>
                      </span>
                      <ArrowRight
                        className="dashboard-action-arrow"
                        size={17}
                        aria-hidden="true"
                      />
                    </button>
                    <button
                      aria-label="Avaa raportit"
                      className="dashboard-action group flex min-h-16 items-center gap-3"
                      onClick={() => navigate("reports")}
                    >
                      <ChartNoAxesCombined
                        size={21}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <span className="dashboard-action-copy">
                        <strong>Avaa raportit</strong>
                        <small>Tutki rahavirtaa ja kulurakennetta</small>
                      </span>
                      <ArrowRight
                        className="dashboard-action-arrow"
                        size={17}
                        aria-hidden="true"
                      />
                    </button>
                  </section>
                  {!dismissedHelp.has("dashboard-start") && (
                    <HelpBox
                      id="dashboard-start"
                      title="Pääset alkuun pienin askelin"
                      onDismiss={dismissHelp}
                    >
                      Lisää ensin yksi tavallinen tulo ja muutama toistuva meno.
                      Budjetti ja raportit tarkentuvat sitä mukaa kun kirjaat
                      tietoja.
                    </HelpBox>
                  )}
                  <section
                    className="metric-group metric-group-cash"
                    aria-labelledby="cash-heading"
                  >
                    <h2 id="cash-heading">Kuukauden rahavirta</h2>
                    <div className="stats">
                      {stat("Tulot tässä kuussa", euro(m.income))}
                      {stat("Menot tässä kuussa", euro(m.expense))}
                      {stat(
                        "Kulutusmenot",
                        euro(m.consumption),
                        "Menon tyypiksi merkityt siirrot sivuutetaan",
                      )}
                      {stat(
                        "Tulot kulutuksen jälkeen",
                        euro(m.surplus),
                        "Ei ole sama kuin todennettu sijoitussumma",
                      )}
                      {stat(
                        "Säästöaste",
                        pct(m.savingRate),
                        "Tulot kulutuksen jälkeen / tulot",
                      )}
                    </div>
                  </section>
                  <section
                    className="metric-group metric-group-wealth"
                    aria-labelledby="wealth-heading"
                  >
                    <h2 id="wealth-heading">Varallisuus</h2>
                    <div className="stats">
                      {stat(
                        "Nettovarallisuus",
                        euro(m.net),
                        "Omaisuus + sijoitukset − velat",
                      )}
                      {stat(
                        "Omaisuus",
                        euro(m.assets),
                        "Käyttäjän syöttämät arvot",
                      )}
                      {stat("Velat", euro(m.debts))}
                      {stat(
                        "Sijoitussalkku",
                        euro(m.investments),
                        "Manuaaliset EUR-hinnat",
                      )}
                    </div>
                  </section>
                  <section
                    className="metric-group metric-group-plan"
                    aria-labelledby="plan-heading"
                  >
                    <h2 id="plan-heading">Suunnitelma ja siirrot</h2>
                    <div className="stats">
                      {stat("Säästösiirrot", euro(m.savingTransfers))}
                      {stat("Sijoitussiirrot", euro(m.investmentTransfers))}
                      {stat(
                        "Budjetista käytetty",
                        m.budget
                          ? pct((m.consumption / m.budget) * 100)
                          : "Ei budjettia",
                      )}
                    </div>
                  </section>
                  <div className="grid-two">
                    <section className="panel">
                      <h2>Kulutuksen kokonaiskuva</h2>
                      <p className="muted">
                        Toteutuneet kulutusmenot valitussa kuussa
                      </p>
                      {expCats
                        .filter(
                          (c) =>
                            total(
                              s.expenses.filter(
                                (e) =>
                                  e.category === c &&
                                  expenseType(e) === "consumption",
                              ),
                              month,
                              true,
                            ) > 0,
                        )
                        .map((c) => {
                          let n = total(
                            s.expenses.filter(
                              (e) =>
                                e.category === c &&
                                expenseType(e) === "consumption",
                            ),
                            month,
                            true,
                          );
                          return (
                            <div className="bar-row" key={c}>
                              <div>
                                <span>{c}</span>
                                <strong>{euro(n)}</strong>
                              </div>
                              <progress
                                max={m.consumption || 1}
                                value={n}
                                aria-label={c}
                              />
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
                          onChange={(e) =>
                            setBufferMonths(Number(e.target.value))
                          }
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
                            ? "—"
                            : s.settings.private
                              ? "•••"
                              : buffer.buffer.toLocaleString("fi-FI", {
                                  maximumFractionDigits: 1,
                                })}
                        </strong>
                        <span>kuukautta välttämättömiä menoja</span>
                      </div>
                      <p className="muted">
                        Likvidiksi merkitty omaisuus / kirjattujen kuukausien
                        välttämättömien kulutusmenojen keskiarvo. Havaintoja{" "}
                        {buffer.observedMonths}/{buffer.requestedMonths}{" "}
                        kuukaudelta.
                      </p>
                      {buffer.observedMonths < buffer.requestedMonths && (
                        <p className="muted">
                          Puuttuvia kuukausia ei lasketa nollamenoiksi. Tarkista
                          kirjausten kattavuus ennen päätöksiä.
                        </p>
                      )}
                      {buffer.averageEssential === 0 && (
                        <p className="muted">
                          Kirjattuja välttämättömiä menoja on 0 €. Hätävaran
                          kestoa ei voi laskea.
                        </p>
                      )}
                      <p className="muted">
                        Valittu kuukausi voi olla vielä kesken; havainto ei
                        takaa kaikkien menojen kirjaamista.
                      </p>
                      {s.goals.map((e) => (
                        <Goal
                          key={e.id}
                          e={e}
                          euro={euro}
                          privateMode={s.settings.private}
                        />
                      ))}
                      {!s.goals.length && (
                        <button
                          onClick={() =>
                            setEdit({
                              kind: "goals",
                              item: entry({ category: "Hätävara" }),
                            })
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
                      Valitussa kuussa yhteensä{" "}
                      <strong>{euro(m.planned)}</strong>. Suunniteltuja
                      tapahtumia ei lasketa toteutuneeseen kassavirtaan.
                    </p>
                    {s.expenses
                      .filter(
                        (e) =>
                          occurrencesWithStatus(e, month, "planned").length > 0,
                      )
                      .map((e) => {
                        const dates = occurrencesWithStatus(
                          e,
                          month,
                          "planned",
                        );
                        return (
                          <div className="simple-row" key={e.id}>
                            <span>
                              {e.name} ·{" "}
                              {dates
                                .map((d) => d.split("-").reverse().join("."))
                                .join(", ")}
                            </span>
                            <strong>{euro(e.amount * dates.length)}</strong>
                          </div>
                        );
                      })}
                  </section>
                </>
              ))}
            {page === "budget" && (
              <>
                {!dismissedHelp.has("budget-actuals") && (
                  <HelpBox
                    id="budget-actuals"
                    title="Suunnitelma ja toteuma ovat eri asioita"
                    onDismiss={dismissHelp}
                  >
                    Syötä budjetti ennakkoon. Toteumakentän voi jättää tyhjäksi,
                    jolloin se seuraa kirjattuja kulutustapahtumia; oma käsin
                    syötetty toteuma koskee vain valittua kuukautta.
                  </HelpBox>
                )}
                <div className="stats summary-strip summary-strip-plan">
                  {stat("Budjetti yhteensä", euro(m.budget))}
                  {stat(
                    "Budjetoitujen kategorioiden toteuma",
                    euro(budgetedActual),
                  )}
                  {stat("Budjettien erotus", euro(budgetDifference))}
                  {stat("Kulutus ilman budjettia", euro(unbudgetedActual))}
                </div>
                <section className="panel">
                  <div className="section-head">
                    <h2>Kategoriabudjetti</h2>
                    <button
                      onClick={() => {
                        let [y, mo] = month.split("-").map(Number),
                          d = new Date(y, mo - 2, 1),
                          prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                        if (!s.budgets[prev])
                          setNotice(
                            "Edellisellä kuukaudella ei ole budjettia.",
                          );
                        else if (
                          confirm(
                            "Korvataanko tämän kuukauden budjetti edellisen kuukauden kopiolla?",
                          )
                        )
                          commit({
                            ...s,
                            budgets: {
                              ...s.budgets,
                              [month]: { ...s.budgets[prev] },
                            },
                          });
                      }}
                    >
                      Kopioi edellinen kuukausi
                    </button>
                  </div>
                  <p className="muted">
                    Syötä suunniteltu budjetti ja halutessasi toteutunut kulutus
                    käsin. Jos toteumaa ei ole syötetty, näytetään tapahtumista
                    laskettu summa. Budjetin toteuma ei muuta kassavirtaa.
                    Yhteenveto vertaa toteumaa vain niihin kategorioihin, joille
                    on asetettu budjetti.
                  </p>
                  <div className="table-wrap mobile-card-table budget-table">
                    <table role="table">
                      <thead role="rowgroup">
                        <tr role="row">
                          <th role="columnheader">Kategoria</th>
                          <th role="columnheader">Suunniteltu €</th>
                          <th role="columnheader">Toteutunut kulutus €</th>
                          <th role="columnheader">Jäljellä</th>
                          <th role="columnheader">Toteuma</th>
                        </tr>
                      </thead>
                      <tbody role="rowgroup">
                        {visibleBudgetCategories.map((c) => {
                          let b = s.budgets[month]?.[c] || 0,
                            observed = total(
                              s.expenses.filter(
                                (e) =>
                                  e.category === c &&
                                  expenseType(e) === "consumption",
                              ),
                              month,
                              true,
                            ),
                            hasManual = Object.hasOwn(
                              s.budgetActuals[month] || {},
                              c,
                            ),
                            a = hasManual
                              ? s.budgetActuals[month][c]
                              : observed;
                          return (
                            <tr role="row" key={month + c}>
                              <th
                                role="rowheader"
                                scope="row"
                                data-label="Kategoria"
                              >
                                {c}
                              </th>
                              <td role="cell" data-label="Suunniteltu">
                                <MoneyInput
                                  className="budget-input"
                                  aria-label={c + " budjetti euroina"}
                                  key={b}
                                  defaultCents={b}
                                  onBlur={(e) =>
                                    budgetChange(c, e.target.value)
                                  }
                                />
                              </td>
                              <td role="cell" data-label="Toteutunut kulutus">
                                <MoneyInput
                                  className="budget-input"
                                  aria-label={c + " toteuma euroina"}
                                  key={`${month}-${c}-${hasManual ? "manual" : "entries"}`}
                                  defaultCents={hasManual ? a : null}
                                  placeholder={euro(observed)}
                                  onBlur={(e) =>
                                    actualChange(c, e.target.value)
                                  }
                                />
                                <small>
                                  {hasManual
                                    ? "Manuaalinen toteuma"
                                    : "Tapahtumista / syötä toteuma"}
                                </small>
                              </td>
                              <td
                                role="cell"
                                data-label="Jäljellä"
                                className={b > 0 && a > b ? "negative" : ""}
                              >
                                {b > 0 ? euro(b - a) : "—"}
                              </td>
                              <td role="cell" data-label="Toteuma">
                                {b ? pct((a / b) * 100) : "Ei budjettia"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {(showAllBudgetCategories ||
                    expCats.length > visibleBudgetCategories.length) && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowAllBudgetCategories((visible) => !visible)
                      }
                    >
                      {showAllBudgetCategories
                        ? "Piilota budjetoimattomat kategoriat"
                        : `Näytä kaikki kategoriat (${expCats.length})`}
                    </button>
                  )}
                  {budgetedCategories.length === 0 && (
                    <p className="muted">
                      Aloita suunnittelemalla muutama tuttu menokategoria.
                      Budjetoimaton kulutus ei ole budjetin ylitys.
                    </p>
                  )}
                  <p>
                    Budjetoitujen kategorioiden erotus on suunnitelma miinus
                    toteuma. Budjetoimaton kulutus näkyy erikseen, eikä sitä
                    lasketa budjettien ylitykseksi. Tässä versiossa budjettia ei
                    jaeta automaattisesti kaikkiin tuloihin.
                  </p>
                </section>
              </>
            )}
            {kinds.includes(page as Kind) && (
              <>
                {(page === "incomes" || page === "expenses") &&
                  !dismissedHelp.has("entry-basics") && (
                    <HelpBox
                      id="entry-basics"
                      title="Kirjaa summa kerran, tarkenna tarvittaessa"
                      onDismiss={dismissHelp}
                    >
                      Toistuva palkka tai lasku kirjataan yhdellä tietueella.
                      Valitse tila oikein: suunniteltu ei vaikuta toteutuneeseen
                      kassavirtaan.
                    </HelpBox>
                  )}
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
                      Sarjan oletustila
                      <select
                        aria-label="Sarjan oletustila"
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
                  {page === "investments" && (
                    <p className="muted">
                      Sijoitushinnat syötetään käsin euroina. Sijoituksia ei
                      tule kirjata uudelleen omaisuuteen. Salkun arvo{" "}
                      {euro(m.investments)}; hankinta-arvo{" "}
                      {euro(
                        sum(
                          s.investments.map((e) =>
                            Math.round(e.purchasePrice * e.quantity),
                          ),
                        ),
                      )}
                      .
                    </p>
                  )}
                  {page === "assets" && (
                    <p className="muted">
                      Nykyarvo on käyttäjän syöttämä arvio. Nettovarallisuudessa
                      huomioidaan omistusosuus.
                    </p>
                  )}
                  {page === "liabilities" && (
                    <p className="muted">
                      Saldo on manuaalinen. Kuukausierä ei luo automaattisesti
                      menotapahtumaa; kirjaa maksut erikseen.
                    </p>
                  )}
                  {rows.length ? (
                    <div className="table-wrap mobile-entry-table">
                      <table className="entry-table" role="table">
                        <thead role="rowgroup">
                          <tr role="row">
                            <th role="columnheader">Nimi / kategoria</th>
                            <th role="columnheader">
                              {page === "investments"
                                ? "Yksikköhinta"
                                : "Summa"}
                            </th>
                            <th role="columnheader">
                              {page === "goals" ? "Tavoite" : "Päivämäärä"}
                            </th>
                            <th role="columnheader">
                              {page === "incomes" || page === "expenses"
                                ? "Toistuvuus / tila"
                                : "Lisätiedot"}
                            </th>
                            <th role="columnheader">Toiminnot</th>
                          </tr>
                        </thead>
                        <tbody role="rowgroup">
                          {rows.slice(0, limit).map((e) => (
                            <React.Fragment key={e.id}>
                              <tr role="row">
                                <td role="cell" data-label="Nimi ja kategoria">
                                  <div className="row-title">
                                    <button
                                      className="row-expand"
                                      type="button"
                                      aria-label={`${expandedRows.has(e.id) ? "Piilota" : "Näytä"} ${e.name} lisätiedot`}
                                      aria-expanded={expandedRows.has(e.id)}
                                      aria-controls={`entry-details-${e.id}`}
                                      onClick={() =>
                                        setExpandedRows((current) => {
                                          const next = new Set(current);
                                          next.has(e.id)
                                            ? next.delete(e.id)
                                            : next.add(e.id);
                                          return next;
                                        })
                                      }
                                    >
                                      <span aria-hidden="true">
                                        {expandedRows.has(e.id) ? "⌄" : "›"}
                                      </span>
                                    </button>
                                    <strong>{e.name}</strong>
                                  </div>
                                  <small className="entry-category-label">
                                    <CategoryImage
                                      icon={
                                        s.categories.find(
                                          (category) =>
                                            category.kind === page &&
                                            category.name === e.category,
                                        )?.icon ||
                                        categoryIconFor(e.category, page)
                                      }
                                      size={19}
                                    />
                                    {e.category}
                                    {userTags(e.tags)
                                      ? " · " + userTags(e.tags)
                                      : ""}
                                  </small>
                                </td>
                                <td
                                  role="cell"
                                  data-label={
                                    page === "investments"
                                      ? "Yksikköhinta"
                                      : "Summa"
                                  }
                                >
                                  {euro(e.amount)}
                                  {page === "investments" && (
                                    <small>
                                      {e.quantity} kpl · arvo{" "}
                                      {euro(Math.round(e.amount * e.quantity))}
                                    </small>
                                  )}
                                </td>
                                <td
                                  role="cell"
                                  data-label={
                                    page === "goals" ? "Tavoite" : "Päivämäärä"
                                  }
                                >
                                  {page === "goals"
                                    ? euro(e.target)
                                    : e.date.split("-").reverse().join(".")}
                                </td>
                                <td
                                  role="cell"
                                  data-label={
                                    page === "incomes" || page === "expenses"
                                      ? "Toistuvuus / tila"
                                      : "Lisätiedot"
                                  }
                                >
                                  {page === "incomes" || page === "expenses" ? (
                                    <>
                                      {recNames[e.recurrence]}
                                      <small>
                                        Oletus: {entryStatusName(e.status)}
                                        {!e.active ? " · Keskeytetty" : ""}
                                      </small>
                                      {Object.keys(e.occurrenceStatuses)
                                        .length > 0 && (
                                        <small>
                                          {
                                            Object.keys(e.occurrenceStatuses)
                                              .length
                                          }{" "}
                                          tilapoikkeusta
                                        </small>
                                      )}
                                      {page === "expenses" && (
                                        <small>
                                          {expenseTypeName(expenseType(e))}
                                        </small>
                                      )}
                                    </>
                                  ) : page === "assets" ? (
                                    `${e.ownership} % · ${e.liquid ? "Likvidi" : "Ei likvidi"}`
                                  ) : page === "liabilities" ? (
                                    `${e.rate} % · erä ${euro(e.payment)}${e.linkedAssetId ? ` · ${s.assets.find((asset) => asset.id === e.linkedAssetId)?.name || "Linkitetty omaisuus"}` : " · Ei omaisuuslinkkiä"}`
                                  ) : page === "goals" ? (
                                    <Goal
                                      e={e}
                                      euro={euro}
                                      privateMode={s.settings.private}
                                    />
                                  ) : (
                                    e.category
                                  )}
                                </td>
                                <td role="cell" data-label="Toiminnot">
                                  <div className="row-actions">
                                    <button
                                      aria-label={"Muokkaa " + e.name}
                                      onClick={() =>
                                        setEdit({ kind: page as Kind, item: e })
                                      }
                                    >
                                      Muokkaa
                                    </button>
                                    <button
                                      aria-label={"Poista " + e.name}
                                      onClick={() => remove(page as Kind, e.id)}
                                    >
                                      Poista
                                    </button>
                                  </div>
                                </td>
                              </tr>
                              <tr
                                role="row"
                                className="expanded-row"
                                hidden={!expandedRows.has(e.id)}
                              >
                                <td
                                  role="cell"
                                  id={`entry-details-${e.id}`}
                                  colSpan={5}
                                >
                                  <div className="expanded-content">
                                    <span>
                                      Kuvaus: {e.description || "Ei kuvausta"}
                                    </span>
                                    <span>
                                      Päiväys:{" "}
                                      {e.date.split("-").reverse().join(".")}
                                    </span>
                                    {(page === "incomes" ||
                                      page === "expenses") && (
                                      <span>
                                        Toistuvuus: {recNames[e.recurrence]}
                                      </span>
                                    )}
                                    {userTags(e.tags) && (
                                      <span>
                                        Tunnisteet: {userTags(e.tags)}
                                      </span>
                                    )}
                                    <span>
                                      {page === "assets"
                                        ? `Omistus ${e.ownership} % · ${e.liquid ? "Likvidi" : "Ei likvidi"}`
                                        : page === "liabilities"
                                          ? `Korko ${e.rate} % · kuukausierä ${euro(e.payment)} · ${e.linkedAssetId ? `Linkitetty omaisuuteen ${s.assets.find((asset) => asset.id === e.linkedAssetId)?.name || "tuntematon omaisuuserä"}` : "Ei linkitettyä omaisuutta"}`
                                          : page === "incomes" ||
                                              page === "expenses"
                                            ? `Sarjan oletus: ${entryStatusName(e.status)}`
                                            : null}
                                    </span>
                                  </div>
                                  {(page === "incomes" ||
                                    page === "expenses") &&
                                    e.recurrence !== "once" && (
                                      <fieldset className="occurrence-statuses">
                                        <legend>
                                          Valitun kuukauden tapahtumat
                                        </legend>
                                        {scheduledOccurrences(e, month)
                                          .length ? (
                                          scheduledOccurrences(e, month).map(
                                            (date) => (
                                              <label key={date}>
                                                <span>
                                                  {date
                                                    .split("-")
                                                    .reverse()
                                                    .join(".")}
                                                </span>
                                                <select
                                                  aria-label={`${e.name} ${date} tila`}
                                                  value={occurrenceStatus(
                                                    e,
                                                    date,
                                                  )}
                                                  onChange={(event) =>
                                                    updateOccurrenceStatus(
                                                      page === "incomes"
                                                        ? "incomes"
                                                        : "expenses",
                                                      e.id,
                                                      date,
                                                      event.target
                                                        .value as EntryStatus,
                                                    )
                                                  }
                                                >
                                                  <option value="actual">
                                                    Toteutunut
                                                  </option>
                                                  <option value="planned">
                                                    Suunniteltu
                                                  </option>
                                                  <option value="skipped">
                                                    Ohitettu
                                                  </option>
                                                </select>
                                              </label>
                                            ),
                                          )
                                        ) : (
                                          <p>
                                            Tälle kuukaudelle ei ole esiintymiä.
                                          </p>
                                        )}
                                      </fieldset>
                                    )}
                                </td>
                              </tr>
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                      {rows.length > limit && (
                        <button onClick={() => setLimit(limit + 100)}>
                          Näytä seuraavat 100
                        </button>
                      )}
                    </div>
                  ) : (
                    <Empty text="Ei tietueita. Lisää uusi tai muuta hakuehtoja." />
                  )}
                </section>
                {(page === "incomes" || page === "expenses") && (
                  <button onClick={() => setCategoryEdit(true)}>
                    Hallitse kategorioita
                  </button>
                )}
              </>
            )}
            {page === "scenarios" && (
              <ScenarioView
                scenarios={s.scenarios}
                euro={euro}
                pct={pct}
                onSave={(q) => commit({ ...s, scenarios: [...s.scenarios, q] })}
                onDelete={(id) =>
                  commit({
                    ...s,
                    scenarios: s.scenarios.filter((q) => q.id !== id),
                  })
                }
                liabilities={s.liabilities}
              />
            )}
            {page === "reports" && (
              <>
                {!dismissedHelp.has("reports-interaction") && (
                  <HelpBox
                    id="reports-interaction"
                    title="Raportit ovat tutkittavia"
                    onDismiss={dismissHelp}
                  >
                    Valitse jakso, vaihda kaaviotyyliä ja avaa pylväs,
                    viivapiste tai kululuokka. Valintaan liittyvät kirjaukset
                    avautuvat raporttikortiksi.
                  </HelpBox>
                )}
                <div
                  className="report-tabs"
                  role="tablist"
                  aria-label="Raporttinäkymä"
                >
                  {reportTabs.map(({ id, label, Icon }) => (
                    <button
                      className="inline-flex items-center gap-2 transition-colors duration-150 motion-reduce:transition-none"
                      id={`report-tab-${id}`}
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={reportView === id}
                      aria-controls={
                        reportView === id ? `report-panel-${id}` : undefined
                      }
                      tabIndex={reportView === id ? 0 : -1}
                      onClick={() => selectReportView(id)}
                      onKeyDown={(event) => onReportTabKeyDown(event, id)}
                    >
                      <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
                {reportView !== "overview" && (
                  <ReportRangeControl
                    start={reportStart}
                    end={reportEnd}
                    startIndex={reportStartNumber}
                    endIndex={reportEndNumber}
                    valid={customRangeValid}
                    length={customRangeLength}
                    months={rangeNavigationMonths}
                    firstMonthIndex={firstMonthIndex}
                    lastMonthIndex={lastMonthIndex}
                    onStart={(value) => {
                      setReportStart(value);
                      setSelectedReport(null);
                    }}
                    onEnd={(value) => {
                      setReportEnd(value);
                      setSelectedReport(null);
                    }}
                    onShift={shiftCustomRange}
                    onRailEnd={setRangeEnd}
                  />
                )}
                <div className="report-global-controls">
                  <label>
                    Esitysmuoto
                    <select
                      aria-label="Raportin esitysmuoto"
                      value={reportFormat}
                      onChange={(event) => setReportFormat(event.target.value)}
                    >
                      {reportFormats[reportView].map((format) => (
                        <option key={format.value} value={format.value}>
                          {format.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {reportView === "overview" && (
                    <span className="report-selected-period">
                      {periodLabel}
                    </span>
                  )}
                </div>
                {reportView === "overview" && (
                  <section
                    className="panel report-panel"
                    id="report-panel-overview"
                    role="tabpanel"
                    aria-labelledby="report-tab-overview"
                    tabIndex={0}
                  >
                    <div className="report-range-control">
                      <div className="report-range-heading">
                        <div>
                          <span className="eyebrow">RAPORTOINTIJAKSO</span>
                          <strong>{periodLabel}</strong>
                        </div>
                        <small>
                          {customRangeValid
                            ? `${customRangeLength} ${customRangeLength === 1 ? "kuukausi" : "kuukautta"}`
                            : "Valitse alku ja loppu"}
                        </small>
                      </div>
                      <div
                        className="report-range-navigator"
                        role="group"
                        aria-label="Valitse raportin alku ja loppu"
                      >
                        <button
                          type="button"
                          aria-label="Siirrä aikaväliä kuukausi taaksepäin"
                          title="Siirrä aikaväliä kuukausi taaksepäin"
                          disabled={
                            !customRangeValid ||
                            reportStartNumber === null ||
                            reportStartNumber <= firstMonthIndex
                          }
                          onClick={() => shiftCustomRange(-1)}
                        >
                          <ChevronLeft size={19} aria-hidden="true" />
                        </button>
                        <div className="report-range-fields">
                          <MonthPicker
                            value={reportStart}
                            label="Alku"
                            ariaLabel="Raportin alkukuukausi"
                            onChange={(value) => {
                              setReportStart(value);
                              setSelectedReport(null);
                            }}
                          />
                          <MonthPicker
                            value={reportEnd}
                            label="Loppu"
                            ariaLabel="Raportin loppukuukausi"
                            onChange={(value) => {
                              setReportEnd(value);
                              setSelectedReport(null);
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          aria-label="Siirrä aikaväliä kuukausi eteenpäin"
                          title="Siirrä aikaväliä kuukausi eteenpäin"
                          disabled={
                            !customRangeValid ||
                            reportEndNumber === null ||
                            reportEndNumber >= lastMonthIndex
                          }
                          onClick={() => shiftCustomRange(1)}
                        >
                          <ChevronRight size={19} aria-hidden="true" />
                        </button>
                      </div>
                      <div
                        className="report-month-rail"
                        role="group"
                        aria-label="Siirry raportin päättymiskuukauteen"
                      >
                        {rangeNavigationMonths.map((key) => {
                          const [year, monthPart] = key.split("-").map(Number);
                          const date = new Date(year, monthPart - 1, 1);
                          const monthText = new Intl.DateTimeFormat("fi-FI", {
                            month: "short",
                          }).format(date);
                          const fullLabel = new Intl.DateTimeFormat("fi-FI", {
                            month: "long",
                            year: "numeric",
                          }).format(date);
                          const endIndex = monthNumber(key);
                          return (
                            <button
                              type="button"
                              key={key}
                              aria-label={`Päättymiskuukausi ${fullLabel}`}
                              aria-pressed={key === reportEnd}
                              title={fullLabel}
                              onClick={() =>
                                setRangeEnd(endIndex ?? lastMonthIndex)
                              }
                            >
                              <span>{monthText}</span>
                              <small>{year}</small>
                            </button>
                          );
                        })}
                      </div>
                      <p className="report-range-hint">
                        Vieritä kuukausia tai siirrä koko jaksoa nuolilla.
                      </p>
                      {!customRangeValid && (
                        <p className="alert warning" role="alert">
                          Valitse alku- ja loppukuukausi. Oma aikaväli voi olla
                          enintään 120 kuukautta.
                        </p>
                      )}
                    </div>
                    <h2>Tulot ja menot</h2>
                    {reportHasData && (
                      <section
                        className="report-period-summary"
                        aria-labelledby="period-summary-title"
                      >
                        <div className="report-period-summary-head">
                          <div>
                            <h3 id="period-summary-title">
                              Valitun jakson yhteenveto
                            </h3>
                            <p className="muted">
                              {periodLabel} · toteutuneiksi merkityt kirjaukset
                            </p>
                          </div>
                          <div className="report-saving-rate">
                            <ChartNoAxesCombined size={18} aria-hidden="true" />
                            <span>
                              <small>Säästöaste</small>
                              <strong>{pct(periodSavingRate)}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="report-kpi-grid grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {(
                            [
                              [
                                "income",
                                "Tulot",
                                euro(periodTotals.income),
                                CircleDollarSign,
                                "Toteutuneet tulot",
                              ],
                              [
                                "expense",
                                "Menot",
                                euro(periodTotals.expense),
                                ReceiptText,
                                "Kaikki menot ja siirrot",
                              ],
                              [
                                "cash",
                                "Nettokassavirta",
                                euro(periodTotals.cash),
                                ArrowLeftRight,
                                "Tulot − kaikki menot",
                              ],
                            ] as const
                          ).map(([metric, label, value, Icon, note]) => (
                            <button
                              className={`report-kpi ${metric}${selectedReport?.type === "period" && selectedReport.metric === metric ? " selected" : ""}${metric === "cash" && periodTotals.cash < 0 ? " negative" : ""}`}
                              key={metric}
                              type="button"
                              aria-label={`${label}, ${value}. Avaa ${periodLabel} tietueet.`}
                              aria-pressed={
                                selectedReport?.type === "period" &&
                                selectedReport.metric === metric
                              }
                              onClick={() =>
                                setSelectedReport({
                                  type: "period",
                                  from: history[0].key,
                                  to: history[history.length - 1].key,
                                  metric,
                                })
                              }
                            >
                              <Icon
                                size={20}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                              <span className="report-kpi-copy">
                                <small>{label}</small>
                                <strong>{value}</strong>
                                <small>{note}</small>
                              </span>
                              <ArrowRight
                                className="report-kpi-arrow"
                                size={16}
                                aria-hidden="true"
                              />
                            </button>
                          ))}
                        </div>
                        <p className="report-period-note">
                          Säästöaste lasketaan kokonaistuloista ja
                          kulutusmenoista, ei siirroista. Kirjausten puuttuminen
                          ei tarkoita, että menoja ei olisi ollut.
                        </p>
                      </section>
                    )}
                    <div className="report-chart-controls">
                      <div
                        className="chart-zoom"
                        role="group"
                        aria-label="Kaavion suurennus"
                      >
                        <button
                          type="button"
                          aria-label="Pienennä kaaviota"
                          title="Pienennä kaaviota"
                          disabled={reportZoom <= 0.7}
                          onClick={() =>
                            setReportZoom((value) =>
                              Math.max(
                                0.7,
                                Math.round((value - 0.1) * 10) / 10,
                              ),
                            )
                          }
                        >
                          <ZoomOut size={17} aria-hidden="true" />
                        </button>
                        <label>
                          Suurennus
                          <input
                            type="range"
                            min="0.7"
                            max="1.8"
                            step="0.1"
                            value={reportZoom}
                            aria-label="Kaavion suurennusprosentti"
                            aria-valuetext={`${Math.round(reportZoom * 100)} prosenttia`}
                            onChange={(event) =>
                              setReportZoom(Number(event.target.value))
                            }
                          />
                          <output>{Math.round(reportZoom * 100)} %</output>
                        </label>
                        <button
                          type="button"
                          aria-label="Suurenna kaaviota"
                          title="Suurenna kaaviota"
                          disabled={reportZoom >= 1.8}
                          onClick={() =>
                            setReportZoom((value) =>
                              Math.min(
                                1.8,
                                Math.round((value + 0.1) * 10) / 10,
                              ),
                            )
                          }
                        >
                          <ZoomIn size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Palauta kaavion oletuskoko"
                          title="Palauta oletuskoko"
                          disabled={reportZoom === 1}
                          onClick={() => setReportZoom(1)}
                        >
                          <RotateCcw size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    {reportHasData ? (
                      <>
                        {reportFormat === "bars" ? (
                          <div
                            className="chart report-canvas chart-scroll"
                            role="region"
                            aria-label="Tulot ja menot kuukausittain. Vieritä vaakasuunnassa, kun kaikki kuukaudet eivät mahdu näkymään."
                            tabIndex={0}
                          >
                            {history.map((h) => (
                              <div
                                className="chart-col"
                                key={h.key}
                                style={{
                                  flexBasis: `${64 * reportZoom}px`,
                                  minWidth: `${68 * reportZoom}px`,
                                }}
                              >
                                <div className="chart-bars">
                                  <button
                                    type="button"
                                    className={`income-bar chart-mark${selectedReport?.type === "month" && selectedReport.month === h.key && selectedReport.metric === "income" ? " selected-mark" : ""}`}
                                    aria-label={`${h.key}: tulot ${euro(h.income)}. Avaa tietueet.`}
                                    title={`Tulot ${euro(h.income)} · Näytä tietueet`}
                                    onClick={() =>
                                      setSelectedReport({
                                        type: "month",
                                        month: h.key,
                                        metric: "income",
                                      })
                                    }
                                    style={{
                                      height: Math.max(
                                        2,
                                        (h.income /
                                          Math.max(
                                            ...history.map((x) =>
                                              Math.max(x.income, x.expense),
                                            ),
                                            1,
                                          )) *
                                          140,
                                      ),
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className={`expense-bar chart-mark${selectedReport?.type === "month" && selectedReport.month === h.key && selectedReport.metric === "expense" ? " selected-mark" : ""}`}
                                    aria-label={`${h.key}: menot ${euro(h.expense)}. Avaa tietueet.`}
                                    title={`Menot ${euro(h.expense)} · Näytä tietueet`}
                                    onClick={() =>
                                      setSelectedReport({
                                        type: "month",
                                        month: h.key,
                                        metric: "expense",
                                      })
                                    }
                                    style={{
                                      height: Math.max(
                                        2,
                                        (h.expense /
                                          Math.max(
                                            ...history.map((x) =>
                                              Math.max(x.income, x.expense),
                                            ),
                                            1,
                                          )) *
                                          140,
                                      ),
                                    }}
                                  />
                                </div>
                                <small>
                                  {history.length > 12 ? h.key : h.key.slice(5)}
                                </small>
                              </div>
                            ))}
                          </div>
                        ) : reportFormat === "table" ? null : (
                          <div
                            className="line-chart-wrap"
                            role="region"
                            aria-label="Kuukausittaiset tulojen ja menojen viivakaaviot. Vieritä vaakasuunnassa, kun kaikki kuukaudet eivät mahdu näkymään."
                            tabIndex={0}
                          >
                            <div
                              className="line-chart-content"
                              style={{
                                minWidth: `${history.length * 68 * reportZoom}px`,
                              }}
                            >
                              <svg
                                className={`line-chart${reportFormat === "area" ? " area-chart" : ""}`}
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                role="img"
                                aria-label={`Kuukausittainen tulojen ja menojen ${reportFormat === "area" ? "aluekaavio" : "viivakaavio"}. Tarkat luvut alla taulukossa.`}
                              >
                                <defs>
                                  <linearGradient
                                    id="incomeArea"
                                    x1="0"
                                    x2="0"
                                    y1="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#087f5b"
                                      stopOpacity=".2"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#087f5b"
                                      stopOpacity="0"
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="expenseArea"
                                    x1="0"
                                    x2="0"
                                    y1="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#d9480f"
                                      stopOpacity=".16"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#d9480f"
                                      stopOpacity="0"
                                    />
                                  </linearGradient>
                                </defs>
                                {[15, 35, 55, 75, 95].map((y) => (
                                  <line
                                    key={y}
                                    x1="0"
                                    y1={y}
                                    x2="100"
                                    y2={y}
                                    className={`chart-axis${y === 95 ? " chart-axis-baseline" : ""}`}
                                  />
                                ))}
                                <path
                                  d={reportArea("income")}
                                  className="income-area"
                                />
                                <path
                                  d={reportArea("expense")}
                                  className="expense-area"
                                />
                                <path
                                  d={reportLine("income")}
                                  className="income-line"
                                />
                                <path
                                  d={reportLine("expense")}
                                  className="expense-line"
                                />
                                {history.map((h, index) => {
                                  const incomePoint =
                                    incomeReportCoordinates[index];
                                  const expensePoint =
                                    expenseReportCoordinates[index];
                                  const incomeSelected =
                                    selectedReport?.type === "month" &&
                                    selectedReport.month === h.key &&
                                    selectedReport.metric === "income";
                                  const expenseSelected =
                                    selectedReport?.type === "month" &&
                                    selectedReport.month === h.key &&
                                    selectedReport.metric === "expense";
                                  const handlePointKey = (
                                    event: React.KeyboardEvent<SVGGElement>,
                                    metric: "income" | "expense",
                                  ) => {
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
                                      setSelectedReport({
                                        type: "month",
                                        month: h.key,
                                        metric,
                                      });
                                    }
                                  };
                                  return (
                                    <React.Fragment key={h.key}>
                                      <g
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={incomeSelected}
                                        aria-label={`${h.key} tulot ${euro(h.income)}. Avaa tietueet.`}
                                        onClick={() =>
                                          setSelectedReport({
                                            type: "month",
                                            month: h.key,
                                            metric: "income",
                                          })
                                        }
                                        onKeyDown={(event) =>
                                          handlePointKey(event, "income")
                                        }
                                        className={`chart-point income-point${incomeSelected ? " selected-point" : ""}`}
                                      >
                                        <title>{`${h.key} · Tulot ${euro(h.income)} · Avaa tietueet`}</title>
                                        <circle
                                          className="chart-point-hit"
                                          cx={incomePoint.x}
                                          cy={incomePoint.y}
                                          r="5"
                                        />
                                        <path
                                          className="chart-point-marker"
                                          d={`M ${incomePoint.x} ${incomePoint.y - 1.2} V ${incomePoint.y + 1.2}`}
                                        />
                                      </g>
                                      <g
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={expenseSelected}
                                        aria-label={`${h.key} menot ${euro(h.expense)}. Avaa tietueet.`}
                                        onClick={() =>
                                          setSelectedReport({
                                            type: "month",
                                            month: h.key,
                                            metric: "expense",
                                          })
                                        }
                                        onKeyDown={(event) =>
                                          handlePointKey(event, "expense")
                                        }
                                        className={`chart-point expense-point${expenseSelected ? " selected-point" : ""}`}
                                      >
                                        <title>{`${h.key} · Menot ${euro(h.expense)} · Avaa tietueet`}</title>
                                        <circle
                                          className="chart-point-hit"
                                          cx={expensePoint.x}
                                          cy={expensePoint.y}
                                          r="5"
                                        />
                                        <path
                                          className="chart-point-marker"
                                          d={`M ${expensePoint.x} ${expensePoint.y - 1.2} V ${expensePoint.y + 1.2}`}
                                        />
                                      </g>
                                    </React.Fragment>
                                  );
                                })}
                              </svg>
                              <div className="line-chart-labels">
                                {history.map((h) => (
                                  <small key={h.key}>
                                    {history.length > 12
                                      ? h.key
                                      : h.key.slice(5)}
                                  </small>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div
                          className="chart-legend"
                          aria-hidden="true"
                          hidden={reportFormat === "table"}
                        >
                          <span>
                            <i className="legend-swatch income-bar" /> Tulot
                          </span>
                          <span>
                            <i className="legend-swatch expense-bar" /> Menot
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="chart-empty">
                        {!customRangeValid
                          ? "Korjaa aikaväli yllä."
                          : "Ei toteutuneita tuloja tai menoja valitulla jaksolla."}
                      </div>
                    )}
                    <div className="table-wrap mobile-card-table report-history-table">
                      <table role="table">
                        <thead role="rowgroup">
                          <tr role="row">
                            <th role="columnheader">Kuukausi</th>
                            <th role="columnheader">Tulot</th>
                            <th role="columnheader">Menot</th>
                            <th role="columnheader">Kulutus</th>
                            <th role="columnheader">
                              Säästö- ja sijoitussiirrot
                            </th>
                            <th role="columnheader">Kassavirta</th>
                            <th role="columnheader">Säästöaste</th>
                          </tr>
                        </thead>
                        <tbody role="rowgroup">
                          {history.map((h) => (
                            <tr role="row" key={h.key}>
                              <th
                                role="rowheader"
                                scope="row"
                                data-label="Kuukausi"
                              >
                                {h.key}
                              </th>
                              <td role="cell" data-label="Tulot">
                                {euro(h.income)}
                              </td>
                              <td role="cell" data-label="Menot">
                                {euro(h.expense)}
                              </td>
                              <td role="cell" data-label="Kulutus">
                                {euro(h.consumption)}
                              </td>
                              <td role="cell" data-label="Siirrot">
                                {euro(
                                  h.savingTransfers + h.investmentTransfers,
                                )}
                              </td>
                              <td role="cell" data-label="Kassavirta">
                                {euro(h.cash)}
                              </td>
                              <td role="cell" data-label="Säästöaste">
                                {pct(h.savingRate)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="muted">
                      Toistuvat toteutuneiksi merkityt tapahtumat lasketaan
                      jokaiselle esiintymälle. Tämä ei ole pankkitapahtumien
                      toteumavarmistus. Nettovarallisuuden historiaseuranta ei
                      kuulu tähän versioon.
                    </p>
                  </section>
                )}
                {reportView === "categories" && (
                  <section
                    className="panel report-panel"
                    id="report-panel-categories"
                    role="tabpanel"
                    aria-labelledby="report-tab-categories"
                    tabIndex={0}
                  >
                    <h2>Kulutusmenot kategorioittain</h2>
                    <p className="muted">
                      {periodLabel} · toteutuneiksi merkityt kulutusmenot. Menot
                      ja säästö- tai sijoitussiirrot ovat erillään.
                    </p>
                    {reportFormat === "pie" && categoryReport.length > 0 && (
                      <div className="pie-layout">
                        <div className="pie-chart">
                          <svg
                            className="pie-svg"
                            viewBox="0 0 100 100"
                            role="group"
                            aria-label="Valitse piirakan kululuokka"
                          >
                            {pieSlices.map((slice) => (
                              <path
                                key={slice.category}
                                d={pieSlicePath(slice.start, slice.end)}
                                fill={slice.color}
                                className={`pie-slice${selectedReport?.type === "category" && selectedReport.category === slice.category ? " selected-slice" : ""}`}
                                role="button"
                                tabIndex={0}
                                aria-label={`${slice.category}: ${euro(slice.value)}, ${pct(categoryTotal ? (slice.value * 100) / categoryTotal : null)}. Avaa kirjaukset.`}
                                aria-pressed={
                                  selectedReport?.type === "category" &&
                                  selectedReport.category === slice.category
                                }
                                onClick={() =>
                                  setSelectedReport({
                                    type: "category",
                                    category: slice.category,
                                    from: history[0]?.key || reportStart,
                                    to: history.at(-1)?.key || reportEnd,
                                  })
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    setSelectedReport({
                                      type: "category",
                                      category: slice.category,
                                      from: history[0]?.key || reportStart,
                                      to: history.at(-1)?.key || reportEnd,
                                    });
                                  }
                                }}
                              />
                            ))}
                          </svg>
                          <div className="pie-center">
                            <strong>{euro(categoryTotal)}</strong>
                            <small>Kulutus yhteensä</small>
                          </div>
                        </div>
                        <div className="pie-legend">
                          {categoryReport.map(([category, value], index) => (
                            <button
                              key={category}
                              className={
                                selectedReport?.type === "category" &&
                                selectedReport.category === category
                                  ? "selected-legend"
                                  : ""
                              }
                              onClick={() =>
                                setSelectedReport({
                                  type: "category",
                                  category,
                                  from: history[0]?.key || reportStart,
                                  to: history.at(-1)?.key || reportEnd,
                                })
                              }
                            >
                              <i
                                style={{
                                  backgroundColor:
                                    pieColors[index % pieColors.length],
                                }}
                              />
                              <span>{category}</span>
                              <strong>
                                {pct(
                                  categoryTotal
                                    ? (value * 100) / categoryTotal
                                    : null,
                                )}
                              </strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {reportFormat === "table" && categoryReport.length > 0 && (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Kategoria</th>
                              <th>Osuus</th>
                              <th>Kulutus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryReport.map(([category, value]) => (
                              <tr key={category}>
                                <th scope="row" data-label="Kategoria">
                                  <button
                                    className="report-table-link"
                                    onClick={() =>
                                      setSelectedReport({
                                        type: "category",
                                        category,
                                        from: history[0]?.key || reportStart,
                                        to: history.at(-1)?.key || reportEnd,
                                      })
                                    }
                                  >
                                    {category}
                                  </button>
                                </th>
                                <td data-label="Osuus">
                                  {pct(
                                    categoryTotal
                                      ? (value * 100) / categoryTotal
                                      : null,
                                  )}
                                </td>
                                <td data-label="Kulutus">{euro(value)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {reportFormat === "bars" &&
                      categoryReport.length > 0 &&
                      categoryReport.map(([category, value]) => (
                        <button
                          className={`category-report-row${selectedReport?.type === "category" && selectedReport.category === category ? " selected-report-row" : ""}`}
                          key={category}
                          aria-label={`${category}, ${euro(value)}. Avaa kirjaukset.`}
                          onClick={() =>
                            setSelectedReport({
                              type: "category",
                              category,
                              from: history[0]?.key || reportStart,
                              to: history.at(-1)?.key || reportEnd,
                            })
                          }
                        >
                          <div>
                            <span>{category}</span>
                            <strong>
                              {euro(value)} ·{" "}
                              {pct(
                                categoryTotal
                                  ? (value * 100) / categoryTotal
                                  : null,
                              )}
                            </strong>
                          </div>
                          <progress
                            max={maxCategoryExpense}
                            value={value}
                            aria-label={`${category}: ${euro(value)}`}
                          />
                        </button>
                      ))}
                    {categoryReport.length === 0 && (
                      <Empty text="Valitulla aikavälillä ei ole toteutuneita kulutusmenoja." />
                    )}
                  </section>
                )}
                {reportView === "flow" && (
                  <section
                    className="panel report-panel"
                    id="report-panel-flow"
                    role="tabpanel"
                    aria-labelledby="report-tab-flow"
                    tabIndex={0}
                  >
                    <h2>Tulojen ja menojen ajoitus</h2>
                    <p className="muted">
                      Kumulatiivinen kassavirta alkaa valitun aikavälin alussa
                      nollasta. Alkusaldoa ja maksujen kellonaikoja ei tunneta;
                      saman päivän tapahtumia ei järjestetä keskenään.
                    </p>
                    {dailyFlow.length ? (
                      <>
                        <div className="flow-summary">
                          <strong>
                            {firstShortfall
                              ? `Kertymä käy miinuksella ${firstShortfall.date.split("-").reverse().join(".")}`
                              : "Kertymä ei käy miinuksella kirjattuina tapahtumapäivinä"}
                          </strong>
                          <span>
                            {recoveryDay
                              ? `Kertymä palautuu plussalle ${recoveryDay.date.split("-").reverse().join(".")}`
                              : firstShortfall
                                ? "Kertymä jää negatiiviseksi kirjatuissa tapahtumapäivissä"
                                : `Jakson lopun kertymä ${euro(dailyFlow.at(-1)!.balance)}`}
                          </span>
                        </div>
                        <div
                          className="flow-visual"
                          role="group"
                          aria-label="Päiväkohtainen kumulatiivinen kassavirta. Valitse päivä avataksesi sen kirjaukset."
                          hidden={reportFormat !== "timeline"}
                        >
                          {dailyFlow.map((day) => (
                            <button
                              type="button"
                              className={`flow-day${selectedReport?.type === "day" && selectedReport.date === day.date ? " selected-flow-day" : ""}`}
                              key={day.date}
                              aria-label={`${day.date.split("-").reverse().join(".")}: tulot ${euro(day.income)}, menot ${euro(day.expense)}, kertymä ${euro(day.balance)}. Avaa tietueet.`}
                              title={`${day.date}: ${euro(day.balance)}`}
                              onClick={() =>
                                setSelectedReport({
                                  type: "day",
                                  date: day.date,
                                })
                              }
                            >
                              <div className="flow-day-plot">
                                <span
                                  className={`flow-bar ${day.balance < 0 ? "below-zero" : "above-zero"}`}
                                  style={{
                                    height: `${Math.max(2, (Math.abs(day.balance) / maxFlowMagnitude) * 46)}%`,
                                    ...(day.balance < 0
                                      ? { top: "50%" }
                                      : { bottom: "50%" }),
                                  }}
                                />
                                <i />
                              </div>
                              <small>
                                {history.length === 1
                                  ? Number(day.date.slice(-2))
                                  : day.date.slice(5, 10)}
                              </small>
                            </button>
                          ))}
                        </div>
                        <p
                          className="muted flow-caption"
                          hidden={reportFormat !== "timeline"}
                        >
                          Päivän lopun kumulatiivinen tulojen ja menojen erotus
                          · positiivinen ylös, alijäämä alas. Päivät, joina ei
                          ole kirjauksia, eivät näy.
                        </p>
                        <div
                          className="table-wrap mobile-card-table flow-table"
                          hidden={reportFormat !== "table"}
                        >
                          <table role="table">
                            <thead role="rowgroup">
                              <tr role="row">
                                <th role="columnheader">Päivä</th>
                                <th role="columnheader">Tulot</th>
                                <th role="columnheader">Menot</th>
                                <th role="columnheader">
                                  Kumulatiivinen kassavirta
                                </th>
                              </tr>
                            </thead>
                            <tbody role="rowgroup">
                              {dailyFlow.map((day) => (
                                <tr role="row" key={day.date}>
                                  <th
                                    role="rowheader"
                                    scope="row"
                                    data-label="Päivä"
                                  >
                                    {day.date.split("-").reverse().join(".")}
                                  </th>
                                  <td role="cell" data-label="Tulot">
                                    {euro(day.income)}
                                  </td>
                                  <td role="cell" data-label="Menot">
                                    {euro(day.expense)}
                                  </td>
                                  <td
                                    role="cell"
                                    data-label="Kertymä"
                                    className={
                                      day.balance < 0 ? "negative" : ""
                                    }
                                  >
                                    {euro(day.balance)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <Empty text="Valitussa kuussa ei ole toteutuneita tapahtumia." />
                    )}
                  </section>
                )}
                {reportView === "budget" && (
                  <section
                    className="panel report-panel"
                    id="report-panel-budget"
                    role="tabpanel"
                    aria-labelledby="report-tab-budget"
                    tabIndex={0}
                  >
                    <h2>Budjetti ja toteutuneet menot</h2>
                    <p className="muted">
                      {periodLabel}. Kunkin kategorian käsin syötetty toteuma
                      korvaa kirjatut menot tässä raportissa; muuten käytetään
                      toteutuneiksi merkittyjä kulutusmenoja. Vertailu koskee
                      vain budjetoituja kategorioita; budjetoimattomat kulut
                      näytetään erikseen.
                    </p>
                    <div className="report-summary-strip">
                      <article>
                        <small>Suunnitelma yhteensä</small>
                        <strong>{euro(budgetTotals.planned)}</strong>
                      </article>
                      <article>
                        <small>Toteuma budjetoiduissa kategorioissa</small>
                        <strong>{euro(budgetTotals.actual)}</strong>
                      </article>
                      <article>
                        <small>Budjetoimattomat kulut</small>
                        <strong>{euro(budgetTotals.unbudgetedActual)}</strong>
                      </article>
                      <article>
                        <small>Budjetoitujen kategorioiden erotus</small>
                        <strong
                          className={
                            budgetTotals.actual > budgetTotals.planned
                              ? "negative"
                              : ""
                          }
                        >
                          {euro(budgetTotals.planned - budgetTotals.actual)}
                        </strong>
                      </article>
                    </div>
                    {reportFormat === "bars" && budgetReport.length > 0 && (
                      <div
                        className="budget-report-chart"
                        aria-label="Kuukausittainen budjetti ja toteuma"
                      >
                        {budgetReport.map((row) => (
                          <button
                            key={row.key}
                            className="budget-report-month"
                            type="button"
                            onClick={() =>
                              setSelectedReport({
                                type: "budget",
                                month: row.key,
                                planned: row.planned,
                                actual: row.actual,
                                manualCategories: Object.keys(
                                  s.budgetActuals[row.key] || {},
                                ),
                              })
                            }
                            aria-label={`${row.key}: ${row.hasPlan ? `budjetti ${euro(row.planned)}, budjetoitujen kategorioiden toteuma ${euro(row.actual)}` : "ei budjettisuunnitelmaa"}, budjetoimattomat kulut ${euro(row.unbudgetedActual)}. Avaa kirjaukset.`}
                          >
                            <span>{row.key}</span>
                            <span className="budget-report-bars">
                              <i
                                title={
                                  row.hasPlan
                                    ? `Suunnitelma ${euro(row.planned)}`
                                    : "Ei budjettisuunnitelmaa"
                                }
                                style={{
                                  width: row.hasPlan
                                    ? `${Math.min(100, (row.planned / budgetReportScale) * 100)}%`
                                    : "0%",
                                }}
                              />
                              <b
                                title={`Budjetoitujen kategorioiden toteuma ${euro(row.actual)}`}
                                style={{
                                  width: `${Math.min(100, (row.actual / budgetReportScale) * 100)}%`,
                                }}
                              />
                              <i
                                className="unbudgeted-bar"
                                title={`Budjetoimattomat kulut ${euro(row.unbudgetedActual)}`}
                                style={{
                                  width: `${Math.min(100, (row.unbudgetedActual / budgetReportScale) * 100)}%`,
                                }}
                              />
                            </span>
                            <strong>
                              {row.hasPlan ? euro(row.actual) : "—"}{" "}
                              <small>
                                /{" "}
                                {row.hasPlan
                                  ? euro(row.planned)
                                  : "ei suunnitelmaa"}
                              </small>
                              {row.unbudgetedActual > 0 && (
                                <small className="unbudgeted-report-value">
                                  + {euro(row.unbudgetedActual)} ilman budjettia
                                </small>
                              )}
                            </strong>
                          </button>
                        ))}
                        <p className="muted">
                          <i className="legend-swatch planned-swatch" />{" "}
                          Budjetti <i className="legend-swatch expense-bar" />
                          Budjetoitujen kategorioiden toteuma{" "}
                          <i className="legend-swatch unbudgeted-swatch" />
                          Budjetoimaton kulutus
                        </p>
                      </div>
                    )}
                    {reportFormat === "table" && budgetReport.length > 0 && (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Kuukausi</th>
                              <th>Suunnitelma</th>
                              <th>Budjetoidun toteuma</th>
                              <th>Budjetoimaton</th>
                              <th>Budjetin erotus</th>
                              <th>Budjetoituja kategorioita</th>
                            </tr>
                          </thead>
                          <tbody>
                            {budgetReport.map((row) => (
                              <tr key={row.key}>
                                <th scope="row" data-label="Kuukausi">
                                  <button
                                    className="report-table-link"
                                    onClick={() =>
                                      setSelectedReport({
                                        type: "budget",
                                        month: row.key,
                                        planned: row.planned,
                                        actual: row.actual,
                                        manualCategories: Object.keys(
                                          s.budgetActuals[row.key] || {},
                                        ),
                                      })
                                    }
                                  >
                                    {row.key}
                                  </button>
                                </th>
                                <td data-label="Suunnitelma">
                                  {row.hasPlan
                                    ? euro(row.planned)
                                    : "Ei suunnitelmaa"}
                                </td>
                                <td data-label="Budjetoidun toteuma">
                                  {euro(row.actual)}
                                </td>
                                <td data-label="Budjetoimaton">
                                  {euro(row.unbudgetedActual)}
                                </td>
                                <td
                                  data-label="Erotus"
                                  className={
                                    row.hasPlan && row.actual > row.planned
                                      ? "negative"
                                      : ""
                                  }
                                >
                                  {row.hasPlan
                                    ? euro(row.planned - row.actual)
                                    : "—"}
                                </td>
                                <td data-label="Kategorioita">
                                  {
                                    Object.values(row.plannedByCategory).filter(
                                      (amount) => amount > 0,
                                    ).length
                                  }
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {!budgetReport.some(
                      (row) =>
                        row.planned || row.actual || row.unbudgetedActual,
                    ) && (
                      <Empty text="Aikavälillä ei ole budjettisuunnitelmia tai toteumia." />
                    )}
                  </section>
                )}
                {reportView === "wealth" && (
                  <section
                    className="panel report-panel"
                    id="report-panel-wealth"
                    role="tabpanel"
                    aria-labelledby="report-tab-wealth"
                    tabIndex={0}
                  >
                    <h2>Nykyinen varallisuuskuva</h2>
                    <p className="muted">
                      Tämä on nykytilan tilannekuva, ei historiaseuranta.
                      Omaisuusarvot perustuvat itse syöttämiisi arvoihin ja
                      arvostuspäiviin.
                    </p>
                    <div className="report-summary-strip wealth-summary">
                      <article>
                        <small>Omaisuus</small>
                        <strong>{euro(assetBalance)}</strong>
                      </article>
                      <article>
                        <small>Sijoitukset</small>
                        <strong>{euro(investmentBalance)}</strong>
                      </article>
                      <article>
                        <small>Velat</small>
                        <strong>{euro(debtBalance)}</strong>
                      </article>
                      <article>
                        <small>Nettovarallisuus</small>
                        <strong>{euro(netWorth)}</strong>
                      </article>
                    </div>
                    {reportFormat === "breakdown" ? (
                      <div className="wealth-report-grid">
                        <section>
                          <h3>Omaisuuserät</h3>
                          {currentAssets.length ? (
                            currentAssets.map((asset) => (
                              <article key={asset.id}>
                                <div className="wealth-report-item-label">
                                  <CategoryImage
                                    icon={categoryIconFor(
                                      asset.category,
                                      "assets",
                                    )}
                                    size={28}
                                  />
                                  <span>
                                    {asset.name}
                                    <small>
                                      {asset.category} · arvostettu{" "}
                                      {asset.date
                                        .split("-")
                                        .reverse()
                                        .join(".")}
                                    </small>
                                  </span>
                                </div>
                                <strong>{euro(asset.ownedValue)}</strong>
                              </article>
                            ))
                          ) : (
                            <p className="muted">Omaisuutta ei ole kirjattu.</p>
                          )}
                        </section>
                        <section>
                          <h3>Sijoitukset</h3>
                          {currentInvestments.length ? (
                            currentInvestments.map((investment) => (
                              <article key={investment.id}>
                                <div className="wealth-report-item-label">
                                  <CategoryImage
                                    icon={categoryIconFor(
                                      investment.category,
                                      "investments",
                                    )}
                                    size={28}
                                  />
                                  <span>
                                    {investment.name}
                                    <small>
                                      {investment.category} ·{" "}
                                      {investment.quantity} kpl
                                    </small>
                                  </span>
                                </div>
                                <strong>{euro(investment.marketValue)}</strong>
                              </article>
                            ))
                          ) : (
                            <p className="muted">
                              Sijoituksia ei ole kirjattu.
                            </p>
                          )}
                        </section>
                        <section>
                          <h3>Velat</h3>
                          {currentDebts.length ? (
                            currentDebts.map((debt) => (
                              <article key={debt.id}>
                                <div className="wealth-report-item-label">
                                  <CategoryImage
                                    icon={categoryIconFor(
                                      debt.category,
                                      "liabilities",
                                    )}
                                    size={28}
                                  />
                                  <span>
                                    {debt.name}
                                    <small>{debt.category}</small>
                                  </span>
                                </div>
                                <strong>−{euro(debt.amount)}</strong>
                              </article>
                            ))
                          ) : (
                            <p className="muted">Velkoja ei ole kirjattu.</p>
                          )}
                        </section>
                      </div>
                    ) : (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Tietue</th>
                              <th>Kategoria</th>
                              <th>Arvo / saldo</th>
                              <th>Päivä</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentAssets.map((asset) => (
                              <tr key={`asset-${asset.id}`}>
                                <th scope="row" data-label="Tietue">
                                  {asset.name}
                                </th>
                                <td data-label="Kategoria">
                                  Omaisuus · {asset.category}
                                </td>
                                <td data-label="Arvo">
                                  {euro(asset.ownedValue)}
                                </td>
                                <td data-label="Päivä">
                                  {asset.date.split("-").reverse().join(".")}
                                </td>
                              </tr>
                            ))}
                            {currentInvestments.map((investment) => (
                              <tr key={`investment-${investment.id}`}>
                                <th scope="row" data-label="Tietue">
                                  {investment.name}
                                </th>
                                <td data-label="Kategoria">
                                  Sijoitus · {investment.category}
                                </td>
                                <td data-label="Arvo">
                                  {euro(investment.marketValue)}
                                </td>
                                <td data-label="Päivä">
                                  {investment.date
                                    .split("-")
                                    .reverse()
                                    .join(".")}
                                </td>
                              </tr>
                            ))}
                            {currentDebts.map((debt) => (
                              <tr key={`debt-${debt.id}`}>
                                <th scope="row" data-label="Tietue">
                                  {debt.name}
                                </th>
                                <td data-label="Kategoria">
                                  Velka · {debt.category}
                                </td>
                                <td data-label="Saldo">−{euro(debt.amount)}</td>
                                <td data-label="Päivä">
                                  {debt.date.split("-").reverse().join(".")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}
                {reportView === "debt" && (
                  <section
                    className="panel report-panel"
                    id="report-panel-debt"
                    role="tabpanel"
                    aria-labelledby="report-tab-debt"
                    tabIndex={0}
                  >
                    <h2>Velat, vakuutena oleva omaisuus ja oma pääoma</h2>
                    <p className="muted">
                      Linkitä laina omaisuuserään velan muokkauksessa. Arvio
                      olettaa nykyisen lainasaldon, koron ja maksuerän pysyvän
                      voimassa eikä huomioi kuluja, lyhennysvapaita tai uusia
                      nostoja.
                    </p>
                    <div className="report-assumption">
                      <PercentField
                        label="Omaisuuden oletettu vuotuinen arvonmuutos"
                        value={assetChangeRate}
                        min={-99.9}
                        max={100}
                        step={0.1}
                        onChange={setAssetChangeRate}
                      />
                      <small>
                        Oletus vaikuttaa vain tulevan arvon suuntaa-antavaan
                        arvioon. Nykyinen oma pääoma = omaisuuden omistusosuus −
                        siihen linkitetyt velat.
                      </small>
                    </div>
                    {reportFormat === "table" ? (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Omaisuus / laina</th>
                              <th>Velkasaldo</th>
                              <th>Oma pääoma nyt</th>
                              <th>Maksuaika-arvio</th>
                              <th>Arvioitu korko</th>
                              <th>Oma pääoma maksuajan lopussa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {linkedOutlooks.map(({ asset, outlook }) => (
                              <tr key={asset.id}>
                                <th scope="row" data-label="Omaisuus / laina">
                                  {asset.name}
                                </th>
                                <td data-label="Velkasaldo">
                                  {euro(outlook!.debtBalance)}
                                </td>
                                <td data-label="Oma pääoma nyt">
                                  {euro(outlook!.currentEquity)}
                                </td>
                                <td data-label="Maksuaika">
                                  {outlook!.payoffMonths === null
                                    ? "Ei laskettavissa"
                                    : `${outlook!.payoffMonths} kk`}
                                </td>
                                <td data-label="Korkoarvio">
                                  {outlook!.estimatedInterest === null
                                    ? "Ei laskettavissa"
                                    : euro(outlook!.estimatedInterest)}
                                </td>
                                <td data-label="Arvio lopussa">
                                  {outlook!.estimatedEquityAtPayoff === null
                                    ? "Ei laskettavissa"
                                    : euro(outlook!.estimatedEquityAtPayoff)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="debt-outlook-list">
                        {linkedOutlooks.map(({ asset, outlook }) => (
                          <article key={asset.id} className="debt-outlook-card">
                            <header>
                              <h3>{asset.name}</h3>
                              <span>{asset.category}</span>
                            </header>
                            <div className="debt-outlook-values">
                              <span>
                                <small>Omaisuuden omistusosuus</small>
                                <strong>{euro(outlook!.ownedValue)}</strong>
                              </span>
                              <span>
                                <small>Linkitetty velka</small>
                                <strong>−{euro(outlook!.debtBalance)}</strong>
                              </span>
                              <span>
                                <small>Oma pääoma nyt</small>
                                <strong>{euro(outlook!.currentEquity)}</strong>
                              </span>
                            </div>
                            <p>
                              {outlook!.payoffMonths === null
                                ? "Maksuaikaa ei voi arvioida: tarkista lainan korko ja kuukausierä."
                                : `Velat maksettu arviolta ${outlook!.payoffMonths} kuukaudessa; korkoja maksetaan arviolta ${euro(outlook!.estimatedInterest || 0)}. Omaisuuden arvioitu arvo silloin: ${euro(outlook!.projectedValueAtPayoff || 0)}.`}
                            </p>
                            <strong className="debt-equity-result">
                              Oma pääoma velkojen maksun jälkeen:{" "}
                              {outlook!.estimatedEquityAtPayoff === null
                                ? "Ei laskettavissa"
                                : euro(outlook!.estimatedEquityAtPayoff)}
                            </strong>
                          </article>
                        ))}
                      </div>
                    )}
                    {currentDebts.some((debt) => !debt.linkedAssetId) && (
                      <div className="alert report-alert">
                        Linkittämättömiä lainoja:{" "}
                        {currentDebts
                          .filter((debt) => !debt.linkedAssetId)
                          .map((debt) => debt.name)
                          .join(", ")}
                        . Linkitä ne velan muokkausnäkymässä, jos niillä on
                        omaisuuserä vastinparina.
                      </div>
                    )}
                    {linkedOutlooks.length === 0 && currentDebts.length > 0 && (
                      <Empty text="Yhtään velkaa ei ole vielä linkitetty omaisuuserään." />
                    )}
                    {currentDebts.length === 0 && (
                      <Empty text="Lisää velka ja omaisuuserä, jotta voit tarkastella pääomaa ja takaisinmaksuarviota." />
                    )}
                  </section>
                )}
                {reportView === "fire" && (
                  <section
                    className="panel report-panel"
                    id="report-panel-fire"
                    role="tabpanel"
                    aria-labelledby="report-tab-fire"
                    tabIndex={0}
                  >
                    <h2>Säästöaste ja taloudellinen riippumattomuus</h2>
                    <p className="muted">
                      Säästöaste käyttää valitun aikavälin tuloja ja
                      kulutusmenoja. FIRE-tavoite annualisoi vain kuukaudet,
                      joissa on kirjattuja tuloja tai menoja; tyhjää kuukautta
                      ei tulkita kuluttomaksi. Arvio olettaa havaittujen
                      kuukausien kuvaavan tulevaa kulutusta. Havaintoja on{" "}
                      {observedCashflowMonths.length} / {history.length}{" "}
                      kuukaudelta.
                    </p>
                    <div className="report-assumption">
                      <PercentField
                        label="Esimerkin nostoprosentti vuodessa"
                        value={withdrawalRate}
                        min={2}
                        max={10}
                        step={0.1}
                        onChange={setWithdrawalRate}
                      />
                      <small>
                        Nostoprosentti on laskennan oletus, ei lupaus tuoton
                        riittävyydestä eikä henkilökohtainen sijoitussuositus.
                      </small>
                    </div>
                    <div className="report-summary-strip">
                      <article>
                        <small>Jakson säästöaste</small>
                        <strong>{pct(periodSavingRate)}</strong>
                      </article>
                      <article>
                        <small>Keskimääräinen kulutus / kk</small>
                        <strong>{euro(averageMonthlyConsumption)}</strong>
                      </article>
                      <article>
                        <small>Annualisoitu kulutus</small>
                        <strong>{euro(annualizedSpending)}</strong>
                      </article>
                      <article>
                        <small>Kirjatut sijoitukset nykyarvossa</small>
                        <strong>{euro(investmentBalance)}</strong>
                      </article>
                    </div>
                    {reportFormat === "bars" &&
                      observedCashflowMonths.length > 0 && (
                        <div
                          className="fire-trend"
                          role="group"
                          aria-label="Kuukausittaiset säästöasteet"
                        >
                          {observedCashflowMonths.map((item) => (
                            <button
                              type="button"
                              key={item.key}
                              onClick={() =>
                                setSelectedReport({
                                  type: "month",
                                  month: item.key,
                                  metric: "income",
                                })
                              }
                              aria-label={`${item.key}: säästöaste ${pct(item.savingRate)}. Avaa tulot.`}
                            >
                              <span
                                style={{
                                  height: `${Math.max(4, Math.min(100, Math.max(0, item.savingRate || 0)))}%`,
                                }}
                              />
                              <small>
                                {observedCashflowMonths.length > 12
                                  ? item.key
                                  : item.key.slice(5)}
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                    {reportFormat === "table" && (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Kuukausi</th>
                              <th>Tulot</th>
                              <th>Kulutus</th>
                              <th>Säästöaste</th>
                            </tr>
                          </thead>
                          <tbody>
                            {observedCashflowMonths.map((item) => (
                              <tr key={item.key}>
                                <th scope="row" data-label="Kuukausi">
                                  {item.key}
                                </th>
                                <td data-label="Tulot">{euro(item.income)}</td>
                                <td data-label="Kulutus">
                                  {euro(item.consumption)}
                                </td>
                                <td data-label="Säästöaste">
                                  {pct(item.savingRate)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="fire-target-card">
                      <div>
                        <span className="eyebrow">ESIMERKKILASKELMA</span>
                        <h3>Arvioitu sijoitusvarallisuuden tavoite</h3>
                      </div>
                      {fireCalculation ? (
                        <>
                          <strong>{euro(fireCalculation.target)}</strong>
                          <p>
                            Perustuu {euro(annualizedSpending)} vuotuiseen
                            kulutukseen ja {pct(withdrawalRate)}{" "}
                            nostoprosenttiin. Nykyisistä kirjatuista
                            sijoituksista puuttuu arviolta{" "}
                            {euro(fireCalculation.shortfall)}.
                          </p>
                        </>
                      ) : (
                        <p>
                          Tavoitetta ei voi laskea tämän aikavälin tiedoilla.
                        </p>
                      )}
                    </div>
                    <p className="muted">
                      Tämä karkea laskelma jättää pois verot, inflaation,
                      kulujen muutokset, sijoitustuotot ja nostojen ajoituksen.
                      Säästöaste on kuvaus kirjatuista tiedoista, ei ennuste.
                    </p>
                  </section>
                )}
                {selectedReport && (
                  <section
                    ref={reportDetailRef}
                    tabIndex={-1}
                    aria-labelledby="report-detail-title"
                    className="report-panel report-detail min-w-0 max-w-full overflow-clip rounded-2xl border p-5 shadow-sm mb-6 transition-shadow duration-200 hover:shadow-md"
                    aria-live="polite"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <p className="eyebrow">VALITTU RAPORTTIKOHTA</p>
                        <h2 id="report-detail-title">
                          {selectedReport.type === "period"
                            ? `${selectedReport.from === selectedReport.to ? selectedReport.from : `${selectedReport.from}–${selectedReport.to}`} · ${selectedReport.metric === "income" ? "Tulot" : selectedReport.metric === "expense" ? "Menot" : "Nettokassavirta"}`
                            : selectedReport.type === "budget"
                              ? `${selectedReport.month} · Budjetti ja toteuma`
                              : selectedReport.type === "month"
                                ? `${selectedReport.month} · ${selectedReport.metric === "income" ? "Tulot" : "Menot"}`
                                : selectedReport.type === "category"
                                  ? `${selectedReport.category} · ${selectedReport.from}–${selectedReport.to}`
                                  : `${selectedReport.date.split("-").reverse().join(".")} · tapahtumat`}
                        </h2>
                      </div>
                      <button
                        aria-label="Sulje raportin tietokortti"
                        onClick={() => setSelectedReport(null)}
                      >
                        Sulje
                      </button>
                    </div>
                    <p>
                      <strong
                        className={selectedReportTotal < 0 ? "negative" : ""}
                      >
                        {euro(selectedReportTotal)}
                      </strong>{" "}
                      · {selectedReportEntries.length} tietuetta
                    </p>
                    {selectedReport.type === "budget" && (
                      <>
                        <p className="muted">
                          Suunnitelma {euro(selectedReport.planned)} ·
                          budjetoitujen kategorioiden toteuma{" "}
                          {euro(selectedReport.actual)} · budjetoimattomat kulut{" "}
                          {euro(selectedBudgetSummary?.unbudgetedActual || 0)}.{" "}
                          {selectedReport.manualCategories.length
                            ? `Käsin syötetty toteuma korvaa kirjaukset kategorioissa ${selectedReport.manualCategories.join(", ")}. `
                            : "Toteuma lasketaan kirjatuista kulutusmenoista. "}
                          Alla näkyvät budjetoitujen kategorioiden toteutuneet
                          kulutustapahtumat.
                        </p>
                        {!!selectedBudgetSummary?.categories.some(
                          (category) =>
                            category.planned <= 0 && category.actual > 0,
                        ) && (
                          <div className="unbudgeted-report-list">
                            <strong>Budjetoimattomat kategoriat</strong>
                            {selectedBudgetSummary.categories
                              .filter(
                                (category) =>
                                  category.planned <= 0 && category.actual > 0,
                              )
                              .map((category) => (
                                <span key={category.category}>
                                  {category.category}
                                  <b>{euro(category.actual)}</b>
                                </span>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                    {selectedReportEntries.length ? (
                      <div className="divide-y divide-slate-100">
                        {selectedReportEntries.map(
                          (
                            { entry: record, kind, amount, occurrences: count },
                            index,
                          ) => (
                            <div
                              className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 py-3"
                              key={`${kind}-${record.id}-${index}`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${kind === "income" ? "bg-report-income" : "bg-report-expense"}`}
                                aria-hidden="true"
                              />
                              <span>
                                <strong>{record.name}</strong>
                                <small className="mt-1 block text-xs text-slate-500">
                                  {selectedReport.type === "period"
                                    ? `${kind === "income" ? "Tulo" : "Meno"} · ${record.category} · ${count} ${count === 1 ? "esiintymä" : "esiintymää"} valitulla jaksolla`
                                    : `${record.category} · ${record.date.split("-").reverse().join(".")}`}
                                </small>
                              </span>
                              <strong>{euro(amount)}</strong>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="muted">
                        Valintaan ei löydy toteutuneita kirjauksia.
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
            {page === "transfer" && (
              <Transfer
                s={s}
                onBackup={exportBackup}
                onRestore={importBackup}
                onImport={(kind, es) => {
                  setUndo(s);
                  if (commit({ ...s, [kind]: [...s[kind], ...es] }))
                    setNotice(
                      `${es.length} tietuetta tuotu. Tuonnin voi kumota.`,
                    );
                }}
              />
            )}
            {page === "settings" && (
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
                    {s.settings.theme === "custom" && (
                      <label>
                        Korostusväri
                        <input
                          type="color"
                          value={s.settings.accent}
                          onChange={(e) => settings({ accent: e.target.value })}
                        />
                        <small>
                          Tekstin väri valitaan automaattisesti parhaan
                          kontrastin mukaan (vähintään 4,5:1).
                        </small>
                      </label>
                    )}
                  </div>
                  <p>
                    Valuutta EUR · kieli Suomi. Summat tallennetaan
                    kokonaislukusentteinä.
                  </p>
                </section>
                <section
                  className="panel help-settings"
                  aria-labelledby="help-settings-title"
                >
                  <div>
                    <h2 id="help-settings-title">Ohjelaatikot</h2>
                    <p className="muted">
                      Piilotetut opastukset eivät muuta taloustietojasi. Voit
                      palauttaa ne näytettäväksi täällä.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={restoreHelp}
                    disabled={!dismissedHelp.size}
                  >
                    Palauta piilotetut ohjeet ({dismissedHelp.size})
                  </button>
                </section>
                <section className="panel demo-household-section">
                  <div className="demo-household-section-heading">
                    <span className="eyebrow">
                      NELJÄ TILANNETTA · SAMA DATA KUIN KOMPASSISSA
                    </span>
                    <h2>Valitse demotalous testailuun</h2>
                  </div>
                  <p>
                    Nämä neljä kahden aikuisen ja yhden lapsen taloutta ovat
                    samat fiktiiviset reitit kuin Talouden kompassissa. Voit
                    testata valitun tilanteen tuloissa, menoissa, budjetissa,
                    varallisuudessa ja raporteissa. Lataus korvaa selaimen
                    nykyisen talouden; tee varmuuskopio ensin, jos haluat
                    palauttaa omat tietosi myöhemmin.
                  </p>
                  <div className="actions">
                    <button onClick={exportBackup}>
                      Vie nykyisen talouden varmuuskopio
                    </button>
                  </div>
                  <DemoHouseholdGrid
                    scenarios={compassDemos}
                    hideNumbers={s.settings.private}
                    onChoose={loadDemoHousehold}
                    buttonText="Lataa tämä talous"
                  />
                </section>
                <section className="panel">
                  <h2>Tallennus ja datan hallinta</h2>
                  <p>
                    {storageOk
                      ? "Paikallinen tallennus on käytettävissä."
                      : "Tallennus ei ole käytettävissä."}{" "}
                    Selaimen asetukset, yksityinen selaus, tiedoston siirtäminen
                    tai selaindatan poisto voivat hävittää tallennuksen.
                    JSON-varmuuskopio on siirrettävä kopio tiedoistasi.
                  </p>
                  <div className="actions">
                    <button onClick={exportBackup}>Vie varmuuskopio</button>
                    <button
                      onClick={() => {
                        try {
                          let t = localStorage.getItem(storage.key);
                          if (t)
                            download(t, "talous-alkuperainen-tallennus.json");
                          else
                            setNotice("Alkuperäistä tallennusta ei löytynyt.");
                        } catch (e) {
                          setNotice(
                            "Selaintallennusta ei voi lukea: " + String(e),
                          );
                        }
                      }}
                    >
                      Vie alkuperäinen selaintallennus
                    </button>
                  </div>
                  <div className="danger-zone">
                    <h3>Kaikkien tietojen poisto</h3>
                    <p>
                      Poisto tyhjentää tämän selaimen talouden. Vie
                      JSON-varmuuskopio ennen poistamista, jos haluat säilyttää
                      tiedot.
                    </p>
                    <button
                      className="danger"
                      onClick={() => {
                        setDeleteText("");
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
                              "Poistetaanko koko esimerkkitalous? Myös siihen tekemäsi muutokset poistuvat.",
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
            {page === "help" && (
              <section className="panel prose">
                <h2>Talous haltuun ilman käyttäjätiliä</h2>
                <p>
                  Tämä sovellus toimii yhdestä HTML-tiedostosta. Talousdataasi
                  ei lähetetä sovelluksesta verkkoon. Ei pankkiyhteyksiä,
                  analytiikkaa, mainoksia tai käyttäjätiliä.
                </p>
                <h3>Aloita näin</h3>
                <ol>
                  <li>
                    Lisää nettotulot ja menot. Valitse toistuvuus ja tila.
                  </li>
                  <li>Aseta kuukausikohtaiset kategoriabudjetit.</li>
                  <li>
                    Kirjaa omaisuus, velat ja sijoitukset ilman päällekkäisiä
                    kirjauksia.
                  </li>
                  <li>Aseta tavoite ja kuukausisäästö.</li>
                  <li>Vie varmuuskopio aina tärkeiden muutosten jälkeen.</li>
                </ol>
                <h3>Mitä laskelmat tarkoittavat?</h3>
                <p>
                  Kassavirta = toteutuneet tulot − toteutuneet menot. Käyttövara
                  vähentää lisäksi suunnitellut menot. Säästöaste = (tulot −
                  kulutusmenot) / tulot. Menon tyyppi ratkaisee, kuuluuko
                  kirjaus kulutukseen vai säästö- tai sijoitussiirtoihin.
                  Vanhojen kirjausten Säästäminen- ja Sijoittaminen-kategoriat
                  tunnistetaan automaattisesti. Kaikki kirjaukset sisältyvät
                  kassavirtaan. Nettovarallisuus = omaisuuden omistusosuuden
                  mukaiset arvot + sijoitusten määrä × hinta − velkasaldot.
                </p>
                <p>
                  Toistuvuus lasketaan aloituspäivästä. Kuukauden 31. päivän
                  tapahtuma siirtyy lyhyessä kuukaudessa sen viimeiselle
                  päivälle. Toistuva toteutunut tietue oletetaan toteutuneeksi
                  jokaisessa esiintymässä. Poikkeuspäivien hallinta ei vielä ole
                  käytettävissä.
                </p>
                <h3>Yksityisyys ja turvallisuus</h3>
                <p>
                  Tiedot ja JSON-varmuuskopiot eivät ole salattuja. Laitteen
                  muut käyttäjät, selainlaajennukset tai haittaohjelmat voivat
                  päästä niihin. Käytä laitteen suojausta ja säilytä
                  varmuuskopiot turvallisesti. Summien piilottaminen on
                  näyttösuoja, ei salaus.
                </p>
                <h3>Arviot, eivät lupaukset</h3>
                <p>
                  Skenaariot perustuvat itse määrittämiisi oletuksiin. Ne eivät
                  ole sijoitussuosituksia tai varmoja ennusteita. Verot,
                  valuuttakurssit ja markkinoiden vaihtelu eivät sisälly
                  laskelmiin.
                </p>
                <h3>Näppäimistö</h3>
                <p>
                  Tab siirtyy seuraavaan toimintoon. Enter aktivoi painikkeen.
                  Escape sulkee valintaikkunan. Ctrl/Cmd + K avaa pikatoiminnot.
                </p>
                <h3>Version rajaus</h3>
                <p>
                  Versio 0.1.0 on toimiva paikallinen ensimmäinen toimitus, ei
                  koko laajan V1-määrittelyn hyväksytty lopputulos. Edistyneet
                  arvostushistoriat, sijoitustapahtumat, monivaluutat, kaikki
                  budjetointitavat ja täydellinen saavutettavuusauditointi ovat
                  jatkokehitystä.
                </p>
              </section>
            )}
          </main>
          <footer>
            Yksityinen, paikallinen ja ilmainen · 0.1.0 · Muista varmuuskopioida
          </footer>
        </div>
      </div>
      {!s.settings.onboarded && (
        <Modal
          title="Talous haltuun ilman käyttäjätiliä"
          onClose={() => {}}
          dismissible={false}
        >
          <p>
            Kaikki tiedot käsitellään paikallisesti. Talousdataasi ei lähetetä
            sovelluksesta mihinkään.
          </p>
          <p>
            Selaintallennus ei korvaa varmuuskopiota. Pidä JSON-kopio tallessa.
          </p>
          {loaded.error && (
            <>
              <p className="negative">{loaded.error}</p>
              <button
                onClick={() => {
                  try {
                    let t = localStorage.getItem(storage.key);
                    if (t) download(t, "talous-alkuperainen-tallennus.json");
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
                    "Alkuperäinen tallennus on vioittunut. Aloittaminen korvaa sen. Oletko tallentanut siitä kopion?",
                  )
                )
                  settings({ onboarded: true });
              }}
            >
              Aloita tyhjästä
            </button>
            <button
              onClick={() => {
                setDemoPickerOpen(true);
              }}
            >
              Valitse demotalous
            </button>
          </div>
          <label className="file-label">
            Palauta varmuuskopio
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                if (e.target.files?.[0]) importBackup(e.target.files[0]);
                e.target.value = "";
              }}
            />
          </label>
        </Modal>
      )}
      {demoPickerOpen && (
        <Modal
          title="Valitse esimerkkitalous"
          onClose={() => setDemoPickerOpen(false)}
        >
          <p className="demo-picker-intro">
            Nämä ovat samat neljä kahden aikuisen ja yhden lapsen esimerkkiä,
            joita voit tutkia Talouden kompassissa.
          </p>
          <DemoHouseholdGrid
            scenarios={compassDemos}
            hideNumbers={s.settings.private}
            onChoose={loadDemoHousehold}
          />
        </Modal>
      )}
      {edit && (
        <Modal
          title={"Muokkaa / lisää " + singular[edit.kind]}
          onClose={() => setEdit(null)}
        >
          <EntryForm
            kind={edit.kind}
            item={edit.item}
            categories={categoryChoices(edit.kind)}
            assets={s.assets}
            onSave={(e) => saveEntry(edit.kind, e)}
            onCancel={() => setEdit(null)}
          />
        </Modal>
      )}
      {quick && (
        <Modal
          title="Pikatoiminnot ja yleishaku"
          onClose={() => setQuick(false)}
        >
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
            <button onClick={() => navigate("budget")}>
              Siirry budjettiin
            </button>
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
                    (e.name + " " + e.category + " " + e.tags)
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
        <Modal
          title="Vahvista varmuuskopion palautus"
          onClose={() => setPending(null)}
        >
          <p>
            Palautus korvaa nykyiset tiedot. Vie nykyisestä tilanteesta
            varmuuskopio ennen jatkamista.
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
                if (
                  confirm(
                    "Korvataanko nykyinen talous vahvistetulla varmuuskopiolla?",
                  )
                ) {
                  let n = {
                    ...pending,
                    settings: { ...pending.settings, onboarded: true },
                  };
                  if (commit(n)) {
                    setPending(null);
                    setNotice(
                      "Varmuuskopio palautettu ja tietomalli validoitu.",
                    );
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
        <Modal
          title="Poista kaikki tietoni"
          onClose={() => setDeleteOpen(false)}
        >
          <p>
            Poistaa tämän sovelluksen selaintallennuksen. Ladatut varmuuskopiot
            eivät poistu. Ota ensin varmuuskopio.
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
            disabled={deleteText !== "POISTA"}
            onClick={() => {
              try {
                storage.clear();
                setS(empty());
                setUndo(null);
                setDeleteOpen(false);
                setNotice("Paikallinen data poistettu ja poisto tarkistettu.");
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
          <Categories
            s={s}
            kind={page as "incomes" | "expenses"}
            commit={commit}
          />
        </Modal>
      )}
    </>
  );
}
function CategoryImage({
  icon,
  size = 26,
}: {
  icon: CategoryIconId;
  size?: number;
}) {
  return (
    <span
      className="category-icon-frame"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        className="category-icon"
        src={categoryIconSources[icon]}
        width={size * 0.72}
        height={size * 0.72}
        alt=""
      />
    </span>
  );
}
function CompassResearchDetails({
  task,
  compact = false,
}: {
  task: PlannedAction;
  compact?: boolean;
}) {
  if (!task.sourceIds?.length && !task.boundary) return null;
  return (
    <details className={`compass-research-details${compact ? " compact" : ""}`}>
      <summary>
        {compact ? "Tietopohja ja rajat" : "Mihin havainto perustuu?"}
        {task.sourceIds?.length ? ` · ${task.sourceIds.join(", ")}` : ""}
      </summary>
      {task.sourceIds?.length ? (
        <ul>
          {task.sourceIds.map((id) => (
            <li key={id}>
              <strong>{guidanceSources[id].citation}.</strong>{" "}
              {guidanceSources[id].idea} {guidanceSources[id].boundary}
            </li>
          ))}
        </ul>
      ) : null}
      {task.boundary && (
        <p>
          <strong>Tämän huomion rajaus:</strong> {task.boundary}
        </p>
      )}
    </details>
  );
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
            ? "••• %"
            : progress.toLocaleString("fi-FI", { maximumFractionDigits: 0 }) +
              " %"}
        </span>
      </div>
      <progress
        value={progress}
        max={100}
        aria-label={e.name + " eteneminen"}
      />
      <small>
        {euro(e.amount)} / {euro(e.target)} ·{" "}
        {months === null
          ? "Aseta kuukausisäästö"
          : months === 0
            ? "Tavoite saavutettu"
            : `Arviolta ${months} kk ilman tuottoa`}
      </small>
    </div>
  );
}
function EntryForm({
  kind,
  item,
  categories,
  assets,
  onSave,
  onCancel,
}: {
  kind: Kind;
  item: Entry;
  categories: CategoryChoice[];
  assets: Entry[];
  onSave: (e: Entry) => void;
  onCancel: () => void;
}) {
  const { register, handleSubmit, setValue, watch } =
    useForm<Record<string, string>>();
  const [error, setError] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryActiveIndex, setCategoryActiveIndex] = useState(-1);
  const categoryValue = watch("category") || item.category;
  const matchingCategories = categories.filter((category) =>
    category.name
      .toLocaleLowerCase("fi-FI")
      .includes(categoryValue.trim().toLocaleLowerCase("fi-FI")),
  );
  const [entryDate, setEntryDate] = useState(item.date);
  const [formPercents, setFormPercents] = useState({
    ownership: item.ownership,
    rate: item.rate,
  });
  const recurring = kind === "incomes" || kind === "expenses";
  function adjustAmount(deltaEuros: number) {
    const input = document.querySelector<HTMLInputElement>(
      'dialog[open] input[name="amount"]',
    );
    let current = 0;
    try {
      current = input?.value.trim() ? money(input.value) : 0;
    } catch {
      current = 0;
    }
    const next = Math.max(0, current + deltaEuros * 100);
    setValue("amount", (next / 100).toFixed(2).replace(".", ","), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }
  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    try {
      let f = new FormData(ev.target as HTMLFormElement),
        v = { ...item, updatedAt: new Date().toISOString() };
      for (let k of [
        "name",
        "category",
        "date",
        "endDate",
        "description",
        "tags",
      ] as const)
        if (f.has(k)) {
          const raw = String(f.get(k));
          v[k] = k === "date" || k === "endDate" ? dateTextToIso(raw) : raw;
        }
      if (kind === "liabilities")
        v.linkedAssetId = String(f.get("linkedAssetId") || "");
      for (let k of [
        "amount",
        "purchasePrice",
        "payment",
        "target",
        "monthly",
      ] as const)
        if (f.has(k)) {
          const raw = String(f.get(k));
          v[k] = raw.trim() ? money(raw) : 0;
        }
      for (let k of ["quantity", "ownership", "rate"] as const)
        if (f.has(k)) v[k] = Number(String(f.get(k)).replace(",", "."));
      if (recurring) {
        v.recurrence = String(f.get("recurrence")) as Entry["recurrence"];
        v.status = String(f.get("status")) as Entry["status"];
        v.active = f.has("active");
      }
      if (kind === "expenses") v.essential = f.has("essential");
      if (kind === "expenses")
        v.tags = setExpenseTypeTags(
          v.tags,
          String(f.get("expenseType")) as
            | "consumption"
            | "saving"
            | "investment",
        );
      if (kind === "assets") v.liquid = f.has("liquid");
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
    type = "text",
    required = false,
  ) => {
    if (type === "date")
      return (
        <DatePickerField
          label={label}
          name={key}
          value={String(value)}
          required={required}
          minDate={key === "endDate" ? entryDate : undefined}
          onChange={key === "date" ? setEntryDate : () => {}}
        />
      );
    const moneyKeys = [
      "amount",
      "purchasePrice",
      "payment",
      "target",
      "monthly",
    ];
    const input = moneyKeys.includes(key) ? (
      <MoneyInput
        {...register(key)}
        id={key === "amount" ? "entry-amount" : undefined}
        defaultCents={Number(value)}
        required={required}
        aria-describedby={key === "amount" ? "amount-adjust-hint" : undefined}
      />
    ) : type === "percent" ? (
      <PercentField
        label={label}
        name={key}
        value={formPercents[key as "ownership" | "rate"]}
        min={key === "ownership" ? 0 : -99.9}
        max={100}
        onChange={(next) =>
          setFormPercents((current) => ({ ...current, [key]: next }))
        }
        hint={false}
      />
    ) : (
      <input
        {...register(key)}
        defaultValue={value}
        type={type}
        required={required}
        maxLength={type === "text" ? 200 : undefined}
      />
    );
    if (key === "amount") {
      return (
        <div className="amount-field">
          <label htmlFor="entry-amount">{label}</label>
          {input}
          <div
            className="amount-adjusters"
            role="group"
            aria-label="Summan pikasäädöt euroina"
          >
            {[-100, -10, 10, 100].map((delta) => (
              <button
                type="button"
                key={delta}
                aria-label={`${delta < 0 ? "Vähennä" : "Lisää"} ${Math.abs(delta)} euroa summasta`}
                onClick={() => adjustAmount(delta)}
              >
                {delta > 0 ? "+" : "−"}
                {Math.abs(delta)} €
              </button>
            ))}
          </div>
          <small id="amount-adjust-hint">
            Kirjoita numerot senttijärjestyksessä: 1250 = 12,50 €. Voit myös
            liittää koko summan.
          </small>
        </div>
      );
    }
    if (type === "percent") return input;
    return (
      <label>
        {label}
        {input}
      </label>
    );
  };
  return (
    <form
      onSubmit={handleSubmit((_values, event) =>
        submit(event as React.FormEvent<HTMLFormElement>),
      )}
    >
      {error && (
        <div role="alert" className="alert warning">
          {error}
        </div>
      )}
      <div className="form-grid">
        {field("Nimi", "name", item.name, "text", true)}
        <label>
          Kategoria
          <div className="category-picker">
            <input
              {...register("category")}
              defaultValue={item.category}
              required
              maxLength={100}
              autoComplete="off"
              role="combobox"
              aria-expanded={categoryOpen}
              aria-controls={`category-options-${kind}`}
              aria-activedescendant={
                categoryOpen &&
                categoryActiveIndex >= 0 &&
                matchingCategories.length
                  ? `category-option-${kind}-${Math.min(categoryActiveIndex, matchingCategories.length - 1)}`
                  : undefined
              }
              aria-autocomplete="list"
              onFocus={() => {
                setCategoryOpen(true);
                setCategoryActiveIndex(-1);
              }}
              onKeyDown={(event) => {
                const lastIndex = matchingCategories.length - 1;
                if (event.key === "Escape" && categoryOpen) {
                  event.preventDefault();
                  event.stopPropagation();
                  setCategoryOpen(false);
                } else if (event.key === "ArrowDown" && lastIndex >= 0) {
                  event.preventDefault();
                  setCategoryOpen(true);
                  setCategoryActiveIndex((index) =>
                    Math.min(index < 0 ? 0 : index + 1, lastIndex),
                  );
                } else if (event.key === "ArrowUp" && lastIndex >= 0) {
                  event.preventDefault();
                  setCategoryOpen(true);
                  setCategoryActiveIndex((index) =>
                    index < 0 ? lastIndex : Math.max(index - 1, 0),
                  );
                } else if (
                  event.key === "Home" &&
                  categoryOpen &&
                  lastIndex >= 0
                ) {
                  event.preventDefault();
                  setCategoryActiveIndex(0);
                } else if (
                  event.key === "End" &&
                  categoryOpen &&
                  lastIndex >= 0
                ) {
                  event.preventDefault();
                  setCategoryActiveIndex(lastIndex);
                } else if (
                  event.key === "Enter" &&
                  categoryOpen &&
                  matchingCategories.length > 0
                ) {
                  event.preventDefault();
                  const active = Math.max(
                    0,
                    Math.min(categoryActiveIndex, lastIndex),
                  );
                  setValue("category", matchingCategories[active].name, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  setCategoryOpen(false);
                }
              }}
            />
            <button
              type="button"
              className="category-picker-toggle"
              aria-label={categoryOpen ? "Sulje kategoriat" : "Avaa kategoriat"}
              aria-expanded={categoryOpen}
              aria-controls={`category-options-${kind}`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                const opening = !categoryOpen;
                setCategoryOpen(opening);
                if (opening) setCategoryActiveIndex(-1);
              }}
            >
              <ChevronDown
                size={18}
                aria-hidden="true"
                className={
                  categoryOpen
                    ? "category-picker-chevron open"
                    : "category-picker-chevron"
                }
              />
            </button>
            {categoryOpen && (
              <div
                id={`category-options-${kind}`}
                className="category-options"
                role="listbox"
                aria-label="Kategoriat"
              >
                {matchingCategories.length ? (
                  matchingCategories.map((category, index) => (
                    <div
                      id={`category-option-${kind}-${index}`}
                      role="option"
                      aria-selected={
                        categoryActiveIndex >= 0 &&
                        index ===
                          Math.min(
                            categoryActiveIndex,
                            matchingCategories.length - 1,
                          )
                      }
                      key={category.name}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setValue("category", category.name, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        setCategoryOpen(false);
                      }}
                    >
                      <CategoryImage icon={category.icon} size={21} />
                      <span>{category.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="category-options-empty">
                    Ei ehdotuksia. Voit kirjoittaa oman kategorian.
                  </span>
                )}
              </div>
            )}
          </div>
        </label>
        {field(
          kind === "investments"
            ? "Nykyinen yksikköhinta (€)"
            : kind === "goals"
              ? "Nykyinen säästösumma (€)"
              : kind === "liabilities"
                ? "Jäljellä oleva pääoma (€)"
                : "Summa / nykyarvo (€)",
          "amount",
          item.amount,
          "text",
          true,
        )}
        {field(
          kind === "assets" || kind === "investments"
            ? "Arvostuspäivä"
            : kind === "goals"
              ? "Tavoitepäivä (informatiivinen)"
              : "Päivämäärä / aloituspäivä",
          "date",
          item.date,
          "date",
          true,
        )}
        {recurring && (
          <>
            <label>
              Toistuvuus
              <select
                aria-label="Toistuvuus"
                name="recurrence"
                defaultValue={item.recurrence}
              >
                {Object.entries(recNames).map(([v, n]) => (
                  <option key={v} value={v}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tila / sarjan oletus
              <select
                aria-label="Tila"
                name="status"
                defaultValue={item.status}
              >
                <option value="actual">Toteutunut</option>
                <option value="planned">Suunniteltu</option>
                <option value="skipped">Ohitettu</option>
              </select>
            </label>
            {field(
              "Lopetuspäivä (valinnainen)",
              "endDate",
              item.endDate,
              "date",
            )}
            <label className="check">
              <input
                type="checkbox"
                name="active"
                defaultChecked={item.active}
              />
              Aktiivinen
            </label>
          </>
        )}
        {kind === "expenses" && (
          <>
            <label>
              Menon tyyppi
              <select
                aria-label="Menon tyyppi"
                name="expenseType"
                defaultValue={expenseType(item)}
              >
                <option value="consumption">Kulutus</option>
                <option value="saving">Säästösiirto</option>
                <option value="investment">Sijoitussiirto</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                name="essential"
                defaultChecked={item.essential}
              />
              Välttämätön meno
            </label>
          </>
        )}
        {kind === "assets" && (
          <>
            {field(
              "Omistusosuus (%)",
              "ownership",
              item.ownership,
              "percent",
              true,
            )}
            <label className="check">
              <input
                type="checkbox"
                name="liquid"
                defaultChecked={item.liquid}
              />
              Likvidi vara (hätävaralaskuri)
            </label>
          </>
        )}
        {kind === "investments" && (
          <>
            {field("Määrä", "quantity", item.quantity, "text", true)}
            {field(
              "Hankintahinta / yksikkö (€)",
              "purchasePrice",
              item.purchasePrice,
            )}
          </>
        )}
        {kind === "liabilities" && (
          <>
            {field("Vuosikorko (%)", "rate", item.rate, "percent", true)}
            {field("Kuukausierä (€)", "payment", item.payment)}
            <label>
              Linkitetty omaisuuserä
              <select
                name="linkedAssetId"
                defaultValue={item.linkedAssetId || ""}
              >
                <option value="">Ei linkitettyä omaisuutta</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} · {asset.category}
                  </option>
                ))}
              </select>
              <small>
                Laina vähennetään tästä omaisuudesta laskettaessa nykyistä omaa
                pääomaa.
              </small>
            </label>
          </>
        )}
        {kind === "goals" && (
          <>
            {field("Tavoitesumma (€)", "target", item.target, "text", true)}
            {field("Kuukausisäästö (€)", "monthly", item.monthly)}
          </>
        )}
        {field("Tunnisteet (pilkulla eroteltuna)", "tags", userTags(item.tags))}
      </div>
      <label>
        Kuvaus
        <textarea
          name="description"
          defaultValue={item.description}
          maxLength={2000}
        />
      </label>
      {recurring && (
        <p className="muted">
          Tila on toistuvan sarjan oletus. Yksittäisen kuukauden tapahtuman
          tilan voit muuttaa avaamalla tietuerivin lisätiedot.
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
  kind: "incomes" | "expenses";
  commit: (s: State) => boolean;
}) {
  const [name, setName] = useState(""),
    [error, setError] = useState(""),
    [chosenIcon, setChosenIcon] = useState<CategoryIconId | null>(null);
  function rename(id: string, value: string) {
    value = value.trim();
    let old = s.categories.find((c) => c.id === id)!;
    if (
      !value ||
      value.length > 100 ||
      s.categories.some(
        (c) => c.kind === kind && c.id !== id && c.name === value,
      )
    ) {
      setError("Anna yksilöllinen nimi (1–100 merkkiä).");
      return;
    }
    let budgets = { ...s.budgets };
    let budgetActuals = { ...s.budgetActuals };
    if (kind === "expenses") {
      for (let [m, b] of Object.entries(budgets)) {
        let n = { ...b };
        if (old.name in n) {
          n[value] = (n[value] || 0) + n[old.name];
          delete n[old.name];
        }
        budgets[m] = n;
      }
      for (let [m, actuals] of Object.entries(budgetActuals)) {
        let n = { ...actuals };
        if (old.name in n) {
          n[value] = (n[value] || 0) + n[old.name];
          delete n[old.name];
        }
        budgetActuals[m] = n;
      }
    }
    commit({
      ...s,
      categories: s.categories.map((c) =>
        c.id === id ? { ...c, name: value } : c,
      ),
      [kind]: s[kind].map((e) =>
        e.category === old.name ? { ...e, category: value } : e,
      ),
      budgets,
      budgetActuals,
    });
  }
  const availableOptional = optionalCategoryDefinitions.filter(
    (definition) =>
      definition.kind === kind &&
      !s.categories.some(
        (category) =>
          category.kind === kind && category.name === definition.name,
      ),
  );
  function addDefinition(definition: Category) {
    if (
      s.categories.some(
        (category) =>
          category.kind === kind && category.name === definition.name,
      )
    ) {
      setError("Kategoria on jo olemassa.");
      return;
    }
    if (commit({ ...s, categories: [...s.categories, definition] }))
      setError("");
  }
  function changeIcon(id: string, icon: CategoryIconId) {
    commit({
      ...s,
      categories: s.categories.map((category) =>
        category.id === id ? { ...category, icon } : category,
      ),
    });
  }
  return (
    <>
      <div className="category-editor-intro">
        <span className="eyebrow">SELKEÄT KATEGORIAT</span>
        <p>
          Aloituksessa näytetään pieni joukko yleisiä kategorioita. Lisää vain
          tarvitsemasi valinnaiset tai luo oma. Kuvakkeet ovat pieniä
          paikallisia kuvia; kodin ja asuntolainan kaltaiset aiheet käyttävät
          samaa kuvaa.
        </p>
        <small>
          Nimen muutos päivittää tietueet, budjetit ja käsin syötetyt toteumat.
          Arkistointi piilottaa valinnan mutta säilyttää historian.
        </small>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="category-list">
        {s.categories
          .filter((c) => c.kind === kind)
          .map((c) => (
            <div
              className={`category-management-row${c.archived ? " archived" : ""}`}
              key={c.id}
            >
              <CategoryImage icon={c.icon} size={32} />
              <input
                aria-label={`Kategorian ${c.name} nimi`}
                defaultValue={c.name}
                key={c.name}
                onBlur={(e) =>
                  e.target.value !== c.name && rename(c.id, e.target.value)
                }
              />
              <label className="category-icon-choice">
                <span className="sr-only">Kuvake</span>
                <CategoryImage icon={c.icon} size={25} />
                <select
                  aria-label={`Kuvake kategorialle ${c.name}`}
                  value={c.icon}
                  onChange={(event) =>
                    changeIcon(c.id, event.target.value as CategoryIconId)
                  }
                >
                  {categoryIconOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  commit({
                    ...s,
                    categories: s.categories.map((x) =>
                      x.id === c.id ? { ...x, archived: !x.archived } : x,
                    ),
                  })
                }
              >
                {c.archived ? "Palauta" : "Arkistoi"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    s[kind].some((e) => e.category === c.name) ||
                    Object.values(s.budgets).some((b) => c.name in b) ||
                    Object.values(s.budgetActuals).some((b) => c.name in b)
                  ) {
                    setError(
                      "Kategoria on käytössä. Arkistoi se poistamisen sijaan.",
                    );
                    return;
                  }
                  commit({
                    ...s,
                    categories: s.categories.filter((x) => x.id !== c.id),
                  });
                }}
              >
                Poista
              </button>
            </div>
          ))}
      </div>
      {availableOptional.length > 0 && (
        <details className="category-optional">
          <summary>
            Valinnaiset valmiit kategoriat
            <span>{availableOptional.length} lisättävissä</span>
          </summary>
          <div className="category-optional-grid">
            {availableOptional.map((definition) => (
              <button
                key={definition.name}
                type="button"
                className="category-optional-card"
                onClick={() =>
                  addDefinition({
                    id: uid(),
                    ...definition,
                    archived: false,
                  })
                }
              >
                <CategoryImage icon={definition.icon} size={32} />
                <span>{definition.name}</span>
                <strong>Lisää</strong>
              </button>
            ))}
          </div>
        </details>
      )}
      <form
        className="category-create-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (
            !name.trim() ||
            name.length > 100 ||
            s.categories.some(
              (c) => c.kind === kind && c.name === name.trim(),
            ) ||
            [
              ...defaultCategoryDefinitions,
              ...optionalCategoryDefinitions,
            ].some((c) => c.kind === kind && c.name === name.trim())
          ) {
            setError("Anna valmiskategorioista eroava yksilöllinen nimi.");
            return;
          }
          if (
            commit({
              ...s,
              categories: [
                ...s.categories,
                {
                  id: uid(),
                  name: name.trim(),
                  kind,
                  color: kind === "incomes" ? "#17604d" : "#245c78",
                  icon: chosenIcon || categoryIconFor(name, kind),
                  archived: false,
                },
              ],
            })
          ) {
            setName("");
            setChosenIcon(null);
            setError("");
          }
        }}
      >
        <div className="category-create-fields">
          <label>
            Oma kategoria
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </label>
          <label className="category-icon-choice category-icon-choice-new">
            <span>Kuvake</span>
            <CategoryImage
              icon={chosenIcon || categoryIconFor(name, kind)}
              size={32}
            />
            <select
              aria-label="Kuvake uudelle kategorialle"
              value={chosenIcon || categoryIconFor(name, kind)}
              onChange={(event) =>
                setChosenIcon(event.target.value as CategoryIconId)
              }
            >
              {categoryIconOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="primary">
          Lisää oma kategoria
        </button>
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
      name: "Oma skenaario",
      initial: 100000,
      monthly: 20000,
      rate: 4,
      fee: 0.5,
      inflation: 2,
      years: 10,
    }),
    [error, setError] = useState(""),
    [fi, setFi] = useState({
      annualExpenses: 3000000,
      annualOutsideIncome: 0,
      capital: 0,
      withdrawalRate: 4,
      monthlySaving: 20000,
      realAnnualReturn: 3,
      maxYears: 50,
    }),
    [fiError, setFiError] = useState("");
  let result = compound(q);
  const fiResult = fiTarget(
    fi.annualExpenses,
    fi.annualOutsideIncome,
    fi.capital,
    fi.withdrawalRate,
  );
  const monthsToFi = fiMonths(
    fi.capital,
    fi.monthlySaving,
    fi.realAnnualReturn,
    fiResult.target,
    fi.maxYears,
  );
  const updateFi = (key: keyof typeof fi, value: string) => {
    try {
      const parsed = [
        "withdrawalRate",
        "realAnnualReturn",
        "maxYears",
      ].includes(key)
        ? Number(value.replace(",", "."))
        : money(value);
      const next = { ...fi, [key]: parsed };
      const target = fiTarget(
        next.annualExpenses,
        next.annualOutsideIncome,
        next.capital,
        next.withdrawalRate,
      ).target;
      fiMonths(
        next.capital,
        next.monthlySaving,
        next.realAnnualReturn,
        target,
        next.maxYears,
      );
      setFi(next);
      setFiError("");
    } catch (e) {
      setFiError(String(e));
    }
  };
  const update = (k: string, v: string) => {
    try {
      let n = ["initial", "monthly"].includes(k)
        ? money(v)
        : Number(v.replace(",", "."));
      let next = { ...q, [k]: n };
      validate({ ...empty(), scenarios: [next] });
      setQ(next);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <>
      <section className="panel panel-plan">
        <h2>FI-pääomatavoite</h2>
        <p className="muted">
          Yhden vaiheen havainnollistus omilla oletuksillasi. Syötä vuosikulut
          ja muut vuosittaiset nettotulot nykyrahassa. Pääoma tarkoittaa
          nostettavissa olevaa sijoituspääomaa; jätä hätävara ja asunto pois,
          ellei niitä aiota käyttää kulutukseen.
        </p>
        <div className="form-grid">
          {(
            [
              ["Vuosikulut (€)", "annualExpenses"],
              ["Muut nettotulot vuodessa (€)", "annualOutsideIncome"],
              ["Nostettavissa oleva pääoma (€)", "capital"],
              ["Alkunostoprosentti (% / vuosi)", "withdrawalRate"],
              ["Kuukausittainen lisäsijoitus (€)", "monthlySaving"],
              ["Reaalituotto kulujen jälkeen (% / vuosi)", "realAnnualReturn"],
              ["Tarkastelujakso (vuotta, 1–50)", "maxYears"],
            ] as const
          ).map(([label, key]) =>
            [
              "annualExpenses",
              "annualOutsideIncome",
              "capital",
              "monthlySaving",
            ].includes(key) ? (
              <label className="scenario-money-field" key={key}>
                {label}
                <MoneyInput
                  defaultCents={fi[key as "annualExpenses"]}
                  onBlur={(e) => updateFi(key, e.target.value)}
                />
              </label>
            ) : ["withdrawalRate", "realAnnualReturn"].includes(key) ? (
              <PercentField
                key={key}
                label={label}
                value={fi[key as "withdrawalRate"]}
                min={key === "withdrawalRate" ? 0.1 : -99.9}
                max={50}
                onChange={(value) => updateFi(key, String(value))}
              />
            ) : (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  defaultValue={fi.maxYears}
                  onBlur={(e) => updateFi(key, e.target.value)}
                  inputMode="numeric"
                />
              </label>
            ),
          )}
        </div>
        {fiError && (
          <p role="alert" className="negative">
            {fiError}
          </p>
        )}
        <div className="stats">
          <article className="stat">
            <span>Vuotuinen rahoitusvaje</span>
            <strong>{euro(fiResult.gap)}</strong>
          </article>
          <article className="stat">
            <span>FI-pääomatavoite</span>
            <strong>
              {fiResult.target ? euro(fiResult.target) : "Ei rahoitusvajetta"}
            </strong>
          </article>
          <article className="stat">
            <span>Pääomaa puuttuu</span>
            <strong>{euro(fiResult.shortfall)}</strong>
          </article>
          <article className="stat">
            <span>Tavoitteen kattavuus</span>
            <strong>
              {fiResult.coverage === null ? "—" : pct(fiResult.coverage)}
            </strong>
          </article>
          <article className="stat">
            <span>Arvioitu aika FI-tavoitteeseen</span>
            <strong>
              {monthsToFi === null
                ? "Ei saavuta jaksolla"
                : monthsToFi === 0
                  ? "Tavoite saavutettu"
                  : `${Math.floor(monthsToFi / 12)} v ${monthsToFi % 12} kk`}
            </strong>
          </article>
        </div>
        <h3>Vuosikulujen herkkyys</h3>
        <p className="muted">
          Samat muut nettotulot ja nostoprosentti kaikissa riveissä. Kulut
          muuttuvat ±10 %.
        </p>
        <div className="table-wrap mobile-card-table fi-sensitivity-table">
          <table role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader">Kulutusoletus</th>
                <th role="columnheader">Vuosikulut</th>
                <th role="columnheader">Rahoitusvaje</th>
                <th role="columnheader">FI-pääomatavoite</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {(
                [
                  ["−10 %", 0.9],
                  ["Oma oletus", 1],
                  ["+10 %", 1.1],
                ] as const
              ).map(([label, factor]) => {
                const expenses = Math.round(fi.annualExpenses * factor);
                const gap = Math.max(0, expenses - fi.annualOutsideIncome);
                const target = Math.ceil(gap / (fi.withdrawalRate / 100));
                return (
                  <tr role="row" key={label}>
                    <th role="rowheader" scope="row" data-label="Kulutusoletus">
                      {label}
                    </th>
                    <td role="cell" data-label="Vuosikulut">
                      {euro(expenses)}
                    </td>
                    <td role="cell" data-label="Rahoitusvaje">
                      {euro(gap)}
                    </td>
                    <td role="cell" data-label="FI-pääomatavoite">
                      {target <= MAX ? euro(target) : "Yli laskentarajan"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Tavoite = max(0, vuosikulut − muut nettotulot) / (alkunostoprosentti /
          100). Nostoprosentti on käyttäjän oletus, ei turvallisuusraja tai
          ennuste. Verot, eläketulojen alkamisajat, tuottojärjestys ja kulujen
          muutokset eivät sisälly laskelmaan. Aika-arviossa sama reaalituotto
          toistuu kuukausittain ja lisäsijoitus tehdään kuun lopussa.
          Reaalituotto-oletuksen on sisällettävä sijoituskulut; tulos ei ole
          luvattu päivämäärä.
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
            ["Alkupääoma (€)", "initial"],
            ["Kuukausisijoitus (€)", "monthly"],
            ["Tuotto-oletus (% / vuosi)", "rate"],
            ["Vuosikulut (%)", "fee"],
            ["Inflaatio (% / vuosi)", "inflation"],
            ["Aika (vuotta, 1–50)", "years"],
          ].map(([label, k]) =>
            ["initial", "monthly"].includes(k) ? (
              <label className="scenario-money-field" key={k}>
                {label}
                <MoneyInput
                  key={k + q.id}
                  defaultCents={q[k as "initial"]}
                  onBlur={(e) => update(k, e.target.value)}
                />
              </label>
            ) : ["rate", "fee", "inflation"].includes(k) ? (
              <PercentField
                key={k}
                label={label}
                value={q[k as "rate"]}
                min={k === "fee" ? 0 : -99.9}
                max={50}
                onChange={(value) => update(k, String(value))}
                hint={false}
              />
            ) : (
              <label key={k}>
                {label}
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  defaultValue={q.years}
                  onBlur={(e) => update(k, e.target.value)}
                  inputMode="numeric"
                />
              </label>
            ),
          )}
        </div>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
        <div className="stats">
          {[
            ["Sijoitettu pääoma", result.invested],
            ["Laskennallinen kokonaisarvo", result.value],
            ["Laskennallinen tuotto", result.gain],
            ["Kulujen vaikutus", result.feeImpact],
            ["Inflaatiokorjattu arvo", result.real],
          ].map(([n, v]) => (
            <article className="stat" key={String(n)}>
              <span>{n}</span>
              <strong>{euro(Number(v))}</strong>
            </article>
          ))}
        </div>
        <p className="muted">
          Kuukausituotto = (1 + vuosituotto)^(1/12) − 1. Kulukerroin = (1 −
          vuosikulu)^(1/12). Tuotto ja kulut lasketaan kuukauden alussa,
          lisäsijoitus lopussa; tulos pyöristetään sentteihin kuukausittain.
          Reaaliarvo = loppuarvo / (1 + inflaatio)^vuodet. Verot ja
          markkinavaihtelu eivät sisälly.
        </p>
        <button
          className="primary"
          disabled={!!error || !Number.isSafeInteger(result.value)}
          onClick={() => {
            if (onSave({ ...q, id: uid() })) setError("");
          }}
        >
          Tallenna vertailuun
        </button>
      </section>
      <section className="panel">
        <h2>Skenaarioiden vertailu</h2>
        <p>Voit tallentaa ja vertailla useita omia oletuksia.</p>
        {scenarios.length ? (
          <div className="table-wrap mobile-card-table scenario-table">
            <table role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader">Nimi</th>
                  <th role="columnheader">Oletukset</th>
                  <th role="columnheader">Pääoma</th>
                  <th role="columnheader">Nimellisarvo</th>
                  <th role="columnheader">Reaaliarvo</th>
                  <th role="columnheader">Toiminnot</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {scenarios.map((v) => {
                  let r = compound(v);
                  return (
                    <tr role="row" key={v.id}>
                      <th role="rowheader" scope="row" data-label="Nimi">
                        {v.name}
                      </th>
                      <td role="cell" data-label="Oletukset">
                        {v.years} v · tuotto {v.rate} % · kulut {v.fee} % ·
                        inflaatio {v.inflation} %
                        <small>
                          {euro(v.initial)} + {euro(v.monthly)} / kk
                        </small>
                      </td>
                      <td role="cell" data-label="Pääoma">
                        {euro(r.invested)}
                      </td>
                      <td role="cell" data-label="Nimellisarvo">
                        {euro(r.value)}
                      </td>
                      <td role="cell" data-label="Reaaliarvo">
                        {euro(r.real)}
                      </td>
                      <td role="cell" data-label="Toiminnot">
                        <button onClick={() => setQ({ ...v, id: uid() })}>
                          Lataa laskuriin
                        </button>
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
          Vakioitu vuosikorko, kuukausittainen korko ja erä. Ei muita kuluja
          eikä koron muutoksia. Ei luotonottosuositus.
        </p>
        {liabilities.map((e) => {
          let r = payoff(e.amount, e.payment, e.rate);
          return (
            <p key={e.id}>
              <strong>{e.name}</strong>:{" "}
              {r
                ? `${r.months} kuukautta, korkoja ${euro(r.interest)}`
                : "Erä ei riitä tai maksuaika ylittää 100 vuotta."}
            </p>
          );
        })}
        {!liabilities.length && (
          <p>Lisää velka ja kuukausierä nähdäksesi arvion.</p>
        )}
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
  const [kind, setKind] = useState<Kind>("expenses"),
    [text, setText] = useState(""),
    [delimiter, setDelimiter] = useState(";"),
    [map, setMap] = useState<Record<string, number>>({}),
    [error, setError] = useState(""),
    [encoding, setEncoding] = useState("utf-8"),
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
      return { e, duplicate, line: i + 2, error: "" };
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
    accepted = evaluated
      .filter((r) => r.e && (!skipDuplicates || !r.duplicate))
      .map((r) => r.e!);
  function decode(b: ArrayBuffer, enc: string) {
    try {
      let t = new TextDecoder(enc, { fatal: enc === "utf-8" })
        .decode(b)
        .replace(/^\ufeff/, "");
      setText(t);
      let sep = t.split(/\r?\n/)[0].includes(";") ? ";" : ",";
      setDelimiter(sep);
      let header = parseCSV(t, sep)[0] || [];
      setMap(
        Object.fromEntries(
          csvFields.map((k) => [
            k,
            header.findIndex((x) => x.trim().toLowerCase() === k),
          ]),
        ),
      );
      setError("");
    } catch (e) {
      setError(
        "Merkistöä ei voitu lukea. Kokeile Windows-1252:ta. " + String(e),
      );
    }
  }
  return (
    <>
      <section className="panel">
        <h2>JSON-varmuuskopio</h2>
        <p>
          Varmuuskopio sisältää koko talouden. Palautus validoidaan ja
          vahvistetaan ennen nykyisten tietojen korvaamista. Eheystarkistus
          tunnistaa tahattomia muutoksia, ei todista tiedoston aitoutta.
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
              e.target.value = "";
            }}
          />
        </label>
      </section>
      <section className="panel">
        <h2>CSV-tuonti ja vienti</h2>
        <p className="muted">
          Tuonti lisää tietueita. Tuonnin voi kumota tämän istunnon aikana.
          Summat ovat CSV:ssä euroina, sisäisesti sentteinä. CSV ei säilytä
          velkojen ja omaisuuserien välisiä linkkejä; käytä JSON-varmuuskopiota
          koko tietomallin siirtämiseen.
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
                setError("");
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
                "talous-" + kind + "-" + today() + ".csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            Vie {names[kind].toLowerCase()} CSV:nä
          </button>
          <button
            onClick={() =>
              download(
                exportCSV([]),
                "talous-csv-pohja.csv",
                "text/csv;charset=utf-8",
              )
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
                setError("Enimmäiskoko 5 Mt.");
                return;
              }
              let b = await f.arrayBuffer();
              setBytes(b);
              decode(b, encoding);
              e.target.value = "";
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
              Nimi ja summa ovat pakollisia. Päivämäärä voi olla dd.mm.yyyy tai
              yyyy-mm-dd. Puuttuva päivämäärä on tänään.
            </p>
            <div className="form-grid">
              {csvFields.map((k) => (
                <label key={k}>
                  {k}
                  {["name", "amount"].includes(k) ? " *" : ""}
                  <select
                    value={map[k] ?? -1}
                    onChange={(e) =>
                      setMap({ ...map, [k]: Number(e.target.value) })
                    }
                  >
                    <option value={-1}>Ei saraketta</option>
                    {rows[0].map((h, i) => (
                      <option key={i} value={i}>
                        {h || "Sarake " + (i + 1)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <h3>Esikatselu (enintään 5 riviä)</h3>
            <div
              className="table-wrap csv-preview-table"
              role="region"
              aria-label="CSV-esikatselu, vieritä sivusuunnassa tarvittaessa"
              tabIndex={0}
            >
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
              {evaluated.length} riviä · {errors.length} virheellistä ·{" "}
              {dups.length} mahdollista duplikaattia · {accepted.length}{" "}
              tuotavaa.
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
                  setText("");
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
createRoot(document.getElementById("root")!).render(<App />);
