import { occurrenceAmount, occurrenceStatus, scheduledOccurrences } from "./calculations";
import type { Entry, Kind, State } from "./model";

export function reconciliationCandidates(state: State, kind: Kind, imported: Entry): Entry[] {
  if (kind !== "incomes" && kind !== "expenses") return [];
  return state[kind].filter(item =>
    scheduledOccurrences(item, imported.date.slice(0, 7)).includes(imported.date) &&
    occurrenceStatus(item, imported.date) === "planned" &&
    occurrenceAmount(item, imported.date) === imported.amount,
  );
}

export type Reconciliation = { imported: Entry; targetId: string };
export function applyCsvReconciliation(state: State, kind: Kind, additions: Entry[], matches: Reconciliation[]): State {
  if (matches.length && kind !== "incomes" && kind !== "expenses") throw Error("Täsmäytys on käytettävissä vain tuloille ja menoille.");
  const used = new Set<string>();
  let entries = [...state[kind]];
  for (const { imported, targetId } of matches) {
    const key = `${targetId}|${imported.date}`;
    if (used.has(key)) throw Error("Samaa tapahtumaa ei voi täsmäyttää kahdesti.");
    used.add(key);
    const target = entries.find(item => item.id === targetId);
    if (!target || !reconciliationCandidates({ ...state, [kind]: entries }, kind, imported).some(item => item.id === targetId))
      throw Error("Täsmäytettävä tapahtuma on muuttunut. Tarkista tuonti uudelleen.");
    entries = entries.map(item => item.id === targetId ? {
      ...item, occurrenceStatuses: { ...item.occurrenceStatuses, [imported.date]: "actual" },
    } : item);
  }
  return { ...state, [kind]: [...entries, ...additions] };
}
