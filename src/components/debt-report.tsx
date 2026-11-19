import type { Entry } from '../domain/model';
import type { linkedAssetOutlook } from '../domain/calculations';
import { PercentField } from './numeric-inputs';
import { Empty } from './empty';

type LinkedReportItem = { asset: Entry & { ownedValue: number }; outlook: ReturnType<typeof linkedAssetOutlook> };
type DebtReportProps = {
 linkedOutlooks: LinkedReportItem[]; filteredLinkedOutlooks: LinkedReportItem[]; currentDebts: Entry[];
 assetChangeRate: number; setAssetChangeRate: (value: number) => void;
 reportFormat: string; euro: (amount: number) => string;
};
export function DebtReport({ linkedOutlooks, filteredLinkedOutlooks, currentDebts, assetChangeRate, setAssetChangeRate, reportFormat, euro }: DebtReportProps) {
return (
                  <section
                    className="panel report-panel"
                    id="report-panel-debt"
                    role="tabpanel"
                    aria-labelledby="report-tab-debt"
                    tabIndex={0}
                  >
                    <h2>Velat, vakuutena oleva omaisuus ja oma pääoma</h2>
                    <p className="muted">
                      Linkitä laina omaisuuserään velan muokkauksessa. Arvio
                      olettaa nykyisen lainasaldon, koron ja maksuerän pysyvän
                      voimassa eikä huomioi kuluja, lyhennysvapaita tai uusia
                      nostoja.
                    </p>
                    <div className="report-assumption">
                      <PercentField
                        label="Omaisuuden oletettu vuotuinen arvonmuutos"
                        value={assetChangeRate}
                        min={-99.9}
                        max={100}
                        step={0.1}
                        onChange={setAssetChangeRate}
                      />
                      <small>
                        Oletus vaikuttaa vain tulevan arvon suuntaa-antavaan
                        arvioon. Nykyinen oma pääoma = omaisuuden omistusosuus −
                        siihen linkitetyt velat.
                      </small>
                    </div>
                    {reportFormat === "table" ? (
                      <div className="table-wrap mobile-card-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Omaisuus / laina</th>
                              <th>Velkasaldo</th>
                              <th>Oma pääoma nyt</th>
                              <th>Maksuaika-arvio</th>
                              <th>Arvioitu korko</th>
                              <th>Oma pääoma maksuajan lopussa</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredLinkedOutlooks.map(({ asset, outlook }) => (
                              <tr key={asset.id}>
                                <th scope="row" data-label="Omaisuus / laina">
                                  {asset.name}
                                </th>
                                <td data-label="Velkasaldo">
                                  {euro(outlook!.debtBalance)}
                                </td>
                                <td data-label="Oma pääoma nyt">
                                  {euro(outlook!.currentEquity)}
                                </td>
                                <td data-label="Maksuaika">
                                  {outlook!.payoffMonths === null
                                    ? "Ei laskettavissa"
                                    : `${outlook!.payoffMonths} kk`}
                                </td>
                                <td data-label="Korkoarvio">
                                  {outlook!.estimatedInterest === null
                                    ? "Ei laskettavissa"
                                    : euro(outlook!.estimatedInterest)}
                                </td>
                                <td data-label="Arvio lopussa">
                                  {outlook!.estimatedEquityAtPayoff === null
                                    ? "Ei laskettavissa"
                                    : euro(outlook!.estimatedEquityAtPayoff)}
                                </td>
                              </tr>
                            ))}
                            {filteredLinkedOutlooks.length === 0 && (
                              <tr>
                                <td colSpan={6}>Suodattimella ei löytynyt velka–omaisuuspareja.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="debt-outlook-list">
                        {linkedOutlooks.map(({ asset, outlook }) => (
                          <article key={asset.id} className="debt-outlook-card">
                            <header>
                              <h3>{asset.name}</h3>
                              <span>{asset.category}</span>
                            </header>
                            <div className="debt-outlook-values">
                              <span>
                                <small>Omaisuuden omistusosuus</small>
                                <strong>{euro(outlook!.ownedValue)}</strong>
                              </span>
                              <span>
                                <small>Linkitetty velka</small>
                                <strong>−{euro(outlook!.debtBalance)}</strong>
                              </span>
                              <span>
                                <small>Oma pääoma nyt</small>
                                <strong>{euro(outlook!.currentEquity)}</strong>
                              </span>
                            </div>
                            <p>
                              {outlook!.payoffMonths === null
                                ? "Maksuaikaa ei voi arvioida: tarkista lainan korko ja kuukausierä."
                                : `Velat maksettu arviolta ${outlook!.payoffMonths} kuukaudessa; korkoja maksetaan arviolta ${euro(outlook!.estimatedInterest || 0)}. Omaisuuden arvioitu arvo silloin: ${euro(outlook!.projectedValueAtPayoff || 0)}.`}
                            </p>
                            <strong className="debt-equity-result">
                              Oma pääoma velkojen maksun jälkeen:{" "}
                              {outlook!.estimatedEquityAtPayoff === null
                                ? "Ei laskettavissa"
                                : euro(outlook!.estimatedEquityAtPayoff)}
                            </strong>
                          </article>
                        ))}
                      </div>
                    )}
                    {currentDebts.some((debt) => !debt.linkedAssetId) && (
                      <div className="alert report-alert">
                        Linkittämättömiä lainoja:{" "}
                        {currentDebts
                          .filter((debt) => !debt.linkedAssetId)
                          .map((debt) => debt.name)
                          .join(", ")}
                        . Linkitä ne velan muokkausnäkymässä, jos niillä on
                        omaisuuserä vastinparina.
                      </div>
                    )}
                    {linkedOutlooks.length === 0 && currentDebts.length > 0 && (
                      <Empty text="Yhtään velkaa ei ole vielä linkitetty omaisuuserään." />
                    )}
                    {currentDebts.length === 0 && (
                      <Empty text="Lisää velka ja omaisuuserä, jotta voit tarkastella pääomaa ja takaisinmaksuarviota." />
                    )}
                  </section>
);
}
