"""Rebuild a dated demo snapshot from public market observations, never future prices."""
import csv,datetime,hashlib,json,math,pathlib,urllib.parse,urllib.request,zoneinfo,concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parents[1]
SYMBOLS=['NOKIA.HE','NDA-FI.HE','KNEBV.HE','SAMPO.HE','UPM.HE','FORTUM.HE','NESTE.HE','WRT1V.HE','ELISA.HE','KESKOB.HE','AAPL','MSFT','NVDA','GOOGL','AMZN','BRK-B','TSLA','META','EUNL.DE','VWCE.DE']
ASOF='2026-11-10'
HEADERS={'User-Agent':'Mozilla/5.0','Accept':'application/json,text/csv,*/*'}
def get(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers=HEADERS),timeout=25) as response:return response.read()
def fetch(symbol):
 url='https://query2.finance.yahoo.com/v8/finance/chart/'+urllib.parse.quote(symbol)+'?'+urllib.parse.urlencode({'period1':1704067200,'period2':1794355200,'interval':'1d','events':'splits'})
 raw=get(url);pathlib.Path('/tmp/market-'+symbol+'.json').write_bytes(raw)
 payload=json.loads(raw);result=payload['chart']['result'][0];meta=result['meta'];timezone=zoneinfo.ZoneInfo(meta['exchangeTimezoneName']);prices=result['indicators']['quote'][0]['close'];monthly={};first=None
 if meta.get('symbol')!=symbol or meta.get('currency') not in ('EUR','USD'):raise ValueError('Unexpected instrument/currency '+symbol)
 for timestamp,close in zip(result['timestamp'],prices):
  date=datetime.datetime.fromtimestamp(timestamp,timezone).date().isoformat()
  if not isinstance(close,(int,float)) or isinstance(close,bool) or not math.isfinite(close) or close<=0 or not ('2024-01-01'<=date<=ASOF):continue
  point={'date':date,'close':round(close,6),'provisional':date==ASOF and ASOF==datetime.datetime.now(datetime.timezone.utc).date().isoformat()}
  if first is None:first=point
  monthly[date[:7]]=point
 if not monthly:raise ValueError('No observations '+symbol)
 points={p['date']:p for p in [first,*monthly.values()]}
 record={'currency':meta['currency'],'exchangeTimezone':meta['exchangeTimezoneName'],'observations':sorted(points.values(),key=lambda p:p['date']),'marketTimestamp':meta.get('regularMarketTime'),'source':url,'sourceSha256':hashlib.sha256(raw).hexdigest()}
 print(json.dumps({'symbol':symbol,'points':len(points),'last':record['observations'][-1]}),flush=True)
 return symbol,record
if __name__=='__main__':
 data={};errors={}
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
  futures={pool.submit(fetch,symbol):symbol for symbol in SYMBOLS}
  for future in concurrent.futures.as_completed(futures):
   symbol=futures[future]
   try:key,value=future.result();data[key]=value
   except Exception as error:errors[symbol]=str(error);print('ERROR',symbol,str(error),flush=True)
 fxurl='https://data-api.ecb.europa.eu/service/data/EXR/D.USD.EUR.SP00.A?startPeriod=2024-01-01&endPeriod=2026-11-10&format=csvdata'
 fxraw=get(fxurl);pathlib.Path('/tmp/market-fx.csv').write_bytes(fxraw)
 fx=[{'date':row['TIME_PERIOD'],'rate':float(row['OBS_VALUE'])} for row in csv.DictReader(fxraw.decode().splitlines()) if row['OBS_VALUE'] and row['TIME_PERIOD']<=ASOF]
 output={'asOf':ASOF,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'priceConvention':'Yahoo Close: provider split-adjusted historical closing price; not total return. Monthly last available trading day plus first available 2024 observation.','fxConvention':'ECB USD per EUR, latest observation on or before the price date.','fxSource':fxurl,'fxSourceSha256':hashlib.sha256(fxraw).hexdigest(),'series':{key:data[key] for key in SYMBOLS if key in data},'usdPerEur':sorted(fx,key=lambda p:p['date']),'unavailable':errors}
 if errors or len(data)!=len(SYMBOLS):raise SystemExit('Incomplete data; existing snapshot was not replaced.')
 if not fx or any(not math.isfinite(point['rate']) or point['rate']<=0 for point in fx):raise SystemExit('Invalid FX data; existing snapshot was not replaced.')
 path=ROOT/'src/data/market-history.json';temp=path.with_suffix('.json.tmp');temp.write_text(json.dumps(output,ensure_ascii=False,separators=(',',':'))+'\n');temp.replace(path);print('SAVED',path,'series',len(data),'fx',len(fx),flush=True)
