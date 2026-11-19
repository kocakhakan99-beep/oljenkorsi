import { ContextDetails, StatusBadge } from './summary';

type DataSettingsProps = {
 cloudManaged: boolean; storageOk: boolean; isDemo: boolean;
 onChooseDemo: () => void; onTransfer: () => void; onExportLegacy: () => void; onRequestDelete: () => void; onRemoveDemo: () => void;
};
export function DataSettings({ cloudManaged, storageOk, isDemo, onChooseDemo, onTransfer, onExportLegacy, onRequestDelete, onRemoveDemo }: DataSettingsProps) {
return <>
                <section className="panel settings-demo-entry" aria-labelledby="settings-demo-title">
                  <div><h2 id="settings-demo-title">Esimerkkitaloudet</h2><StatusBadge>4 taloutta · 2024–2026</StatusBadge><p className="ux-status-note">{cloudManaged ? 'Lataus korvaa valitun talouden ja tallentuu pilveen.' : 'Lataus korvaa nykyisen talouden.'}</p></div>
                  <button onClick={() => onChooseDemo()}>Valitse demotalous</button>
                </section>
                <section className="panel">
                  <h2>Tallennus ja datan hallinta</h2>
                  <StatusBadge tone={storageOk ? "positive" : "warning"}>{cloudManaged ? 'Pilvitallennuksen tila yläpalkissa' : storageOk ? "Vain väliaikaisesti muistissa" : "Tallennus ei käytettävissä"}</StatusBadge>
                  {!storageOk && <p role="alert">Vie varmuuskopio ennen kuin suljet tämän välilehden.</p>}
                  <p className="ux-status-note">Varmuuskopio ei ole automaattinen.</p>
                  <button onClick={() => onTransfer()}>Varmuuskopiot, tuonti ja vienti</button>
                  <ContextDetails title="Miten tiedot säilyvät?"><p>{cloudManaged ? 'Vahvistetut muutokset tallennetaan valittuun pilvitalouteen. Tallentamattomat muutokset katoavat, jos sivu suljetaan.' : 'Tiedot katoavat sivun uudelleenlatauksessa ja sulkemisessa. Vie tiedot ennen poistumista.'} JSON-varmuuskopio sisältää koko talouden; CSV-vienti ei sisällä kaikkia tietoja.</p></ContextDetails>
                  <ContextDetails title="Tallennuksen lisätyökalut"><p>Aiemman version selaintallennuksen voi viedä tästä ja palauttaa JSON-tiedostona. Sitä ei poisteta automaattisesti.</p>
                    <button
                      onClick={onExportLegacy}
                    >
                      Vie alkuperäinen selaintallennus
                    </button>
                  </ContextDetails>
                  <details className="danger-zone"><summary>Poista tietoja</summary>
                    <h3>Kaikkien tietojen poisto</h3>
                    <p>
                      {cloudManaged ? 'Poisto tyhjentää valitun pilvitalouden.' : 'Poisto tyhjentää tämän välilehden muistissa olevan talouden.'} Vie JSON-varmuuskopio ennen poistamista, jos haluat säilyttää tiedot.
                    </p>
                    <button
                      className="danger"
                      onClick={onRequestDelete}
                    >
                      Poista kaikki tietoni
                    </button>
                  {isDemo && (
                    <p>
                      <button
                        onClick={onRemoveDemo}
                      >
                        Poista esimerkkitalous
                      </button>
                    </p>
                  )}
                  </details>
                </section>
</>;
}
