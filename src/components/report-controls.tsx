import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContextDetails } from './summary';
import { MonthPicker } from './month-picker';

export type ReportSortOption = { value: string; label: string };

export function ReportRangeControl({
  start,
  end,
  mode,
  startIndex,
  endIndex,
  valid,
  length,
  months,
  firstMonthIndex,
  lastMonthIndex,
  onStart,
  onEnd,
  onMode,
  onShift,
  onRailEnd,
}: {
  start: string;
  end: string;
  mode: "month" | "range";
  startIndex: number | null;
  endIndex: number | null;
  valid: boolean;
  length: number;
  months: string[];
  firstMonthIndex: number;
  lastMonthIndex: number;
  onStart: (month: string) => void;
  onEnd: (month: string) => void;
  onMode: (mode: "month" | "range") => void;
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
    <div className={`report-range-control${mode === "month" ? " single-month" : ""}`}>
      {mode === "range" && <div className="report-range-heading"><div><span className="eyebrow">RAPORTOINTIJAKSO</span><strong>{valid ? `${monthLabel(start)} – ${monthLabel(end)}` : "Tarkista aikaväli"}</strong></div><small>{valid ? `${length} ${length === 1 ? "kuukausi" : "kuukautta"}` : "Valitse alku ja loppu"}</small></div>}
      <div className="report-period-mode" role="group" aria-label="Raportin aikarajaus">
        <button
          type="button"
          aria-pressed={mode === "month"}
          onClick={() => onMode("month")}
        >
          Kuukausi
        </button>
        <button
          type="button"
          aria-pressed={mode === "range"}
          onClick={() => onMode("range")}
        >
          Aikaväli
        </button>
      </div>
      <div
        className="report-range-navigator"
        role="group"
        aria-label={mode === "month" ? "Vaihda raportointikuukautta" : "Valitse raportin alku ja loppu"}
      >
        <button
          type="button"
          aria-label={mode === "month" ? "Edellinen raportointikuukausi" : "Siirrä aikaväliä kuukausi taaksepäin"}
          title={mode === "month" ? "Edellinen kuukausi" : "Siirrä aikaväliä kuukausi taaksepäin"}
          disabled={
            !valid || startIndex === null || startIndex <= firstMonthIndex
          }
          onClick={() => onShift(-1)}
        >
          <ChevronLeft size={19} aria-hidden="true" />
        </button>
        <div className={`report-range-fields${mode === "month" ? " report-single-month-field" : ""}`}>
          {mode === "month" ? (
            <MonthPicker
              value={end}
              label="Kuukausi"
              ariaLabel="Raportointikuukausi"
              onChange={onEnd}
            />
          ) : (
            <>
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
            </>
          )}
        </div>
        <button
          type="button"
          aria-label={mode === "month" ? "Seuraava raportointikuukausi" : "Siirrä aikaväliä kuukausi eteenpäin"}
          title={mode === "month" ? "Seuraava kuukausi" : "Siirrä aikaväliä kuukausi eteenpäin"}
          disabled={!valid || endIndex === null || endIndex >= lastMonthIndex}
          onClick={() => onShift(1)}
        >
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>
      {mode === "range" && <div
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
      </div>}
      <ContextDetails title="Aikavalinnan ohje"><p className="report-range-hint">
        {mode === "month"
          ? "Valitse kuukausi kalenterista tai siirry nuolilla edelliseen ja seuraavaan."
          : "Valitse alku ja loppu, siirrä aikaväliä nuolilla tai vieritä kuukausilistaa."}
      </p></ContextDetails>
      {!valid && (
        <p className="alert warning" role="alert">
          Aikavälin pitää olla enintään 120 kuukautta ja loppukuukausi ei voi
          olla ennen alkua.
        </p>
      )}
    </div>
  );
}
export function ReportTableControls({
  query,
  onQuery,
  sort,
  onSort,
  sortOptions,
  visible,
  total,
}: {
  query: string;
  onQuery: (value: string) => void;
  sort: string;
  onSort: (value: string) => void;
  sortOptions: ReportSortOption[];
  visible: number;
  total: number;
}) {
  return (
    <div className="report-table-controls" role="search">
      <label>
        <span>Suodata taulukkoa</span>
        <input
          type="search"
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder="Hae taulukon rivejä"
          aria-label="Suodata raporttitaulukkoa"
        />
      </label>
      <label>
        <span>Lajittelu</span>
        <select
          value={sort}
          onChange={(event) => onSort(event.target.value)}
          aria-label="Lajittele raporttitaulukko"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <small aria-live="polite">
        {visible} / {total} riviä
      </small>
    </div>
  );
}
