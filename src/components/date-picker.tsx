import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { today } from '../domain/model';
import { validDate } from '../domain/calculations';

export function dateTextToIso(text: string) {
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
export function DatePickerField({
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
