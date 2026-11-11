import { expect, it } from "vitest";
import { loanEstimate } from "../domain/loan-estimate";
it("deducts assumed payments only on their due date", () => {
 expect(loanEstimate(100000,0,10000,"2026-01-10","2026-02-09").balance).toBe(100000);
 expect(loanEstimate(100000,0,10000,"2026-01-10","2026-03-10").balance).toBe(80000);
});
it("includes fees in APR but does not add paid fees to principal", () => {
 const plain=loanEstimate(100000,5,10000,"2026-01-10","2026-02-10");
 const fees=loanEstimate(100000,5,10000,"2026-01-10","2026-02-10",500,1000);
 expect(fees.apr!).toBeGreaterThan(plain.apr!);expect(fees.balance).toBe(plain.balance);expect(fees.paid-plain.paid).toBe(500);
});
it("does not invent repayment or APR during a payment-free period", () => {
 const result=loanEstimate(100000,3.65,0,"2026-01-01","2026-01-11");
 expect(result.balance).toBe(100100);expect(result.apr).toBeNull();expect(result.paid).toBe(0);
});
it("clamps month ends and rejects invalid valuation dates", () => {
 expect(loanEstimate(10000,0,10000,"2026-01-31","2026-02-28").balance).toBe(0);
 expect(()=>loanEstimate(10000,5,1000,"2026-01-31","2026-01-01")).toThrow();
});
