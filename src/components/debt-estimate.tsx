import { useEffect, useState } from 'react';
import type { Entry } from '../domain/model';
import { money } from '../domain/calculations';
import { loanEstimate } from '../domain/loan-estimate';
import { MetricCard } from './summary';
import { DatePickerField } from './date-picker';
import { MoneyInput, percentText } from './numeric-inputs';

export function DebtEstimate({ item, euro, atDate }: { atDate: string; item: Entry; euro: (n: number) => string }) {
 const [expanded, setExpanded] = useState(false);
 const [asOf, setAsOf] = useState(atDate < item.date ? item.date : atDate);
 useEffect(() => setAsOf(atDate < item.date ? item.date : atDate),[atDate,item.date]);
 const [fee, setFee] = useState(0), [opening, setOpening] = useState(0);
 let result: ReturnType<typeof loanEstimate> | null = null, error = "";
 try { result = loanEstimate(item.amount, item.rate, item.payment, item.date, asOf, fee, opening); } catch (e) { error = String(e).replace(/^Error: /, ""); }
 return <details className="debt-estimate" onToggle={event => setExpanded(event.currentTarget.open)}><summary>Maksusuunnitelma ja todellinen vuosikorko</summary>{expanded && <><p>Arvio kirjatusta saldosta {item.date}. Olettaa erät maksetuiksi kuukausittain samana päivänä. Ei pankin vahvistama saldo; ei muuta kirjattua velkaa.</p><DatePickerField name="loan-estimate-date" label="Laskentapäivä" value={asOf} minDate={item.date} onChange={setAsOf} /><div className="form-grid"><label>Eräkohtainen lisäkulu (€)<MoneyInput defaultCents={fee} onChange={e => setFee(e.target.value ? money(e.target.value) : 0)} /></label><label>Alussa perittävä kulu (€)<MoneyInput defaultCents={opening} onChange={e => setOpening(e.target.value ? money(e.target.value) : 0)} /></label></div><p>Nimelliskorko {percentText(item.rate)} % vuodessa. Maksuerä {euro(item.payment)} sisältää koron ja lyhennyksen; kulut maksetaan sen lisäksi. Kulut ovat tämän laskelman oletuksia.</p>{error ? <p role="alert">{error}</p> : result && <><div className="stats"><MetricCard label="Arvioitu saldo valittuna päivänä" value={euro(result.balance)} /><MetricCard label="Todellisen vuosikoron arvio" value={result.apr === null ? "Ei laskettavissa" : `${percentText(result.apr)} %`} /><MetricCard label="Maksetuiksi oletetut erät kuluineen" value={euro(result.paid)} /></div><small>{item.payment === 0 ? "Takaisinmaksu ei ole laskelmassa käynnissä. Korkoa arvioidaan yksinkertaisena päiväkorolla; opintolainan todellinen pääomitus on tarkistettava pankista." : "Vakioitu korko, actual/365-päiväkorko ja kuukausierät. Ei koron muutoksia, lyhennysvapaita tai sopimuskohtaisia pyhäpäiväsiirtoja. Vuosikorko ratkaistaan kaikkien tulevien erien kassavirrasta tämän saldon päivämäärästä, ei alkuperäisen lainan virallisena vuosikorkona."}</small></>}</>}</details>;
}
