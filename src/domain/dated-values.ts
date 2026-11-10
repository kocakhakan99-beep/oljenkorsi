import { scheduledOccurrences } from "./calculations";
import type { Kind } from "./model";
import type { Entry, State } from "./model";
import { today } from "./model";
import { assetValuation, defaultAssetModel } from "./asset-valuation";
import { loanEstimate } from "./loan-estimate";
export function selectedValuationDate(month: string, now = today()) {
 if (month === now.slice(0,7)) return now;
 const [y,m]=month.split('-').map(Number);
 return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);
}
export function datedValue(item: Entry, kind: 'assets'|'liabilities', at: string) {
 if (at < item.date) return { value:item.amount, estimated:false, note:'Arvostuspäivää edeltävää arvoa ei tunneta' };
 try {
  if (kind==='assets' && item.assetModel && defaultAssetModel(item.category).model !== "custom" && item.assetModel.model !== defaultAssetModel(item.category).model) return {value:item.amount,estimated:false,note:"Tallennetun mallin kategoria on muuttunut. Tallenna oikea malli kortilta."};
  if (kind==='assets' && item.assetModel) return {value:assetValuation(item.amount,item.date,at,item.assetModel).value,estimated:true,note:'Tallennetun arvomallin arvio'};
  if (kind==='liabilities' && (item.payment>0 || item.rate>0)) return {value:loanEstimate(item.amount,item.rate,item.payment,item.date,at,0,0,true).balance,estimated:true,note:item.payment>0 ? 'Kuukausierät oletettu maksetuiksi; sisältää kertyvän koron, ei lisäkuluja' : 'Korkokertymän arvio ilman lyhennyksiä; sopimuskohtaista pääomitusta ei mallinneta'};
 } catch(e) { return {value:item.amount,estimated:false,note:`Arviota ei voitu laskea: ${String(e)}`}; }
 return {value:item.amount,estimated:false,note:kind==='assets'?'Kirjattu arvo, ei tallennettua mallia':'Kirjattu saldo, takaisinmaksua ei oleteta'};
}
export function datedState(state:State,at:string):State {
 return {...state,investments:state.investments.filter(e=>e.date<=at),assets:state.assets.filter(e=>e.date<=at).map(e=>({...e,amount:datedValue(e,'assets',at).value})),liabilities:state.liabilities.filter(e=>e.date<=at).map(e=>({...e,amount:datedValue(e,'liabilities',at).value}))};
}

export function visibleInMonth(item:Entry,kind:Kind,month:string) {
 if(kind==='incomes'||kind==='expenses') return scheduledOccurrences(item.active ? item : {...item,active:true},month).length>0;
 if(kind==='goals') return item.createdAt.slice(0,10)<=selectedValuationDate(month);
 return item.date<=selectedValuationDate(month);
}
