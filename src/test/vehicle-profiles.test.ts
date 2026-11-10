import { expect,it } from "vitest";
import { vehicleRetention,vehicleBrandProfiles } from "../domain/vehicle-profiles";
import { assetValuation,defaultAssetModel } from "../domain/asset-valuation";
it('provides an explicit weight for each of the 20 brands and influences the new curve',()=>{
 expect(vehicleBrandProfiles).toHaveLength(20);expect(new Set(vehicleBrandProfiles.map(([brand])=>brand)).size).toBe(20);
 const base={...defaultAssetModel('Auto'),automatic:true,year:2024,initialMileage:0,annualMileage:15000};
 const values=vehicleBrandProfiles.map(([brand])=>assetValuation(3000000,'2024-01-01','2025-01-01',{...base,brand}).value);expect(new Set(values).size).toBeGreaterThan(10);
 expect(assetValuation(3000000,'2024-01-01','2025-01-01',{...base,brand:'Toyota'}).value).toBeGreaterThan(assetValuation(3000000,'2024-01-01','2025-01-01',{...base,brand:'Tesla'}).value);
});
it('depreciates a new vehicle faster and remains continuous at age boundaries',()=>{
 expect(1-vehicleRetention(1)/vehicleRetention(0)).toBeGreaterThan(1-vehicleRetention(7)/vehicleRetention(6));
 for(const age of [1,3,5,10])expect(Math.abs(vehicleRetention(age-1e-6)-vehicleRetention(age+1e-6))).toBeLessThan(1e-5);
});
it('preserves dated value at the anchor even with a brand and high mileage',()=>{
 const p={...defaultAssetModel('Auto'),automatic:true,year:2015,initialMileage:250000,brand:'BMW'};expect(assetValuation(500000,'2024-01-01','2024-01-01',p).value).toBe(500000);
});

it('starts the steep first year on the recorded new-car date, also late in a model year',()=>{
 const p={...defaultAssetModel('Auto'),automatic:true,year:2026,initialMileage:0,annualMileage:15000};
 expect(assetValuation(3000000,'2026-11-01','2027-11-01',{...p,newAtBase:true}).value).toBeLessThan(assetValuation(3000000,'2026-11-01','2027-11-01',{...p,newAtBase:false}).value);
});
