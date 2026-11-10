import { expect, it } from "vitest";
import { assetValuation, defaultAssetModel } from "../domain/asset-valuation";
import { entry, empty } from "../domain/model";
import { backup, restore } from "../services/validation";
it("anchors every model at the recorded value without double depreciation", () => {
 for (const category of ['Asunto','Auto','Vene','Metsä','Taide']) {
 const p={...defaultAssetModel(category),year:2010};
 expect(assetValuation(100000,'2026-01-01','2026-01-01',p).value).toBe(100000);
 }
});
it("ages vehicles with an optional mileage adjustment", () => {
 const p={...defaultAssetModel('Auto'),year:2020};
 const result=assetValuation(2000000,'2026-01-01','2027-01-01',p);
 expect(result.value).toBeLessThan(2000000);
 expect(assetValuation(2000000,'2026-01-01','2027-01-01',{...p,mileagePenalty:5}).value).toBeLessThan(result.value);
});
it("keeps land free of building wear and separates market growth", () => {
 const p={...defaultAssetModel('Metsä'),marketRate:2};
 expect(assetValuation(100000,'2026-01-01','2027-01-01',p).value).toBeGreaterThan(101900);
 const home={...defaultAssetModel('Asunto'),year:2000,buildingShare:0};
 expect(assetValuation(100000,'2026-01-01','2036-01-01',home).value).toBe(100000);
});
it("treats the uncertainty band as a user assumption", () => {
 const r=assetValuation(100000,'2026-01-01','2027-01-01',defaultAssetModel('Taide'));
 expect(r.low).toBe(80000);expect(r.high).toBe(120000);
});
it("rejects missing age data, backwards dates and overflow", () => {
 expect(()=>assetValuation(100,'2026-01-01','2027-01-01',defaultAssetModel('Auto'))).toThrow();
 expect(()=>assetValuation(100,'2026-01-01','2025-01-01',defaultAssetModel('Metsä'))).toThrow();
 expect(()=>assetValuation(1000000000000,'2026-01-01','2099-01-01',{...defaultAssetModel('Metsä'),marketRate:50})).toThrow();
});
it("roundtrips optional assumptions in JSON and leaves old records usable", () => {
 const s=empty();s.assets=[entry({name:'Auto',assetModel:{...defaultAssetModel('Auto'),year:2020}})];
 expect(restore(backup(s)).assets[0].assetModel?.year).toBe(2020);
 delete s.assets[0].assetModel;expect(restore(backup(s)).assets[0].assetModel).toBeNull();
});
