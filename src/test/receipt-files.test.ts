import { it, expect } from "vitest";
import { receiptFileError, RECEIPT_PDF_LIMIT } from "../domain/receipts/files";
it('accepts one nonempty PDF filename regardless of extension casing', () => {
  expect(receiptFileError([{ name: 'Kuitti.pdf', size: 12000 }])).toBe('');
  expect(receiptFileError([{ name: 'KUITTI.PDF', size: RECEIPT_PDF_LIMIT }])).toBe('');
});
it('rejects missing/multiple files, other extensions, empty and oversized PDFs', () => {
  for (const files of [[], [{name:'1.pdf',size:10},{name:'2.pdf',size:10}], [{name:'photo.png',size:10}], [{name:'receipt.pdf.exe',size:10}], [{name:'empty.pdf',size:0}], [{name:'large.pdf',size:RECEIPT_PDF_LIMIT+1}]]) expect(receiptFileError(files)).not.toBe('');
});

it('limits batch count, total bytes and validates every PDF', async () => {
  const { importBatchError } = await import('../domain/receipts/files');
  expect(importBatchError(Array.from({ length: 50 }, () => ({ name: 'r.pdf', size: 1 })))).toBe('');
  expect(importBatchError(Array.from({ length: 51 }, () => ({ name: 'r.pdf', size: 1 })))).not.toBe('');
  expect(importBatchError(Array.from({ length: 6 }, () => ({ name: 'r.pdf', size: RECEIPT_PDF_LIMIT })))).not.toBe('');
  expect(importBatchError([{ name: 'r.pdf', size: 10 }, { name: 'bad.exe', size: 10 }])).not.toBe('');
});
