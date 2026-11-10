import { z } from "zod";
import { validDate, MAX } from "../calculations";

const cents = z.number().int().min(-MAX).max(MAX);
export const receiptSourceSchema = z.object({ page: z.number().int().min(1).max(50), line: z.number().int().min(1).max(10000), text: z.string().max(1000) });
export const receiptLineSchema = z.object({
  id: z.string().max(80), name: z.string().min(1).max(300),
  quantity: z.number().positive().max(100000).nullable(), unit: z.enum(["kpl", "kg", "l"]).nullable(),
  unitPrice: cents.nonnegative().nullable().optional(),
  gross: cents, discount: z.number().int().nonnegative().max(MAX), net: cents,
  kind: z.enum(["product", "deposit", "bag", "refund"]),
  suggestedCategory: z.string().max(100).nullable(),
  source: z.array(receiptSourceSchema).min(1).max(30),
});
export const receiptDraftSchema = z.object({
  parserVersion: z.enum(["receipt-1", "receipt-2"]), chain: z.enum(["s", "k", "unknown"]),
  merchant: z.string().max(200), date: z.string().refine(v => !v || validDate(v)),
  receiptId: z.string().max(100), currency: z.literal("EUR"), total: cents.nullable(),
  lines: z.array(receiptLineSchema).max(2000),
  issues: z.array(z.object({ code: z.string().max(80), message: z.string().max(500), blocking: z.boolean(), source: receiptSourceSchema.optional() })).max(200),
});
export type ReceiptLine = z.infer<typeof receiptLineSchema>;
export type ReceiptDraft = z.infer<typeof receiptDraftSchema>;
export type ReceiptSource = z.infer<typeof receiptSourceSchema>;
export const receiptImportSchema = z.object({
  id: z.string().min(1).max(100), sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
  semanticKey: z.string().min(1).max(400), importedAt: z.string().datetime(),
  draft: receiptDraftSchema, categories: z.record(z.string(), z.string().min(1).max(100)),
  entryIds: z.array(z.string().max(100)).min(1).max(500),
});
export type ReceiptImport = z.infer<typeof receiptImportSchema>;
