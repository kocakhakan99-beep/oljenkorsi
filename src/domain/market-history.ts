import snapshot from "../data/market-history.json";
export interface PriceObservation { date:string; close:number; provisional:boolean }
export interface MarketSeries { currency:string; exchangeTimezone:string; observations:PriceObservation[]; source:string; sourceSha256:string; marketTimestamp?:number }
export const marketSnapshot = snapshot as { asOf:string; priceConvention:string; fxConvention:string; fxSource:string; series:Record<string,MarketSeries>; usdPerEur:{date:string;rate:number}[] };
export function marketQuote(symbol:string, at:string) {
 const series=marketSnapshot.series[symbol];if(!series)return null;
 const point=series.observations.filter(point=>point.date<=at).at(-1);if(!point)return null;
 const fx=series.currency==='USD'?marketSnapshot.usdPerEur.filter(fxPoint=>fxPoint.date<=point.date).at(-1):null;
 if(series.currency!=='EUR'&&(series.currency!=='USD'||!fx))return null;
 const exactUnitCents=point.close*100/(fx?.rate||1);
 return {...point,symbol,currency:series.currency,eurCents:Math.round(exactUnitCents),exactUnitCents,fxDate:fx?.date||point.date,fxRate:fx?.rate||1,source:series.source};
}
