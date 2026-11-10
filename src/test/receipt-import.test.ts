import { expect, it } from "vitest";
import { empty, entry } from "../domain/model";
import { budgetSummary, occurrenceSum } from "../domain/calculations";
import { parseReceipt } from "../domain/receipts/parser";
import { prepareReceiptImport, duplicateReceipt, receiptMatches } from "../domain/receipts/import";
import { backup, restore, validate } from "../services/validation";
import fixture from "./fixtures/receipt-example.json";
const draft = () => parseReceipt(fixture.pages);
const cats = () => Object.fromEntries(draft().lines.map(l => [l.id, l.suggestedCategory || "Muu meno"]));
const hash = "a".repeat(64);
it("imports one receipt as category expenses exactly once, in purchase month, retaining its detail", () => {
  const s = empty(); s.settings.month = "2026-11"; s.budgets["2026-04"] = { Ruoka: 50000 }; s.coverage.expenseMonths = ["2026-04", "2026-03"];
  const next = validate(prepareReceiptImport(s, draft(), hash, cats(), { checked: true }));
  expect(next.expenses.reduce((n, e) => n + e.amount, 0)).toBe(3287);
  expect(next.expenses.every(e => e.date === "2026-04-05" && e.recurrence === "once")).toBe(true);
  expect(next.receiptImports[0].draft.lines).toHaveLength(15);
  expect(next.budgets).toEqual(s.budgets); expect(next.coverage.expenseMonths).toEqual(["2026-03"]);
  expect(budgetSummary(next, "2026-04").budgetedActual).toBeGreaterThan(0);
  expect(s.expenses).toEqual([]); expect(s.receiptImports).toEqual([]);
});
it("preserves receipt details and deduplication across JSON, including a differently encoded PDF", () => {
  const next = prepareReceiptImport(empty(), draft(), hash, cats(), { checked: true });
  const saved = restore(backup(next));
  expect(saved.receiptImports).toEqual(next.receiptImports);
  expect(duplicateReceipt(saved, draft(), "b".repeat(64))).toBe(true);
  expect(() => prepareReceiptImport(saved, draft(), "b".repeat(64), cats(), { checked: true })).toThrow("jo tuotu");
  const legacy = structuredClone(empty()) as unknown as Record<string, unknown>; delete legacy.receiptImports;
  expect(validate(legacy).receiptImports).toEqual([]);
});
it("requires classification, confirmation and exact sum, never partially mutating state", () => {
  const s = empty();
  expect(() => prepareReceiptImport(s, draft(), hash, {}, { checked: true })).toThrow("kategoria");
  expect(() => prepareReceiptImport(s, draft(), hash, cats(), { checked: false })).toThrow("Tarkista");
  const broken = draft(); broken.total!++;
  expect(() => prepareReceiptImport(s, broken, hash, cats(), { checked: true })).toThrow("täsmää");
  expect(s.expenses).toHaveLength(0);
});
it("replaces an existing one-off payment rather than doubling it", () => {
  const s = empty(); const e = entry({ name: "Korttiostos", amount: 3287, date: "2026-04-05", category: "Ruoka" }); s.expenses = [e];
  expect(receiptMatches(s, draft())).toHaveLength(1);
  expect(() => prepareReceiptImport(s, draft(), hash, cats(), { checked: true })).toThrow("Samalle päivälle");
  const next = prepareReceiptImport(s, draft(), hash, cats(), { checked: true, replaceEntryId: e.id });
  expect(next.expenses.some(x => x.id === e.id)).toBe(false);
  expect(next.expenses.reduce((n, e) => n + e.amount, 0)).toBe(3287);
});
it("replaces only a matching recurring occurrence, preserving the rest of the series", () => {
  const s = empty(), e = entry({ name: "Kuukausimaksu", amount: 3287, date: "2026-01-05", category: "Ruoka", recurrence: "monthly" }); s.expenses = [e];
  const next = prepareReceiptImport(s, draft(), hash, cats(), { checked: true, replaceEntryId: e.id });
  const series = next.expenses.find(x => x.id === e.id)!;
  expect(occurrenceSum(series, "2026-04")).toBe(0); expect(occurrenceSum(series, "2026-05")).toBe(3287);
  expect(next.expenses.reduce((n, e) => n + occurrenceSum(e, "2026-04"), 0)).toBe(3287);
});
it("requires explicit removal of manual category actuals, while leaving budgets intact", () => {
  const s = empty(); s.budgetActuals["2026-04"] = { Ruoka: 12345, Vesi: 990 }; s.budgets["2026-04"] = { Ruoka: 50000 };
  expect(() => prepareReceiptImport(s, draft(), hash, cats(), { checked: true })).toThrow("käsin");
  const next = prepareReceiptImport(s, draft(), hash, cats(), { checked: true, clearActuals: true });
  expect(next.budgetActuals["2026-04"]).toEqual({ Vesi: 990 }); expect(next.budgets).toEqual(s.budgets);
});
it("rejects tampered saved receipt groups and never learns categories from arbitrary document instructions", () => {
  const next = prepareReceiptImport(empty(), draft(), hash, cats(), { checked: true });
  next.receiptImports[0].draft.lines[0].net++;
  expect(() => validate(next)).toThrow();
});

it("honours occurrence overrides and clears an explicitly approved manual total in a replaced category", () => {
  const s = empty(); const e = entry({ name: "Korttiostos", amount: 3287, date: "2026-01-05", category: "Muu meno", recurrence: "monthly", status: "skipped", occurrenceStatuses: { "2026-04-05": "actual" } });
  s.expenses = [e]; s.budgetActuals["2026-04"] = { "Muu meno": 3287 };
  expect(receiptMatches(s, draft())).toHaveLength(1);
  expect(() => prepareReceiptImport(s, draft(), hash, cats(), { checked: true, replaceEntryId: e.id })).toThrow("käsin");
  const next = prepareReceiptImport(s, draft(), hash, cats(), { checked: true, replaceEntryId: e.id, clearActuals: true });
  expect(next.budgetActuals["2026-04"]).toEqual({});
  expect(next.expenses.reduce((n, e) => n + occurrenceSum(e, "2026-04"), 0)).toBe(3287);
});
