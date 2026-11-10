import { getDocument, OPS } from "pdfjs-dist";
// Statically bundled PDF.js handler: no worker URL, CDN, eval or CSP relaxation.
import "pdfjs-dist/build/pdf.worker.mjs";
import type { ReceiptTextPage } from "../domain/receipts/parser";

export const PDF_LIMIT = 20 * 1024 * 1024;
export async function receiptPDF(file: File, signal: AbortSignal, progress: (page: number, total: number) => void): Promise<{ pages: ReceiptTextPage[]; hash: string }> {
  if (file.size > PDF_LIMIT) throw Error("PDF saa olla enintään 20 Mt.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes("%PDF-")) throw Error("Tiedosto ei ole PDF.");
  if (signal.aborted) throw Error("Käsittely peruutettu.");
  const hash = [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map(n => n.toString(16).padStart(2, "0")).join("");
  const task = getDocument({ data: bytes, useSystemFonts: false, disableFontFace: true, useWasm: false, isImageDecoderSupported: false, stopAtErrors: true });
  const abort = () => { void task.destroy().catch(() => {}); };
  signal.addEventListener("abort", abort, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; abort(); }, 30000);
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 50) throw Error("PDF saa sisältää enintään 50 sivua.");
    const pages: ReceiptTextPage[] = [];
    let chars = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      if (signal.aborted) throw Error("Käsittely peruutettu.");
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const items = content.items.filter(item => "str" in item).map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], h: Math.abs(item.height) || 10 }));
      // PDF text order is not guaranteed. Group by baseline, then read columns left to right.
      items.sort((a, b) => b.y - a.y || a.x - b.x);
      const rows: { y: number; h: number; items: typeof items }[] = [];
      for (const item of items) {
        let row = rows.at(-1);
        if (!row || Math.abs(row.y - item.y) > Math.min(row.h, item.h) * 0.35) { row = { y: item.y, h: item.h, items: [] }; rows.push(row); }
        row.items.push(item);
      }
      const lines = rows.map(row => row.items.sort((a, b) => a.x - b.x).map(i => i.text).join(" ").replace(/\s+/g, " ").trim()).filter(Boolean);
      if (!lines.length) {
        const ops = await page.getOperatorList();
        if (ops.fnArray.some(op => [OPS.paintImageXObject, OPS.paintInlineImageXObject, OPS.paintImageMaskXObject].includes(op))) throw Error(`Sivu ${i} on kuvallinen. Tämä versio tarvitsee tekstimuotoisen PDF-kuitin; OCR ei ole vielä käytössä.`);
      }
      chars += lines.join("").length;
      if (chars > 200000) throw Error("PDF:n tekstimäärä ylittää käsittelyrajan.");
      pages.push({ page: i, lines }); progress(i, pdf.numPages); page.cleanup();
    }
    if (!pages.some(p => p.lines.length)) throw Error("PDF:stä ei löytynyt tekstiä. Kuvallinen kuitti tarvitsee OCR-tunnistuksen.");
    return { pages, hash };
  } catch (error) {
    if (signal.aborted) throw Error("Käsittely peruutettu.");
    if (timedOut) throw Error("PDF:n käsittelyn aikaraja ylittyi. Kokeile pienempää kuittitiedostoa.");
    if (error instanceof Error && error.name === "PasswordException") throw Error("PDF on salasanasuojattu. Valitse suojaamaton kuittikopio.");
    throw error;
  } finally { clearTimeout(timer); signal.removeEventListener("abort", abort); await task.destroy().catch(() => {}); }
}
