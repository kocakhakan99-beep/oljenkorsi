export const RECEIPT_PDF_LIMIT = 20 * 1024 * 1024;
/** Extension is only an initial gate. The reader also verifies the actual PDF header. */
export function receiptFileError(files: readonly { name: string; size: number }[]): string {
  if (files.length !== 1) return "Valitse tai pudota yksi PDF-kuitti kerrallaan.";
  if (!/\.pdf$/i.test(files[0].name)) return "Kuittiskannaus hyväksyy vain PDF-tiedostoja.";
  if (!files[0].size) return "PDF-tiedosto on tyhjä.";
  if (files[0].size > RECEIPT_PDF_LIMIT) return "PDF saa olla enintään 20 Mt.";
  return "";
}

/** Bound queued browser memory as well as each individual PDF. */
export function importBatchError(files: readonly { name: string; size: number }[]): string {
  if (!files.length || files.length > 50) return 'Valitse 1–50 PDF-tiedostoa.';
  if (files.reduce((sum, file) => sum + file.size, 0) > 100 * 1024 * 1024) return 'Tiedostojen yhteiskoko saa olla enintään 100 Mt.';
  return files.map(file => receiptFileError([file])).find(Boolean) || '';
}
