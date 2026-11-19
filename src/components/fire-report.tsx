import type { fiTarget } from '../domain/calculations';
import { PercentField } from './numeric-inputs';
import { ContextDetails, StatusBadge } from './summary';

type FireMonth = { key: string; income: number; consumption: number; savingRate: number | null };
type FireReportProps = {
 observedCashflowMonths: FireMonth[]; filteredFireMonths: FireMonth[]; historyCount: number;
 withdrawalRate: number; setWithdrawalRate: (value: number) => void;
 periodSavingRate: number | null; averageMonthlyConsumption: number; annualizedSpending: number; investmentBalance: number;
 fireCalculation: ReturnType<typeof fiTarget> | null; reportFormat: string;
 euro: (amount: number) => string; pct: (amount: number | null) => string;
 onSelectMonth: (month: string) => void;
};
export function FireReport({ observedCashflowMonths, filteredFireMonths, historyCount, withdrawalRate, setWithdrawalRate, periodSavingRate, averageMonthlyConsumption, annualizedSpending, investmentBalance, fireCalculation, reportFormat, euro, pct, onSelectMonth }: FireReportProps) {
return (
                  <section
                    className="panel report-panel"
                    id="report-panel-fire"
                    role="tabpanel"
                    aria-labelledby="report-tab-fire"
                    tabIndex={0}
                  >
                    <h2>Säästöaste ja taloudellinen riippumattomuus</h2>
                    <p className="muted">
                      Säästöaste käyttää valitun aikavälin tuloja ja
                      kulutusmenoja. FIRE-tavoite annualisoi vain kuukaudet,
                      joissa on kirjattuja tuloja tai menoja; tyhjää kuukautta
                      ei tulkita kuluttomaksi. Arvio olettaa havaittujen
                      kuukausien kuvaavan tulevaa kulutusta. Havaintoja on{" "}
                      {observedCashflowMonths.length} / {historyCount}{" "}
                      kuukaudelta.
                    </p>
                    <div className="report-assumption">
                      <PercentField
                        label="Esimerkin nostoprosentti vuodessa"
                        value={withdrawalRate}
                        min={2}
                        max={10}
                        step={0.1}
                        onChange={setWithdrawalRate}
                      />
                      <small>
                        Nostoprosentti on laskennan oletus, ei lupaus tuoton
                        riittävyydestä eikä henkilökohtainen sijoitussuositus.
                      </small>
                    </div>
                    <div className="report-summary-strip">
                      <article>
                        <small>Jakson säästöaste</small>
                        <strong>{pct(periodSavingRate)}</strong>
                      </article>
                      <article>
                        <small>Keskimääräinen kulutus / kk</small>
                        <strong>{euro(averageMonthlyConsumption)}</strong>
                      </article>
                      <article>
                        <small>Annualisoitu kulutus</small>
                        <strong>{euro(annualizedSpending)}</strong>
                      </article>
                      <article>
                        <small>Kirjatut sijoitukset nykyarvossa</small>
                        <strong>{euro(investmentBalance)}</strong>
                      </article>
                    </div>
                    {reportFormat === "bars" &&
                      observedCashflowMonths.length > 0 && (
                        <div
                          className="fire-trend"
                          role="group"
                          aria-label="Kuukausittaiset säästöasteet"
                        >
                          {observedCashflowMonths.map((item) => (
                            <button
                              type="button"
                              key={item.key}
                              onClick={() =>
                                onSelectMonth(item.key)
                              }
                              aria-label={`${item.key}: säästöaste ${pct(item.savingRate)}. Avaa tulot.`}
                            >
                              <span
                                style={{
                                  height: `${Math.max(4, Math.min(100, Math.max(0, item.savingRate || 0)))}%`,
                                }}
                              />
                              <small>
                                {observedCashflowMonths.length > 12
                                  ? item.key
                                  : item.key.slice(5)}
                              </small>
                            </button>
                          ))}
                        </div>
                      )}
                    {reportFormat === "table" && (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Kuukausi</th>
                              <th>Tulot</th>
                              <th>Kulutus</th>
                              <th>Säästöaste</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredFireMonths.map((item) => (
                              <tr key={item.key}>
                                <th scope="row" data-label="Kuukausi">
                                  {item.key}
                                </th>
                                <td data-label="Tulot">{euro(item.income)}</td>
                                <td data-label="Kulutus">
                                  {euro(item.consumption)}
                                </td>
                                <td data-label="Säästöaste">
                                  {pct(item.savingRate)}
                                </td>
                              </tr>
                            ))}
                            {filteredFireMonths.length === 0 && (
                              <tr>
                                <td colSpan={4}>Suodattimella ei löytynyt kuukausia.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="fire-target-card">
                      <div>
                        <span className="eyebrow">ESIMERKKILASKELMA</span>
                        <h3>Arvioitu sijoitusvarallisuuden tavoite</h3>
                      </div>
                      {fireCalculation ? (
                        <>
                          <strong>{euro(fireCalculation.target)}</strong>
                          <p>
                            Perustuu {euro(annualizedSpending)} vuotuiseen
                            kulutukseen ja {pct(withdrawalRate)}{" "}
                            nostoprosenttiin. Nykyisistä kirjatuista
                            sijoituksista puuttuu arviolta{" "}
                            {euro(fireCalculation.shortfall)}.
                          </p>
                        </>
                      ) : (
                        <p>
                          Tavoitetta ei voi laskea tämän aikavälin tiedoilla.
                        </p>
                      )}
                    </div>
                    <StatusBadge tone="warning">Skenaario, ei ennuste</StatusBadge>
                    <ContextDetails title="FIRE-laskelman rajaukset"><p>Tämä karkea laskelma jättää pois verot, inflaation, kulujen muutokset, sijoitustuotot ja nostojen ajoituksen. Säästöaste on kuvaus kirjatuista tiedoista, ei ennuste.</p></ContextDetails>
                  </section>
);
}
