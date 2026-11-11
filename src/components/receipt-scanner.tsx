import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { FileText, ScanLine, Check, X, AlertTriangle } from "lucide-react";
import { ContextDetails } from "./summary";
import type { State } from "../domain/model";
import { validDate } from "../domain/calculations";
import { parseReceipt } from "../domain/receipts/parser";
import type { ReceiptDraft } from "../domain/receipts/schema";
import { prepareReceiptImport, receiptCategoryTotals, receiptMatches, receiptCategoryOptions } from "../domain/receipts/import";
import { receiptFileError } from "../domain/receipts/files";
import { receiptPDF } from "../services/receipt-pdf";

const euro = (n: number) => new Intl.NumberFormat("fi-FI", { style: "currency", currency: "EUR" }).format(n / 100);
export interface ReceiptScannerHandle { scanFile: (file: File) => boolean; focusPanel: () => void }
export function ReceiptScanButton({ onClick, label = "Skannaa kuitti", expanded }: { onClick: () => void; label?: string; expanded?: boolean }) {
  return <button type="button" onClick={onClick} aria-controls="receipt-workspace" aria-expanded={expanded} className="receipt-scan-button" title={label === "Skannaa kuitti" ? "PDF-kuitti · voit myös pudottaa tiedoston näkymään" : "Avaa kuittiskannaus Menot-näkymässä"}><ScanLine size={18} aria-hidden="true" />{label}</button>;
}
export const ReceiptScanner = forwardRef<ReceiptScannerHandle, { state: State; onImport: (next: State) => boolean; onClose: () => void }>(function ReceiptScanner({ state, onImport, onClose }, ref) {
  const [draft, setDraft] = useState<ReceiptDraft | null>(null);
  const [categories, setCategories] = useState<Record<string, string>>({}), [selected, setSelected] = useState<string[]>([]);
  const [onlyReview, setOnlyReview] = useState(false), [busy, setBusy] = useState(false), [progress, setProgress] = useState("");
  const [error, setError] = useState(""), [success, setSuccess] = useState("");
  const [checked, setChecked] = useState(false), [clearActuals, setClearActuals] = useState(false), [match, setMatch] = useState("");
  const controller = useRef<AbortController | null>(null), focus = useRef<HTMLHeadingElement>(null), title = useRef<HTMLHeadingElement>(null), fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const available = receiptCategoryOptions(state);
  const unresolved = draft?.lines.filter(l => !available.some(c => c.name === categories[l.id])) || [];
  const totals = draft ? receiptCategoryTotals(draft, categories) : new Map<string, number>();
  const rowSum = draft?.lines.reduce((n, l) => n + l.net, 0) || 0;
  const matches = draft ? receiptMatches(state, draft) : [];
  const actuals = [...new Set([...totals.keys(), ...matches.filter(e => e.id === match).map(e => e.category)])].filter(name => draft && state.budgetActuals[draft.date.slice(0, 7)]?.[name] !== undefined);
  const recurring = state.expenses.filter(e => e.active && e.recurrence !== "once" && totals.has(e.category));
  const blocked = !draft || draft.issues.some(i => i.blocking) || !validDate(draft.date) || draft.total === null || draft.total <= 0 || rowSum !== draft.total || !!unresolved.length || !checked || actuals.length > 0 && !clearActuals || matches.length > 0 && !match;
  async function scan(file: File) {
    controller.current?.abort(); const current = new AbortController(); controller.current = current;
    setBusy(true); setDraft(null); setError(""); setSuccess(""); setChecked(false); setClearActuals(false); setMatch(""); setSelected([]); setProgress("Luetaan PDF paikallisesti…");
    try {
      const result = await receiptPDF(file, current.signal, (page, total) => { if (controller.current === current && !current.signal.aborted) setProgress(`Luetaan sivua ${page}/${total}`); });
      if (current.signal.aborted) return;
      const parsed = parseReceipt(result.pages);
      setDraft(parsed);
      setCategories(Object.fromEntries(parsed.lines.map(l => [l.id, available.some(c => c.name === l.suggestedCategory) ? l.suggestedCategory! : ""])));
      setOnlyReview(false); setTimeout(() => { if (focus.current?.getClientRects().length) focus.current.focus(); }, 0);
    } catch (e) { if (!current.signal.aborted) setError(e instanceof Error ? e.message : "PDF:n lukeminen epäonnistui."); }
    finally { if (controller.current === current) { setBusy(false); setProgress(""); } }
  }
  function requestFile(file: File) {
    const validation = receiptFileError([file]);
    if (validation) { setError(validation); return false; }
    if ((draft || busy) && !window.confirm("Korvataanko nykyinen kuittiluonnos uudella PDF:llä? Tallentamattomat luokittelut menetetään.")) return false;
    void scan(file); return true;
  }
  useImperativeHandle(ref, () => ({ scanFile: requestFile, focusPanel: () => {
    const target = focus.current || title.current;
    if (target?.getClientRects().length) { target.focus(); target.scrollIntoView({ block: "start" }); }
  } }));
  function cancel() { controller.current?.abort(); controller.current = null; setBusy(false); setDraft(null); setProgress(""); setError(""); }
  function save() {
    if (!draft || blocked) return;
    try {
      const next = prepareReceiptImport(state, draft, categories, { checked, clearActuals, replaceEntryId: match === "separate" ? undefined : match || undefined, allowSeparatePurchase: match === "separate" });
      if (onImport(next)) {
        setSuccess(`Kuitti kirjattu: ${euro(draft.total!)} · ${draft.date.split("-").reverse().join(".")}. Budjettien suunnitellut summat säilyivät.`);
        setDraft(null); setCategories({}); setSelected([]); setMatch(""); setChecked(false); setClearActuals(false); setOnlyReview(false);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Tuonti epäonnistui."); }
  }
  return <section className="panel receipt-scanner" aria-labelledby="receipt-scanner-title">
    <div className="receipt-heading"><ScanLine aria-hidden="true" size={25} /><div><h2 id="receipt-scanner-title" ref={title} tabIndex={-1}>Kuittiskannaus</h2><p className="muted">Prisma, S-market, Alepa ja K-kaupat · PDF-kuitit · käsittely omassa selaimessa</p></div><button type="button" className="receipt-close" aria-label="Sulje kuittiskannaus" title="Sulje kuittiskannaus · luonnos säilyy" onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
    <ol className="receipt-steps" aria-label="Kuittiskannauksen vaiheet"><li aria-current={!draft ? "step" : undefined}>1 Valitse PDF</li><li aria-current={draft ? "step" : undefined}>2 Tarkista</li><li>3 Kirjaa menot</li></ol>
    <button type="button" className="receipt-scan-button" disabled={busy} onClick={() => fileInput.current?.click()}><FileText size={18} aria-hidden="true" />Valitse PDF</button>
    <input ref={fileInput} hidden aria-label="Skannaa PDF-kuitti" type="file" accept="application/pdf,.pdf" disabled={busy} onChange={e => { const f = e.target.files?.[0]; if (f) requestFile(f); e.target.value = ""; }} />
    <p className="ux-status-note">Enintään 20 Mt / 50 sivua. Tekstimuotoiset PDF-kuitit; kuvallinen skannaus tarvitsee myöhemmin OCR:n. Alkuperäistä PDF:ää ei tallenneta.</p>
    {busy && <div className="receipt-busy" role="status"><span>{progress}</span><button onClick={cancel}><X size={16} aria-hidden="true" /> Peruuta käsittely</button></div>}
    {error && <p className="alert" role="alert">{error}</p>}
    {success && <p className="alert" role="status"><Check size={18} aria-hidden="true" />{success} Tuonnin voi kumota sivun yläosan Kumoa-painikkeella ennen muita muutoksia.</p>}
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
      <div className="receipt-actions"><button className="primary" disabled={blocked} onClick={save}>Kirjaa {draft.total === null ? "kuitti" : euro(draft.total)} menoihin</button><button onClick={cancel}>Hylkää luonnos</button></div>
      <p className="ux-status-note">Kirjataan {draft.date ? draft.date.slice(0, 7) : "kuitin"} kuukauteen. Budjetti säilyy; toteuma päivittyy kirjauksista. Maksu- ja asiakasomistajatietoja ei poimita.</p>
    </div>}
  </section>;
});
