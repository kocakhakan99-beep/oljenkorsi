import type { ReportSelection } from '../domain/report-model';
import { Empty } from './empty';

type CategoryReportProps = {
 periodLabel: string; reportFormat: string;
 data: { rows: [string, number][]; filteredRows: [string, number][]; slices: { category: string; value: number; start: number; end: number; color: string }[]; colors: string[]; total: number; max: number };
 range: { history: { key: string }[]; start: string; end: string };
 selectedReport: ReportSelection | null; onSelect: (value: ReportSelection | null) => void;
 euro: (amount: number) => string; pct: (amount: number | null) => string;
};
function pieSlicePath(startPercent: number, endPercent: number) {
  const point = (percent: number, radius: number) => {
    const angle = ((percent * 3.6 - 90) * Math.PI) / 180;
    return [50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius];
  };
  const end =
    endPercent - startPercent > 99.99 ? startPercent + 99.99 : endPercent;
  const [x1, y1] = point(startPercent, 48);
  const [x2, y2] = point(end, 48);
  const [x3, y3] = point(end, 27);
  const [x4, y4] = point(startPercent, 27);
  const large = end - startPercent > 50 ? 1 : 0;
  return `M ${x1} ${y1} A 48 48 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A 27 27 0 ${large} 0 ${x4} ${y4} Z`;
}

export function CategoryReport({ periodLabel, reportFormat, data, range, selectedReport, onSelect, euro, pct }: CategoryReportProps) {
 const { rows: categoryReport, filteredRows: filteredCategoryReport, slices: pieSlices, colors: pieColors, total: categoryTotal, max: maxCategoryExpense } = data;
 const { history, start: reportStart, end: reportEnd } = range;
 return (
                  <section
                    className="panel report-panel"
                    id="report-panel-categories"
                    role="tabpanel"
                    aria-labelledby="report-tab-categories"
                    tabIndex={0}
                  >
                    <h2>Kulutusmenot kategorioittain</h2>
                    <p className="muted">
                      {periodLabel} · toteutuneiksi merkityt kulutusmenot. Menot
                      ja säästö- tai sijoitussiirrot ovat erillään.
                    </p>
                    {reportFormat === "pie" && categoryReport.length > 0 && (
                      <div className="pie-layout">
                        <div className="pie-chart">
                          <svg
                            className="pie-svg"
                            viewBox="0 0 100 100"
                            role="group"
                            aria-label="Valitse piirakan kululuokka"
                          >
                            {pieSlices.map((slice) => (
                              <path
                                key={slice.category}
                                d={pieSlicePath(slice.start, slice.end)}
                                fill={slice.color}
                                className={`pie-slice${selectedReport?.type === "category" && selectedReport.category === slice.category ? " selected-slice" : ""}`}
                                role="button"
                                tabIndex={0}
                                aria-label={`${slice.category}: ${euro(slice.value)}, ${pct(categoryTotal ? (slice.value * 100) / categoryTotal : null)}. Avaa kirjaukset.`}
                                aria-pressed={
                                  selectedReport?.type === "category" &&
                                  selectedReport.category === slice.category
                                }
                                onClick={() =>
                                  onSelect({
                                    type: "category",
                                    category: slice.category,
                                    from: history[0]?.key || reportStart,
                                    to: history.at(-1)?.key || reportEnd,
                                  })
                                }
                                onKeyDown={(event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    onSelect({
                                      type: "category",
                                      category: slice.category,
                                      from: history[0]?.key || reportStart,
                                      to: history.at(-1)?.key || reportEnd,
                                    });
                                  }
                                }}
                              />
                            ))}
                          </svg>
                          <div className="pie-center">
                            <strong>{euro(categoryTotal)}</strong>
                            <small>Kulutus yhteensä</small>
                          </div>
                        </div>
                        <div className="pie-legend">
                          {categoryReport.map(([category, value], index) => (
                            <button
                              key={category}
                              className={
                                selectedReport?.type === "category" &&
                                selectedReport.category === category
                                  ? "selected-legend"
                                  : ""
                              }
                              onClick={() =>
                                onSelect({
                                  type: "category",
                                  category,
                                  from: history[0]?.key || reportStart,
                                  to: history.at(-1)?.key || reportEnd,
                                })
                              }
                            >
                              <i
                                style={{
                                  backgroundColor:
                                    pieColors[index % pieColors.length],
                                }}
                              />
                              <span>{category}</span>
                              <strong>
                                {pct(
                                  categoryTotal
                                    ? (value * 100) / categoryTotal
                                    : null,
                                )}
                              </strong>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {reportFormat === "table" && categoryReport.length > 0 && (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Kategoria</th>
                              <th>Osuus</th>
                              <th>Kulutus</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCategoryReport.map(([category, value]) => (
                              <tr key={category}>
                                <th scope="row" data-label="Kategoria">
                                  <button
                                    className="report-table-link"
                                    onClick={() =>
                                      onSelect({
                                        type: "category",
                                        category,
                                        from: history[0]?.key || reportStart,
                                        to: history.at(-1)?.key || reportEnd,
                                      })
                                    }
                                  >
                                    {category}
                                  </button>
                                </th>
                                <td data-label="Osuus">
                                  {pct(
                                    categoryTotal
                                      ? (value * 100) / categoryTotal
                                      : null,
                                  )}
                                </td>
                                <td data-label="Kulutus">{euro(value)}</td>
                              </tr>
                            ))}
                            {filteredCategoryReport.length === 0 && (
                              <tr>
                                <td colSpan={3}>Suodattimella ei löytynyt kululuokkia.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {reportFormat === "bars" &&
                      categoryReport.length > 0 &&
                      categoryReport.map(([category, value]) => (
                        <button
                          className={`category-report-row${selectedReport?.type === "category" && selectedReport.category === category ? " selected-report-row" : ""}`}
                          key={category}
                          aria-label={`${category}, ${euro(value)}. Avaa kirjaukset.`}
                          onClick={() =>
                            onSelect({
                              type: "category",
                              category,
                              from: history[0]?.key || reportStart,
                              to: history.at(-1)?.key || reportEnd,
                            })
                          }
                        >
                          <div>
                            <span>{category}</span>
                            <strong>
                              {euro(value)} ·{" "}
                              {pct(
                                categoryTotal
                                  ? (value * 100) / categoryTotal
                                  : null,
                              )}
                            </strong>
                          </div>
                          <progress
                            max={maxCategoryExpense}
                            value={value}
                            aria-label={`${category}: ${euro(value)}`}
                          />
                        </button>
                      ))}
                    {categoryReport.length === 0 && (
                      <Empty text="Valitulla aikavälillä ei ole toteutuneita kulutusmenoja." />
                    )}
                  </section>
);
}
