import type { State } from '../domain/model';
import type { ReportSelection } from '../domain/report-model';
import { Empty } from './empty';

type BudgetReportRow = { key: string; planned: number; hasPlan: boolean; actual: number; unbudgetedActual: number; plannedByCategory: Record<string, number> };
type BudgetReportProps = {
 periodLabel: string; reportFormat: string; manualActuals: State['budgetActuals'];
 data: { rows: BudgetReportRow[]; filteredRows: BudgetReportRow[]; totals: { planned: number; actual: number; unbudgetedActual: number }; scale: number };
 onSelect: (value: ReportSelection | null) => void; euro: (amount: number) => string;
};
export function BudgetReport({ periodLabel, reportFormat, manualActuals, data, onSelect, euro }: BudgetReportProps) {
 const { rows: budgetReport, filteredRows: filteredBudgetReport, totals: budgetTotals, scale: budgetReportScale } = data;
 return (
                  <section
                    className="panel report-panel"
                    id="report-panel-budget"
                    role="tabpanel"
                    aria-labelledby="report-tab-budget"
                    tabIndex={0}
                  >
                    <h2>Budjetti ja toteutuneet menot</h2>
                    <p className="muted">
                      {periodLabel}. Kunkin kategorian käsin syötetty toteuma
                      korvaa kirjatut menot tässä raportissa; muuten käytetään
                      toteutuneiksi merkittyjä kulutusmenoja. Vertailu koskee
                      vain budjetoituja kategorioita; budjetoimattomat kulut
                      näytetään erikseen.
                    </p>
                    <div className="report-summary-strip">
                      <article>
                        <small>Suunnitelma yhteensä</small>
                        <strong>{euro(budgetTotals.planned)}</strong>
                      </article>
                      <article>
                        <small>Toteuma budjetoiduissa kategorioissa</small>
                        <strong>{euro(budgetTotals.actual)}</strong>
                      </article>
                      <article>
                        <small>Budjetoimattomat kulut</small>
                        <strong>{euro(budgetTotals.unbudgetedActual)}</strong>
                      </article>
                      <article>
                        <small>Budjetoitujen kategorioiden erotus</small>
                        <strong
                          className={
                            budgetTotals.actual > budgetTotals.planned
                              ? "negative"
                              : ""
                          }
                        >
                          {euro(budgetTotals.planned - budgetTotals.actual)}
                        </strong>
                      </article>
                    </div>
                    {reportFormat === "bars" && budgetReport.length > 0 && (
                      <div
                        className="budget-report-chart"
                        aria-label="Kuukausittainen budjetti ja toteuma"
                      >
                        {budgetReport.map((row) => (
                          <button
                            key={row.key}
                            className="budget-report-month"
                            type="button"
                            onClick={() =>
                              onSelect({
                                type: "budget",
                                month: row.key,
                                planned: row.planned,
                                actual: row.actual,
                                manualCategories: Object.keys(
                                  manualActuals[row.key] || {},
                                ),
                              })
                            }
                            aria-label={`${row.key}: ${row.hasPlan ? `budjetti ${euro(row.planned)}, budjetoitujen kategorioiden toteuma ${euro(row.actual)}` : "ei budjettisuunnitelmaa"}, budjetoimattomat kulut ${euro(row.unbudgetedActual)}. Avaa kirjaukset.`}
                          >
                            <span>{row.key}</span>
                            <span className="budget-report-bars">
                              <i
                                title={
                                  row.hasPlan
                                    ? `Suunnitelma ${euro(row.planned)}`
                                    : "Ei budjettisuunnitelmaa"
                                }
                                style={{
                                  width: row.hasPlan
                                    ? `${Math.min(100, (row.planned / budgetReportScale) * 100)}%`
                                    : "0%",
                                }}
                              />
                              <b
                                title={`Budjetoitujen kategorioiden toteuma ${euro(row.actual)}`}
                                style={{
                                  width: `${Math.min(100, (row.actual / budgetReportScale) * 100)}%`,
                                }}
                              />
                              <i
                                className="unbudgeted-bar"
                                title={`Budjetoimattomat kulut ${euro(row.unbudgetedActual)}`}
                                style={{
                                  width: `${Math.min(100, (row.unbudgetedActual / budgetReportScale) * 100)}%`,
                                }}
                              />
                            </span>
                            <strong>
                              {row.hasPlan ? euro(row.actual) : "—"}{" "}
                              <small>
                                /{" "}
                                {row.hasPlan
                                  ? euro(row.planned)
                                  : "ei suunnitelmaa"}
                              </small>
                              {row.unbudgetedActual > 0 && (
                                <small className="unbudgeted-report-value">
                                  + {euro(row.unbudgetedActual)} ilman budjettia
                                </small>
                              )}
                            </strong>
                          </button>
                        ))}
                        <p className="muted">
                          <i className="legend-swatch planned-swatch" />{" "}
                          Budjetti <i className="legend-swatch expense-bar" />
                          Budjetoitujen kategorioiden toteuma{" "}
                          <i className="legend-swatch unbudgeted-swatch" />
                          Budjetoimaton kulutus
                        </p>
                      </div>
                    )}
                    {reportFormat === "table" && budgetReport.length > 0 && (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Kuukausi</th>
                              <th>Suunnitelma</th>
                              <th>Budjetoidun toteuma</th>
                              <th>Budjetoimaton</th>
                              <th>Budjetin erotus</th>
                              <th>Budjetoituja kategorioita</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredBudgetReport.map((row) => (
                              <tr key={row.key}>
                                <th scope="row" data-label="Kuukausi">
                                  <button
                                    className="report-table-link"
                                    onClick={() =>
                                      onSelect({
                                        type: "budget",
                                        month: row.key,
                                        planned: row.planned,
                                        actual: row.actual,
                                        manualCategories: Object.keys(
                                          manualActuals[row.key] || {},
                                        ),
                                      })
                                    }
                                  >
                                    {row.key}
                                  </button>
                                </th>
                                <td data-label="Suunnitelma">
                                  {row.hasPlan
                                    ? euro(row.planned)
                                    : "Ei suunnitelmaa"}
                                </td>
                                <td data-label="Budjetoidun toteuma">
                                  {euro(row.actual)}
                                </td>
                                <td data-label="Budjetoimaton">
                                  {euro(row.unbudgetedActual)}
                                </td>
                                <td
                                  data-label="Erotus"
                                  className={
                                    row.hasPlan && row.actual > row.planned
                                      ? "negative"
                                      : ""
                                  }
                                >
                                  {row.hasPlan
                                    ? euro(row.planned - row.actual)
                                    : "—"}
                                </td>
                                <td data-label="Kategorioita">
                                  {
                                    Object.values(row.plannedByCategory).filter(
                                      (amount) => amount > 0,
                                    ).length
                                  }
                                </td>
                              </tr>
                            ))}
                            {filteredBudgetReport.length === 0 && (
                              <tr>
                                <td colSpan={6}>Suodattimella ei löytynyt kuukausia.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {!budgetReport.some(
                      (row) =>
                        row.planned || row.actual || row.unbudgetedActual,
                    ) && (
                      <Empty text="Aikavälillä ei ole budjettisuunnitelmia tai toteumia." />
                    )}
                  </section>
);
}
