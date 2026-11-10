export const RECEIPT_PDF_LIMIT = 20 * 1024 * 1024;
/** Extension is only an initial gate. The reader also verifies the actual PDF header. */
export function receiptFileError(files: readonly { name: string; size: number }[]): string {
  if (files.length !== 1) return "Valitse tai pudota yksi PDF-kuitti kerrallaan.";
  if (!/\.pdf$/i.test(files[0].name)) return "Kuittiskannaus hyväksyy vain PDF-tiedostoja.";
  if (!files[0].size) return "PDF-tiedosto on tyhjä.";
  if (files[0].size > RECEIPT_PDF_LIMIT) return "PDF saa olla enintään 20 Mt.";
  return "";
}
