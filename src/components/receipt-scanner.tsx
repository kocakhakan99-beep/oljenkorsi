import { DocumentProcessing } from "./document-processing";
import { APIKeyButton } from "./api-key-button";
import { useSessionAPIKey } from "../services/session-api-key";
import { categorizeReceiptBatch, suggestReceiptStructure } from "../services/invoice-ai";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ScanLine, X, AlertTriangle, CircleCheck } from "lucide-react";
import type { State } from "../domain/model";
import { validDate } from "../domain/calculations";
import { parseReceipt, type ReceiptTextPage } from "../domain/receipts/parser";
import { receiptSourceLines, verifyAIReceipt } from "../domain/receipts/ai-fallback";
import type { ReceiptDraft } from "../domain/receipts/schema";
import { prepareReceiptImport, receiptCategoryTotals, receiptMatches, receiptCategoryOptions } from "../domain/receipts/import";
import { receiptFileError, importBatchError } from "../domain/receipts/files";
import { receiptPDF } from "../services/receipt-pdf";

const euro = (n: number) => new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(n / 100);
export interface ReceiptScannerHandle { scanFile: (file: File) => boolean; scanFiles: (files: File[]) => void; focusPanel: () => void }
export function ReceiptScanButton({ onClick, label = "Lisää kuitti", expanded }: { onClick: () => void; label?: string; expanded?: boolean }) {
  return <button type="button" onClick={onClick} aria-haspopup="dialog" aria-expanded={expanded} className="receipt-scan-button" title={label === "Lisää kuitti" ? "PDF-kuitti · voit myös pudottaa tiedoston näkymään" : "Avaa kuittiskannaus Menot-näkymässä"}><ScanLine size={18} aria-hidden="true" />{label}</button>;
}
type BatchItem = { id: string; name: string; draft?: ReceiptDraft; pages?: ReceiptTextPage[]; fallbackError?: string; error?: string; suggestions?: Record<string, string> };
type ReviewHandle = { prepare: (state: State) => State; apply: (categories: Record<string, string>) => void };
type ReviewInfo = { categories: Record<string, string>; unresolved: string[]; needsAttention: boolean; totals: [string, number][] };
const chartColors = ["#056b56", "#9850a1", "#c45c2b", "#3864aa", "#b08215", "#ab4166", "#277f88", "#6751a7", "#9b5c28", "#537244", "#a3483c", "#286eaa"];
const fallbackCandidates = new Set(["unsupported", "structure", "unknown-row"]);
const fallbackAllowed = new Set(["unsupported", "structure", "unknown-row", "reconciliation", "total", "date", "lines"]);
function mayTryFallback(draft: ReceiptDraft): boolean {
  return draft.issues.some(issue => issue.blocking && fallbackCandidates.has(issue.code)) && draft.issues.every(issue => !issue.blocking || fallbackAllowed.has(issue.code));
}
async function resolveReceipt(item: BatchItem, key: string, signal: AbortSignal): Promise<BatchItem> {
  if (!item.pages || !item.draft || !mayTryFallback(item.draft)) return item;
  // Strip common payment/customer lines. Other personal details may still remain.
  const input = receiptSourceLines(item.pages).filter(line => line.text && !/(?:asiakasomistaja|asiakasnumero|jäsen|jäsennumero|s-etukortti|plussa-kortti|kortti|visa|mastercard|debit|credit|iban|tilinumero|viitenumero|henkilötunnus|puhelin|sähköposti)/iu.test(line.text)).map(({ id, text }) => ({ id, text }));
  if (JSON.stringify(input).length > 30000) return { ...item, fallbackError: "Kuitti on liian pitkä AI-rakenteen tarkistukseen." };
  try {
    const proposal = await suggestReceiptStructure(key, input, signal);
    return { ...item, draft: verifyAIReceipt(item.pages, proposal, new Set(input.map(line => line.id))), pages: undefined, fallbackError: undefined };
  } catch {
    if (signal.aborted) throw Error("Käsittely peruutettu.");
    return { ...item, fallbackError: "Kuitin rakennetta ei voitu varmistaa. Kirjaa ostos tarvittaessa käsin." };
  }
}
type ScannerProps = { state: State; onImport: (next: State) => boolean; onClose: () => void };
export const ReceiptScanner = forwardRef<ReceiptScannerHandle, ScannerProps>(function ReceiptScanner({ state, onImport, onClose }, ref) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState("");
  const [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [aiComplete, setAiComplete] = useState(false);
  const aiKey = useSessionAPIKey();
  const previousKey = useRef(aiKey);
  const [ready, setReady] = useState<Record<string, boolean>>({});
  const [reviewInfo, setReviewInfo] = useState<Record<string, ReviewInfo>>({});
  const operation = useRef<AbortController | null>(null), heading = useRef<HTMLHeadingElement>(null);
  const reviews = useRef(new Map<string, ReviewHandle>());
  useEffect(() => () => operation.current?.abort(), []);
  const available = receiptCategoryOptions(state);
  const receiptKeys = items.filter(item => item.draft?.receiptId).map(item => `${item.draft!.merchant}|${item.draft!.date}|${item.draft!.receiptId}`);
  const duplicateReceipts = new Set(receiptKeys).size !== receiptKeys.length;
  const unresolved = items.flatMap(item => {
    const info = reviewInfo[item.id];
    if (!item.draft || !info) return [];
    return info.unresolved.map(id => ({ item, line: item.draft!.lines.find(line => line.id === id)! }));
  }).filter(value => value.line);
  const totals = new Map<string, number>();
  for (const item of items) for (const [name, amount] of reviewInfo[item.id]?.totals || []) if (name) totals.set(name, (totals.get(name) || 0) + amount);
  const slices = [...totals].filter(([, amount]) => amount > 0).sort((a, b) => b[1] - a[1]);
  const chartTotal = slices.reduce((sum, [, amount]) => sum + amount, 0);
  let previous = 0;
  const chartGradient = slices.map(([, amount], index) => { const start = previous; previous += amount / chartTotal * 100; return `${chartColors[index % chartColors.length]} ${start}% ${previous}%`; }).join(", ");
  const reviewsLoaded = items.every(item => !item.draft || !!reviewInfo[item.id]);
  async function readFiles(files: File[]) {
    operation.current?.abort(); const current = new AbortController(); operation.current = current;
    setBusy(true); setItems([]); setReady({}); setReviewInfo({}); setAiComplete(false); setError(""); setSuccess("");
    const next: BatchItem[] = [];
    try {
      for (const [index, file] of files.entries()) {
        if (current.signal.aborted) return;
        setProgress(`Luetaan kuittia ${index + 1}/${files.length}: ${file.name}`);
        try {
          const result = await receiptPDF(file, current.signal, () => {});
          const draft = parseReceipt(result.pages);
          next.push({ id: String(index), name: file.name, draft, ...(mayTryFallback(draft) ? { pages: result.pages } : {}) });
        } catch (e) {
          if (current.signal.aborted) return;
          next.push({ id: String(index), name: file.name, error: e instanceof Error ? e.message : "PDF:n luku epäonnistui." });
        }
      }
      if (current.signal.aborted) return;
      if (aiKey.trim() && next.some(item => item.draft)) {
        try {
          for (let i = 0; i < next.length; i++) if (next[i].pages) { setProgress(`Selvitetään kuitin rakennetta ${i + 1}/${next.length}…`); next[i] = await resolveReceipt(next[i], aiKey, current.signal); }
          const suggestions = await categorizeReceiptBatch(aiKey, next.filter(item => item.draft).map(item => ({ id: item.id, products: item.draft!.lines.filter(line => line.kind !== "deposit").map(line => ({ id: line.id, name: line.name })) })), available.map(c => c.name), current.signal,
            (completed, total) => setProgress(`AI luokittelee tuote-erää ${completed}/${total}…`));
          if (current.signal.aborted) return;
          for (const item of next) item.suggestions = suggestions[item.id];
          setAiComplete(true);
        } catch (e) { if (current.signal.aborted) return; setError(e instanceof Error ? e.message : "Analyysi epäonnistui."); }
      }
      setItems(next);
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
    if (!aiKey.trim() || !items.some(item => item.draft)) return;
    const key = aiKey; setBusy(true); setError("");
    const current = new AbortController(); operation.current = current;
    try {
      const next = [...items];
      for (let i = 0; i < next.length; i++) if (next[i].pages) { setProgress(`Selvitetään kuitin rakennetta ${i + 1}/${next.length}…`); next[i] = await resolveReceipt(next[i], key, current.signal); }
      const suggestions = await categorizeReceiptBatch(key, next.filter(item => item.draft).map(item => ({ id: item.id, products: item.draft!.lines.filter(line => line.kind !== "deposit").map(line => ({ id: line.id, name: line.name })) })), available.map(c => c.name), current.signal,
        (completed, total) => setProgress(`AI luokittelee tuote-erää ${completed}/${total}…`));
      if (current.signal.aborted) return;
      for (const [id, categories] of Object.entries(suggestions)) reviews.current.get(id)?.apply(categories);
      setItems(next.map(item => ({ ...item, suggestions: suggestions[item.id] })));
      setAiComplete(true);
      setSuccess(`AI ehdotti kategorian ${Object.values(suggestions).reduce((n, values) => n + Object.keys(values).length, 0)} tuoteriville. Tarkista luokittelut ennen kirjaamista.`);
    } catch (e) { if (!current.signal.aborted) setError(e instanceof Error ? e.message : "AI-luokittelu epäonnistui. Voit jatkaa käsin."); }
    finally { if (operation.current === current) { setBusy(false); setProgress(""); } }
  }
  async function retryReceipt(item: BatchItem) {
    if (busy || !aiKey.trim() || !item.pages) return;
    const current = new AbortController(); operation.current = current;
    setBusy(true); setError(""); setSuccess(""); setProgress("Selvitetään kuitin rakennetta…");
    try {
      const resolved = await resolveReceipt(item, aiKey, current.signal);
      if (current.signal.aborted) return;
      if (resolved.draft?.parserVersion === "receipt-ai-1") {
        const suggestions = await categorizeReceiptBatch(aiKey, [{ id: resolved.id, products: resolved.draft.lines.filter(line => line.kind !== "deposit").map(line => ({ id: line.id, name: line.name })) }], available.map(c => c.name), current.signal);
        if (current.signal.aborted) return;
        resolved.suggestions = suggestions[resolved.id];
      }
      setItems(old => old.map(value => value.id === item.id ? resolved : value));
    } catch (e) { if (!current.signal.aborted) setError(e instanceof Error ? e.message : "Kuitin analyysi epäonnistui."); }
    finally { if (operation.current === current) { setBusy(false); setProgress(""); } }
  }
  useEffect(() => {
    const wasSet = !!previousKey.current.trim();
    previousKey.current = aiKey;
    if (!wasSet && aiKey.trim() && !busy && !aiComplete && items.some(item => item.draft)) void categorize();
  }, [aiKey]);
  function saveAll() {
    if (busy || !aiComplete || !items.length || duplicateReceipts) return;
    try {
      let next = state;
      for (const item of items) {
        const review = reviews.current.get(item.id);
        if (!item.draft || !review) throw Error(`${item.name}: korjaa tai poista epäonnistunut kuitti erästä.`);
        next = review.prepare(next);
      }
      if (onImport(next)) { setSuccess(`${items.length} kuittia kirjattu menoihin. Voit kumota koko erän yläosan Kumoa-painikkeella.`); setItems([]); setReady({}); setReviewInfo({}); }
    } catch (e) { setError(e instanceof Error ? e.message : "Erän kirjaus epäonnistui. Mitään ei tallennettu."); }
  }
  return <section className="panel receipt-scanner" aria-labelledby="receipt-scanner-title">
    <div className="receipt-heading ai-card-heading"><ScanLine size={25} aria-hidden="true" /><h2 ref={heading} id="receipt-scanner-title" tabIndex={-1}>Lisää kuitti</h2><APIKeyButton disabled={busy} /><button aria-label="Sulje kuittiskannaus" onClick={onClose}><X size={18} /></button></div>
    <p>Kuittien tuotenimet lähetetään AI-analyysiin. Jos rakenne ei selviä, myös kuitin tekstiä lähetetään analysoitavaksi.</p>
    <label>Valitse kuitit<input type="file" multiple accept="application/pdf,.pdf" aria-label="Skannaa PDF-kuitti" disabled={busy} onChange={e => { const files = Array.from(e.target.files || []); if (files.length) requestFiles(files); e.target.value = ""; }} /></label>
    {error && !!items.length && !aiComplete && aiKey.trim() && <button disabled={busy || !items.some(item => item.draft)} onClick={() => void categorize()}>Yritä uudelleen</button>}
    {!!items.length && !aiKey.trim() && <p>Lisää avain yläkulman avainpainikkeesta.</p>}
    {busy ? <DocumentProcessing kind="receipt" progress={progress} action={<button type="button" onClick={cancel}>Peruuta käsittely</button>} /> : <DocumentProcessing kind="receipt" stage={items.length ? (aiComplete ? "review" : "attention") : "waiting"} progress={items.length ? (aiComplete ? (unresolved.length ? "Luokittele vielä nämä." : "Tarkista yhteenveto.") : "Lisää avain tai käynnistä analyysi uudelleen.") : "Valitse kuitit aloittaaksesi."} />}
    {error && <p role="alert">{error}</p>}{success && <p role="status">{success}</p>}
    {duplicateReceipts && <p role="alert">Erässä on saman kuitin kopioita. Poista ylimääräiset ennen kirjaamista.</p>}
    {aiComplete && reviewsLoaded && unresolved.length > 0 && <section className="receipt-unresolved" aria-labelledby="receipt-unresolved-title">
      <div className="receipt-unresolved-heading"><span aria-hidden="true">✦</span><div><h3 id="receipt-unresolved-title">Luokittele vielä nämä</h3><p>{unresolved.length} tuotetta jäljellä</p></div></div>
      <p className="receipt-unresolved-name">{unresolved[0].line.name}</p>
      <p>{euro(unresolved[0].line.net)}</p>
      <label>Kategoria<select value="" onChange={event => { if (event.target.value) reviews.current.get(unresolved[0].item.id)?.apply({ [unresolved[0].line.id]: event.target.value }); }}><option value="">Valitse kategoria</option>{available.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}</select></label>
    </section>}
    {aiComplete && reviewsLoaded && !unresolved.length && !!items.length && <div className="document-review document-review--receipt"><div className="document-review-heading"><CircleCheck size={23} aria-hidden="true" /><div><strong>Ostosten yhteenveto</strong><p>{items.length} kuittia</p></div><strong className="document-review-total">{euro(items.reduce((sum, item) => sum + (item.draft?.total || 0), 0))}</strong></div>
      {chartTotal > 0 && !duplicateReceipts && items.every(item => item.draft && ready[item.id]) && <div className="receipt-pie-layout"><div className="receipt-pie" role="img" aria-label="Ostosten jakauma kategorioittain; summat näkyvät kaavion vieressä" style={{ background: `conic-gradient(${chartGradient})` }} /><ul aria-label="Ostosten jakauma">{slices.map(([name, amount], index) => <li key={name}><span className="receipt-pie-dot" style={{ backgroundColor: chartColors[index % chartColors.length] }} aria-hidden="true" /><span>{name}</span><strong>{euro(amount)}</strong><small>{new Intl.NumberFormat("fi-FI", { maximumFractionDigits: 1 }).format(amount / chartTotal * 100)} %</small></li>)}</ul></div>}
      <div className="receipt-batch-toolbar"><button className="primary" disabled={busy || duplicateReceipts || !items.every(i => i.draft && ready[i.id])} onClick={saveAll}>Kirjaa koko erä menoihin</button><button disabled={busy} onClick={() => { if (window.confirm("Hylätäänkö koko kuittierä?")) { setItems([]); setReady({}); setReviewInfo({}); } }}>Hylkää koko erä</button></div></div>}
    {items.map(item => <div key={item.id}>
      {item.fallbackError && <div role="alert"><p>{item.name}: {item.fallbackError}</p><button type="button" disabled={busy || !aiKey.trim()} onClick={() => void retryReceipt(item)}>Yritä tätä kuittia uudelleen</button></div>}
      {item.error && <div role="alert"><p>{item.name}: {item.error}</p><button onClick={() => setItems(old => old.filter(i => i.id !== item.id))}>Poista epäonnistunut tiedosto</button></div>}
      {duplicateReceipts && item.draft && <div className="receipt-exception"><span>{item.name} · {item.draft.merchant} · {item.draft.date}</span> <button onClick={() => setItems(old => old.filter(i => i.id !== item.id))}>Poista kopio</button></div>}
      {item.draft && <ReceiptReview key={`${item.id}-${item.draft.parserVersion}`} ref={handle => { if (handle) reviews.current.set(item.id, handle); else reviews.current.delete(item.id); }} state={state} draft={item.draft} initialSuggestions={item.suggestions} busy={busy} onRemove={() => setItems(old => old.filter(i => i.id !== item.id))} onReady={value => setReady(old => old[item.id] === value ? old : { ...old, [item.id]: value })} onInfo={value => setReviewInfo(old => JSON.stringify(old[item.id]) === JSON.stringify(value) ? old : { ...old, [item.id]: value })} />}
    </div>)}
  </section>;
});

const ReceiptReview = forwardRef<ReviewHandle, { state: State; draft: ReceiptDraft; initialSuggestions?: Record<string, string>; busy: boolean; onRemove: () => void; onReady: (ready: boolean) => void; onInfo: (info: ReviewInfo) => void }>(function ReceiptReview({ state, draft, initialSuggestions, busy, onRemove, onReady, onInfo }, ref) {
  const available = receiptCategoryOptions(state);
  const depositCategory = available.find(c => c.name === "Päivittäistavara")?.name || available.find(c => c.name === "Ruoka")?.name || "";
  const [categories, setCategories] = useState<Record<string, string>>(() => ({ ...initialSuggestions, ...Object.fromEntries(draft.lines.filter(line => line.kind === "deposit").map(line => [line.id, depositCategory])) }));
  const [aiReviewed, setAiReviewed] = useState(false);
  const [clearActuals, setClearActuals] = useState(false), [match, setMatch] = useState("");
  const unresolved = draft.lines.filter(line => !available.some(category => category.name === categories[line.id]));
  const totals = receiptCategoryTotals(draft, categories);
  const rowSum = draft.lines.reduce((sum, line) => sum + line.net, 0);
  const matches = receiptMatches(state, draft);
  const actuals = [...new Set([...totals.keys(), ...matches.filter(e => e.id === match).map(e => e.category)])].filter(name => state.budgetActuals[draft.date.slice(0, 7)]?.[name] !== undefined);
  const invalid = draft.chain === "unknown" || !draft.merchant || !draft.receiptId || !draft.lines.length || draft.issues.some(i => i.blocking) || !validDate(draft.date) || draft.total === null || draft.total <= 0 || rowSum !== draft.total || new Set(draft.lines.map(line => line.id)).size !== draft.lines.length || draft.lines.some(line => line.net < 0 || line.gross - line.discount !== line.net || line.unitPrice != null && (line.quantity === null || line.unit === null || ![line.gross, line.net].includes(Math.round(line.quantity * line.unitPrice))));
  const needsAttention = !!invalid || draft.parserVersion === "receipt-ai-1" && !aiReviewed || actuals.length > 0 && !clearActuals || matches.length > 0 && !match;
  const blocked = needsAttention || !!unresolved.length;
  const info: ReviewInfo = { categories, unresolved: unresolved.map(line => line.id), needsAttention, totals: [...totals] };
  useEffect(() => { onReady(!blocked); onInfo(info); }, [blocked, categories, state, match, clearActuals, aiReviewed, onReady, onInfo]);
  function prepare(current: State) {
    if (blocked) throw Error(`${draft.merchant || "Kuitti"}: tarkista kategoriat, summat ja hyväksynnät ennen erän kirjausta.`);
    return prepareReceiptImport(current, draft, categories, { checked: true, clearActuals, replaceEntryId: match === "separate" ? undefined : match || undefined, allowSeparatePurchase: match === "separate" });
  }
  useImperativeHandle(ref, () => ({ prepare, apply: values => setCategories(old => ({ ...old, ...Object.fromEntries(Object.entries(values).filter(([id]) => !draft.lines.some(line => line.id === id && line.kind === "deposit"))) })) }));
  return <fieldset disabled={busy} hidden={!needsAttention} className="receipt-exception">
    <legend>{draft.merchant || "Kuitti"} · {draft.date || "päivä puuttuu"}</legend>
    {draft.issues.map((issue, i) => <p key={i} className="alert" role={issue.blocking ? "alert" : "status"}><AlertTriangle size={17} aria-hidden="true" />{issue.message}{issue.source && <span className="receipt-issue-source">Sivu {issue.source.page}, rivi {issue.source.line}: {issue.source.text}</span>}</p>)}
    {invalid && <p>Tämän kuitin tietoja tai summaa ei voitu varmistaa. Poista kuitti erästä ja kirjaa se tarvittaessa käsin.</p>}
    {draft.parserVersion === "receipt-ai-1" && <div><p>AI auttoi tunnistamaan tämän kuitin. Tarkista, että kaikki tuotteet ja hinnat vastaavat alkuperäistä kuittia.</p><ul>{draft.lines.map(line => <li key={line.id}>{line.name} · {euro(line.net)} <small>({line.source[0].text})</small></li>)}</ul><label className="receipt-check"><input type="checkbox" checked={aiReviewed} onChange={e => setAiReviewed(e.target.checked)} />Tarkistin tämän kuitin tuotteet ja hinnat.</label></div>}
    {!!matches.length && <label>Samansuuruinen maksu samana päivänä<select aria-label="Täsmäytä kuitti" value={match} onChange={e => setMatch(e.target.value)}><option value="">Valitse: sama maksu vai eri ostos?</option>{matches.map(e => <option key={e.id} value={e.id}>Korvaa: {e.name}{e.recurrence !== "once" ? " (vain tämä tapahtuma)" : ""}</option>)}<option value="separate">Eri ostos — lisää uutena</option></select></label>}
    {!!actuals.length && <label className="receipt-check receipt-warning"><input type="checkbox" checked={clearActuals} onChange={e => setClearActuals(e.target.checked)} />Korvaa käsin asetettu toteuma kirjauksista laskettavalla toteumalla: {actuals.join(", ")}.</label>}
    <button type="button" onClick={onRemove}>Poista kuitti erästä</button>
  </fieldset>;
});
