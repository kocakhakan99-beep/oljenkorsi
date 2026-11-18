import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { monthComparison } from "../domain/monthly-planning";
import type { State } from "../domain/model";
import { StatusBadge } from "./summary";

function MonthChange({
  amount,
  format,
  positiveIsGood,
}: {
  amount: number;
  format: (value: number) => string;
  positiveIsGood?: boolean;
}) {
  const tone = amount === 0 ? "neutral" : (amount > 0) === (positiveIsGood !== false) ? "positive" : "negative";
  const Icon = amount > 0 ? ArrowUpRight : amount < 0 ? ArrowDownRight : Minus;
  const label = amount > 0 ? "Lisäystä" : amount < 0 ? "Vähennystä" : "Ei muutosta";
  return (
    <span className={`month-change tone-${tone}`}>
      <Icon size={15} aria-hidden="true" />
      <span>{amount === 0 ? "Ei muutosta" : `${label} ${format(Math.abs(amount))}`}</span>
    </span>
  );
}

export function MonthComparisonCard({
  state,
  month,
  asOf,
  format,
}: {
  state: State;
  month: string;
  asOf: string;
  format: (value: number) => string;
}) {
  const comparison = monthComparison(state, month, asOf);
  const label = (value: string) => new Intl.DateTimeFormat("fi-FI", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}-01T00:00:00Z`));

  return (
    <section className="panel month-comparison" aria-labelledby="month-comparison-title">
      <div className="section-head">
        <div>
          <h2 id="month-comparison-title">Mikä muuttui viime kuusta?</h2>
          <p className="muted">{label(month)} verrattuna kuukauteen {label(comparison.previousMonth)}</p>
        </div>
        <div className="month-comparison-status" aria-label="Kuukausien tarkistustila">
          <StatusBadge tone={comparison.currentConfirmed && !comparison.currentIsOpen ? "positive" : "warning"}>
            {label(month)}: {comparison.isFuture ? "tuleva" : comparison.currentIsOpen ? "kesken" : comparison.currentConfirmed ? "tarkistettu" : "ei vahvistettu"}
          </StatusBadge>
          <StatusBadge tone={comparison.previousConfirmed ? "positive" : "warning"}>
            {label(comparison.previousMonth)}: {comparison.previousConfirmed ? "tarkistettu" : "ei vahvistettu"}
          </StatusBadge>
        </div>
      </div>

      {comparison.isFuture ? (
        <p role="status">Valittu kuukausi on tulevaisuudessa, joten toteutunutta vertailua ei vielä ole.</p>
      ) : (
        <>
          <p className="month-comparison-caveat">
            {comparison.currentConfirmed && comparison.previousConfirmed && !comparison.currentIsOpen
              ? "Vertailu perustuu tarkistettuihin kirjauksiin."
              : "Summat perustuvat kirjattuihin tapahtumiin. Vahvistamaton kuukausi voi olla puutteellinen, eikä sitä tulkita nollaksi."}
            {comparison.currentIsOpen ? " Valittu kuukausi on vielä kesken, joten summat voivat kasvaa." : ""}
          </p>
          <div className="month-comparison-metrics">
            {([
              ["Tulot", comparison.income, true],
              ["Kulutusmenot", comparison.consumption, false],
              ["Tulot kulutuksen jälkeen", comparison.afterConsumption, true],
            ] as const).map(([title, values, positiveIsGood]) => (
              <div className="month-comparison-metric" key={title}>
                <span>{title}</span>
                <strong>{format(values.current)}</strong>
                <small>Edellinen kuukausi {format(values.previous)}</small>
                <MonthChange amount={values.change} format={format} positiveIsGood={positiveIsGood} />
              </div>
            ))}
          </div>

          <div className="month-comparison-categories">
            <h3>Suurimmat kulutuksen muutokset</h3>
            <small>Kirjattujen kulutusmenojen mukaan</small>
            {comparison.categories.length ? comparison.categories.map((category) => (
              <div className="simple-row" key={category.name}>
                <span>
                  <strong>{category.name}</strong>
                  <small>{format(category.previous)} → {format(category.current)}</small>
                </span>
                <MonthChange amount={category.change} format={format} positiveIsGood={false} />
              </div>
            )) : <p className="muted">Kirjattujen kulutusmenojen kategorioissa ei ole muutosta.</p>}
          </div>

          {(Object.keys(state.budgetActuals[month] || {}).length > 0 || Object.keys(state.budgetActuals[comparison.previousMonth] || {}).length > 0) && (
            <small className="month-comparison-note">Budjetissa on omia toteumakorjauksia. Tämä vertailu näyttää kirjaukset; toteumakorjaukset näkyvät budjetissa.</small>
          )}
        </>
      )}
    </section>
  );
}
