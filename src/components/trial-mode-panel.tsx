import { useEffect, useMemo, useState } from "react";
import { money, occurrenceAmount } from "../domain/calculations";
import type { Entry, State } from "../domain/model";
import { trialProjection, type TrialAdjustments } from "../domain/trial-mode";

function TrialDeltaInput({
  label,
  cents,
  maxReduction,
  format,
  onSave,
}: {
  label: string;
  cents: number;
  maxReduction: number;
  format: (amount: number) => string;
  onSave: (value: number) => void;
}) {
  const [text, setText] = useState((cents / 100).toFixed(2).replace(".", ","));
  const [error, setError] = useState("");
  useEffect(() => setText((cents / 100).toFixed(2).replace(".", ",")), [cents]);
  function save() {
    try {
      const value = text.trim() ? money(text) : 0;
      if (value < -maxReduction) throw Error(`Vähennys voi olla enintään ${format(maxReduction)} kuukaudessa.`);
      setText((value / 100).toFixed(2).replace(".", ","));
      setError("");
      onSave(value);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tarkista summa.");
    }
  }
  return <label className="trial-delta-input">{label}
    <span><input type="text" inputMode="decimal" value={text} onChange={event => setText(event.target.value)} onBlur={save} aria-label={label} /> € / kk</span>
    {error && <small role="alert">{error}</small>}
  </label>;
}

function TrialPriceInput({
  cents,
  onSave,
}: {
  cents: number;
  onSave: (amount: number) => void;
}) {
  const [text, setText] = useState((cents / 100).toFixed(2).replace(".", ","));
  const [error, setError] = useState("");
  useEffect(() => setText((cents / 100).toFixed(2).replace(".", ",")), [cents]);
  return <label>Uusi hinta (€)<input type="text" inputMode="decimal" value={text} onChange={event => setText(event.target.value)} onBlur={() => {
    try {
      const amount = money(text);
      if (amount < 0) throw Error("Hinta ei voi olla negatiivinen.");
      setError("");
      setText((amount / 100).toFixed(2).replace(".", ","));
      onSave(amount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tarkista hinta.");
    }
  }} />{error && <small role="alert">{error}</small>}</label>;
}

function recurringConsumption(expenses: Entry[]) {
  return expenses.filter(item => item.active && item.recurrence !== "once" && item.expenseType === "consumption");
}

export function TrialModePanel({
  state,
  asOf,
  adjustments,
  format,
  onChange,
}: {
  state: State;
  asOf: string;
  adjustments: TrialAdjustments;
  format: (amount: number) => string;
  onChange: (next: TrialAdjustments) => void;
}) {
  const projection = useMemo(() => {
    try { return { result: trialProjection(state, asOf, adjustments), error: "" }; }
    catch (reason) { return { result: null, error: reason instanceof Error ? reason.message : "Kokeilua ei voitu laskea." }; }
  }, [state, asOf, adjustments]);
  const expenses = recurringConsumption(state.expenses);
  const selectedExpense = expenses.find(item => item.id === adjustments.expense?.entryId);
  const currentExpenseAmount = selectedExpense ? adjustments.expense?.action === "price" ? adjustments.expense.amount : occurrenceAmount(selectedExpense, asOf) : 0;
  const result = projection.result;

  return <section className="panel trial-mode-panel" aria-labelledby="trial-mode-title">
    <div className="section-head"><div><span className="eyebrow">ISTUNNON AIKAINEN · EI TALLENNU</span><h2 id="trial-mode-title">Kokeile omaa taloutta</h2></div></div>
    <p>Muuta oletuksia ja katso arvioitu vaikutus seuraavan 12 kuukauden kirjattuihin tuloihin ja kulutusmenoihin. Tämä on kassavirran laskelma, ei pankkitilin saldoennuste. Kokeilu säilyy vain tämän välilehden muistissa; sivun lataus tai sulkeminen päättää sen.</p>
    <div className="trial-adjustment-grid">
      <TrialDeltaInput label="Tulojen muutos" cents={adjustments.monthlyIncomeDelta} maxReduction={result?.maxIncomeReduction || 0} format={format} onSave={value => onChange({ ...adjustments, monthlyIncomeDelta: value })} />
      <TrialDeltaInput label="Kulutusmenojen muutos" cents={adjustments.monthlyConsumptionDelta} maxReduction={result?.maxConsumptionReduction || 0} format={format} onSave={value => onChange({ ...adjustments, monthlyConsumptionDelta: value })} />
      <label>Kokeiltava toistuva meno<select value={adjustments.expense?.entryId || ""} onChange={event => {
        const item = expenses.find(expense => expense.id === event.target.value);
        onChange({ ...adjustments, expense: item ? { entryId: item.id, action: "remove", amount: 0 } : null });
      }}>
        <option value="">Ei muutosta</option>
        {expenses.map(item => <option key={item.id} value={item.id}>{item.name} · {format(occurrenceAmount(item, asOf))}</option>)}
      </select></label>
      {selectedExpense && <label>Mitä jos?<select value={adjustments.expense?.action || "remove"} onChange={event => {
        const action = event.target.value as "remove" | "price";
        onChange({ ...adjustments, expense: { entryId: selectedExpense.id, action, amount: action === "price" ? occurrenceAmount(selectedExpense, asOf) : 0 } });
      }}><option value="remove">Meno poistuu</option><option value="price">Meno saa uuden hinnan</option></select></label>}
      {selectedExpense && adjustments.expense?.action === "price" && <TrialPriceInput cents={currentExpenseAmount} onSave={amount => onChange({ ...adjustments, expense: { entryId: selectedExpense.id, action: "price", amount } })} />}
    </div>
    {result ? <>
      <div className="trial-projection-grid">
        <article><small>Kuukausittainen käyttövara · lähtötilanne</small><strong>{format(result.baseline.averageMonthlyDisposable)}</strong><span>{format(result.baseline.income)} tulot − {format(result.baseline.consumption)} kulutusmenot / 12 kk</span></article>
        <article><small>Kuukausittainen käyttövara · kokeilu</small><strong>{format(result.adjusted.averageMonthlyDisposable)}</strong><span>{format(result.adjusted.income)} tulot − {format(result.adjusted.consumption)} kulutusmenot / 12 kk</span></article>
        <article className={result.difference >= 0 ? "positive" : "negative"}><small>Muutos 12 kuukaudessa</small><strong>{result.difference > 0 ? "+" : ""}{format(result.difference)}</strong><span>Käyttövaran yhteismuutos lähtötilanteeseen.</span></article>
      </div>
      <p className="trial-assumptions">Lähtötilanne on kopioitu {asOf}. Kokeilu käyttää seuraavien 12 kalenterikuukauden tulevia tapahtumia. Säästämistä, sijoittamista, alkusaldoa, veroja tai korkotuottoja ei lasketa mukaan. Kuukausimuutos lisätään jokaiseen tarkasteltavaan kuukauteen; kuukausitason tuloa tai menoa ei voi laskea alle nollan.</p>
    </> : <p role="alert">{projection.error}</p>}
  </section>;
}
