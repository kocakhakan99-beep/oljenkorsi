/** Transparent scenario assumptions, NOT measured Finnish resale statistics. */
export const vehicleBrandProfiles = [
 ["Toyota",.85], ["Volkswagen",.96], ["Volvo",.95], ["Škoda",.94], ["Ford",1.05],
 ["Mercedes-Benz",1.04], ["BMW",1.08], ["Nissan",1.03], ["Kia",.94], ["Opel",1.09],
 ["Audi",1.04], ["Hyundai",.97], ["Peugeot",1.12], ["Renault",1.10], ["Honda",.88],
 ["Mazda",.91], ["Citroën",1.14], ["SEAT",1.02], ["Mitsubishi",1.01], ["Tesla",1.16],
] as const;
export const vehicleStages = [{until:1,rate:.22},{until:3,rate:.14},{until:5,rate:.10},{until:10,rate:.07},{until:Infinity,rate:.04}];
export function brandWearFactor(brand?:string) {
 return vehicleBrandProfiles.find(([name])=>name.toLocaleLowerCase()===brand?.toLocaleLowerCase())?.[1] ?? 1;
}
/** Continuous survival curve; no value jump at a stage boundary. */
export function vehicleRetention(age:number,brand?:string) {
 let previous=0,log=0;
 for(const stage of vehicleStages) { const years=Math.max(0,Math.min(age,stage.until)-previous);log+=years*Math.log(1-stage.rate);previous=stage.until; }
 return Math.exp(log*brandWearFactor(brand));
}
