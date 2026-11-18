import { useMemo, useState, type FormEvent } from "react";
import { today, type Entry, type EntryPriceChange } from "../domain/model";
import { money, occurrenceAmount, occurrenceStatus, scheduledOccurrences } from "../domain/calculations";
import { shiftMonth } from "../domain/monthly-planning";

export function PriceHistoryEditor({
  item,
  format,
  onSave,
}: {
  item: Entry;
  format: (amount: number) => string;
  onSave: (changes: EntryPriceChange[]) => boolean;
}) {
  const [startDate, setStartDate] = useState(() => item.date > today() ? item.date : today());
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState("");
  const history = item.priceHistory || [];
  const nextAffectedOccurrence = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return null;
    for (let offset = 0; offset <= 24; offset++) {
      let month: string;
      try {
        month = shiftMonth(startDate.slice(0, 7), offset);
      } catch {
        break;
      }
      const date = scheduledOccurrences(item, month).find(value =>
        value >= startDate && occurrenceStatus(item, value) !== "skipped" &&
        !Object.hasOwn(item.occurrenceAmounts, value),
      );
      if (date) return { date, amount: occurrenceAmount(item, date) };
    }
    return null;
  }, [item, startDate]);
  const proposedAmount = useMemo(() => {
    try {
      const amount = amountText ? money(amountText) : null;
      return amount !== null && amount >= 0 ? amount : null;
    } catch { return null; }
  }, [amountText]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const amount = money(amountText);
      if (amount < 0) throw Error("Hinta ei voi olla negatiivinen.");
      if (startDate < item.date) throw Error("Alkamispäivä ei voi olla ennen kirjauksen alkamista.");
      if (history.find(change => change.startDate === startDate)?.amount === amount) {
        setAmountText("");
        setError("");
        return;
      }
      if (startDate < today() && !confirm(`Takautuva hinnanmuutos muuttaa laskettuja summia alkaen ${nextAffectedOccurrence?.date || startDate}. Jatketaanko?`)) return;
      const next = [...history.filter(change => change.startDate !== startDate), { startDate, amount }]
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      if (onSave(next)) {
        setAmountText("");
        setError("");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }

  function remove(change: EntryPriceChange) {
    if (change.startDate < today() &&
        !confirm(`Poistetaanko hinnanmuutos ${change.startDate}? Tapahtumien laskettu summa muuttuu tästä alkamispäivästä eteenpäin.`)) return;
    onSave(history.filter(item => item.startDate !== change.startDate));
  }

  return (
    <details className="price-history-editor">
      <summary>Hinnanmuutokset ({history.length})</summary>
      <p>Lisää sarjan uusi oletushinta alkamispäivästä eteenpäin. Päiväkohtainen summakorjaus ohittaa sarjan hinnan.</p>
      {history.length > 0 && (
        <ul className="price-history-list">
          {history.map(change => (
            <li key={change.startDate}>
              <span>{change.startDate.split("-").reverse().join(".")} · <strong>{format(change.amount)}</strong></span>
              <button type="button" onClick={() => remove(change)}>Poista</button>
            </li>
          ))}
        </ul>
      )}
      <form className="price-history-form" onSubmit={save}>
        <label>Alkamispäivä<input type="date" min={item.date} value={startDate} onChange={event => setStartDate(event.target.value)} required /></label>
        <label>Uusi hinta (€)<input type="text" inputMode="decimal" value={amountText} onChange={event => setAmountText(event.target.value)} placeholder="esim. 39,90" required /></label>
        {nextAffectedOccurrence && proposedAmount !== null && <p className="price-history-preview">Ensimmäinen muuttuva erä: {nextAffectedOccurrence.date.split("-").reverse().join(".")} · {format(nextAffectedOccurrence.amount)} → <strong>{format(proposedAmount)}</strong></p>}
        {startDate < today() && <p className="price-history-warning">Takautuva muutos vaikuttaa kirjattujen tapahtumien summiin alkamispäivästä alkaen. Tapahtumakohtaiset summakorjaukset jäävät voimaan.</p>}
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="primary">Tallenna hinnanmuutos</button>
      </form>
    </details>
  );
}
