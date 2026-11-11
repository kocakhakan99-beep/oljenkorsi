import { useState } from 'react';
import { receiptPDF } from '../services/receipt-pdf';
import { analyzeInvoice, type InvoiceSuggestion, type InvoiceProvider } from '../services/invoice-ai';

export function InvoiceScanner({ onUse }: { onUse: (suggestion: InvoiceSuggestion, recurring: boolean) => void }) {
  const [key, setKey] = useState('');
  const [provider, setProvider] = useState<InvoiceProvider>('worker');
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<InvoiceSuggestion | null>(null);
  function useSuggestion(recurring: boolean) {
    if (!suggestion) return;
    onUse(suggestion, recurring); setKey(''); setText(''); setSuggestion(null);
  }
  async function readFile(file: File) {
    setError(''); setSuggestion(null); setText(''); setBusy(true);
    try {
      const result = await receiptPDF(file, new AbortController().signal, () => {});
      const extracted = result.pages.map(page => page.lines.join('\n')).join('\n\n');
      if (extracted.length > 30000) throw Error('Laskun teksti on liian pitkä. Lyhennä se ennen analyysiä.');
      setText(extracted);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'PDF:n lukeminen epäonnistui.'); }
    finally { setBusy(false); }
  }
  async function analyze() {
    const requestKey = key;
    setKey(''); setError(''); setSuggestion(null); setBusy(true);
    try { setSuggestion(await analyzeInvoice(requestKey, text, provider)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Analyysi epäonnistui.'); }
    finally { setBusy(false); }
  }
  return <section className="panel invoice-scanner" aria-label="Laskun AI-analyysi">
    <h2>Laskun AI-analyysi</h2>
    <p>Valitse tekstimuotoinen PDF tai liitä teksti. Tarkista ja poista tekstistä henkilötiedot ennen lähettämistä. {provider === "worker" ? "Koko alla näkyvä teksti lähetetään Cloudflare Workerille ja sen käyttämälle mallipalvelulle." : "Koko alla näkyvä teksti lähetetään OpenRouterille ja sen valitsemalle mallipalvelulle."} Tarkista palveluiden tietojen käsittelyehdot. Kuvapohjaiset PDF:t tarvitsevat OCR:n.</p>
    <label>Valitse laskun PDF<input type="file" accept="application/pdf,.pdf" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (file) void readFile(file); event.target.value = ''; }} /></label>
    <label>Lähetettävä laskuteksti<textarea rows={8} value={text} maxLength={30000} onChange={event => { setText(event.target.value); setSuggestion(null); }} placeholder="Liitä laskuteksti tai valitse PDF" /></label>
    <label>AI-palvelu<select aria-label="AI-palvelu" value={provider} disabled={busy} onChange={event => { setProvider(event.target.value as InvoiceProvider); setKey(''); setSuggestion(null); setError(''); }}><option value="openrouter">OpenRouter</option><option value="worker">Cloudflare Worker</option></select></label>
    {provider === "openrouter" && <label>OpenRouter API-avain<input type="password" autoComplete="off" value={key} onChange={event => setKey(event.target.value)} /></label>}
    <p>{provider === "openrouter" ? "OpenRouter-avain syötetään jokaista analyysiä varten eikä sitä tallenneta. " : "Worker ei vaadi Bearer-avainta. "}Ensisijaisesti käytetään ilmaista Nemotron 3 Ultra -mallia. Jos se on varattu tai käyttöraja täynnä, kokeillaan automaattisesti OpenRouterin ilmaismallireititintä. Sovellus pyytää vain ilmaismalleja. Saatavuus ja kiintiöt voivat vaihdella. AI voi erehtyä.</p>
    <button type="button" disabled={busy || !text.trim() || (provider === "openrouter" && !key.trim())} onClick={() => void analyze()}>{busy ? 'Käsitellään…' : 'Lähetä teksti analysoitavaksi'}</button>
    {error && <p role="alert">{error}</p>}
    {suggestion && <div role="status"><h3>Tarkista ehdotus</h3><p>{suggestion.name || 'Nimi puuttuu'} · {suggestion.amountCents === null ? 'Summa puuttuu' : new Intl.NumberFormat('fi-FI', {style:'currency',currency:'EUR'}).format(suggestion.amountCents / 100)} · {suggestion.date || 'Eräpäivä puuttuu'}</p><p>Valitse kirjaustapa ja tarkista kaikki kentät seuraavassa lomakkeessa. Toistuvan laskun oletus on kuukausittain; rytmiä voi muuttaa lisävalinnoissa. Varmista myös, ettei lasku ole jo kirjattu.</p><button type="button" onClick={() => useSuggestion(false)}>Jatka kertamenona</button> <button type="button" onClick={() => useSuggestion(true)}>Jatka toistuvana laskuna</button></div>}
  </section>;
}
