import { useEffect, useMemo, useState } from "react";
import { annualReserveSummary } from "../domain/annual-planning";
import { expenseType, money } from "../domain/calculations";
import type { State } from "../domain/model";

const recurrenceName: Record<string, string> = {
  once: "Kertaluonteinen",
  weekly: "Viikoittain",
  biweekly: "Joka toinen viikko",
  monthly: "Kuukausittain",
  bimonthly: "Joka toinen kuukausi",
  quarterly: "Neljännesvuosittain",
  semiannual: "Puolivuosittain",
  yearly: "Vuosittain",
};

function shortDate(value: string) {
  return value.split("-").reverse().join(".");
}

function ReservationInput({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number;
  onSave: (amount: number) => void;
}) {
  const [text, setText] = useState(value ? (value / 100).toFixed(2).replace(".", ",") : "");
  const [error, setError] = useState("");
  useEffect(() => {
    setText(value ? (value / 100).toFixed(2).replace(".", ",") : "");
  }, [value]);

  function save() {
    if (!text.trim()) {
      setError("");
      onSave(0);
      return;
    }
    try {
      const amount = money(text);
      if (amount < 0) throw Error("Varaus ei voi olla negatiivinen.");
      setError("");
      setText((amount / 100).toFixed(2).replace(".", ","));
      onSave(amount);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Tarkista summa.");
    }
  }

  return <label className="annual-reservation-input">{label}
    <span><input type="text" inputMode="decimal" value={text} onChange={event => setText(event.target.value)} onBlur={save} aria-label={label} placeholder="0,00" /> €</span>
    {error && <small role="alert">{error}</small>}
  </label>;
}

