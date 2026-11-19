import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

function monthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}
export function monthIndexKey(index: number) {
  return monthKey(Math.floor(index / 12), index % 12);
}
export function MonthPicker({
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
