import { expect, it } from "vitest";
import { entry, empty } from "../domain/model";
import { selectedValuationDate, datedValue, datedState, visibleInMonth } from "../domain/dated-values";
import { defaultAssetModel,assetValuation } from "../domain/asset-valuation";
it('selects today for current month and month end for other months',()=>{expect(selectedValuationDate('2026-11','2026-11-10')).toBe('2026-11-10');expect(selectedValuationDate('2028-02','2026-11-10')).toBe('2028-02-29')});
it('projects assets and debts without rewriting their recorded values',()=>{
 const s=empty();s.assets=[entry({amount:2000000,date:'2026-01-01',category:'Auto',assetModel:{...defaultAssetModel('Auto'),year:2020,automatic:true,initialMileage:100000}})];s.liabilities=[entry({amount:100000,date:'2026-01-01',payment:10000,rate:0})];
 const next=datedState(s,'2026-03-01');expect(next.assets[0].amount).toBeLessThan(s.assets[0].amount);expect(next.liabilities[0].amount).toBe(80000);expect(s.liabilities[0].amount).toBe(100000);const growing=datedValue(entry({amount:1000000,rate:24,payment:100,date:'2026-01-01'}),'liabilities','2026-02-01');expect(growing.estimated).toBe(true);expect(growing.value).toBeGreaterThan(1000000);
 expect(datedValue(s.assets[0],'assets','2025-01-01').estimated).toBe(false);
});
it('does not apply a car model to a house and keeps deferred debt recorded',()=>{expect(datedValue(entry({category:'Asunto',assetModel:{...defaultAssetModel('Auto'),year:2020}}),'assets','2028-01-01').estimated).toBe(false);expect(datedValue(entry({amount:10000,payment:0}),'liabilities','2028-01-01').value).toBe(10000);expect(datedValue(entry({amount:100000,payment:0,rate:3.65,date:'2026-01-01'}),'liabilities','2026-01-11').value).toBe(100100)});
it('uses mileage and makes brand metadata neutral without calibrated data',()=>{
 const p={...defaultAssetModel('Auto'),automatic:true,year:2020,initialMileage:100000,annualMileage:10000};
 const r=assetValuation(100000,'2026-01-01','2027-01-01',p);expect(assetValuation(100000,'2026-01-01','2027-01-01',{...p,annualMileage:30000}).value).toBeLessThan(r.value);expect(assetValuation(100000,'2026-01-01','2027-01-01',{...p,brand:'Toyota',powertrain:'electric'}).value).toBe(r.value);
});

it('filters one-off and recurring events by occurrence month and snapshots by date',()=>{
 const e=entry({date:'2026-01-10',recurrence:'once'});expect(visibleInMonth(e,'expenses','2026-02')).toBe(false);expect(visibleInMonth({...e,recurrence:'monthly'},'expenses','2026-02')).toBe(true);expect(visibleInMonth({...e,active:false,recurrence:'monthly'},'expenses','2026-02')).toBe(true);expect(visibleInMonth({...e,recurrence:'monthly',endDate:'2026-01-31'},'incomes','2026-02')).toBe(false);expect(visibleInMonth(e,'assets','2025-12')).toBe(false);expect(visibleInMonth({...e,date:'2030-01-01',createdAt:'2026-01-01T00:00:00Z'},'goals','2026-02')).toBe(true);
});
