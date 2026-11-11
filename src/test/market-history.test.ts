import { expect,it } from "vitest";
import { marketQuote,marketSnapshot } from "../domain/market-history";
import { investmentCatalog } from "../domain/investment-catalog";
import { datedState } from "../domain/dated-values";
import { empty,entry } from "../domain/model";
it('covers all 20 symbols with dated 2024–2026 observations, without future prices',()=>{
 expect(Object.keys(marketSnapshot.series)).toHaveLength(20);
 for(const [,symbol] of investmentCatalog){const series=marketSnapshot.series[symbol];expect(series.observations.length).toBeGreaterThanOrEqual(35);expect(series.observations[0].date.startsWith('2024')).toBe(true);expect(series.observations.at(-1)!.date.startsWith('2026')).toBe(true);for(const p of series.observations){expect(p.date<=marketSnapshot.asOf).toBe(true);expect(p.close).toBeGreaterThan(0)}}
});
it('uses past-only prices and FX without calling a future price a new observation',()=>{
 expect(marketQuote('AAPL','2023-12-31')).toBeNull();const q=marketQuote('AAPL','2026-12-31')!;expect(q.date<=marketSnapshot.asOf).toBe(true);expect(q.fxDate<=q.date).toBe(true);expect(q.exactUnitCents).toBeCloseTo(q.close*100/q.fxRate);expect(marketQuote('UNKNOWN','2026-01-01')).toBeNull();
});
it('values a linked position at its historical price while preserving recorded basis',()=>{
 const s=empty();s.investments=[entry({name:'Apple',marketSymbol:'AAPL',amount:10000,quantity:2,date:'2024-01-02'})];const a=datedState(s,'2024-12-31'),b=datedState(s,'2026-10-31');expect(a.investments[0].amount).not.toBe(b.investments[0].amount);expect(s.investments[0].amount).toBe(10000);
});
