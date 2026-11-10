import { CalendarCheck2, CalendarDays, CalendarOff, CircleCheck, CircleDashed, Clock3, Pause, Repeat2, SkipForward } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Recurrence, EntryStatus } from "../domain/model";

type EventState = EntryStatus | "mixed" | "none" | "paused";
const rhythms: Record<Recurrence, string> = {
  once: "1×", weekly: "vk", biweekly: "2 vk", monthly: "kk",
  bimonthly: "2 kk", quarterly: "3 kk", semiannual: "6 kk", yearly: "v",
};
const states: Record<EventState, { icon: LucideIcon; tone: string }> = {
  actual: { icon: CircleCheck, tone: "actual" },
  planned: { icon: Clock3, tone: "planned" },
  skipped: { icon: SkipForward, tone: "neutral" },
  mixed: { icon: CircleDashed, tone: "mixed" },
  none: { icon: CalendarOff, tone: "neutral" },
  paused: { icon: Pause, tone: "neutral" },
};

/** Tap/keyboard exposes the same explanation as hover, without relying on colour. */
function EventIndicator({ icon: Icon, label, code, tone, kind }: {
  icon: LucideIcon; label: string; code?: string; tone: string; kind: string;
}) {
  return <details className={`event-indicator event-${tone}`} data-event-kind={kind}>
    <summary aria-label={label} title={label}>
      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
      {code && <span className="event-rhythm" aria-hidden="true">{code}</span>}
    </summary>
    <span className="event-indicator-explanation">{label}</span>
  </details>;
}
export function RecurrenceIndicator({ recurrence, label }: { recurrence: Recurrence; label: string }) {
  const icon = recurrence === "once" ? CalendarCheck2 : recurrence === "yearly" ? CalendarDays : Repeat2;
  return <EventIndicator icon={icon} label={`Toistuvuus: ${label}`} code={rhythms[recurrence]} tone="recurrence" kind="recurrence" />;
}
export function EventStatusIndicator({ status, label }: { status: EventState; label: string }) {
  const { icon, tone } = states[status];
  return <EventIndicator icon={icon} label={label} tone={tone} kind={status} />;
}
