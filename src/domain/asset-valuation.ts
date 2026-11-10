import { vehicleRetention, vehicleBrandProfiles } from "./vehicle-profiles";
import { z } from "zod";
import { MAX, validDate } from "./calculations";
export const assetModelSchema = z.object({
  automatic: z.boolean().optional(),
  vehicleCurve: z.enum(["legacy-v1","staged-v2"]).optional(),
  newAtBase: z.boolean().optional(),
  initialMileage: z.number().min(0).max(3000000).optional(),
  brand: z.string().max(80).optional(),
  powertrain: z.enum(["petrol","diesel","hybrid","plugin","electric","other"]).optional(),
  model: z.enum(["home", "vehicle", "equipment", "land", "custom"]),
  year: z.number().int().min(1000).max(2100).nullable(),
  marketRate: z.number().min(-50).max(50),
  annualWear: z.number().min(0).max(90),
  life: z.number().min(1).max(300),
  residual: z.number().min(1).max(100),
  buildingShare: z.number().min(0).max(100),
  annualMileage: z.number().min(0).max(300000),
  mileagePenalty: z.number().min(0).max(50),
  uncertainty: z.number().min(0).max(90),
});
export type AssetModel = z.infer<typeof assetModelSchema>;
export const assetModelNames = { home: "Asunto / rakennus", vehicle: "Auto / ajoneuvo", equipment: "Laite / vene / kone", land: "Maa / metsä", custom: "Muu omaisuus" };
export function defaultAssetModel(category: string): AssetModel {
 const model = /asunto|asunn|rakennus|kiinteistö|mökki/i.test(category) ? "home" : /auto|ajoneuvo|moottori/i.test(category) ? "vehicle" : /maa|metsä|tontti/i.test(category) ? "land" : /vene|kone|laite|elektroni/i.test(category) ? "equipment" : "custom";
 return { model, newAtBase:false, vehicleCurve:"staged-v2", year: null, marketRate: 0, annualWear: model === "vehicle" ? 15 : model === "equipment" ? 20 : 0, life: 60, residual: 10, buildingShare: 70, annualMileage: 15000, mileagePenalty: 0, uncertainty: 20 };
}
/** Calibrated to a dated observed value: age is not deducted a second time. */
export function assetValuation(base: number, baseDate: string, at: string, raw: AssetModel) {
 const parsed = assetModelSchema.parse(raw);
 const p = parsed.automatic ? { ...parsed, marketRate:0, annualWear:parsed.model === "vehicle" ? 12 : parsed.model === "equipment" ? 20 : 0, life:60, residual:10, buildingShare:70, mileagePenalty:parsed.model === "vehicle" ? 2 : 0, uncertainty:25 } : parsed;
 if (!Number.isSafeInteger(base) || base < 0 || base > MAX || !validDate(baseDate) || !validDate(at) || at < baseDate) throw Error("Valitse arviointipäivä aikaisintaan kirjatun arvon päivästä.");
 const baseYear = Number(baseDate.slice(0, 4));
 if (["home", "vehicle", "equipment"].includes(p.model) && (p.year === null || p.year > baseYear)) throw Error("Syötä rakennusvuosi tai vuosimalli, joka on viimeistään arvostusvuosi.");
 if (p.model === "vehicle" && p.automatic && p.initialMileage === undefined) throw Error("Syötä kilometrit arvostuspäivänä (uudelle autolle 0).");
 const years = (Date.parse(at) - Date.parse(baseDate)) / (365.2425 * 86400000);
 const age = p.model === "vehicle" && p.newAtBase ? 0 : p.year === null ? 0 : Math.max(0, (Date.parse(baseDate) - Date.UTC(p.year, 0, 1)) / (365.2425 * 86400000));
 const floor = p.residual / 100;
 const condition = (a: number) => p.model === "home" ? floor + (1 - floor) * Math.max(0, 1 - a / p.life) : floor + (1 - floor) * Math.pow(1 - p.annualWear / 100, a);
 let aging = 1;
 if (p.model === "home") aging = 1 - p.buildingShare / 100 + p.buildingShare / 100 * condition(age + years) / condition(age);
 if (p.model === "vehicle" || p.model === "equipment") aging = condition(age + years) / condition(age);
 if (p.model === "vehicle" && p.automatic) {
  const c = (a:number,km:number) => p.vehicleCurve === "staged-v2" ? .06 + .94 * vehicleRetention(a,p.brand) * Math.pow(.98,km/10000) : floor+(1-floor)*Math.pow(1-p.annualWear/100,a)*Math.pow(1-p.mileagePenalty/100,km/10000);
  aging=c(age+years,(p.initialMileage||0)+p.annualMileage*years)/c(age,p.initialMileage||0);
 }
 // Mileage is an optional additional adjustment; zero avoids assuming double wear.
 const mileage = p.model === "vehicle" && !p.automatic ? Math.pow(1 - p.mileagePenalty / 100, p.annualMileage * years / 10000) : 1;
 const value = Math.round(base * Math.pow(1 + p.marketRate / 100, years) * aging * mileage);
 const low = Math.round(value * (1 - p.uncertainty / 100)), high = Math.round(value * (1 + p.uncertainty / 100));
 if (![value, low, high].every(v => Number.isSafeInteger(v) && v >= 0 && v <= MAX)) throw Error("Arvio ylittää laskentarajan. Lyhennä aikaväliä tai muuta oletuksia.");
 return { value, low, high, years, age, marketFactor: Math.pow(1 + p.marketRate / 100, years), agingFactor: aging, mileageFactor: mileage };
}

export const vehicleBrands = vehicleBrandProfiles.map(([brand])=>brand);
