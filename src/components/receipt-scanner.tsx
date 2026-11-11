import { APIKeyButton } from "./api-key-button";
import { useSessionAPIKey } from "../services/session-api-key";
import { categorizeReceiptBatch } from "../services/invoice-ai";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FileText, ScanLine, X, AlertTriangle } from "lucide-react";
import { ContextDetails } from "./summary";
import type { State } from "../domain/model";
import { validDate } from "../domain/calculations";
import { parseReceipt } from "../domain/receipts/parser";
import type { ReceiptDraft } from "../domain/receipts/schema";
import { prepareReceiptImport, receiptCategoryTotals, receiptMatches, receiptCategoryOptions } from "../domain/receipts/import";
import { receiptFileError, importBatchError } from "../domain/receipts/files";
import { receiptPDF } from "../services/receipt-pdf";

const euro = (n: number) => new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(n / 100);
export interface ReceiptScannerHandle { scanFile: (file: File) => boolean; scanFiles: (files: File[]) => void; focusPanel: () => void }
export function ReceiptScanButton({ onClick, label = "Skannaa kuitti", expanded }: { onClick: () => void; label?: string; expanded?: boolean }) {
  return <button type="button" onClick={onClick} aria-controls="receipt-workspace" aria-expanded={expanded} className="receipt-scan-button" title={label === "Skannaa kuitti" ? "PDF-kuitti · voit myös pudottaa tiedoston näkymään" : "Avaa kuittiskannaus Menot-näkymässä"}><ScanLine size={18} aria-hidden="true" />{label}</button>;
}
type BatchItem = { id: string; name: string; draft?: ReceiptDraft; error?: string };
type ReviewHandle = { prepare: (state: State) => State; check: (checked: boolean) => void; apply: (categories: Record<string, string>) => void };
type ScannerProps = { state: State; onImport: (next: State) => boolean; onClose: () => void };
export const ReceiptScanner = forwardRef<ReceiptScannerHandle, ScannerProps>(function ReceiptScanner({ state, onImport, onClose }, ref) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState("");
  const [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const aiKey = useSessionAPIKey();
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const operation = useRef<AbortController | null>(null), input = useRef<HTMLInputElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const reviews = useRef(new Map<string, ReviewHandle>());
  useEffect(() => () => operation.current?.abort(), []);
  const available = receiptCategoryOptions(state);
  const receiptKeys = items.filter(item => item.draft?.receiptId).map(item => `${item.draft!.merchant}|${item.draft!.date}|${item.draft!.receiptId}`);
  const duplicateReceipts = new Set(receiptKeys).size !== receiptKeys.length;
  async function readFiles(files: File[]) {
    operation.current?.abort(); const current = new AbortController(); operation.current = current;
    setBusy(true); setItems([]); setReady({}); setError(""); setSuccess("");
    const next: BatchItem[] = [];
    try {
      for (const [index, file] of files.entries()) {
        if (current.signal.aborted) return;
        setProgress(`Luetaan kuittia ${index + 1}/${files.length}: ${file.name}`);
        try {
          const result = await receiptPDF(file, current.signal, () => {});
          next.push({ id: String(index), name: file.name, draft: parseReceipt(result.pages) });
        } catch (e) {
          if (current.signal.aborted) return;
          next.push({ id: String(index), name: file.name, error: e instanceof Error ? e.message : "PDF:n luku epäonnistui." });
        }
      }
      if (!current.signal.aborted) setItems(next);
    } finally { if (operation.current === current) { setBusy(false); setProgress(""); } }
  }
  function requestFiles(files: File[]): boolean {
    const validation = importBatchError(files); if (validation) { setError(validation); return false; }
    if ((items.length || busy) && !window.confirm("Korvataanko nykyinen kuittierä? Tallentamattomat luonnokset menetetään.")) return false;
    void readFiles(files); return true;
  }
  useImperativeHandle(ref, () => ({ scanFile: file => { const validation = receiptFileError([file]); if (validation) { setError(validation); return false; } return requestFiles([file]); }, scanFiles: requestFiles,
    focusPanel: () => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start" }); } }));
  function cancel() { operation.current?.abort(); operation.current = null; setBusy(false); setProgress(""); }
  async function categorize() {
    if (!aiEnabled || !aiKey.trim() || !items.some(item => item.draft)) return;
    const key = aiKey; setBusy(true); setError("");
    const current = new AbortController(); operation.current = current;
    try {
      const suggestions = await categorizeReceiptBatch(key, items.filter(item => item.draft).map(item => ({ id: item.id, products: item.draft!.lines.map(line => ({ id: line.id, name: line.name })) })), available.map(c => c.name), current.signal,
        (completed, total) => setProgress(`AI luokittelee tuote-erää ${completed}/${total}…`));
      if (current.signal.aborted) return;
      for (const [id, categories] of Object.entries(suggestions)) reviews.current.get(id)?.apply(categories);
      setSuccess(`AI ehdotti kategorian ${Object.values(suggestions).reduce((n, values) => n + Object.keys(values).length, 0)} tuoteriville. Tarkista luokittelut ennen kirjaamista.`);
    } catch (e) { if (!current.signal.aborted) setError(e instanceof Error ? e.message : "AI-luokittelu epäonnistui. Voit jatkaa käsin."); }
    finally { if (operation.current === current) { setBusy(false); setProgress(""); } }
  }
  function saveAll() {
    if (busy || !items.length || duplicateReceipts) return;
    try {
      let next = state;
      for (const item of items) {
        const review = reviews.current.get(item.id);
        if (!item.draft || !review) throw Error(`${item.name}: korjaa tai poista epäonnistunut kuitti erästä.`);
        next = review.prepare(next);
      }
      if (onImport(next)) { setSuccess(`${items.length} kuittia kirjattu menoihin. Voit kumota koko erän yläosan Kumoa-painikkeella.`); setItems([]); setReady({}); }
    } catch (e) { setError(e instanceof Error ? e.message : "Erän kirjaus epäonnistui. Mitään ei tallennettu."); }
  }
  return <section className="panel receipt-scanner" aria-labelledby="receipt-scanner-title">
    <div className="receipt-heading ai-card-heading"><ScanLine size={25} aria-hidden="true" /><h2 ref={heading} id="receipt-scanner-title" tabIndex={-1}>Kuittiskannaus</h2><APIKeyButton disabled={busy} /><button aria-label="Sulje kuittiskannaus" onClick={onClose}><X size={18} /></button></div>
    <p>Valitse tai pudota 1–50 PDF-kuittia (yhteensä 100 Mt, 20 Mt / tiedosto). Tarkista tuotteet ja kategoriat, ja kirjaa kuitit yhdessä menoihin.</p>
    <button disabled={busy} onClick={() => input.current?.click()}><FileText size={18} />Valitse PDF-kuitit</button>
    <input ref={input} hidden type="file" multiple accept="application/pdf,.pdf" aria-label="Skannaa PDF-kuitti" onChange={e => { const files = Array.from(e.target.files || []); if (files.length) requestFiles(files); e.target.value = ""; }} />
    <label><input type="checkbox" disabled={busy} checked={aiEnabled} onChange={e => { setAiEnabled(e.target.checked); }} />AI-avusteinen kategorisointi</label>
    {aiEnabled && <div><p>Pyydä kategoriaehdotukset kaikille kuiteille kerralla. Tuotteiden nimet lähetetään analysoitavaksi. Tarkista ehdotukset ennen kirjaamista.</p><button disabled={busy || !aiKey.trim() || !items.some(item => item.draft)} onClick={() => void categorize()}>Ehdota kategoriat koko erälle</button></div>}
    {busy && <p role="status">{progress}<button onClick={cancel}>Peruuta käsittely</button></p>}
    {error && <p role="alert">{error}</p>}{success && <p role="status">{success}</p>}
    {duplicateReceipts && <p role="alert">Erässä on saman kuitin kopioita. Poista ylimääräiset ennen kirjaamista.</p>}
    {!!items.length && <div className="receipt-batch-toolbar"><p>{items.length} kuittia · {items.filter(i => ready[i.id]).length} valmiina · {euro(items.reduce((sum, item) => sum + (item.draft?.total || 0), 0))}</p><button disabled={busy} onClick={() => { for (const review of reviews.current.values()) review.check(true); }}>Vahvista kaikkien kuittien tarkistus</button><button className="primary" disabled={busy || duplicateReceipts || !items.every(i => i.draft && ready[i.id])} onClick={saveAll}>Kirjaa koko erä menoihin</button><button disabled={busy} onClick={() => { if (window.confirm("Hylätäänkö koko kuittierä?")) { setItems([]); setReady({}); } }}>Hylkää koko erä</button></div>}
    {items.map(item => <article key={item.id} className="panel"><h3>{item.name}</h3>{item.error && <p role="alert">{item.error}</p>}{item.draft ? <ReceiptReview ref={handle => { if (handle) reviews.current.set(item.id, handle); else reviews.current.delete(item.id); }} state={state} draft={item.draft} busy={busy} onImport={next => { if (duplicateReceipts) { setError("Poista saman kuitin ylimääräiset kopiot ennen kirjaamista."); return false; } if (!onImport(next)) return false; setItems(old => old.filter(i => i.id !== item.id)); setSuccess("Kuitti kirjattu menoihin."); return true; }} onRemove={() => setItems(old => old.filter(i => i.id !== item.id))} onReady={value => setReady(old => old[item.id] === value ? old : { ...old, [item.id]: value })} /> : <button disabled={busy} onClick={() => setItems(old => old.filter(i => i.id !== item.id))}>Poista erästä</button>}</article>)}
  </section>;
});

const ReceiptReview = forwardRef<ReviewHandle, { state: State; draft: ReceiptDraft; busy: boolean; onImport: (next: State) => boolean; onRemove: () => void; onReady: (ready: boolean) => void }>(function ReceiptReview({ state, draft, busy, onImport, onRemove, onReady }, ref) {
  const available = receiptCategoryOptions(state);
  const [categories, setCategories] = useState<Record<string, string>>(() => Object.fromEntries(draft.lines.map(l => [l.id, available.some(c => c.name === l.suggestedCategory) ? l.suggestedCategory! : ""])));
  const [selected, setSelected] = useState<string[]>([]);
  const [onlyReview, setOnlyReview] = useState(false), [error, setError] = useState("");
  const [checked, setChecked] = useState(false), [clearActuals, setClearActuals] = useState(false), [match, setMatch] = useState("");
  const focus = useRef<HTMLHeadingElement>(null);
  const unresolved = draft.lines.filter(l => !available.some(c => c.name === categories[l.id]));
  const totals = receiptCategoryTotals(draft, categories);
  const rowSum = draft.lines.reduce((n, l) => n + l.net, 0);
  const matches = receiptMatches(state, draft);
  const actuals = [...new Set([...totals.keys(), ...matches.filter(e => e.id === match).map(e => e.category)])].filter(name => state.budgetActuals[draft.date.slice(0, 7)]?.[name] !== undefined);
  const recurring = state.expenses.filter(e => e.active && e.recurrence !== "once" && totals.has(e.category));
  const blocked = draft.chain === "unknown" || !draft.merchant || !draft.receiptId || !draft.lines.length || draft.issues.some(i => i.blocking) || !validDate(draft.date) || draft.total === null || draft.total <= 0 || rowSum !== draft.total || !!unresolved.length || !checked || actuals.length > 0 && !clearActuals || matches.length > 0 && !match;
  useEffect(() => { onReady(!blocked); }, [blocked, onReady]);
  function prepare(current: State) {
    if (blocked) throw Error(`${draft.merchant || "Kuitti"}: tarkista kategoriat, summat ja hyväksynnät ennen erän kirjausta.`);
    return prepareReceiptImport(current, draft, categories, { checked, clearActuals, replaceEntryId: match === "separate" ? undefined : match || undefined, allowSeparatePurchase: match === "separate" });
  }
  useImperativeHandle(ref, () => ({ prepare, check: setChecked, apply: values => { setCategories(old => ({ ...old, ...values })); setChecked(false); } }));
  function save() { try { onImport(prepare(state)); } catch (e) { setError(e instanceof Error ? e.message : "Tuonti epäonnistui."); } }
  return <fieldset disabled={busy} style={{ border: 0, padding: 0, minWidth: 0 }}>{error && <p role="alert">{error}</p>}
    {draft && <div className="receipt-review">
      <h3 ref={focus} tabIndex={-1}>Tarkista kuitti</h3>
      <div className="receipt-summary"><div><small>Kauppa</small><strong>{draft.merchant || "Ei tunnistettu"}</strong></div><div><small>Ostopäivä</small><strong>{draft.date ? draft.date.split("-").reverse().join(".") : "Puuttuu"}</strong></div><div><small>Maksettu</small><strong>{draft.total === null ? "Puuttuu" : euro(draft.total)}</strong></div><div><small>Tuoterivien summa</small><strong>{euro(rowSum)}</strong></div></div>
      <p className="ux-status-note">{draft.lines.length} tuoteriviä · {unresolved.length} luokittelematta · {draft.total === rowSum ? "Summat täsmäävät" : "Summat eivät täsmää"}. Luokittelut ovat ehdotuksia: tarkista ne ennen kirjaamista. Valitut valinnaiset kategoriat otetaan käyttöön tallennettaessa.</p>
      {draft.issues.map((issue, i) => <p key={i} className="alert" role={issue.blocking ? "alert" : "status"}><AlertTriangle size={17} aria-hidden="true" />{issue.message}{issue.source && <span className="receipt-issue-source">Sivu {issue.source.page}, rivi {issue.source.line}: {issue.source.text}</span>}</p>)}
      <div className="receipt-category-totals" aria-label="Kuitin kategoriat">{[...totals].map(([category, amount]) => <span key={category}><span>{category || "Valitse kategoria"}</span><strong>{euro(amount)}</strong></span>)}</div>
      <div className="receipt-controls"><label className="receipt-check"><input type="checkbox" checked={onlyReview} onChange={e => setOnlyReview(e.target.checked)} /> Vain luokittelemattomat ({unresolved.length})</label><label>Kategoria valituille ({selected.length})<select aria-label="Luokittele valitut tuotteet" value="" disabled={!selected.length} onChange={e => { const value = e.target.value; setCategories(old => ({ ...old, ...Object.fromEntries(selected.map(id => [id, value])) })); setSelected([]); setChecked(false); }}><option value="">Valitse kategoria</option>{available.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></label><button onClick={() => setSelected((onlyReview ? unresolved : draft.lines).map(l => l.id))}>Valitse näkyvät</button></div>
      <ul className="receipt-products" aria-label="Kuitin tuoterivit">{draft.lines.filter(l => !onlyReview || unresolved.some(u => u.id === l.id)).map(line => <li key={line.id} className="receipt-product">
        <label className="receipt-product-select"><input type="checkbox" aria-label={`Valitse ${line.name}`} checked={selected.includes(line.id)} onChange={e => setSelected(old => e.target.checked ? [...old, line.id] : old.filter(id => id !== line.id))} /><span><strong>{line.name}</strong>{line.quantity !== null && <small>{new Intl.NumberFormat("fi-FI").format(line.quantity)} {line.unit}</small>}</span></label>
        <strong className="receipt-price">{euro(line.net)}</strong>
        <label className="receipt-product-category"><span className="sr-only">Kategoria: {line.name}</span><select aria-label={`Kategoria: ${line.name}`} value={categories[line.id] || ""} onChange={e => { setCategories(old => ({ ...old, [line.id]: e.target.value })); setChecked(false); }}><option value="">Valitse kategoria</option>{available.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></label>
        <details className="receipt-source"><summary>Lähderivi{line.discount > 0 ? ` · alennus ${euro(line.discount)}` : ""}</summary>{line.source.map((source, i) => <div key={i}><small>Sivu {source.page}, rivi {source.line}</small><p>{source.text}</p></div>)}</details>
      </li>)}</ul>
      {!!matches.length && <label>Samansuuruinen maksu samana päivänä<select aria-label="Täsmäytä kuitti" value={match} onChange={e => { setMatch(e.target.value); setChecked(false); }}><option value="">Valitse: sama maksu vai eri ostos?</option>{matches.map(e => <option key={e.id} value={e.id}>Korvaa: {e.name}{e.recurrence !== "once" ? " (vain tämä tapahtuma)" : ""}</option>)}<option value="separate">Eri ostos — lisää uutena</option></select></label>}
      {!!actuals.length && <label className="receipt-check receipt-warning"><input type="checkbox" checked={clearActuals} onChange={e => { setClearActuals(e.target.checked); setChecked(false); }} />Kategorioissa {actuals.join(", ")} on käsin asetettu toteuma. Poista näiden kategorioiden tämän kuun korjaus ja laske toteuma kaikista kirjauksista.</label>}
      {!!recurring.length && <ContextDetails title={`Tarkista saman kategorian toistuvat menot · ${recurring.length}`} className="receipt-warning-info"><p>Koko kuukauden menoarvio voi sisältää jo tämän ostoksen. Kuittituonti ei vähennä arviota automaattisesti. Korjaa päällekkäinen arvio ennen hyväksyntää. Samaksi maksuksi valittu tapahtuma korvataan, muut sarjan tapahtumat säilyvät.</p><ul>{recurring.slice(0, 10).map(e => <li key={e.id}>{e.name} · {e.category}</li>)}</ul></ContextDetails>}
      <label className="receipt-check"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />Tarkistin tuotteet, kategoriat ja ettei ostosta ole jo kirjattu. {match && match !== "separate" ? "Valittu aiempi maksu korvataan tällä erittelyllä." : "Kirjaukset lisätään uusina menoina; kuittihistoriaa ei tallenneta."}</label>
      <div className="receipt-actions"><button className="primary" disabled={blocked || busy} onClick={save}>Kirjaa {draft.total === null ? "kuitti" : euro(draft.total)} menoihin</button><button disabled={busy} onClick={onRemove}>Poista erästä</button></div>
      <p className="ux-status-note">Kirjataan {draft.date ? draft.date.slice(0, 7) : "kuitin"} kuukauteen. Budjetti säilyy; toteuma päivittyy kirjauksista. Maksu- ja asiakasomistajatietoja ei poimita.</p>
    </div>}
  </fieldset>;
});
