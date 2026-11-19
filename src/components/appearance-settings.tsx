import type { State } from '../domain/model';
import { StatusBadge } from './summary';

export function AppearanceSettings({ value, onChange, dismissedCount, legacyHelpCount, restoreHelp, importLegacyHelp }: { value: State['settings']; onChange: (value: Partial<State['settings']>) => void; dismissedCount: number; legacyHelpCount: number; restoreHelp: () => void; importLegacyHelp: () => void }) {
return <>
                <section className="panel panel-plan">
                  <h2>Ulkoasu</h2>
                  <div className="form-grid">
                    <label>
                      Teema
                      <select
                        aria-label="Teema"
                        value={value.theme}
                        onChange={(e) => onChange({ theme: e.target.value })}
                      >
                        <option value="neutral">Selkeä / neutraali</option>
                        <option value="blue">Rauhallinen sininen</option>
                        <option value="green">Luonnollinen vihreä</option>
                        <option value="contrast">Korkea kontrasti</option>
                        <option value="custom">Oma korostusväri</option>
                      </select>
                    </label>
                    <label>
                      Väritila
                      <select
                        aria-label="Väritila"
                        value={value.mode}
                        onChange={(e) => onChange({ mode: e.target.value })}
                      >
                        <option value="system">Järjestelmä</option>
                        <option value="light">Vaalea</option>
                        <option value="dark">Tumma</option>
                      </select>
                    </label>
                    {value.theme === "custom" && (
                      <label>
                        Korostusväri
                        <input
                          type="color"
                          value={value.accent}
                          onChange={(e) => onChange({ accent: e.target.value })}
                        />
                        <small>
                          Tekstikontrasti säätyy automaattisesti.
                        </small>
                      </label>
                    )}
                  </div>
                  <StatusBadge>EUR · Suomi</StatusBadge>
                </section>
                <section
                  className="panel help-settings"
                  aria-labelledby="help-settings-title"
                >
                  <div>
                    <h2 id="help-settings-title">Ohjelaatikot</h2>

                  </div>
                  <button
                    type="button"
                    onClick={restoreHelp}
                    disabled={!dismissedCount}
                  >
                    Palauta piilotetut ohjeet ({dismissedCount})
                  </button>
                  {legacyHelpCount > 0 && <button type="button" onClick={importLegacyHelp}>Tuo tämän selaimen vanhat ohjeasetukset</button>}
                </section>
</>;
}
