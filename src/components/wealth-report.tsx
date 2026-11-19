import type { Entry } from '../domain/model';
import { categoryIconFor } from '../domain/categories';
import { CategoryImage } from './category-image';

type WealthReportProps = {
 currentAssets: (Entry & { ownedValue: number })[];
 currentInvestments: (Entry & { marketValue: number })[];
 currentDebts: Entry[];
 filteredWealthTableRows: { id: string; name: string; category: string; value: number; date: string }[];
 assetBalance: number; investmentBalance: number; debtBalance: number; netWorth: number;
 reportFormat: string; euro: (amount: number) => string;
};
export function WealthReport({ currentAssets, currentInvestments, currentDebts, filteredWealthTableRows, assetBalance, investmentBalance, debtBalance, netWorth, reportFormat, euro }: WealthReportProps) {
return (
                  <section
                    className="panel report-panel"
                    id="report-panel-wealth"
                    role="tabpanel"
                    aria-labelledby="report-tab-wealth"
                    tabIndex={0}
                  >
                    <h2>Valitun päivän varallisuuskuva</h2>
                    <p className="muted">
                      Tämä on valitun päivän arvio ja kirjattujen arvojen tilannekuva, ei todennettu historiaseuranta.
                      Omaisuusarvot perustuvat itse syöttämiisi arvoihin ja
                      arvostuspäiviin.
                    </p>
                    <div className="report-summary-strip wealth-summary">
                      <article>
                        <small>Omaisuus</small>
                        <strong>{euro(assetBalance)}</strong>
                      </article>
                      <article>
                        <small>Sijoitukset</small>
                        <strong>{euro(investmentBalance)}</strong>
                      </article>
                      <article>
                        <small>Velat</small>
                        <strong>{euro(debtBalance)}</strong>
                      </article>
                      <article>
                        <small>Nettovarallisuus</small>
                        <strong>{euro(netWorth)}</strong>
                      </article>
                    </div>
                    {reportFormat === "breakdown" ? (
                      <div className="wealth-report-grid">
                        <section>
                          <h3>Omaisuuserät</h3>
                          {currentAssets.length ? (
                            currentAssets.map((asset) => (
                              <article key={asset.id}>
                                <div className="wealth-report-item-label">
                                  <CategoryImage
                                    icon={categoryIconFor(
                                      asset.category,
                                      "assets",
                                    )}
                                    size={28}
                                  />
                                  <span>
                                    {asset.name}
                                    <small>
                                      {asset.category} · arvostettu{" "}
                                      {asset.date
                                        .split("-")
                                        .reverse()
                                        .join(".")}
                                    </small>
                                  </span>
                                </div>
                                <strong>{euro(asset.ownedValue)}</strong>
                              </article>
                            ))
                          ) : (
                            <p className="muted">Omaisuutta ei ole kirjattu.</p>
                          )}
                        </section>
                        <section>
                          <h3>Sijoitukset</h3>
                          {currentInvestments.length ? (
                            currentInvestments.map((investment) => (
                              <article key={investment.id}>
                                <div className="wealth-report-item-label">
                                  <CategoryImage
                                    icon={categoryIconFor(
                                      investment.category,
                                      "investments",
                                    )}
                                    size={28}
                                  />
                                  <span>
                                    {investment.name}
                                    <small>
                                      {investment.category} ·{" "}
                                      {investment.quantity} kpl
                                    </small>
                                  </span>
                                </div>
                                <strong>{euro(investment.marketValue)}</strong>
                              </article>
                            ))
                          ) : (
                            <p className="muted">
                              Sijoituksia ei ole kirjattu.
                            </p>
                          )}
                        </section>
                        <section>
                          <h3>Velat</h3>
                          {currentDebts.length ? (
                            currentDebts.map((debt) => (
                              <article key={debt.id}>
                                <div className="wealth-report-item-label">
                                  <CategoryImage
                                    icon={categoryIconFor(
                                      debt.category,
                                      "liabilities",
                                    )}
                                    size={28}
                                  />
                                  <span>
                                    {debt.name}
                                    <small>{debt.category}</small>
                                  </span>
                                </div>
                                <strong>−{euro(debt.amount)}</strong>
                              </article>
                            ))
                          ) : (
                            <p className="muted">Velkoja ei ole kirjattu.</p>
                          )}
                        </section>
                      </div>
                    ) : (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Tietue</th>
                              <th>Kategoria</th>
                              <th>Arvo / saldo</th>
                              <th>Päivä</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredWealthTableRows.map((row) => (
                              <tr key={row.id}>
                                <th scope="row" data-label="Tietue">
                                  {row.name}
                                </th>
                                <td data-label="Kategoria">{row.category}</td>
                                <td data-label="Arvo">
                                  {row.value < 0
                                    ? `−${euro(Math.abs(row.value))}`
                                    : euro(row.value)}
                                </td>
                                <td data-label="Päivä">
                                  {row.date.split("-").reverse().join(".")}
                                </td>
                              </tr>
                            ))}
                            {filteredWealthTableRows.length === 0 && (
                              <tr>
                                <td colSpan={4}>Suodattimella ei löytynyt tietueita.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
);
}
