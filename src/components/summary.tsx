import type { ReactNode } from "react";
import { CircleHelp, Pencil, Trash2 } from "lucide-react";

/** A value stays primary; a method is available without repeating it underneath. */
export function MetricCard({ label, value, note, children }: { label: string; value: string; note?: string; children?: ReactNode }) {
  return <div className="stat metric-card">
    <span>{label}</span><strong>{value}</strong>
    {children}
    {note && <details className="metric-note"><summary aria-label={`Lisätieto: ${label}`} title={`Lisätieto: ${label}`}><CircleHelp size={18} aria-hidden="true" /></summary><p>{note}</p></details>}
  </div>;
}
export function StatusBadge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warning" | "positive" }) {
  return <span className={`status-badge tone-${tone}`}>{children}</span>;
}
export function ContextDetails({ title, children }: { title: string; children: ReactNode }) {
  return <details className="ux-explanation"><summary>{title}</summary>{children}</details>;
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
export function RowActions({ name, onEdit, onDelete, editLabel }: { name: string; onEdit: () => void; onDelete?: () => void; editLabel?: string }) {
  const editName = editLabel || `Muokkaa ${name}`;
  return <div className="row-actions unified-row-actions">
    <button type="button" aria-label={editName} title={editName} onClick={onEdit}><Pencil size={18} aria-hidden="true" /></button>
    {onDelete && <button type="button" aria-label={`Poista ${name}`} title={`Poista ${name}`} onClick={onDelete}><Trash2 size={18} aria-hidden="true" /></button>}
  </div>;
}
