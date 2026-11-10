"""Create clearly fictional receipt PDFs with real random baskets and reproducible seeds.
Developer dependency: PyMuPDF. No private receipts, payment identifiers or network access.
"""
from pathlib import Path
from decimal import Decimal, ROUND_HALF_UP
import json, random, secrets, zipfile, csv, argparse
import fitz

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'examples/receipts'
OUT.mkdir(parents=True, exist_ok=True)
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf'
arguments = argparse.ArgumentParser()
arguments.add_argument('--replay', action='store_true', help='Reuse saved receipt seeds; new PDFs may have different file identifiers')
args = arguments.parse_args()
previous = json.loads((OUT/'manifest.json').read_text())['receipts'] if args.replay else []
seeds = {r['file']: int(r['seed']) for r in previous}
SHOPS = [('prisma', 'PRISMA', 's'), ('s-market', 'S-MARKET', 's'), ('alepa', 'ALEPA', 's'), ('sale', 'SALE', 's'), ('k-citymarket', 'K-Citymarket', 'k'), ('k-supermarket', 'K-Supermarket', 'k'), ('k-market', 'K-Market', 'k')]
# Prices are fictional cents, not store offers. Food and general goods use separate VAT groups.
CATALOG = [
 ('KEVYTMAITO 1L',119,135),('KAURAJUOMA 1L',189,135),('JOGURTTI MUSTIKKA 1KG',265,135),('ARKIRAE 400G',249,135),
 ('ARKIJUUSTO 700G',689,135),('MOZZARELLA 125G',139,135),('RUOKAKERMA 2DL',89,135),('KERMAVIILI 200G',79,135),
 ('VOI 500G',429,135),('KANANMUNAT 10KPL',299,135),('REISSUMIES 12KPL',219,135),('KAURAPALAT 500G',259,135),
 ('FAZER PAAHTO 505G',269,135),('KAURAHIUTALEET 1KG',149,135),('PASTA 500G',119,135),('BASMATIRIISI 1KG',349,135),
 ('TOMAATTIMURSKA 400G',99,135),('PAPUSEKOITUS 380G',159,135),('KAHVI 500G',729,135),('TEE 20PS',269,135),
 ('NAUDAN JAUHELIHA 400G',579,135),('BROILERIFILEE 400G',599,135),('KIRJOLOHIFILEE 300G',749,135),('ALASKANSEITI 400G',359,135),
 ('KALKKUNALEIKKELE 200G',259,135),('NAKKI 400G',289,135),('KASVISPYORYKAT 250G',329,135),('PAKASTEHERNEET 400G',189,135),
 ('MUSTIKKA 200G',319,135),('RANSKANPERUNAT 750G',229,135),('PIZZA MOZZARELLA 350G',389,135),('HUMMUS 200G',249,135),
 ('PILTTI KASVISRISOTTO 190G',169,135),('MAISSINAKSU 90G',219,135),('SMOOTHIE MANGO 90G',119,135),('PROTEIINIPATUKKA 55G',189,135),
 ('MAAPAHKINAT 200G',249,135),('TUMMA SUKLAA 100G',239,135),('SIPS POIMU 200G',249,135),('DIPPI RANCH 20G',109,135),
 ('JODIOITU SUOLA 500G',119,135),('OLIIVIOLJY 500ML',699,135),('SINAPPI 250G',149,135),('KETSUPPI 500G',239,135),
 ('WC-PAPERI 8RLL',429,255),('TALOUSPAPERI 4RLL',359,255),('ASTIANPESUAINE 500ML',269,255),('PYYKINPESUNESTE 1L',579,255),
 ('SAIPPUA 250ML',229,255),('HAMMASTAHNA 75ML',299,255),('HAMMASLANKAIN 30KPL',279,255),('NENALIINA 10PKT',199,255),
 ('SHAMPOO 250ML',349,255),('TERVEYSSIDE 14KPL',339,255),('HOUSUVAIPPA 28KPL',1099,255),('PAKASTUSPUSSI 30KPL',199,255),
 ('LEIVINPAPERI 20ARK',229,255),('ROSKAPUSSI 20KPL',159,255),('KASVOVOIDE 50ML',649,255),('MIKROKUITULIINA 3KPL',329,255),
 ('SUKAT 3PARIA',599,255),('LASTEN RUKKASET',1299,255),('LEGGINGSIT',999,255),('VARIKYNAT 12KPL',399,255),
]
WEIGHED = [('BANAANI',169),('OMENA',249),('KURKKU',299),('TOMAATTI',399),('PORKKANA',149),('PAARYNA',349),('PAPRIKA',599)]
def rounded(n): return int(Decimal(n).quantize(Decimal('1'), rounding=ROUND_HALF_UP))
def money(n): return f'{n//100},{n%100:02d}' if n>=0 else '-'+money(-n)
def item(name, qty, unit, price, vat, discount=0):
    gross = rounded(Decimal(str(qty))*price)
    return dict(name=name,quantity=qty,unit=unit,unitPrice=price,gross=gross,discount=discount,net=gross-discount,vat=vat)
