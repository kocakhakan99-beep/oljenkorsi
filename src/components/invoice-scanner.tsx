import { DocumentProcessing } from "./document-processing";
import { APIKeyButton } from "./api-key-button";
import { useSessionAPIKey } from "../services/session-api-key";
import { CircleCheck, FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from 'react';
import { validDate } from '../domain/calculations';
import { receiptPDF } from '../services/receipt-pdf';
import { receiptFileError, importBatchError } from '../domain/receipts/files';
import { analyzeInvoiceBatch, type InvoiceSuggestion } from '../services/invoice-ai';

type Document = { name: string; text: string; suggestion?: InvoiceSuggestion; error?: string; recurring?: boolean; category?: string; amountText?: string };
export function InvoiceScanner({ onBatch, onClose, categories, files = [] }: { onClose: () => void; onBatch: (suggestions: { suggestion: InvoiceSuggestion; recurring: boolean; category: string }[], allowDuplicates: boolean) => string; categories: string[]; files?: File[] }) {
  const key = useSessionAPIKey();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [progress, setProgress] = useState('');
  const previousKey = useRef(key);
  async function readFiles(selected: File[]) {
    if (busy) { setError("Odota nykyisen käsittelyn valmistumista ennen uutta tuontia."); return; }
    if (documents.length && !window.confirm("Korvataanko nykyiset laskuluonnokset uusilla tiedostoilla?")) return;
    const validation = importBatchError(selected);
    if (validation) { setError(validation); return; }
    setError(''); setSuccess(''); setAllowDuplicates(false); setBusy(true);
    const next: Document[] = [];
    for (const file of selected) {
      setProgress(`Luetaan ${next.length + 1}/${selected.length}: ${file.name}`);
      try {
        const validation = receiptFileError([file]); if (validation) throw Error(validation);
        const result = await receiptPDF(file, new AbortController().signal, () => {});
        const text = result.pages.map(page => page.lines.join('\n')).join('\n\n');
        if (text.length > 20000) throw Error('Laskuteksti on liian pitkä erätuontiin (enintään 20 000 merkkiä).');
        next.push({ name: file.name, text });
      } catch (reason) { next.push({ name: file.name, text: '', error: reason instanceof Error ? reason.message : 'PDF:n luku epäonnistui.' }); }
    }
    setDocuments(next); setBusy(false); setProgress('');
    if (key.trim() && next.some(d => d.text.trim())) void analyze(next);
  }
  useEffect(() => { if (files.length) void readFiles(files); }, [files]);
  useEffect(() => {
    const wasSet = !!previousKey.current.trim();
    previousKey.current = key;
    if (!wasSet && key.trim() && !busy && documents.some(d => d.text.trim() && !d.suggestion)) void analyze();
  }, [key]);
  async function analyze(source = documents) {
    const requestKey = key; setBusy(true); setError(''); setSuccess('');
    const next = source.map(d => ({ ...d }));
    try {
      // Bound both document count and prompt size. A large upload is split into
      // small requests, while short invoices share a single request.
      const pending = next.map((d, i) => ({ d, i })).filter(({ d }) => d.text.trim() && !d.suggestion);
      for (let offset = 0; offset < pending.length;) {
        const group: typeof pending = []; let length = 0;
        while (offset < pending.length && group.length < 5 && length + pending[offset].d.text.length < 24000) {
          const item = pending[offset++]; group.push(item); length += item.d.text.length;
        }
        setProgress(`Analysoidaan ${offset}/${pending.length} laskua…`);
        const suggestions = await analyzeInvoiceBatch(requestKey, group.map(({ d }) => d.text));
        group.forEach(({ i }, index) => { next[i] = { ...next[i], suggestion: suggestions[index], error: undefined }; });
        setDocuments([...next]);
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Analyysi epäonnistui.'); }
    finally { setBusy(false); setProgress(''); }
  }
  const incomplete = documents.filter(d => d.suggestion && (!d.suggestion.name.trim() || !d.suggestion.amountCents || !validDate(d.suggestion.date))).length;
  return <section className="panel invoice-scanner" aria-label="Laskun AI-analyysi">
    <div className="ai-card-heading"><h2>Lisää lasku</h2><APIKeyButton disabled={busy} /><button type="button" aria-label="Sulje laskun lisäys" onClick={onClose}><X size={18} aria-hidden="true" /></button></div>
    <p>Valitut laskut lähetetään AI-analyysiin.</p>
    <label>Valitse laskujen PDF:t<input type="file" multiple accept="application/pdf,.pdf" disabled={busy} onChange={event => { void readFiles(Array.from(event.target.files || [])); event.target.value = ''; }} /></label>
    {busy ? <DocumentProcessing kind="invoice" progress={progress} /> : <DocumentProcessing kind="invoice" stage={documents.length ? (documents.every(d => d.suggestion) && !incomplete ? 'review' : 'attention') : 'waiting'} progress={documents.length ? (incomplete ? 'Täydennä vielä puuttuvat tiedot.' : documents.every(d => d.suggestion) ? 'Tarkista yhteenveto.' : 'Lisää avain tai yritä uudelleen.') : 'Valitse laskut aloittaaksesi.'} />}
    {!!incomplete && <div className="receipt-unresolved-heading invoice-review-attention"><span aria-hidden="true">✦</span><div><h3>Täydennä vielä nämä</h3><p>{incomplete} laskua vaatii tarkistuksen</p></div></div>}
    {documents.map((document, index) => <div className="invoice-review-card" key={index} onChangeCapture={() => setAllowDuplicates(false)}>
      {!busy && <div className="invoice-review-card-heading"><FileText size={20} aria-hidden="true" /><strong>{document.suggestion?.name || document.name}</strong>{document.suggestion?.amountCents != null && <strong>{new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(document.suggestion.amountCents / 100)}</strong>}</div>}
      {document.error && <p role="alert">{document.error}</p>}
      {document.suggestion && <div className="invoice-review-fields">
        <label>Nimi<input value={document.suggestion.name} onChange={e => setDocuments(old => old.map((d, i) => i === index ? { ...d, suggestion: { ...d.suggestion!, name: e.target.value } } : d))} /></label>
        <label>Summa (€)<input inputMode="decimal" value={document.amountText ?? (document.suggestion.amountCents === null ? '' : (document.suggestion.amountCents / 100).toFixed(2).replace('.', ','))} onChange={e => { const raw = e.target.value; const clean = raw.trim().replace(',', '.'); const amount = /^\d+(?:\.\d{0,2})?$/.test(clean) ? Math.round(Number(clean) * 100) : null; setDocuments(old => old.map((d, i) => i === index ? { ...d, amountText: raw, suggestion: { ...d.suggestion!, amountCents: amount } } : d)); }} /></label>
        <label>Eräpäivä<input type="date" value={document.suggestion.date} onChange={e => setDocuments(old => old.map((d, i) => i === index ? { ...d, suggestion: { ...d.suggestion!, date: e.target.value } } : d))} /></label>
        <label>Kategoria<select value={document.category || (categories.includes('Muu meno') ? 'Muu meno' : categories[0] || '')} onChange={e => setDocuments(old => old.map((d, i) => i === index ? { ...d, category: e.target.value } : d))}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
        <label><input type="checkbox" checked={!!document.recurring} onChange={event => setDocuments(old => old.map((d, i) => i === index ? { ...d, recurring: event.target.checked } : d))} />Toistuva lasku kuukausittain</label>
      </div>}
      {!busy && (document.error || document.suggestion) && <button type="button" onClick={() => { setAllowDuplicates(false); setDocuments(old => old.filter((_, i) => i !== index)); }}>Poista erästä</button>}

    </div>)}

    {error && key && documents.some(d => d.text.trim() && !d.suggestion) && <button disabled={busy} onClick={() => void analyze()}>Yritä uudelleen</button>}
    {!key && <p>Lisää avain yläkulman avainpainikkeesta.</p>}
    {documents.some(d => d.suggestion) && <div className="document-review document-review--invoice"><div className="document-review-heading"><CircleCheck size={23} aria-hidden="true" /><div><h3>Laskujen yhteenveto</h3><p>{documents.filter(d => d.suggestion).length} laskua</p></div><strong className="document-review-total">{new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(documents.reduce((n, d) => n + (d.suggestion?.amountCents || 0), 0) / 100)}</strong></div><button className="primary" disabled={busy || documents.some(d => !d.suggestion || !d.suggestion.name.trim() || !d.suggestion.amountCents || d.suggestion.amountCents > 10000000000 || !categories.length || !validDate(d.suggestion.date))} onClick={() => { const message = onBatch(documents.map(d => ({ suggestion: d.suggestion!, recurring: !!d.recurring, category: d.category || (categories.includes('Muu meno') ? 'Muu meno' : categories[0] || '') })), allowDuplicates); if (message) setError(message); else { setSuccess(`${documents.length} laskua kirjattu. Sulje ikkuna, jos haluat kumota erän.`); setDocuments([]); setError(''); setAllowDuplicates(false); } }}>Kirjaa laskut menoihin</button><p>Tarkista nimet, summat, eräpäivät ja toistuvuus ennen kirjaamista. Puuttuvat tiedot vaativat tarkistuksen.</p></div>}
    {error && <p role="alert">{error}</p>}{error.startsWith("Sama lasku") && <label><input type="checkbox" checked={allowDuplicates} onChange={e => setAllowDuplicates(e.target.checked)} />Olen tarkistanut, että samanlaiset laskut ovat erillisiä.</label>}{success && <p role="status">{success}</p>}
  </section>;
}
