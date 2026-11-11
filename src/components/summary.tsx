import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { CircleHelp, Eye, Pencil, Trash2, X } from "lucide-react";

export function InfoPopup({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);
  return <span className={`info-popup ${className}`.trim()}>
    <button type="button" className="info-popup-trigger" aria-label={`Lisätieto: ${title}`} title={title} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      <CircleHelp size={19} aria-hidden="true" />
    </button>
    <dialog ref={dialog} className="info-popup-dialog" aria-labelledby={titleId} onClose={() => setOpen(false)} onCancel={event => event.stopPropagation()} onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }} onClick={event => { if (event.target === event.currentTarget) setOpen(false); }}>
      <div className="info-popup-heading"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Sulje ohje" title="Sulje" onClick={() => setOpen(false)}><X size={20} aria-hidden="true" /></button></div>
      <div className="info-popup-content">{children}</div>
    </dialog>
  </span>;
}

/** A value stays primary; a method is available without repeating it underneath. */
export function MetricCard({ label, value, note, children }: { label: string; value: string; note?: string; children?: ReactNode }) {
  return <div className="stat metric-card">
    <span>{label}</span><strong>{value}</strong>
    {children}
    {note && <InfoPopup className="metric-info" title={label}><p>{note}</p></InfoPopup>}
  </div>;
}
export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "positive" }) {
  return <span className={`status-badge tone-${tone}`}>{children}</span>;
}
export function ContextDetails({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return <InfoPopup title={title} className={className}>{children}</InfoPopup>;
}
/** Raw percentage remains readable above 100%; the visual track stops at its end. */
export function BudgetUsage({ actual, budget, label }: { actual: number; budget: number; label: string }) {
  if (budget <= 0) return <span className="budget-usage-empty">Ei budjettia</span>;
  const percent = actual / budget * 100;
  const text = `${new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 }).format(percent)} %`;
  return <span className={`budget-usage${percent > 100 ? " exceeded" : ""}`} role="group" aria-label={`${label}: ${text}`}>
    <progress aria-hidden="true" max={100} value={Math.min(100, Math.max(0, percent))} /><span>{text}</span>
  </span>;
}

/** Same accessible controls in lists and detail cards; deletion keeps its caller's protection. */
export function RowActions({ name, onEdit, onDelete, editLabel, onOpen }: { name: string; onOpen?: () => void; onEdit: () => void; onDelete?: () => void; editLabel?: string }) {
  const editName = editLabel || `Muokkaa ${name}`;
  return <div className="row-actions unified-row-actions">
    {onOpen && <button type="button" aria-label={`Avaa ${name}`} title={`Avaa ${name}`} onClick={onOpen}><Eye size={18} aria-hidden="true" /></button>}
    <button type="button" aria-label={editName} title={editName} onClick={onEdit}><Pencil size={18} aria-hidden="true" /></button>
    {onDelete && <button type="button" aria-label={`Poista ${name}`} title={`Poista ${name}`} onClick={onDelete}><Trash2 size={18} aria-hidden="true" /></button>}
  </div>;
}

/** Positive always means room in the frame or savings above the minimum. */
export function SignedAmount({ amount, format, label }: { amount: number; format: (amount: number) => string; label: string }) {
  const value = `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${format(Math.abs(amount))}`;
  return <span className={`signed-amount ${amount > 0 ? "is-positive" : amount < 0 ? "is-negative" : "is-zero"}`} title={label}><span className="sr-only">{label}: </span><span className="signed-value">{value}</span></span>;
}
