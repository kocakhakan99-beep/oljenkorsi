import { Empty } from './empty';
import { useState, type ReactNode } from 'react';
import { type Scenario, type Entry, type Kind, empty, uid } from '../domain/model';
import { compound, fiTarget, fiMonths, money, payoff, paymentBreakdown, MAX } from '../domain/calculations';
import { validate } from '../services/validation';
import { MoneyInput, PercentField } from './numeric-inputs';
import { DebtEstimate } from './debt-estimate';

export function Calculators({
  scenarios,
  euro,
  pct,
  onSave,
  onDelete,
  liabilities,
  emergencyPlanner,
  assets,
  goals,
  onEdit,
  atDate,
}: {
  scenarios: Scenario[];
  euro: (n: number) => string;
  pct: (n: number | null) => string;
  onSave: (q: Scenario) => boolean;
  onDelete: (id: string) => boolean;
  liabilities: Entry[];
  emergencyPlanner: ReactNode;
  assets: Entry[];
  goals: Entry[];
  onEdit: (kind: Kind, item: Entry) => void;
  atDate: string;
}) {
  const [calculator, setCalculator] = useState<'fi' | 'invest' | 'compare' | 'debt' | 'buffer' | 'assets' | 'goals'>('fi');
  const [q, setQ] = useState<Scenario>({
      id: uid(),
      name: "Oma skenaario",
      initial: 100000,
      monthly: 20000,
      rate: 4,
      fee: 0.5,
      inflation: 2,
      years: 10,
    }),
    [error, setError] = useState(""),
    [fi, setFi] = useState({
      annualExpenses: 3000000,
      annualOutsideIncome: 0,
      capital: 0,
      withdrawalRate: 4,
      monthlySaving: 20000,
      realAnnualReturn: 3,
      maxYears: 50,
    }),
    [fiError, setFiError] = useState("");
  let result = compound(q);
  const fiResult = fiTarget(
    fi.annualExpenses,
    fi.annualOutsideIncome,
    fi.capital,
    fi.withdrawalRate,
  );
  const monthsToFi = fiMonths(
    fi.capital,
    fi.monthlySaving,
    fi.realAnnualReturn,
    fiResult.target,
    fi.maxYears,
  );
  const updateFi = (key: keyof typeof fi, value: string) => {
    try {
      const parsed = [
        "withdrawalRate",
        "realAnnualReturn",
        "maxYears",
      ].includes(key)
        ? Number(value.replace(",", "."))
        : money(value);
      const next = { ...fi, [key]: parsed };
      const target = fiTarget(
        next.annualExpenses,
        next.annualOutsideIncome,
        next.capital,
        next.withdrawalRate,
      ).target;
      fiMonths(
        next.capital,
        next.monthlySaving,
        next.realAnnualReturn,
        target,
        next.maxYears,
      );
      setFi(next);
      setFiError("");
    } catch (e) {
      setFiError(String(e));
    }
  };
  const update = (k: string, v: string) => {
    try {
      let n = ["initial", "monthly"].includes(k)
        ? money(v)
        : Number(v.replace(",", "."));
      let next = { ...q, [k]: n };
      validate({ ...empty(), scenarios: [next] });
      setQ(next);
      setError("");
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <>
      <section className="panel scenario-start"><h2>Mitä haluat selvittää?</h2><p>Valitse laskuri ja muuta oletuksia. Laskelmat eivät muuta kirjattua taloutta ilman erillistä tallennusta.</p><div role="group" className="scenario-shortcuts" aria-label="Laskurit">{([
        ['fi', 'FI-pääomatavoite'], ['invest', 'Korkoa korolle'], ['compare', 'Tallennetut suunnitelmat'], ['debt', 'Velanmaksu ja vuosikorko'], ['buffer', 'Puskuri ja tulokatkos'], ['assets', 'Omaisuuden arvon arvio'], ['goals', 'Tavoitteen säästölaskuri'],
      ] as const).map(([id, label]) => <button type="button" key={id} aria-pressed={calculator === id} onClick={() => setCalculator(id)}>{label}</button>)}</div></section>
      <section className="panel panel-plan" hidden={calculator !== 'fi'}>
        <h2 id="scenario-fi" tabIndex={-1}>FI-pääomatavoite</h2>
        <p className="muted">
          Yhden vaiheen havainnollistus omilla oletuksillasi. Syötä vuosikulut
          ja muut vuosittaiset nettotulot nykyrahassa. Pääoma tarkoittaa
          nostettavissa olevaa sijoituspääomaa; jätä hätävara ja asunto pois,
          ellei niitä aiota käyttää kulutukseen.
        </p>
        <div className="form-grid">
          {(
            [
              ["Vuosikulut (€)", "annualExpenses"],
              ["Muut nettotulot vuodessa (€)", "annualOutsideIncome"],
              ["Nostettavissa oleva pääoma (€)", "capital"],
              ["Alkunostoprosentti (% / vuosi)", "withdrawalRate"],
              ["Kuukausittainen lisäsijoitus (€)", "monthlySaving"],
              ["Reaalituotto kulujen jälkeen (% / vuosi)", "realAnnualReturn"],
              ["Tarkastelujakso (vuotta, 1–50)", "maxYears"],
            ] as const
          ).map(([label, key]) =>
            [
              "annualExpenses",
              "annualOutsideIncome",
              "capital",
              "monthlySaving",
            ].includes(key) ? (
              <label className="scenario-money-field" key={key}>
                {label}
                <MoneyInput
                  defaultCents={fi[key as "annualExpenses"]}
                  onBlur={(e) => updateFi(key, e.target.value)}
                />
              </label>
            ) : ["withdrawalRate", "realAnnualReturn"].includes(key) ? (
              <PercentField
                key={key}
                label={label}
                value={fi[key as "withdrawalRate"]}
                min={key === "withdrawalRate" ? 0.1 : -99.9}
                max={50}
                onChange={(value) => updateFi(key, String(value))}
              />
            ) : (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  defaultValue={fi.maxYears}
                  onBlur={(e) => updateFi(key, e.target.value)}
                  inputMode="numeric"
                />
              </label>
            ),
          )}
        </div>
        {fiError && (
          <p role="alert" className="negative">
            {fiError}
          </p>
        )}
        <div className="stats">
          <article className="stat">
            <span>Vuotuinen rahoitusvaje</span>
            <strong>{euro(fiResult.gap)}</strong>
          </article>
          <article className="stat">
            <span>FI-pääomatavoite</span>
            <strong>
              {fiResult.target ? euro(fiResult.target) : "Ei rahoitusvajetta"}
            </strong>
          </article>
          <article className="stat">
            <span>Pääomaa puuttuu</span>
            <strong>{euro(fiResult.shortfall)}</strong>
          </article>
          <article className="stat">
            <span>Tavoitteen kattavuus</span>
            <strong>
              {fiResult.coverage === null ? "—" : pct(fiResult.coverage)}
            </strong>
          </article>
          <article className="stat">
            <span>Arvioitu aika FI-tavoitteeseen</span>
            <strong>
              {monthsToFi === null
                ? "Ei saavuta jaksolla"
                : monthsToFi === 0
                  ? "Tavoite saavutettu"
                  : `${Math.floor(monthsToFi / 12)} v ${monthsToFi % 12} kk`}
            </strong>
          </article>
        </div>
        <h3>Vuosikulujen herkkyys</h3>
        <p className="muted">
          Samat muut nettotulot ja nostoprosentti kaikissa riveissä. Kulut
          muuttuvat ±10 %.
        </p>
        <div className="table-wrap mobile-card-table fi-sensitivity-table">
          <table role="table">
            <thead role="rowgroup">
              <tr role="row">
                <th role="columnheader">Kulutusoletus</th>
                <th role="columnheader">Vuosikulut</th>
                <th role="columnheader">Rahoitusvaje</th>
                <th role="columnheader">FI-pääomatavoite</th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {(
                [
                  ["−10 %", 0.9],
                  ["Oma oletus", 1],
                  ["+10 %", 1.1],
                ] as const
              ).map(([label, factor]) => {
                const expenses = Math.round(fi.annualExpenses * factor);
                const gap = Math.max(0, expenses - fi.annualOutsideIncome);
                const target = Math.ceil(gap / (fi.withdrawalRate / 100));
                return (
                  <tr role="row" key={label}>
                    <th role="rowheader" scope="row" data-label="Kulutusoletus">
                      {label}
                    </th>
                    <td role="cell" data-label="Vuosikulut">
                      {euro(expenses)}
                    </td>
                    <td role="cell" data-label="Rahoitusvaje">
                      {euro(gap)}
                    </td>
                    <td role="cell" data-label="FI-pääomatavoite">
                      {target <= MAX ? euro(target) : "Yli laskentarajan"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted">
          Tavoite = max(0, vuosikulut − muut nettotulot) / (alkunostoprosentti /
          100). Nostoprosentti on käyttäjän oletus, ei turvallisuusraja tai
          ennuste. Verot, eläketulojen alkamisajat, tuottojärjestys ja kulujen
          muutokset eivät sisälly laskelmaan. Aika-arviossa sama reaalituotto
          toistuu kuukausittain ja lisäsijoitus tehdään kuun lopussa.
          Reaalituotto-oletuksen on sisällettävä sijoituskulut; tulos ei ole
          luvattu päivämäärä.
        </p>
      </section>
      <section className="panel panel-cash" hidden={calculator !== 'invest'}>
        <h2 id="scenario-invest" tabIndex={-1}>Korkoa korolle ja kulujen vaikutus</h2>
        <p className="muted">
          Oletukset ovat muokattavia arvioita, eivät historiallisia tuottoja tai
          sijoitussuosituksia.
        </p>
        <div className="form-grid">
          <label>
            Nimi
            <input
              value={q.name}
              maxLength={100}
              onChange={(e) => setQ({ ...q, name: e.target.value })}
            />
          </label>
          {[
            ["Alkupääoma (€)", "initial"],
            ["Kuukausisijoitus (€)", "monthly"],
            ["Tuotto-oletus (% / vuosi)", "rate"],
            ["Vuosikulut (%)", "fee"],
            ["Inflaatio (% / vuosi)", "inflation"],
            ["Aika (vuotta, 1–50)", "years"],
          ].map(([label, k]) =>
            ["initial", "monthly"].includes(k) ? (
              <label className="scenario-money-field" key={k}>
                {label}
                <MoneyInput
                  key={k + q.id}
                  defaultCents={q[k as "initial"]}
                  onBlur={(e) => update(k, e.target.value)}
                />
              </label>
            ) : ["rate", "fee", "inflation"].includes(k) ? (
              <PercentField
                key={k}
                label={label}
                value={q[k as "rate"]}
                min={k === "fee" ? 0 : -99.9}
                max={50}
                onChange={(value) => update(k, String(value))}
                hint={false}
              />
            ) : (
              <label key={k}>
                {label}
                <input
                  type="number"
                  min={1}
                  max={50}
                  step={1}
                  defaultValue={q.years}
                  onBlur={(e) => update(k, e.target.value)}
                  inputMode="numeric"
                />
              </label>
            ),
          )}
        </div>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
        <div className="stats">
          {[
            ["Sijoitettu pääoma", result.invested],
            ["Laskennallinen kokonaisarvo", result.value],
            ["Laskennallinen tuotto", result.gain],
            ["Kulujen vaikutus", result.feeImpact],
            ["Inflaatiokorjattu arvo", result.real],
          ].map(([n, v]) => (
            <article className="stat" key={String(n)}>
              <span>{n}</span>
              <strong>{euro(Number(v))}</strong>
            </article>
          ))}
        </div>
        <p className="muted">
          Kuukausituotto = (1 + vuosituotto)^(1/12) − 1. Kulukerroin = (1 −
          vuosikulu)^(1/12). Tuotto ja kulut lasketaan kuukauden alussa,
          lisäsijoitus lopussa; tulos pyöristetään sentteihin kuukausittain.
          Reaaliarvo = loppuarvo / (1 + inflaatio)^vuodet. Verot ja
          markkinavaihtelu eivät sisälly.
        </p>
        <button
          className="primary"
          disabled={!!error || !Number.isSafeInteger(result.value)}
          onClick={() => {
            if (onSave({ ...q, id: uid() })) setError("");
          }}
        >
          Tallenna vertailuun
        </button>
      </section>
      <section className="panel" hidden={calculator !== 'compare'}>
        <h2 id="scenario-compare" tabIndex={-1}>Skenaarioiden vertailu</h2>
        <p>Voit tallentaa ja vertailla useita omia oletuksia.</p>
        {scenarios.length ? (
          <div className="table-wrap mobile-card-table scenario-table">
            <table role="table">
              <thead role="rowgroup">
                <tr role="row">
                  <th role="columnheader">Nimi</th>
                  <th role="columnheader">Oletukset</th>
                  <th role="columnheader">Pääoma</th>
                  <th role="columnheader">Nimellisarvo</th>
                  <th role="columnheader">Reaaliarvo</th>
                  <th role="columnheader">Toiminnot</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {scenarios.map((v) => {
                  let r = compound(v);
                  return (
                    <tr role="row" key={v.id}>
                      <th role="rowheader" scope="row" data-label="Nimi">
                        {v.name}
                      </th>
                      <td role="cell" data-label="Oletukset">
                        {v.years} v · tuotto {v.rate} % · kulut {v.fee} % ·
                        inflaatio {v.inflation} %
                        <small>
                          {euro(v.initial)} + {euro(v.monthly)} / kk
                        </small>
                      </td>
                      <td role="cell" data-label="Pääoma">
                        {euro(r.invested)}
                      </td>
                      <td role="cell" data-label="Nimellisarvo">
                        {euro(r.value)}
                      </td>
                      <td role="cell" data-label="Reaaliarvo">
                        {euro(r.real)}
                      </td>
                      <td role="cell" data-label="Toiminnot">
                        <button onClick={() => { setQ({ ...v, id: uid() }); setCalculator('invest'); }}>
                          Lataa laskuriin
                        </button>
                        <button onClick={() => onDelete(v.id)}>Poista</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Tallenna ensimmäinen skenaario vertailuun." />
        )}
      </section>
      <section className="panel" hidden={calculator !== 'debt'}>
        <h2 id="scenario-debt" tabIndex={-1}>Velanmaksuskenaariot</h2>
        <p className="muted">
          Vakioitu vuosikorko, kuukausittainen korko ja erä. Ei muita kuluja
          eikä koron muutoksia. Ei luotonottosuositus.
        </p>
        {liabilities.map((e) => {
          let r = payoff(e.amount, e.payment, e.rate);
          const installment = paymentBreakdown(e.amount, e.payment, e.rate);
          return (
            <article key={e.id} className="debt-installment-estimate">
              <p>
                <strong>{e.name}</strong>:{" "}
                {r
                  ? `${r.months} kuukautta, korkoja ${euro(r.interest)}`
                  : "Erä ei riitä tai maksuaika ylittää 100 vuotta."}
              </p>
              <p className="muted">
                Seuraavan erän arvio nykyisestä saldosta: korkoa{" "}
                {euro(installment.interest)} ja pääoman muutos{" "}
                {installment.principal < 0
                  ? `−${euro(Math.abs(installment.principal))} (saldo kasvaisi)`
                  : euro(installment.principal)}
                . Arvioitu saldo erän jälkeen{" "}
                {euro(installment.remainingBalance)}.
              </p>
              <DebtEstimate item={e} atDate={atDate} euro={euro} />
            </article>
          );
        })}
        {!liabilities.length && (
          <p>Lisää velka ja kuukausierä nähdäksesi arvion.</p>
        )}
      </section>
      <section className="panel" hidden={calculator !== 'buffer'}><h2>Puskuri ja tulokatkos</h2>{emergencyPlanner}</section>
      <section className="panel" hidden={calculator !== 'assets'}><h2>Omaisuuden arvon arviointi</h2><p>Valitse omaisuuserä ja avaa sen arvonmuutoslaskuri.</p>{assets.length ? assets.map(item => <p key={item.id}><button type="button" onClick={() => onEdit('assets', item)}>{item.name}</button></p>) : <p>Lisää ensin omaisuuserä Omaisuus-sivulla.</p>}</section>
      <section className="panel" hidden={calculator !== 'goals'}><h2>Tavoitteen säästölaskuri</h2><p>Valitse tavoite ja arvioi siihen tarvittava kuukausisäästö.</p>{goals.length ? goals.map(item => <p key={item.id}><button type="button" onClick={() => onEdit('goals', item)}>{item.name}</button></p>) : <p>Lisää ensin tavoite Tavoitteet-sivulla.</p>}</section>
    </>
  );
}
