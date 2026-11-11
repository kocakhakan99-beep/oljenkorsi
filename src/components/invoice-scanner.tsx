import { APIKeyButton } from "./api-key-button";
import { useSessionAPIKey } from "../services/session-api-key";
import { useEffect, useState } from 'react';
import { receiptPDF } from '../services/receipt-pdf';
import { receiptFileError, importBatchError } from '../domain/receipts/files';
import { analyzeInvoiceBatch, type InvoiceSuggestion } from '../services/invoice-ai';

type Document = { name: string; text: string; suggestion?: InvoiceSuggestion; error?: string };
export function InvoiceScanner({ onUse, files = [] }: { onUse: (suggestion: InvoiceSuggestion, recurring: boolean) => void; files?: File[] }) {
  const key = useSessionAPIKey();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  async function readFiles(selected: File[]) {
    if (busy) { setError("Odota nykyisen käsittelyn valmistumista ennen uutta tuontia."); return; }
    if (documents.length && !window.confirm("Korvataanko nykyiset laskuluonnokset uusilla tiedostoilla?")) return;
    const validation = importBatchError(selected);
    if (validation) { setError(validation); return; }
    setError(''); setBusy(true);
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
  }
  useEffect(() => { if (files.length) void readFiles(files); }, [files]);
  async function analyze() {
    const requestKey = key; setBusy(true); setError('');
    const next = documents.map(d => ({ ...d }));
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
  return <section className="panel invoice-scanner" aria-label="Laskun AI-analyysi">
    <div className="ai-card-heading"><h2>Laskun analyysi</h2><APIKeyButton disabled={busy} /></div>
    <p>Lisää laskut ja pyydä ehdotukset. Tarkista tiedot ja valitse kertameno tai toistuva lasku. Tarvitset avaimen ja verkkoyhteyden.</p>
    <label>Valitse laskujen PDF:t<input type="file" multiple accept="application/pdf,.pdf" disabled={busy} onChange={event => { void readFiles(Array.from(event.target.files || [])); event.target.value = ''; }} /></label>
    {!documents.length && <button onClick={() => setDocuments([{ name: 'Liitetty lasku', text: '' }])}>Liitä laskuteksti</button>}
    {documents.map((document, index) => <div key={index}>
      <details open={documents.length === 1}><summary>{document.name}{document.suggestion ? ' · Analysoitu' : ''}</summary><label>Lähetettävä laskuteksti<textarea disabled={busy} rows={5} maxLength={20000} value={document.text} onChange={e => setDocuments(old => old.map((d, i) => i === index ? { ...d, text: e.target.value, suggestion: undefined, error: undefined } : d))} /></label></details>
      {document.error && <p role="alert">{document.error}</p>}
      {document.suggestion && <div><p>{document.suggestion.name || 'Nimi puuttuu'} · {document.suggestion.amountCents === null ? 'Summa puuttuu' : new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' }).format(document.suggestion.amountCents / 100)} · {document.suggestion.date || 'Eräpäivä puuttuu'}</p><p>Tarkista tiedot menolomakkeessa ennen tallentamista.</p>{[false, true].map(recurring => <button key={String(recurring)} onClick={() => { onUse(document.suggestion!, recurring); setDocuments(old => old.filter((_, i) => i !== index)); }}>{recurring ? 'Jatka toistuvana laskuna' : 'Jatka kertamenona'}</button>)}</div>}
    </div>)}

    <button disabled={busy || !key.trim() || !documents.some(d => d.text.trim() && !d.suggestion)} onClick={() => void analyze()}>Analysoi laskut</button>
    {busy && <p role="status">{progress}</p>}{error && <p role="alert">{error}</p>}
  </section>;
}