def baskets(rng):
    for _ in range(1000):
        result=[]
        for name, price, vat in rng.sample(CATALOG,rng.randint(22,32)):
            price = max(49, price + rng.randint(-20,30))
            qty = rng.choices([1,2,3],[7,3,1])[0]
            gross=qty*price
            discount=rng.randint(20,min(gross//3,199)) if rng.random()<.16 else 0
            result.append(item(name,qty,'kpl',price,vat,discount))
        for name, price in rng.sample(WEIGHED,rng.randint(2,4)):
            qty = rng.randint(230,1300)/1000
            result.append(item(name,qty,'kg',price,135))
        n=rng.randint(2,4)
        result.extend([item('COLA SOKERITON 0,5L',n,'kpl',rng.randint(125,175),135),item('PANTTI 0,20 EUR PULLO',n,'kpl',20,255),item('MUOVIKASSI TESTI 40L',rng.randint(1,2),'kpl',35,255)])
        if 6000<=sum(x['net'] for x in result)<=12500: return result
    raise RuntimeError('Could not generate basket within budget')
def render_pdf(path, lines):
    doc=fitz.open()
    # More than one page when needed; never insert a second transaction header.
    for offset in range(0,len(lines),64):
        part=lines[offset:offset+64]
        page=doc.new_page(width=304,height=max(180,36+len(part)*11))
        page.insert_font(fontname='ReceiptMono',fontfile=FONT)
        for i,line in enumerate(part):
            assert fitz.get_text_length(line,fontname='cour',fontsize=8) < 276, line
            page.insert_text((14,20+i*11),line,fontname='ReceiptMono',fontsize=8,color=(0.08,0.12,0.10))
    doc.set_metadata({'title':'FIKTIIVINEN TESTIKUITTI - '+path.stem,'author':'Oljenkorsi / synteettinen testiaineisto','subject':'Ei oikea ostos, maksutosite tai kaupan tarjous'})
    doc.subset_fonts()
    doc.save(path,garbage=4,deflate=True);doc.close()
def generate(slug,shop,chain,number,index):
    seed=seeds.get(f'{slug}-{number}.pdf', secrets.randbits(64));rng=random.Random(seed)
    products=baskets(rng)
    # Include at least one format-specific offer in each independent random basket.
    if chain=='s':
        bundle=item(rng.choice(['PROTEIININUUD. KUPPI KASVIS','JOGURTTI MARJAMIX 200G','PROTEIINIPATUKKA KAAKAO']),2,'kpl',rng.randint(169,269),135,rng.choice([60,80,100]))
        products.insert(rng.randrange(len(products)+1),dict(bundle,bundle=True))
    else:
        price=rng.randint(219,329);discount=rng.choice([80,100,120]);pos=rng.randrange(len(products)+1)
        products[pos:pos]=[dict(item('SUIHKUSAIPPUA SITRUUNA 250ML',1,'kpl',price,255,discount//2),offer='start'),dict(item('SUIHKUSAIPPUA ALOE 250ML',1,'kpl',price,255,discount//2),offer='end')]
    total=sum(x['net'] for x in products);assert 5000<=total<=15000
    day=rng.randint(1,10);month=rng.choice([9,10,11]);date=f'2026-{month:02d}-{day:02d}'
    transaction=f'K{900+index:03d} M{800000+index:06d}/{9000+index:04d}'
    at=f'{rng.randint(8,22):02d}:{rng.randint(0,59):02d}'
    lines=['FIKTIIVINEN TESTIKUITTI','EI OIKEA OSTOTOSITE / VAIN TESTAUKSEEN','',f'*{shop} TESTIMYYMALA*','',f'{transaction}  {day}.{month}.2026  {at}','']
    if chain=='s': lines.extend(['ASIAKASOMISTAJAN edut on huomioitu.','-'*54])
    def product_line(name,value):
        return f'*{name:<40}{money(value):>10} *' if chain=='s' else f'{name:<41}{money(value):>10}'
    for p in products:
        if p.get('bundle'):
            lines.extend([product_line(f'TASAERA 2 KPL / {money(p["net"])} EUR'.replace('TASAERA','TASAERÄ'),p['net']),f'  *{p["name"]:<45} *',f'    2 KPL  {money(p["unitPrice"])} €/KPL  {money(p["gross"])}',f'  KAMPANJA {money(-p["discount"]):>39}'])
            continue
        if p.get('offer')=='start':
            offer=sum(q['net'] for q in products if q.get('offer'));lines.append(f'PLUSSA-TASAERÄ 2 KPL/{money(offer)} EUR')
        lines.append(product_line(p['name'],p['net'] if chain=='s' else p['gross']))
        if p['quantity']!=1 or p['unit']=='kg':
            q=f'{p["quantity"]:.3f}'.replace('.',',') if p['unit']=='kg' else str(p['quantity'])
            lines.append(f'  {q} {p["unit"].upper()}    {money(p["unitPrice"])} €/{p["unit"].upper()}')
        if chain=='s' and p['discount']:
            lines.extend([f'  NORM. {money(p["gross"]):>42}',f'  KAMPANJA {money(-p["discount"]):>39}'])
        elif chain=='k' and p.get('offer')=='end':
            lines.append(f'PLUSSA-ETU {money(sum(q["discount"] for q in products if q.get("offer"))):>39}-')
        elif chain=='k' and p['discount'] and not p.get('offer'):
            lines.append(f'PLUSSA-ETU {money(p["discount"]):>39}-')
    lines.extend(['-'*54,product_line('YHTEENSÄ',total),''])
    if chain=='s':lines.append(f'BONUSTA KERRYTTÄVÄT OSTOT {money(total):>28}')
    else:lines.append(f'PLUSSA-EDUT YHTEENSÄ {money(sum(p["discount"] for p in products)):>32}')
    lines.extend(['','KORTTITAPAHTUMA','Maksutapa: TESTIMAKSU - ei oikea kortti',f'Debit/Veloitus {money(total):>30} EUR','','ALV     VEROTON       VERO       VEROLLINEN'])
    net_total=tax_total=0
    for vat in [135,255]:
        taxable=sum(p['net'] for p in products if p['vat']==vat)
        net=rounded(Decimal(taxable)/(1+Decimal(vat)/1000));tax=taxable-net
        net_total+=net;tax_total+=tax
        lines.append(f'{vat/10:.2f}%'.replace('.',',')+f' {money(net):>10} {money(tax):>10} {money(taxable):>15}')
    lines.extend([f'YHTEENSÄ {money(net_total):>10} {money(tax_total):>10} {money(total):>15}','','FIKTIIVINEN TESTIKUITTI - EI OIKEA OSTOS'])
    path=OUT/f'{slug}-{number}.pdf';render_pdf(path,lines)
    # Extract the finished PDF rather than using the planned source lines as parser input.
    with fitz.open(path) as pdf:
        pages=[{'page':i+1,'lines':page.get_text().splitlines()} for i,page in enumerate(pdf)]
    return dict(file=path.name,shop=shop,chain=chain,date=date,total=total,seed=str(seed),products=products,pages=pages)
receipts=[]
for slug,shop,chain in SHOPS:
    for number in [1,2]:receipts.append(generate(slug,shop,chain,number,len(receipts)+1))
manifest={'fictional':True,'notice':'Synteettinen aineisto; ei oikeita ostoja, henkilötietoja, maksukortteja tai kauppojen tarjouksia. Sale/K-market/K-supermarket käyttävät testissä yhteistä S/K-rakennetta; aitojen formaattien kattavuutta ei tästä päätellä.','receipts':receipts}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with (OUT/'summat.csv').open('w') as f:
    writer=csv.writer(f,delimiter=';');writer.writerow(['Tiedosto','Kauppa','Päivä','Tuoterivejä','Summa EUR'])
    for r in receipts:writer.writerow([r['file'],r['shop'],r['date'],len(r['products']),money(r['total'])])
readme=['# Fiktiiviset testikuitit','', '14 satunnaistettua PDF-kuittia, kaksi kullekin parserin tunnistamalle kauppanimelle. Kaikki ovat merkittyjä testitositteita, eivät oikeita ostoksia.','', 'Tuotteet, määrät, tarjoukset ja päivät arvotaan; jokaisen generointisiemen säilyy manifestissa. Summat lasketaan tuotteista, ei täytetä keinotekoisella tasauserällä. Painotuotteet, pantit, kassit, alennukset, tarjousryhmät, maksutapa ja ALV-erittely ovat mukana.','', 'Prisman, S-marketin, Alepan ja K-Citymarketin rakenne perustuu varmennettuihin esimerkkimuotoihin. Salen, K-marketin ja K-supermarketin fiktiiviset kuitit käyttävät yhteisen S/K-sovittimen rakennetta; ne eivät vahvista näiden aitoja formaatteja.','', 'Käyttö: Tuonti ja vienti → Kuittiskannaus → valitse PDF. Kategoriat ovat ehdotuksia ja epäselvät tuotteet luokitellaan käsin.','', '| PDF | Tuoterivejä | Yhteensä |','| --- | ---: | ---: |']
for r in receipts:readme.append(f'| [{r["file"]}]({r["file"]}) | {len(r["products"])} | {money(r["total"])} € |')
(OUT/'README.md').write_text('\n'.join(readme)+'\n')
with zipfile.ZipFile(OUT/'fiktiiviset-testikuitit.zip','w',zipfile.ZIP_DEFLATED) as z:
    for path in sorted(OUT.glob('*.pdf')):z.write(path,path.name)
    for name in ['README.md','summat.csv']:z.write(OUT/name,name)
for r in receipts:print(r['file'],len(r['products']),money(r['total']))
