import React, { type ReactNode, type Dispatch, type SetStateAction } from 'react';
import { ChartNoAxesCombined, CircleDollarSign, ReceiptText, ArrowLeftRight, ArrowRight, ZoomOut, ZoomIn, RotateCcw } from 'lucide-react';
import type { ReportMonth, ReportSelection } from '../domain/report-model';
import { ContextDetails, StatusBadge } from './summary';

type OverviewReportProps = {
 rangeControl: ReactNode;
 history: ReportMonth[]; filteredHistory: ReportMonth[];
 selectedReport: ReportSelection | null; onSelect: (value: ReportSelection | null) => void;
 summary: { valid: boolean; hasData: boolean; periodLabel: string; savingRate: number | null; totals: { income: number; expense: number; consumption: number; cash: number } };
 chart: { format: string; zoom: number; onZoom: Dispatch<SetStateAction<number>>; incomeCoordinates: { x: number; y: number }[]; expenseCoordinates: { x: number; y: number }[]; area: (metric: 'income' | 'expense') => string; line: (metric: 'income' | 'expense') => string };
 euro: (amount: number) => string; pct: (amount: number | null) => string;
};
export function OverviewReport({ rangeControl, history, filteredHistory, selectedReport, onSelect, summary, chart, euro, pct }: OverviewReportProps) {
 const { valid: customRangeValid, hasData: reportHasData, periodLabel, savingRate: periodSavingRate, totals: periodTotals } = summary;
 const { format: reportFormat, zoom: reportZoom, onZoom: setReportZoom, incomeCoordinates: incomeReportCoordinates, expenseCoordinates: expenseReportCoordinates, area: reportArea, line: reportLine } = chart;
 return (
                  <section
                    className="panel report-panel"
                    id="report-panel-overview"
                    role="tabpanel"
                    aria-labelledby="report-tab-overview"
                    tabIndex={0}
                  >
                    {rangeControl}
                    <h2>Tulot ja menot</h2>
                    {reportHasData && (
                      <section
                        className="report-period-summary"
                        aria-labelledby="period-summary-title"
                      >
                        <div className="report-period-summary-head">
                          <div>
                            <h3 id="period-summary-title">
                              Valitun jakson yhteenveto
                            </h3>
                            <p className="muted">
                              {periodLabel} · toteutuneiksi merkityt kirjaukset
                            </p>
                          </div>
                          <div className="report-saving-rate">
                            <ChartNoAxesCombined size={18} aria-hidden="true" />
                            <span>
                              <small>Säästöaste</small>
                              <strong>{pct(periodSavingRate)}</strong>
                            </span>
                          </div>
                        </div>
                        <div className="report-kpi-grid grid grid-cols-1 gap-3 sm:grid-cols-3">
                          {(
                            [
                              [
                                "income",
                                "Tulot",
                                euro(periodTotals.income),
                                CircleDollarSign,
                                "Toteutuneet tulot",
                              ],
                              [
                                "expense",
                                "Menot",
                                euro(periodTotals.expense),
                                ReceiptText,
                                "Kaikki menot ja siirrot",
                              ],
                              [
                                "cash",
                                "Nettokassavirta",
                                euro(periodTotals.cash),
                                ArrowLeftRight,
                                "Tulot − kaikki menot",
                              ],
                            ] as const
                          ).map(([metric, label, value, Icon, note]) => (
                            <button
                              className={`report-kpi ${metric}${selectedReport?.type === "period" && selectedReport.metric === metric ? " selected" : ""}${metric === "cash" && periodTotals.cash < 0 ? " negative" : ""}`}
                              key={metric}
                              type="button"
                              aria-label={`${label}, ${value}. Avaa ${periodLabel} tietueet.`}
                              aria-pressed={
                                selectedReport?.type === "period" &&
                                selectedReport.metric === metric
                              }
                              onClick={() =>
                                onSelect({
                                  type: "period",
                                  from: history[0].key,
                                  to: history[history.length - 1].key,
                                  metric,
                                })
                              }
                            >
                              <Icon
                                size={20}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                              <span className="report-kpi-copy">
                                <small>{label}</small>
                                <strong>{value}</strong>
                                {metric === "expense" && <small>{note}</small>}
                              </span>
                              <ArrowRight
                                className="report-kpi-arrow"
                                size={16}
                                aria-hidden="true"
                              />
                            </button>
                          ))}
                        </div>
                        <StatusBadge>Kirjaukset eivät yksin varmista kattavuutta</StatusBadge>
                        <ContextDetails title="Miten raportin luvut lasketaan?"><p>Tulot ja menot ovat toteutuneiksi laskettuja kirjauksia. Nettokassavirta on tulot miinus kaikki menot, mukaan lukien siirrot. Säästöaste lasketaan kokonaistuloista ja kulutusmenoista, ei siirroista. Kirjausten puuttuminen ei tarkoita, että menoja ei olisi ollut.</p></ContextDetails>
                      </section>
                    )}
                    {reportFormat !== "table" && reportHasData && <div className="report-chart-controls">
                      <div
                        className="chart-zoom"
                        role="group"
                        aria-label="Kaavion suurennus"
                      >
                        <button
                          type="button"
                          aria-label="Pienennä kaaviota"
                          title="Pienennä kaaviota"
                          disabled={reportZoom <= 0.7}
                          onClick={() =>
                            setReportZoom((value) =>
                              Math.max(
                                0.7,
                                Math.round((value - 0.1) * 10) / 10,
                              ),
                            )
                          }
                        >
                          <ZoomOut size={17} aria-hidden="true" />
                        </button>
                        <label>
                          Suurennus
                          <input
                            type="range"
                            min="0.7"
                            max="1.8"
                            step="0.1"
                            value={reportZoom}
                            aria-label="Kaavion suurennusprosentti"
                            aria-valuetext={`${Math.round(reportZoom * 100)} prosenttia`}
                            onChange={(event) =>
                              setReportZoom(Number(event.target.value))
                            }
                          />
                          <output>{Math.round(reportZoom * 100)} %</output>
                        </label>
                        <button
                          type="button"
                          aria-label="Suurenna kaaviota"
                          title="Suurenna kaaviota"
                          disabled={reportZoom >= 1.8}
                          onClick={() =>
                            setReportZoom((value) =>
                              Math.min(
                                1.8,
                                Math.round((value + 0.1) * 10) / 10,
                              ),
                            )
                          }
                        >
                          <ZoomIn size={17} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Palauta kaavion oletuskoko"
                          title="Palauta oletuskoko"
                          disabled={reportZoom === 1}
                          onClick={() => setReportZoom(1)}
                        >
                          <RotateCcw size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>}
                    {reportHasData ? (
                      <>
                        {reportFormat === "bars" ? (
                          <div
                            className="chart report-canvas chart-scroll"
                            role="region"
                            aria-label="Tulot ja menot kuukausittain. Vieritä vaakasuunnassa, kun kaikki kuukaudet eivät mahdu näkymään."
                            tabIndex={0}
                          >
                            {history.map((h) => (
                              <div
                                className="chart-col"
                                key={h.key}
                                style={{
                                  flexBasis: `${64 * reportZoom}px`,
                                  minWidth: `${68 * reportZoom}px`,
                                }}
                              >
                                <div className="chart-bars">
                                  <button
                                    type="button"
                                    className={`income-bar chart-mark${selectedReport?.type === "month" && selectedReport.month === h.key && selectedReport.metric === "income" ? " selected-mark" : ""}`}
                                    aria-label={`${h.key}: tulot ${euro(h.income)}. Avaa tietueet.`}
                                    title={`Tulot ${euro(h.income)} · Näytä tietueet`}
                                    onClick={() =>
                                      onSelect({
                                        type: "month",
                                        month: h.key,
                                        metric: "income",
                                      })
                                    }
                                    style={{
                                      height: Math.max(
                                        2,
                                        (h.income /
                                          Math.max(
                                            ...history.map((x) =>
                                              Math.max(x.income, x.expense),
                                            ),
                                            1,
                                          )) *
                                          140,
                                      ),
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className={`expense-bar chart-mark${selectedReport?.type === "month" && selectedReport.month === h.key && selectedReport.metric === "expense" ? " selected-mark" : ""}`}
                                    aria-label={`${h.key}: menot ${euro(h.expense)}. Avaa tietueet.`}
                                    title={`Menot ${euro(h.expense)} · Näytä tietueet`}
                                    onClick={() =>
                                      onSelect({
                                        type: "month",
                                        month: h.key,
                                        metric: "expense",
                                      })
                                    }
                                    style={{
                                      height: Math.max(
                                        2,
                                        (h.expense /
                                          Math.max(
                                            ...history.map((x) =>
                                              Math.max(x.income, x.expense),
                                            ),
                                            1,
                                          )) *
                                          140,
                                      ),
                                    }}
                                  />
                                </div>
                                <small>
                                  {history.length > 12 ? h.key : h.key.slice(5)}
                                </small>
                              </div>
                            ))}
                          </div>
                        ) : reportFormat === "table" ? null : (
                          <div
                            className="line-chart-wrap"
                            role="region"
                            aria-label="Kuukausittaiset tulojen ja menojen viivakaaviot. Vieritä vaakasuunnassa, kun kaikki kuukaudet eivät mahdu näkymään."
                            tabIndex={0}
                          >
                            <div
                              className="line-chart-content"
                              style={{
                                minWidth: `${history.length * 68 * reportZoom}px`,
                              }}
                            >
                              <svg
                                className={`line-chart${reportFormat === "area" ? " area-chart" : ""}`}
                                viewBox="0 0 100 100"
                                preserveAspectRatio="none"
                                role="img"
                                aria-label={`Kuukausittainen tulojen ja menojen ${reportFormat === "area" ? "aluekaavio" : "viivakaavio"}. Tarkat luvut alla taulukossa.`}
                              >
                                <defs>
                                  <linearGradient
                                    id="incomeArea"
                                    x1="0"
                                    x2="0"
                                    y1="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#087f5b"
                                      stopOpacity=".42"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#087f5b"
                                      stopOpacity=".04"
                                    />
                                  </linearGradient>
                                  <linearGradient
                                    id="expenseArea"
                                    x1="0"
                                    x2="0"
                                    y1="0"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#d9480f"
                                      stopOpacity=".38"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#d9480f"
                                      stopOpacity=".03"
                                    />
                                  </linearGradient>
                                </defs>
                                {[15, 35, 55, 75, 95].map((y) => (
                                  <line
                                    key={y}
                                    x1="0"
                                    y1={y}
                                    x2="100"
                                    y2={y}
                                    className={`chart-axis${y === 95 ? " chart-axis-baseline" : ""}`}
                                  />
                                ))}
                                {reportFormat === "area" && <>
                                  <path d={reportArea("income")} className="income-area" />
                                  <path d={reportArea("expense")} className="expense-area" />
                                </>}
                                <path
                                  d={reportLine("income")}
                                  className="income-line"
                                />
                                <path
                                  d={reportLine("expense")}
                                  className="expense-line"
                                />
                                {history.map((h, index) => {
                                  const incomePoint =
                                    incomeReportCoordinates[index];
                                  const expensePoint =
                                    expenseReportCoordinates[index];
                                  const incomeSelected =
                                    selectedReport?.type === "month" &&
                                    selectedReport.month === h.key &&
                                    selectedReport.metric === "income";
                                  const expenseSelected =
                                    selectedReport?.type === "month" &&
                                    selectedReport.month === h.key &&
                                    selectedReport.metric === "expense";
                                  const handlePointKey = (
                                    event: React.KeyboardEvent<SVGGElement>,
                                    metric: "income" | "expense",
                                  ) => {
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
                                      onSelect({
                                        type: "month",
                                        month: h.key,
                                        metric,
                                      });
                                    }
                                  };
                                  return (
                                    <React.Fragment key={h.key}>
                                      <g
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={incomeSelected}
                                        aria-label={`${h.key} tulot ${euro(h.income)}. Avaa tietueet.`}
                                        onClick={() =>
                                          onSelect({
                                            type: "month",
                                            month: h.key,
                                            metric: "income",
                                          })
                                        }
                                        onKeyDown={(event) =>
                                          handlePointKey(event, "income")
                                        }
                                        className={`chart-point income-point${incomeSelected ? " selected-point" : ""}`}
                                      >
                                        <title>{`${h.key} · Tulot ${euro(h.income)} · Avaa tietueet`}</title>
                                        <circle
                                          className="chart-point-hit"
                                          cx={incomePoint.x}
                                          cy={incomePoint.y}
                                          r="5"
                                        />
                                        <path
                                          className="chart-point-marker"
                                          d={`M ${incomePoint.x} ${incomePoint.y - 1.2} V ${incomePoint.y + 1.2}`}
                                        />
                                      </g>
                                      <g
                                        role="button"
                                        tabIndex={0}
                                        aria-pressed={expenseSelected}
                                        aria-label={`${h.key} menot ${euro(h.expense)}. Avaa tietueet.`}
                                        onClick={() =>
                                          onSelect({
                                            type: "month",
                                            month: h.key,
                                            metric: "expense",
                                          })
                                        }
                                        onKeyDown={(event) =>
                                          handlePointKey(event, "expense")
                                        }
                                        className={`chart-point expense-point${expenseSelected ? " selected-point" : ""}`}
                                      >
                                        <title>{`${h.key} · Menot ${euro(h.expense)} · Avaa tietueet`}</title>
                                        <circle
                                          className="chart-point-hit"
                                          cx={expensePoint.x}
                                          cy={expensePoint.y}
                                          r="5"
                                        />
                                        <path
                                          className="chart-point-marker"
                                          d={`M ${expensePoint.x} ${expensePoint.y - 1.2} V ${expensePoint.y + 1.2}`}
                                        />
                                      </g>
                                    </React.Fragment>
                                  );
                                })}
                              </svg>
                              <div className="line-chart-labels">
                                {history.map((h) => (
                                  <small key={h.key}>
                                    {history.length > 12
                                      ? h.key
                                      : h.key.slice(5)}
                                  </small>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        <div
                          className="chart-legend"
                          aria-hidden="true"
                          hidden={reportFormat === "table"}
                        >
                          <span>
                            <i className="legend-swatch income-bar" /> Tulot
                          </span>
                          <span>
                            <i className="legend-swatch expense-bar" /> Menot
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="chart-empty">
                        {!customRangeValid
                          ? "Korjaa aikaväli yllä."
                          : "Ei toteutuneita tuloja tai menoja valitulla jaksolla."}
                      </div>
                    )}
                    <div className="table-wrap mobile-card-table report-history-table" hidden={reportFormat !== "table"}>
                      <table role="table">
                        <thead role="rowgroup">
                          <tr role="row">
                            <th role="columnheader">Kuukausi</th>
                            <th role="columnheader">Tulot</th>
                            <th role="columnheader">Menot</th>
                            <th role="columnheader">Kulutus</th>
                            <th role="columnheader">
                              Säästö- ja sijoitussiirrot
                            </th>
                            <th role="columnheader">Kassavirta</th>
                            <th role="columnheader">Säästöaste</th>
                          </tr>
                        </thead>
                        <tbody role="rowgroup">
                          {filteredHistory.map((h) => (
                            <tr role="row" key={h.key}>
                              <th
                                role="rowheader"
                                scope="row"
                                data-label="Kuukausi"
                              >
                                {h.key}
                              </th>
                              <td role="cell" data-label="Tulot">
                                {euro(h.income)}
                              </td>
                              <td role="cell" data-label="Menot">
                                {euro(h.expense)}
                              </td>
                              <td role="cell" data-label="Kulutus">
                                {euro(h.consumption)}
                              </td>
                              <td role="cell" data-label="Siirrot">
                                {euro(
                                  h.savingTransfers + h.investmentTransfers,
                                )}
                              </td>
                              <td role="cell" data-label="Kassavirta">
                                {euro(h.cash)}
                              </td>
                              <td role="cell" data-label="Säästöaste">
                                {pct(h.savingRate)}
                              </td>
                            </tr>
                          ))}
                          {filteredHistory.length === 0 && (
                            <tr>
                              <td colSpan={7}>Suodattimella ei löytynyt kuukausia.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <p className="muted">
                      Toistuvat toteutuneiksi merkityt tapahtumat lasketaan
                      jokaiselle esiintymälle. Tämä ei ole pankkitapahtumien
                      toteumavarmistus. Nettovarallisuuden historiaseuranta ei
                      kuulu tähän versioon.
                    </p>
                  </section>
);
}