export function AnnualCalendar({
  state,
  asOf,
  format,
  householdLabel,
  onPlanChange,
  onReserveChange,
  onUseReservation,
  onDeleteReservation,
  onAddExpense,
}: {
  state: State;
  asOf: string;
  format: (amount: number) => string;
  householdLabel: string;
  onPlanChange: (expenseId: string, selected: boolean) => void;
  onReserveChange: (expenseId: string, occurrenceDate: string, amount: number) => void;
  onUseReservation: (expenseId: string, occurrenceDate: string) => void;
  onDeleteReservation: (expenseId: string, occurrenceDate: string) => void;
  onAddExpense: (recurrence: "once" | "monthly") => void;
}) {
  const summary = useMemo(() => annualReserveSummary(state, asOf), [state, asOf]);
  const selected = new Set(state.annualReservePlans || []);
  const horizonEnd = `${summary.endMonth}-31`;
  const candidates = state.expenses.filter(item =>
    selected.size < 200 && item.active && item.status !== "skipped" && expenseType(item) === "consumption" && !selected.has(item.id) &&
    (!item.endDate || item.endDate >= asOf) &&
    (item.recurrence === "once" ? item.date >= asOf && item.date <= horizonEnd : item.date <= horizonEnd),
  ).sort((a, b) => a.name.localeCompare(b.name, "fi")).slice(0, 200);
  const [candidateId, setCandidateId] = useState("");
  useEffect(() => {
    if (!candidates.some(item => item.id === candidateId)) setCandidateId(candidates[0]?.id || "");
  }, [candidates, candidateId]);

  const monthLabel = (month: string) => {
    const [year, monthNumber] = month.split("-").map(Number);
    return new Intl.DateTimeFormat("fi-FI", { month: "long", year: "numeric" }).format(new Date(year, monthNumber - 1, 1));
  };

  return <div className="annual-calendar-page">
    <section className="panel annual-calendar-intro">
      <div><span className="eyebrow">SUUNNITTELU · {summary.months[0]}–{summary.endMonth}</span>
        <h2>Vuosikello</h2>
        <p className="annual-calendar-household">Talous: {householdLabel}</p>
        <p>Valitse tulevia kulutusmenoja ja arvioi niihin tarvittava varaus. Kuukausivaraus on suunnitteluluku: se ei lisää budjettia, menokirjauksia tai tilisiirtoja.</p>
      </div>
      <div className="annual-calendar-total"><small>Tasaus seuraaville 12 kuukaudelle</small><strong>{format(summary.monthlyReserve)} / kk</strong><small>Vain toistuvat menot ja niiden tulevat erät</small></div>
    </section>

    <section className="panel annual-calendar-plans" aria-labelledby="annual-plans-title">
      <div className="section-head"><div><h2 id="annual-plans-title">Varaussuunnitelmassa</h2><p>Varaus kohdistuu tiettyyn tulevaan eräpäivään. Se ei ole pankkisaldo.</p></div></div>
      <div className="annual-calendar-new-expense"><span>Lisää uusi tuleva lasku tavalliseksi menokirjaukseksi:</span><button type="button" onClick={() => onAddExpense("once")}>Lisää kertameno</button><button type="button" onClick={() => onAddExpense("monthly")}>Lisää toistuva meno</button></div>
      {candidates.length > 0 ? <div className="annual-calendar-add">
        <label>Lisää meno vuosikelloon<select value={candidateId} onChange={event => setCandidateId(event.target.value)}>
          {candidates.map(item => <option key={item.id} value={item.id}>{item.name} · {recurrenceName[item.recurrence] || item.recurrence}</option>)}
        </select></label>
        <button type="button" className="primary" disabled={!candidateId} onClick={() => onPlanChange(candidateId, true)}>Lisää suunnitelmaan</button>
      </div> : <p className="ux-status-note">{selected.size >= 200 ? "Vuosikellossa voi olla enintään 200 suunniteltua menoa." : "Lisättäviä tulevia kulutusmenoja ei löytynyt. Voit ensin lisätä tai muuttaa menon Menot-näkymässä."}</p>}
      {summary.orphanPlans.map(id => <div className="annual-calendar-orphan" key={id}><p>Suunnitelma viittaa poistettuun menoon. Sen varaustiedot säilyvät, kunnes poistat suunnitelman.</p><button type="button" onClick={() => onPlanChange(id, false)}>Poista suunnitelma</button></div>)}
      {summary.items.length === 0 && summary.orphanPlans.length === 0 && <p className="ux-status-note">Lisää tähän esimerkiksi vuosittainen vakuutus, ajoneuvovero tai muu ennakoitava lasku.</p>}
      <div className="annual-reserve-plan-list">{summary.items.map(item => {
        const next = item.nextDue;
        const hasReservations = (state.annualReservations || []).some(reservation => reservation.expenseId === item.expense.id);
        return <article className="annual-reserve-plan" key={item.expense.id}>
          <div className="annual-reserve-plan-head"><div><h3>{item.expense.name}</h3><p>{item.expense.category} · {recurrenceName[item.expense.recurrence] || item.expense.recurrence}</p></div><button type="button" aria-label={`Poista ${item.expense.name} varaussuunnitelmasta`} onClick={() => onPlanChange(item.expense.id, false)}>{hasReservations ? "Poista suunnitelma ja varaukset" : "Poista suunnitelma"}</button></div>
          {!item.eligible ? <p className="ux-status-note">Tämä meno on keskeytetty tai merkitty säästöksi/sijoitukseksi. Se ei sisälly vuosikellon laskelmaan.</p> : <>
            {item.expense.recurrence !== "once" && <p className="annual-reserve-flat">Tasaus: <strong>{format(item.annualizedMonthly)} / kk</strong><small>Arvio perustuu seuraavan 12 kuukauden eriin. Sitä ei lisätä budjettiin automaattisesti.</small></p>}
            {next ? <div className="annual-reserve-next">
              <div><small>Seuraava erä · {shortDate(next.date)}</small><strong>{format(next.amount)}</strong></div>
              <ReservationInput label={`Varattu tähän erään (${shortDate(next.date)})`} value={item.reservedForNextDue} onSave={amount => onReserveChange(item.expense.id, next.date, amount)} />
              {item.reservedForNextDue > 0 && <button type="button" className="annual-reserve-use" onClick={() => { if (confirm(`Kuitataanko ${format(item.reservedForNextDue)} käytetyksi ${shortDate(next.date)} erästä? Tämä ei merkitse menoa maksetuksi.`)) onUseReservation(item.expense.id, next.date); }}>Kuittaa varaus käytetyksi</button>}
              {(state.annualReservations || []).find(value => value.expenseId === item.expense.id && value.occurrenceDate === next.date)?.usedAmount ? <small className="annual-reserve-used">Käytetty varaus ei muuta menon tilaa. Vahvista maksu erikseen Menot-näkymässä.</small> : null}
              {item.shortfallForNextDue === 0 ? <p className="annual-reserve-needed">Varaus riittää tähän erään.</p> : item.neededPerMonth === null ? <p className="annual-reserve-needed warning">{format(item.shortfallForNextDue)} tarvitaan ennen eräpäivää. Kuukausisäästölle ei ole enää täyttä kuukausiväliä.</p> : <p className="annual-reserve-needed">Tarve ennen eräpäivää: <strong>{format(item.neededPerMonth)} / kk</strong> · {item.savingsInstallments} säästökertaa, ensimmäinen kuukauden kuluttua.</p>}
            </div> : <p className="ux-status-note">Tälle menolle ei ole suunniteltua erää seuraavien 12 kuukauden aikana.</p>}
            {item.occurrences.length > 1 && <details className="annual-reserve-other-events"><summary>Varaa myös muut tulevat erät ({item.occurrences.length - 1})</summary><ul>{item.occurrences.slice(1).map(occurrence => {
              const reservation = (state.annualReservations || []).find(value => value.expenseId === item.expense.id && value.occurrenceDate === occurrence.date);
              const reserved = Math.max(0, (reservation?.amount || 0) - (reservation?.usedAmount || 0));
              return <li key={occurrence.date}><div><time dateTime={occurrence.date}>{shortDate(occurrence.date)}</time><strong>{format(occurrence.amount)}</strong>{reservation?.usedAmount ? <small>Käytetty {format(reservation.usedAmount)} · maksun tila vahvistetaan erikseen</small> : null}</div><ReservationInput label={`Varattu erään ${shortDate(occurrence.date)}`} value={reserved} onSave={amount => onReserveChange(item.expense.id, occurrence.date, amount)} />{reserved > 0 && <button type="button" onClick={() => { if (confirm(`Kuitataanko ${format(reserved)} käytetyksi ${shortDate(occurrence.date)} erästä? Tämä ei merkitse menoa maksetuksi.`)) onUseReservation(item.expense.id, occurrence.date); }}>Kuittaa käytetyksi</button>}</li>;
            })}</ul></details>}
          </>}
          {item.staleReservations.length > 0 && <div className="annual-reserve-stale"><strong>Eräpäivä tai meno on muuttunut</strong><p>Varausta ei löydy enää vastaavalle tapahtumapäivälle. Poistamalla sen vapautat tämän kirjauksen suunnittelusumman.</p>{item.staleReservations.map(reservation => <div key={reservation.occurrenceDate}><span>{shortDate(reservation.occurrenceDate)} · {format(reservation.amount)}{reservation.usedAmount ? ` · käytetty ${format(reservation.usedAmount)}` : ""}</span><button type="button" onClick={() => { if (confirm(`Poistetaanko ${shortDate(reservation.occurrenceDate)} päivälle kohdistettu vanha varaus?`)) onDeleteReservation(item.expense.id, reservation.occurrenceDate); }}>Poista vanha varaus</button></div>)}</div>}
        </article>;
      })}</div>
    </section>

    <section className="panel annual-calendar-months" aria-labelledby="annual-calendar-title">
      <div className="section-head"><div><h2 id="annual-calendar-title">Tulevat eräpäivät</h2><p>Vain valitut, aktiiviset kulutusmenot. Päivämäärä- ja summakorjaukset noudattavat kirjauksen asetuksia.</p></div></div>
      <div className="annual-calendar-month-grid">{summary.months.map(month => {
        const occurrences = summary.monthlyByMonth[month];
        return <section className="annual-calendar-month" key={month} aria-label={monthLabel(month)}>
          <div><h3>{monthLabel(month)}</h3><strong>{format(occurrences.reduce((total, item) => total + item.amount, 0))}</strong></div>
          {occurrences.length ? <ul>{occurrences.map(occurrence => <li key={`${occurrence.expenseId}:${occurrence.date}`}><span><time dateTime={occurrence.date}>{shortDate(occurrence.date)}</time><strong>{occurrence.name}</strong></span><b>{format(occurrence.amount)}</b></li>)}</ul> : <p>Ei valittuja eriä</p>}
        </section>;
      })}</div>
      <small className="annual-calendar-footnote">Erä merkitään toteutuneeksi tai ohitetuksi tavallisessa Menot-näkymässä. Vuosikello ei päättele maksua pankkitiedosta. Kertaluonteista menoa ei oleteta vuosittaiseksi.</small>
    </section>
  </div>;
}
