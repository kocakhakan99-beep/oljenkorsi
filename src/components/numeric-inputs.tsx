import React, { useEffect, useRef, useState } from 'react';

export function formatMoneyCents(cents: number) {
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
export function MoneyInput({ defaultCents, onChange, ...props }: MoneyInputProps) {
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
      defaultValue={props.value !== undefined ? undefined : defaultCents === null ? "" : formatMoneyCents(defaultCents)}
      onChange={handleChange}
    />
  );
}
export function percentText(value: number) {
  return new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 2 }).format(
    value,
  );
}
export function PercentField({
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
