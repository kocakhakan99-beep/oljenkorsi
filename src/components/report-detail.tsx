import type { Ref } from 'react';
import type { budgetSummary } from '../domain/calculations';
import type { ReportSelection, ReportDetailEntry } from '../domain/report-model';
import { MetricCard, StatusBadge, ContextDetails } from './summary';

type ReportDetailProps = {
 reportDetailRef: Ref<HTMLElement>; selectedReport: ReportSelection;
 selectedReportTotal: number; selectedReportEntries: ReportDetailEntry[];
 selectedBudgetSummary: ReturnType<typeof budgetSummary> | null;
 onClose: () => void; onOpenEntry: (value: { kind: 'incomes' | 'expenses'; id: string }) => void;
 euro: (amount: number) => string;
};
export function ReportDetail({ reportDetailRef, selectedReport, selectedReportTotal, selectedReportEntries, selectedBudgetSummary, onClose, onOpenEntry, euro }: ReportDetailProps) {
 return (
                  <section
                    ref={reportDetailRef}
                    tabIndex={-1}
                    aria-labelledby="report-detail-title"
                    className="report-panel report-detail min-w-0 max-w-full overflow-clip rounded-2xl border p-5 shadow-sm mb-6 transition-shadow duration-200 hover:shadow-md"
                    aria-live="polite"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <p className="eyebrow">VALITTU RAPORTTIKOHTA</p>
                        <h2 id="report-detail-title">
                          {selectedReport.type === "period"
                            ? `${selectedReport.from === selectedReport.to ? selectedReport.from : `${selectedReport.from}–${selectedReport.to}`} · ${selectedReport.metric === "income" ? "Tulot" : selectedReport.metric === "expense" ? "Menot" : "Nettokassavirta"}`
                            : selectedReport.type === "budget"
                              ? `${selectedReport.month} · Budjetti ja toteuma`
                              : selectedReport.type === "month"
                                ? `${selectedReport.month} · ${selectedReport.metric === "income" ? "Tulot" : "Menot"}`
                                : selectedReport.type === "category"
                                  ? `${selectedReport.category} · ${selectedReport.from}–${selectedReport.to}`
                                  : `${selectedReport.date.split("-").reverse().join(".")} · tapahtumat`}
                        </h2>
                      </div>
                      <button
                        aria-label="Sulje raportin tietokortti"
                        onClick={() => onClose()}
                      >
                        Sulje
                      </button>
                    </div>
                    <div className="report-detail-total"><strong className={selectedReportTotal < 0 ? "negative" : ""}>{euro(selectedReportTotal)}</strong><StatusBadge>{selectedReportEntries.length} tietuetta</StatusBadge></div>
                    {selectedReport.type === "budget" && (
                      <>
                        <div className="stats report-detail-metrics">
                          <MetricCard label="Suunnitelma" value={euro(selectedReport.planned)} />
                          <MetricCard label="Toteuma budjetoiduissa" value={euro(selectedReport.actual)} />
                          <MetricCard label="Ilman budjettia" value={euro(selectedBudgetSummary?.unbudgetedActual || 0)} />
                        </div>
                        {selectedReport.manualCategories.length ? <p className="ux-status-note"><StatusBadge tone="warning">Oma kokonaistoteuma</StatusBadge> Käsin syötetty toteuma korvaa kirjaukset kategorioissa {selectedReport.manualCategories.join(", ")}.</p> : <StatusBadge>Toteuma kirjauksista</StatusBadge>}
                        <ContextDetails title="Mitä tietokortin kirjaukset sisältävät?"><p>Alla näkyvät budjetoitujen kategorioiden toteutuneet kulutustapahtumat. Mahdollinen oma kokonaistoteuma korvaa budjettivertailun luvun, ei yksittäisiä maksuja tai kassavirtaa.</p></ContextDetails>
                        {!!selectedBudgetSummary?.categories.some(
                          (category) =>
                            category.planned <= 0 && category.actual > 0,
                        ) && (
                          <div className="unbudgeted-report-list">
                            <strong>Budjetoimattomat kategoriat</strong>
                            {selectedBudgetSummary.categories
                              .filter(
                                (category) =>
                                  category.planned <= 0 && category.actual > 0,
                              )
                              .map((category) => (
                                <span key={category.category}>
                                  {category.category}
                                  <b>{euro(category.actual)}</b>
                                </span>
                              ))}
                          </div>
                        )}
                      </>
                    )}
                    {selectedReportEntries.length ? (
                      <div className="divide-y divide-slate-100">
                        {selectedReportEntries.map(
                          (
                            { entry: record, kind, amount, occurrences: count },
                            index,
                          ) => (
                            <div
                              className="grid grid-cols-[10px_minmax(0,1fr)_auto] items-center gap-3 py-3"
                              key={`${kind}-${record.id}-${index}`}
                            >
                              <span
                                className={`h-2.5 w-2.5 rounded-full ${kind === "income" ? "bg-report-income" : "bg-report-expense"}`}
                                aria-hidden="true"
                              />
                              <span>
                                <button type="button" className="report-record-open" aria-label={`Avaa ${record.name}`} onClick={() => onOpenEntry({ kind: kind === "income" ? "incomes" : "expenses", id: record.id })}>{record.name}</button>
                                <small className="mt-1 block text-xs text-slate-500">
                                  {selectedReport.type === "period"
                                    ? `${kind === "income" ? "Tulo" : "Meno"} · ${record.category} · ${count} ${count === 1 ? "esiintymä" : "esiintymää"} valitulla jaksolla`
                                    : `${record.category} · ${record.date.split("-").reverse().join(".")}`}
                                </small>
                              </span>
                              <strong>{euro(amount)}</strong>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="muted">
                        Valintaan ei löydy toteutuneita kirjauksia.
                      </p>
                    )}
                  </section>
);
}
