import { Empty } from './empty';

export type FlowDay = { date: string; income: number; expense: number; balance: number };
export function FlowReport({ dailyFlow, filteredDailyFlow, firstShortfall, recoveryDay, maxFlowMagnitude, monthCount, reportFormat, selectedDate, onSelectDay, euro }: { dailyFlow: FlowDay[]; filteredDailyFlow: FlowDay[]; firstShortfall?: FlowDay; recoveryDay?: FlowDay; maxFlowMagnitude: number; monthCount: number; reportFormat: string; selectedDate?: string; onSelectDay: (date: string) => void; euro: (amount: number) => string }) {
return (
                  <section
                    className="panel report-panel"
                    id="report-panel-flow"
                    role="tabpanel"
                    aria-labelledby="report-tab-flow"
                    tabIndex={0}
                  >
                    <h2>Tulojen ja menojen ajoitus</h2>
                    <p className="muted">
                      Kumulatiivinen kassavirta alkaa valitun aikavälin alussa
                      nollasta. Alkusaldoa ja maksujen kellonaikoja ei tunneta;
                      saman päivän tapahtumia ei järjestetä keskenään.
                    </p>
                    {dailyFlow.length ? (
                      <>
                        <div className="flow-summary">
                          <strong>
                            {firstShortfall
                              ? `Kertymä käy miinuksella ${firstShortfall.date.split("-").reverse().join(".")}`
                              : "Kertymä ei käy miinuksella kirjattuina tapahtumapäivinä"}
                          </strong>
                          <span>
                            {recoveryDay
                              ? `Kertymä palautuu plussalle ${recoveryDay.date.split("-").reverse().join(".")}`
                              : firstShortfall
                                ? "Kertymä jää negatiiviseksi kirjatuissa tapahtumapäivissä"
                                : `Jakson lopun kertymä ${euro(dailyFlow.at(-1)!.balance)}`}
                          </span>
                        </div>
                        <div
                          className="flow-visual"
                          role="group"
                          aria-label="Päiväkohtainen kumulatiivinen kassavirta. Valitse päivä avataksesi sen kirjaukset."
                          hidden={reportFormat !== "timeline"}
                        >
                          {dailyFlow.map((day) => (
                            <button
                              type="button"
                              className={`flow-day${selectedDate === day.date ? " selected-flow-day" : ""}`}
                              key={day.date}
                              aria-label={`${day.date.split("-").reverse().join(".")}: tulot ${euro(day.income)}, menot ${euro(day.expense)}, kertymä ${euro(day.balance)}. Avaa tietueet.`}
                              title={`${day.date}: ${euro(day.balance)}`}
                              onClick={() =>
                                onSelectDay(day.date)
                              }
                            >
                              <div className="flow-day-plot">
                                <span
                                  className={`flow-bar ${day.balance < 0 ? "below-zero" : "above-zero"}`}
                                  style={{
                                    height: `${Math.max(2, (Math.abs(day.balance) / maxFlowMagnitude) * 46)}%`,
                                    ...(day.balance < 0
                                      ? { top: "50%" }
                                      : { bottom: "50%" }),
                                  }}
                                />
                                <i />
                              </div>
                              <small>
                                {monthCount === 1
                                  ? Number(day.date.slice(-2))
                                  : day.date.slice(5, 10)}
                              </small>
                            </button>
                          ))}
                        </div>
                        <p
                          className="muted flow-caption"
                          hidden={reportFormat !== "timeline"}
                        >
                          Päivän lopun kumulatiivinen tulojen ja menojen erotus
                          · positiivinen ylös, alijäämä alas. Päivät, joina ei
                          ole kirjauksia, eivät näy.
                        </p>
                        <div
                          className="table-wrap mobile-card-table flow-table"
                          hidden={reportFormat !== "table"}
                        >
                          <table role="table">
                            <thead role="rowgroup">
                              <tr role="row">
                                <th role="columnheader">Päivä</th>
                                <th role="columnheader">Tulot</th>
                                <th role="columnheader">Menot</th>
                                <th role="columnheader">
                                  Kumulatiivinen kassavirta
                                </th>
                              </tr>
                            </thead>
                            <tbody role="rowgroup">
                              {filteredDailyFlow.map((day) => (
                                <tr role="row" key={day.date}>
                                  <th
                                    role="rowheader"
                                    scope="row"
                                    data-label="Päivä"
                                  >
                                    {day.date.split("-").reverse().join(".")}
                                  </th>
                                  <td role="cell" data-label="Tulot">
                                    {euro(day.income)}
                                  </td>
                                  <td role="cell" data-label="Menot">
                                    {euro(day.expense)}
                                  </td>
                                  <td
                                    role="cell"
                                    data-label="Kertymä"
                                    className={
                                      day.balance < 0 ? "negative" : ""
                                    }
                                  >
                                    {euro(day.balance)}
                                  </td>
                                </tr>
                              ))}
                              {filteredDailyFlow.length === 0 && (
                                <tr>
                                  <td colSpan={4}>Suodattimella ei löytynyt päiviä.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <Empty text="Valitussa kuussa ei ole toteutuneita tapahtumia." />
                    )}
                  </section>
);
}
