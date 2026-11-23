import { reconciliationCandidates, type Reconciliation } from "../domain/csv-reconciliation";
import { useState } from 'react';
import { type State, type Entry, type Kind, kinds, today } from '../domain/model';
import { money, occurrenceAmount, scheduledOccurrences, occurrenceStatus } from '../domain/calculations';
import { parseCSV, exportCSV, csvEntry, csvFields, csvFieldLabels, mapCSVHeaders, download } from '../services/csv';
import { ContextDetails, StatusBadge } from './summary';

export function Transfer({
  s,
  onBackup,
  onRestore,
  onImport,
  labels,
}: {
  labels: Record<Kind, string>;
  s: State;
  onBackup: () => void;
  onRestore: (f: File) => void;
  onImport: (k: Kind, e: Entry[], matches: Reconciliation[]) => boolean;
}) {
  const [kind, setKind] = useState<Kind>("expenses"),
    [text, setText] = useState(""),
    [delimiter, setDelimiter] = useState(";"),
    [map, setMap] = useState<Record<string, number>>({}),
    [error, setError] = useState(""),
    [encoding, setEncoding] = useState("utf-8"),
    [bytes, setBytes] = useState<ArrayBuffer | null>(null),
    [fileOptionsOpen, setFileOptionsOpen] = useState(false),
    [skipErrors, setSkipErrors] = useState(false),
    [skipDuplicates, setSkipDuplicates] = useState(true),
    [choices, setChoices] = useState<Record<number, string>>({}),
    [choiceContext, setChoiceContext] = useState("");
  const currentContext = JSON.stringify([kind, text, delimiter, map]);
  const selectedChoices = choiceContext === currentContext ? choices : {};
  const primaryCSVFields = ["name", "amount", "category", "date"];
  const advancedCSVFields = csvFields.filter(
    (field) => !primaryCSVFields.includes(field),
  );
  const mappedAdvancedCSVFields = advancedCSVFields.filter(
    (field) => (map[field] ?? -1) >= 0,
  ).length;
  let rows: string[][] = [];
  try {
    rows = text ? parseCSV(text, delimiter) : [];
  } catch (e) {
    error || queueMicrotask(() => setError(String(e)));
  }
  const usesSignedBankAmounts =
    map.amount >= 0 &&
    rows.slice(1).some((row) => {
      try {
        return money(row[map.amount] || "") < 0;
      } catch {
        return false;
      }
    });
  const evaluated = rows.slice(1).map((r, i) => {
    try {
      if (
        usesSignedBankAmounts &&
        kind === "expenses" &&
        money(r[map.amount] || "") > 0
      )
        throw Error(
          "Positiivinen pankkitapahtuma näyttää tulolta. Tuo se Tulot-näkymässä tai suodata CSV.",
        );
      let e = csvEntry(
          r,
          map,
          kind === "incomes" || kind === "expenses" ? kind : undefined,
        ),
        duplicate = s[kind].some((x) =>
          (x.name === e.name && x.date === e.date && x.amount === e.amount && x.category === e.category) ||
          ((kind === "incomes" || kind === "expenses") && scheduledOccurrences(x, e.date.slice(0, 7)).includes(e.date) && occurrenceStatus(x, e.date) === "actual" && occurrenceAmount(x, e.date) === e.amount),
        );
      return { e, duplicate, line: i + 2, error: "" };
    } catch (e) {
      return {
        e: null,
        duplicate: false,
        line: i + 2,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  });
  let seen = new Set<string>();
  for (let r of evaluated)
    if (r.e) {
      let key = JSON.stringify([r.e.name, r.e.date, r.e.amount, r.e.category]);
      if (seen.has(key)) r.duplicate = true;
      seen.add(key);
    }
  const matches: Reconciliation[] = [];
  const selectedTargets = new Set<string>();
  let selectionError = "";
  const acceptedRows = evaluated.filter(row => {
    if (!row.e) return false;
    const selected = selectedChoices[row.line];
    if (selected === "skip") return false;
    if (selected && selected !== "add") {
      const candidates = reconciliationCandidates(s, kind, row.e);
      if (!candidates.some(candidate => candidate.id === selected)) { selectionError = "Valittu tapahtuma on muuttunut. Tarkista valinnat."; return false; }
      const key = `${selected}|${row.e.date}`;
      if (selectedTargets.has(key)) { selectionError = "Samaa tapahtumaa ei voi täsmäyttää kahdesti."; return false; }
      selectedTargets.add(key);
      matches.push({ imported: row.e, targetId: selected });
      return false;
    }
    if (!selected && reconciliationCandidates(s, kind, row.e).length) return false;
    return selected === "add" || !skipDuplicates || !row.duplicate;
  });
  let errors = evaluated.filter((r) => r.error),
    dups = evaluated.filter((r) => r.duplicate),
    accepted = acceptedRows.map((r) => r.e!);
  function decode(b: ArrayBuffer, enc: string) {
    try {
      let t = new TextDecoder(enc, { fatal: enc === "utf-8" })
        .decode(b)
        .replace(/^\ufeff/, "");
      setText(t);
      let sep = t.split(/\r?\n/)[0].includes(";") ? ";" : ",";
      setDelimiter(sep);
      let header = parseCSV(t, sep)[0] || [];
      setMap(mapCSVHeaders(header));
      setError("");
    } catch (e) {
      setFileOptionsOpen(true);
      setError(
        "Merkistöä ei voitu lukea. Kokeile Windows-1252:ta. " + String(e),
      );
    }
  }
  return (
    <>
      <section className="panel">
        <h2>JSON-varmuuskopio</h2>
        <div className="entry-statuses"><StatusBadge>Koko talous</StatusBadge><StatusBadge>Salaamaton tiedosto</StatusBadge></div>
        <p className="ux-status-note">Palautus korvaa nykyisen talouden vahvistuksen jälkeen.</p>
        <ContextDetails title="Mitä varmuuskopio sisältää?"><p>Varmuuskopio sisältää koko talouden ja sen asetukset. Palautus validoidaan ennen korvaamista. Eheystarkistus tunnistaa tahattomia muutoksia, ei todista tiedoston aitoutta.</p></ContextDetails>
        <button className="primary" onClick={onBackup}>
          Vie varmuuskopio
        </button>
        <label className="file-label">
          Palauta varmuuskopio
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) onRestore(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
      </section>
      <section className="panel">
        <h2>CSV-tuonti ja vienti</h2>
        <div className="entry-statuses"><StatusBadge>Lisää tai täsmäytä tietueita</StatusBadge><StatusBadge tone="warning">CSV ei ole koko talouden varmuuskopio</StatusBadge></div>
        <ContextDetails title="CSV:n käyttö ja rajaukset"><p>Tuonnin voi kumota tämän istunnon aikana. Summat ovat euroina. CSV ei säilytä velkojen ja omaisuuserien välisiä linkkejä; käytä JSON-varmuuskopiota koko talouden siirtämiseen. Pankkiaineiston miinusmerkkiset menot tuodaan positiivisina menoina; tulorivit pitää tuoda Tulot-valinnalla. Virhe- ja duplikaattirivit tarkistetaan ennen tuontia.</p></ContextDetails>
        <div className="form-grid">
          <label>
            Tietotyyppi
            <select
              aria-label="Tietotyyppi"
              value={kind}
              onChange={(e) => setKind(e.target.value as Kind)}
            >
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {labels[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <details className="csv-file-options" open={fileOptionsOpen} onToggle={event => setFileOptionsOpen(event.currentTarget.open)}><summary>Tiedoston lisäasetukset</summary><div className="form-grid">
          <label>
            Merkistö
            <select
              aria-label="Merkistö"
              value={encoding}
              onChange={(e) => {
                setEncoding(e.target.value);
                if (bytes) decode(bytes, e.target.value);
              }}
            >
              <option value="utf-8">UTF-8</option>
              <option value="windows-1252">Windows-1252</option>
            </select>
          </label>
          <label>
            Erotin
            <select
              aria-label="Erotin"
              value={delimiter}
              onChange={(e) => {
                const nextDelimiter = e.target.value;
                setDelimiter(nextDelimiter);
                setError("");
                try {
                  setMap(mapCSVHeaders(parseCSV(text, nextDelimiter)[0] || []));
                } catch (error) {
                  setError(String(error));
                }
              }}
            >
              <option value=";">Puolipiste</option>
              <option value=",">Pilkku</option>
            </select>
          </label>
        </div></details>
        <div className="actions">
          <button
            onClick={() =>
              download(
                exportCSV(s[kind]),
                "talous-" + kind + "-" + today() + ".csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            Vie {labels[kind].toLowerCase()} CSV:nä
          </button>
          <button
            onClick={() =>
              download(
                exportCSV([]),
                "talous-csv-pohja.csv",
                "text/csv;charset=utf-8",
              )
            }
          >
            Lataa CSV-pohja
          </button>
        </div>
        <label className="file-label">
          Valitse CSV
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={async (e) => {
              let f = e.target.files?.[0];
              if (!f) return;
              if (f.size > 5000000) {
                setError("Enimmäiskoko 5 Mt.");
                return;
              }
              let b = await f.arrayBuffer();
              setBytes(b);
              decode(b, encoding);
              e.target.value = "";
            }}
          />
        </label>
        {error && (
          <p role="alert" className="negative">
            {error}
          </p>
        )}
        {rows.length > 0 && (
          <>
            <h3>Yhdistä sarakkeet</h3>
            <p>
              Tarkista otsikoiden yhdistäminen. Nimi, summa ja päivämäärä ovat
              pakollisia; päivämäärä voi olla dd.mm.yyyy tai yyyy-mm-dd.
              Kategoria on vapaaehtoinen.
            </p>
            <p className="muted csv-auto-map-note">
              Tunnistetut otsikot yhdistettiin automaattisesti. Tarkista neljä
              perustietoa ennen tuontia.
            </p>
            <div className="form-grid csv-primary-mapping">
              {primaryCSVFields.map((field) => (
                <label key={field}>
                  {csvFieldLabels[field]}
                  {["name", "amount", "date"].includes(field) ? " *" : ""}
                  <select
                    aria-label={csvFieldLabels[field]}
                    value={map[field] ?? -1}
                    onChange={(e) =>
                      setMap({ ...map, [field]: Number(e.target.value) })
                    }
                  >
                    <option value={-1}>Ei saraketta</option>
                    {rows[0].map((h, i) => (
                      <option
                        key={i}
                        value={i}
                        disabled={Object.entries(map).some(
                          ([otherField, column]) =>
                            otherField !== field && column === i,
                        )}
                      >
                        {h || "Sarake " + (i + 1)}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <details className="csv-advanced-mapping">
              <summary>
                Lisätiedot ja harvemmat kentät
                <small>{mappedAdvancedCSVFields} yhdistetty</small>
              </summary>
              <p className="muted">
                Näitä tarvitaan vain, jos tuot toistuvuuden, muistiinpanoja tai
                omaisuustietoja.
              </p>
              <div className="form-grid">
                {advancedCSVFields.map((field) => (
                  <label key={field}>
                    {csvFieldLabels[field] || field}
                    <select
                      aria-label={csvFieldLabels[field] || field}
                      value={map[field] ?? -1}
                      onChange={(e) =>
                        setMap({ ...map, [field]: Number(e.target.value) })
                      }
                    >
                      <option value={-1}>Ei saraketta</option>
                      {rows[0].map((h, i) => (
                        <option
                          key={i}
                          value={i}
                          disabled={Object.entries(map).some(
                            ([otherField, column]) =>
                              otherField !== field && column === i,
                          )}
                        >
                          {h || "Sarake " + (i + 1)}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
            </details>
            <h3>Esikatselu (enintään 5 riviä)</h3>
            <div
              className="table-wrap csv-preview-table"
              role="region"
              aria-label="CSV-esikatselu, vieritä sivusuunnassa tarvittaessa"
              tabIndex={0}
            >
              <table>
                <thead>
                  <tr>
                    {rows[0].map((h, i) => (
                      <th key={i}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(1, 6).map((r, i) => (
                    <tr key={i}>
                      {r.map((v, j) => (
                        <td key={j}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="import-summary" role="status" aria-label="CSV-tuonnin yhteenveto"><StatusBadge>{evaluated.length} {evaluated.length === 1 ? "rivi" : "riviä"}</StatusBadge><StatusBadge tone={errors.length ? "warning" : "neutral"}>{errors.length} {errors.length === 1 ? "virhe" : "virhettä"}</StatusBadge><StatusBadge tone={dups.length ? "warning" : "neutral"}>{dups.length} {dups.length === 1 ? "mahdollinen duplikaatti" : "mahdollista duplikaattia"}</StatusBadge><StatusBadge tone="positive">{accepted.length} tuotavaa</StatusBadge></div>
            {evaluated.map(row => {
              if (!row.e) return null;
              const candidates = reconciliationCandidates(s, kind, row.e);
              if (!candidates.length && !row.duplicate) return null;
              const value = selectedChoices[row.line] || "";
              return <div key={row.line} className="csv-match-row">
                <p>Rivi {row.line}: {row.e.name} · {(row.e.amount / 100).toFixed(2).replace(".", ",")} € · {row.e.date}{row.duplicate ? " · mahdollinen duplikaatti" : ""}</p>
                <label>Rivin {row.line} käsittely<select value={value} onChange={event => {
                  setChoices({ ...(choiceContext === currentContext ? choices : {}), [row.line]: event.target.value });
                  setChoiceContext(currentContext);
                }}>
                  <option value="">{candidates.length ? "Valitse käsittely (oletus: ohita)" : row.duplicate && skipDuplicates ? "Ohita oletuksena" : "Lisää oletuksena"}</option>
                  <option value="add">Lisää erillisenä</option>
                  <option value="skip">Ohita</option>
                  {candidates.map(item => <option key={item.id} value={item.id}>Merkitse toteutuneeksi: {item.name} · {item.category} · {row.e!.date}</option>)}
                </select></label>
              </div>;
            })}
            {matches.length > 0 && <p>{matches.length} suunniteltua tapahtumaa merkitään toteutuneeksi. Nimi, kategoria ja muut tiedot säilyvät.</p>}
            {selectionError && <p role="alert">{selectionError}</p>}
            {errors.slice(0, 10).map((r) => (
              <p key={r.line} className="negative">
                Rivi {r.line}: {r.error}
              </p>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={skipErrors}
                onChange={(e) => setSkipErrors(e.target.checked)}
              />
              Ohita virheelliset rivit (tai korjaa CSV ja valitse uudelleen)
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
              />
              Ohita mahdolliset duplikaatit
            </label>
            <button
              className="primary"
              disabled={
                (!accepted.length && !matches.length) ||
                !!selectionError ||
                !!error ||
                (!!errors.length && !skipErrors) ||
                !(map.name >= 0) ||
                !(map.amount >= 0) ||
                !(map.date >= 0)
              }
              onClick={() => {
                if (confirm(`Lisätäänkö ${accepted.length} tietuetta ja täsmäytetäänkö ${matches.length} tapahtumaa?`)) {
                  if (!onImport(kind, accepted, matches)) return;
                  setText("");
                  setBytes(null);
                }
              }}
            >
              Vahvista ja tuo {accepted.length} tietuetta{matches.length > 0 && `, täsmäytä ${matches.length}`}
            </button>
          </>
        )}
      </section>
    </>
  );
}
