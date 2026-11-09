from pathlib import Path
from decimal import Decimal
import json, shutil, os, tempfile, re
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).parent
QA=ROOT/'qa'
BROWSER=os.environ.get('TALOUS_BROWSER') or None
PROFILE=Path(tempfile.gettempdir())/'talous-e2e-profile'
ARTIFACTS=Path(tempfile.gettempdir())/'talous-e2e-artifacts'
ARTIFACTS.mkdir(exist_ok=True)
URL=os.environ.get('TALOUS_URL') or (ROOT/'index.html').as_uri()
OFFLINE=os.environ.get('TALOUS_OFFLINE','1')!='0'
LOCAL_BASE=URL.rsplit('/',1)[0]+'/' if URL.startswith(('http://127.0.0.1','http://localhost')) else ''
results=[]; errors=[]; network=[]; consoles=[]
def mark(s):
 results.append(s); print('PASS:',s,flush=True)
def attach(page):
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('request',lambda r:network.append(r.url) if not r.url.startswith(('file:','blob:','data:')) and not (LOCAL_BASE and r.url.startswith(LOCAL_BASE)) else None)
 page.on('console',lambda m:consoles.append(m.text) if m.type=='error' else None)
 page.on('dialog',lambda d:d.accept())
def nav(page,name):
 navigation=page.get_by_role('navigation')
 if not navigation.is_visible():page.locator('.mobile-menu-toggle').click()
 navigation.get_by_role('button',name=name,exact=True).click()
def state(page):return page.evaluate("JSON.parse(localStorage.getItem('taloussuunnittelu.v1')).data")
def add(page,section,button,values,selects={}):
 nav(page,section);page.get_by_role('button',name=button,exact=True).click();dlg=page.locator('dialog[open]')
 for k,v in values.items():
  if k in ('amount','purchasePrice','payment','target','monthly'):
   v=str(int(Decimal(str(v))*100))
  if k=='rate':dlg.get_by_label('Vuosikorko (%)',exact=True).fill(str(v))
  elif k=='ownership':dlg.get_by_label('Omistusosuus (%)',exact=True).fill(str(v))
  else:dlg.locator('[name="'+k+'"]').fill(str(v))
 for k,v in selects.items():dlg.locator('[name="'+k+'"]').select_option(v)
 dlg.get_by_role('button',name='Tallenna',exact=True).click();expect(dlg).not_to_be_visible()
def quick_add(page,section,button,values,repeat=False):
 nav(page,section);page.get_by_role('button',name=button,exact=True).click();dlg=page.locator('dialog[open]');expect(dlg.locator('.quick-entry-form')).to_be_visible()
 for k,v in values.items():
  if k=='amount':v=str(int(Decimal(str(v))*100))
  elif k=='date':v='.'.join(reversed(v.split('-')))
  if k=='category':dlg.locator('[name=category]').select_option(label=v)
  else:dlg.locator('[name="'+k+'"]').fill(str(v))
 dlg.locator('.quick-entry-details summary').click()
 if repeat:dlg.locator('[name=recurrence]').select_option('monthly')
 save_name='Tallenna tulo' if section=='Tulot' else 'Tallenna meno'
 dlg.get_by_role('button',name=save_name,exact=True).click();expect(dlg).not_to_be_visible()
def choose_month(page,label,value):
 page.get_by_role('button',name=re.compile(re.escape(label)+':')).click()
 page.get_by_label(label+', syötä kuukausi',exact=True).fill(value)
with sync_playwright() as p:
 if PROFILE.exists():shutil.rmtree(PROFILE)
 c=p.chromium.launch_persistent_context(str(PROFILE),executable_path=BROWSER,headless=True,offline=OFFLINE,accept_downloads=True,args=['--no-sandbox'],viewport={'width':1440,'height':1000})
 browser_version=c.browser.version if c.browser else 'Chromium'
 page=c.pages[0];attach(page);page.goto(URL,wait_until='domcontentloaded')
 expect(page.get_by_role('button',name='Aloita tyhjästä')).to_be_visible();page.get_by_role('button',name='Valitse demotalous').click();expect(page.get_by_role('heading',name='Valitse esimerkkitalous')).to_be_visible();assert page.locator('.demo-household-card').count()==4;page.get_by_role('button',name='Sulje',exact=True).click();mark('Onboarding näyttää samat neljä demoreittiä kuin kompassi');page.get_by_role('button',name='Aloita tyhjästä').click();mark('Onboarding tyhjästä paikallisessa yhden tiedoston sovelluksessa'+(' file/offline' if URL.startswith('file:') and OFFLINE else ' localhost-testipalvelimella'))
 initial=state(page);assert len([c for c in initial['categories'] if c['kind']=='incomes'])<=6 and len([c for c in initial['categories'] if c['kind']=='expenses'])<=20;nav(page,'Menot');page.get_by_role('button',name='Hallitse kategorioita').click();dialog=page.locator('dialog[open]');assert dialog.locator('.category-management-row img.category-icon').count()>0;dialog.locator('.category-optional summary').click();dialog.get_by_role('button',name=re.compile('Autoilu')).click();page.get_by_label('Oma kategoria',exact=True).fill('Lemmikinhoito');page.get_by_label('Kuvake uudelle kategorialle').select_option('pet');dialog.get_by_role('button',name='Lisää oma kategoria',exact=True).click();cats=state(page)['categories'];assert next(c for c in cats if c['name']=='Autoilu')['icon']=='car';assert next(c for c in cats if c['name']=='Lemmikinhoito')['icon']=='pet';page.get_by_role('button',name='Sulje',exact=True).click();nav(page,'Yhteenveto');mark('Rajattu aloituskategorioiden joukko, valinnaiset kategoriat ja kuvan esikatselu uuden kategorian ikonille')
 nav(page,'Raportit');page.get_by_role('button',name='Piilota ohje: Raportit ovat tutkittavia').click();expect(page.locator('.help-box')).to_have_count(0);nav(page,'Asetukset');page.get_by_role('button',name='Palauta piilotetut ohjeet (1)').click();nav(page,'Raportit');expect(page.locator('.help-box')).to_be_visible();help_details=page.locator('.help-box details');expect(help_details.locator('p')).not_to_be_visible();help_details.locator('summary').focus();help_details.locator('summary').press('Enter');expect(help_details.locator('p')).to_be_visible();help_details.locator('summary').press('Space');expect(help_details.locator('p')).not_to_be_visible();nav(page,'Yhteenveto');mark('Ohje on ensin lyhyt otsikko, avautuu näppäimistöllä ja voidaan piilottaa/palauttaa')
 page.get_by_role('button',name='Lisää tulo',exact=True).click();dlg=page.locator('dialog[open]');expect(dlg.locator('.quick-entry-form')).to_be_visible();assert dlg.locator('.quick-entry-fields [name=name]').is_visible();assert dlg.locator('.quick-entry-fields [name=amount]').is_visible();dlg.locator('[name=name]').fill('Pikatesti 1');dlg.locator('[name=amount]').fill('10000');dlg.locator('[name=category]').select_option(label='Palkka');dlg.get_by_role('button',name='Tallenna ja lisää seuraava',exact=True).click();assert any(x['name']=='Pikatesti 1' and x['amount']==10000 for x in state(page)['incomes']);expect(dlg.locator('[name=name]')).to_have_value('');expect(dlg.locator('[name=amount]')).to_have_value('');dlg.locator('[name=name]').fill('Pikatesti 2');dlg.locator('[name=amount]').fill('10500');dlg.get_by_role('button',name='Tallenna tulo',exact=True).click();assert {x['name'] for x in state(page)['incomes']}=={'Pikatesti 1','Pikatesti 2'};nav(page,'Tulot');page.get_by_role('button',name='Poista Pikatesti 1',exact=True).click();page.get_by_role('button',name='Poista Pikatesti 2',exact=True).click();assert not state(page)['incomes'];nav(page,'Yhteenveto');mark('Nopea tulokirjaus tallentaa sekä tyhjentää lomakkeen usean kirjauksen sarjassa')
 page.get_by_role('button',name='Lisää meno',exact=True).click();dlg=page.locator('dialog[open]');expect(dlg.locator('.quick-entry-form')).to_be_visible();dlg.locator('.quick-entry-details summary').click();expect(dlg.locator('[name=recurrence]')).to_be_visible();assert dlg.locator('[name=expenseType]').is_visible();dlg.locator('[name=name]').fill('Pikatoistuva');dlg.locator('[name=amount]').fill('12000');dlg.locator('[name=category]').select_option(label='Asuminen');dlg.locator('[name=recurrence]').select_option('monthly');dlg.get_by_role('button',name='Tallenna meno',exact=True).click();repeat_item=next(x for x in state(page)['expenses'] if x['name']=='Pikatoistuva');assert repeat_item['status']=='actual' and repeat_item['occurrenceStatuses']=={};nav(page,'Menot');current_row=page.get_by_role('row').filter(has_text='Pikatoistuva');expect(current_row.get_by_text('Päivämäärän mukaan toteutunut',exact=True)).to_be_visible();page.get_by_role('button',name='Muokkaa Pikatoistuva',exact=True).click();edit_dialog=page.locator('dialog[open]');expect(edit_dialog.locator('.quick-entry-form')).to_be_visible();edit_dialog.locator('.quick-entry-details summary').click();edit_dialog.locator('[name=recurrence]').select_option('weekly');edit_dialog.locator('[name=endDate]').fill('30.11.2026');edit_dialog.locator('[name=description]').fill('Ensimmäinen rivi\nToinen rivi');edit_dialog.locator('[name=tags]').fill('testi');edit_dialog.get_by_role('button',name='Tallenna',exact=True).click();edited=next(x for x in state(page)['expenses'] if x['name']=='Pikatoistuva');assert edited['id']==repeat_item['id'] and edited['recurrence']=='weekly' and edited['endDate']=='2026-11-30' and edited['description']=='Ensimmäinen rivi\nToinen rivi' and edited['tags']=='testi';page.get_by_role('button',name='Muokkaa Pikatoistuva',exact=True).click();edit_dialog=page.locator('dialog[open]');assert edit_dialog.locator('[name=recurrence]').input_value()=='weekly';assert edit_dialog.locator('[name=description]').input_value()=='Ensimmäinen rivi\nToinen rivi';page.get_by_role('button',name='Sulje',exact=True).click();page.get_by_role('button',name='Poista Pikatoistuva',exact=True).click();nav(page,'Tulot');page.get_by_role('button',name='+ Lisää tulo',exact=True).click();expect(page.locator('dialog[open] .amount-adjusters')).to_be_visible();page.get_by_role('button',name='Lisää 10 euroa summasta').click();assert page.locator('dialog [name=amount]').input_value()=='10,00';page.get_by_role('button',name='Sulje',exact=True).click();nav(page,'Menot');page.get_by_role('button',name='+ Lisää kertaluonteinen meno',exact=True).click();dlg=page.locator('dialog[open]');options=[option.inner_text() for option in dlg.locator('[name=category] option').all()];assert {'Päivittäistavara','Kosmetiikka','Hygieniatarvikkeet','Luottokorttilasku'}.issubset(set(options));page.get_by_role('button',name='Sulje',exact=True).click();quick_add(page,'Menot','+ Lisää kertaluonteinen meno',{'name':'Tuleva pikameno','amount':'12.00','date':'2026-12-05','category':'Päivittäistavara'});future=next(x for x in state(page)['expenses'] if x['name']=='Tuleva pikameno');assert future['status']=='planned' and future['occurrenceStatuses']=={};choose_month(page,'Valitse kuukausi','2026-12');nav(page,'Menot');future_row=page.get_by_role('row').filter(has_text='Tuleva pikameno');expect(future_row.get_by_text('Päivämäärän mukaan suunniteltu',exact=True)).to_be_visible();page.get_by_role('button',name='Poista Tuleva pikameno',exact=True).click();choose_month(page,'Valitse kuukausi','2026-11');mark('Päivämääräperusteinen toteuma, tulevan kirjauksen suunniteltu tila, kerta-/toistuva-valinnat ja uudet oletusmenokategoriat')
 nav(page,'Menot');page.get_by_role('button',name='+ Lisää kertaluonteinen meno',exact=True).click();expect(page.locator('dialog[open] .quick-entry-form')).to_be_visible();assert page.locator('dialog [name=category] option').count()>=18;page.get_by_role('button',name='Sulje',exact=True).click();mark('Menokategoriat ovat suoraan valittavissa nopeassa kirjauspolussa')
 nav(page,'Yhteenveto');page.get_by_role('button',name='Avaa budjetti',exact=True).click();expect(page.get_by_role('heading',name='Budjetti',exact=True)).to_be_visible();nav(page,'Yhteenveto');mark('Yhteenvedon pikatoiminnot avaavat kirjauksen ja näkymän')
 month_button=page.get_by_role('button',name=re.compile('Valitse kuukausi:'))
 month_button.click();page.get_by_label('Valitse kuukausi, syötä kuukausi',exact=True).fill('2026-11');expect(page.locator('.month-choice')).to_contain_text('marraskuu 2026')
 page.get_by_role('button',name='Edellinen kuukausi',exact=True).click();assert 'lokakuu 2026' in month_button.get_attribute('aria-label')
 page.get_by_role('button',name='Seuraava kuukausi',exact=True).click();assert 'marraskuu 2026' in month_button.get_attribute('aria-label')
 expect(page.get_by_role('button',name='Pikatoiminnot',exact=True)).to_be_visible()
 assert page.locator('.toolbar-status').count()==0
 mark('Mukautettu kuukausivalitsin, nuolisiirtymät ja kompakti yläpalkki')
 choose_month(page,'Valitse kuukausi','2026-10');nav(page,'Menot');page.get_by_role('button',name='Vahvista kuukauden menot',exact=True).click();assert '2026-10' in state(page)['coverage']['expenseMonths'];quick_add(page,'Menot','+ Lisää kertaluonteinen meno',{'name':'Kattavuustesti','amount':'42','date':'2026-10-15','category':'Ruoka'});assert '2026-10' not in state(page)['coverage']['expenseMonths'];page.get_by_role('button',name='Poista Kattavuustesti',exact=True).click();choose_month(page,'Valitse kuukausi','2026-11');mark('Vahvistettu nollakuukausi tallentuu ja uusi pikakirjaus mitätöi kuukauden kattavuuden')
 choose_month(page,'Valitse kuukausi','2026-10');nav(page,'Tulot');page.get_by_role('button',name='Vahvista kuukauden tulot',exact=True).click();choose_month(page,'Valitse kuukausi','2026-11');nav(page,'Yhteenveto');planner=page.locator('.buffer-planner');planner.locator('summary').click();estimate=page.get_by_label('Oma arvio välttämättömistä menoista kuukaudessa (€)',exact=True);estimate.fill('200000');estimate.press('Tab');assert state(page)['settings']['essentialMonthlyEstimate']==200000;expect(planner.locator('.buffer-stress-result')).to_contain_text('Tarvittava puskuri: 6 000,00 €');mark('Oma välttämättömien menojen arvio ja kolmen kuukauden tulokatkosstressi tallentuvat ja laskevat puskuriarvion')
 nav(page,'Tulot');page.get_by_role('button',name='+ Lisää tulo',exact=True).click();dlg=page.locator('dialog[open]')
 dlg.locator('[name="amount"]').fill('1250');assert dlg.locator('[name="amount"]').input_value()=='12,50'
 dlg.locator('[name="amount"]').fill('1 234,56 €');assert re.sub(r'\s+',' ',dlg.locator('[name="amount"]').input_value()).strip()=='1 234,56'
 date_button=dlg.get_by_role('button',name='Päivämäärä: avaa kalenteri',exact=True);date_button.click();expect(dlg.get_by_role('dialog',name='Päivämäärä kalenteri')).to_be_visible();dlg.get_by_role('button',name='Tänään',exact=True).click()
 dialog_style=dlg.evaluate("(el)=>({resize:getComputedStyle(el).resize,rect:el.getBoundingClientRect().toJSON()})");assert dialog_style['resize']=='both';assert abs(dialog_style['rect']['x']+dialog_style['rect']['width']/2-720)<2
 dlg.get_by_role('button',name='Sulje',exact=True).click();mark('Suomalainen summamaski, mukautettu päivämäärävalitsin sekä keskitetty ja resizable ikkuna')
 quick_add(page,'Tulot','+ Lisää toistuva tulo',{'name':'Testipalkka','amount':'3000','date':'2026-11-02','category':'Palkka'},repeat=True);assert state(page)['incomes'][0]['adjustToPreviousBankDay'] is True
 mark('Tulo lisätty')
 quick_add(page,'Menot','+ Lisää toistuva lasku',{'name':'Testivuokra','amount':'1000','date':'2026-11-01','category':'Asuminen'},repeat=True)
 mark('Toistuva meno lisätty')
 expand=page.locator('.row-expand')
 expand.focus();expand.press('Enter');expect(expand).to_have_attribute('aria-expanded','true');expect(page.locator('#'+expand.get_attribute('aria-controls'))).to_be_visible();expand.press('Space');expect(expand).to_have_attribute('aria-expanded','false');mark('Tapahtuman lisätiedot avautuvat näppäimistöllä ja aria-controls kohdistuu sisältöön')
 choose_month(page,'Valitse kuukausi','2026-12');nav(page,'Menot');expand=page.locator('.row-expand');expand.click();amount_override=page.get_by_label('Testivuokra 2026-12-01 tapahtuman summa euroina',exact=True);amount_override.fill('101000');amount_override.press('Tab');assert state(page)['expenses'][0]['occurrenceAmounts']=={'2026-12-01':101000};page.get_by_label('Testivuokra 2026-12-01 tila',exact=True).select_option('actual');assert state(page)['expenses'][0]['occurrenceStatuses']=={'2026-12-01':'actual'};page.get_by_label('Testivuokra 2026-12-01 tila',exact=True).select_option('auto');assert state(page)['expenses'][0]['occurrenceStatuses']=={};page.get_by_label('Testivuokra 2026-12-01 tila',exact=True).select_option('actual');assert state(page)['expenses'][0]['occurrenceStatuses']=={'2026-12-01':'actual'};assert state(page)['expenses'][0]['status']=='actual';expand.click();nav(page,'Yhteenveto');expect(page.get_by_text('1 010,00 €',exact=True).first).to_be_visible();nav(page,'Menot');choose_month(page,'Valitse kuukausi','2026-11');mark('Toistuvan tapahtuman tila voidaan korjata yhdelle esiintymälle ja palauttaa päiväautomatiikkaan')
 page.get_by_role('button',name='Muokkaa Testivuokra',exact=True).click();expect(page.locator('dialog[open] .quick-entry-form')).to_be_visible();assert page.locator('dialog [name=recurrence]').input_value()=='monthly';assert page.locator('dialog [name=recurrence] option').count()==8;page.locator('dialog [name=amount]').fill('90000');page.locator('dialog').get_by_role('button',name='Tallenna',exact=True).click();assert state(page)['expenses'][0]['amount']==90000;assert state(page)['expenses'][0]['occurrenceAmounts']=={'2026-12-01':101000};mark('Menon muokkaus säilyttää valitun kuukauden summapoikkeuksen')
 nav(page,'Budjetti');expect(page.locator('.summary-strip')).to_contain_text('Budjettien erotus');expect(page.locator('.summary-strip')).to_contain_text('Kulutus ilman budjettia');page.get_by_label('Asuminen budjetti euroina').fill('50000');page.get_by_label('Asuminen budjetti euroina').press('Tab');assert state(page)['budgets']['2026-11']['Asuminen']==50000;page.get_by_role('button',name='Lisää meno kategoriaan Asuminen',exact=True).click();expect(page.locator('dialog[open] .quick-entry-form')).to_be_visible();assert page.locator('dialog[open] [name=category]').input_value()=='Asuminen';page.get_by_role('button',name='Sulje',exact=True).click();mark('Budjetista alkava kirjaus esivalitsee oikean kulukategorian')
 budget_icon=page.locator('.budget-category-title .category-icon-frame').first;icon_size=budget_icon.bounding_box();assert abs(icon_size['width']-32)<1 and abs(icon_size['height']-32)<1;image_size=budget_icon.locator('img').bounding_box();assert image_size['width']>=20 and image_size['height']>=20;add_button=page.get_by_role('button',name='Lisää meno kategoriaan Asuminen',exact=True);assert add_button.inner_text().strip()=='';assert add_button.bounding_box()['width']>=44
 page.get_by_role('button',name='Näytä kategorian Asuminen menot',exact=True).click();category_dialog=page.locator('dialog[open]');expect(category_dialog.locator('.budget-event-list')).to_contain_text('Testivuokra');expect(category_dialog.locator('.budget-event-list')).to_contain_text('900,00');category_dialog.get_by_role('button',name='Toistuva meno',exact=True).click();expect(page.locator('dialog[open] .quick-entry-form')).to_be_visible();assert page.locator('dialog[open] [name=category]').input_value()=='Asuminen';assert page.locator('dialog[open] [name=recurrence]').input_value()=='monthly';page.get_by_role('button',name='Sulje',exact=True).click();mark('Budjettikategorian menokortti näyttää kuukauden kirjaukset ja avaa esitäytetyn toistuvan menon')
 page.get_by_role('button',name='Näytä kategorian Asuminen menot',exact=True).click();page.locator('dialog[open] .budget-actual-adjustment summary').click();page.get_by_label('Asuminen toteuma euroina').fill('100000');page.get_by_label('Asuminen toteuma euroina').press('Tab');assert state(page)['budgetActuals']['2026-11']['Asuminen']==100000;page.get_by_role('button',name='Sulje',exact=True).click();assert page.get_by_label('Asuminen toteuma euroina',exact=True).count()==0;mark('Kokonaistoteuman korjaus on vain kategoriakortin lisävalinta, ei rinnakkainen perussyöttö')
 guidance=page.get_by_role('region',name='Budjetin raamit',exact=True);expect(guidance.locator('.ux-explanation p')).not_to_be_visible();guidance.locator('.ux-explanation summary').click();expect(guidance.locator('.ux-explanation p')).to_be_visible();guidance.locator('.ux-explanation summary').click();expect(guidance.locator('.budget-rule-card.saving')).to_contain_text('tavoitteesta puuttuu');expect(guidance.locator('.budget-rule-alerts')).to_contain_text('Asuminen');guidance.locator('.budget-rule-settings > summary').click();editor=guidance.locator('.budget-policy-editor').filter(has_text='Asuminen').first;editor.locator('summary').click();editor.locator('select').select_option('wants');editor.get_by_label('Asuminen, enimmäisosuus nettotuloista (%)',exact=True).fill('40');editor.get_by_role('button',name='Tallenna kategorian Asuminen ohje',exact=True).click();expect(guidance.locator('.budget-rule-alerts')).not_to_contain_text('Asuminen');assert next(iter(state(page)['settings']['budgetGuidance']['categories'].values()))=={'group':'wants','maxPercent':40};editor=guidance.locator('.budget-policy-editor').filter(has_text='Asuminen').first;editor.locator('summary').click();editor.locator('select').select_option('needs');editor.get_by_label('Asuminen, enimmäisosuus nettotuloista (%)',exact=True).fill('30');editor.get_by_role('button',name='Tallenna kategorian Asuminen ohje',exact=True).click();expect(guidance.locator('.budget-rule-alerts')).to_contain_text('Asuminen');guidance.get_by_label('Valinnaiset, tavoite (%)',exact=True).fill('40');guidance.get_by_role('button',name='Tallenna ryhmien osuudet',exact=True).click();expect(guidance.get_by_role('alert')).to_contain_text('100 %');guidance.get_by_label('Valinnaiset, tavoite (%)',exact=True).fill('30');guidance.get_by_role('button',name='Tallenna ryhmien osuudet',exact=True).click();guidance.locator('.budget-rule-settings > summary').click();nav(page,'Tulot');expect(page.get_by_role('region',name='Budjetin raamit',exact=True)).to_be_visible();assert page.locator('.budget-rule-grid').count()==0;page.get_by_role('button',name='Tarkista budjetissa',exact=True).click();expect(page.get_by_role('heading',name='Budjetti',exact=True)).to_be_visible();nav(page,'Menot');expect(page.get_by_role('region',name='Budjetin raamit',exact=True)).to_be_visible();assert page.locator('.budget-rule-settings').count()==0;mark('50/30/20 näkyy budjetissa, tuloissa ja menoissa; kategoriarajaa ja ryhmää voi muuttaa, ja virheellinen prosenttijako estetään')
 nav(page,'Omaisuus');page.get_by_role('button',name='+ Lisää omaisuuserä',exact=True).click();dlg=page.locator('dialog[open]');slider=dlg.get_by_role('slider',name='Omistusosuus (%), säädin');percent_input=dlg.get_by_label('Omistusosuus (%)',exact=True);slider.press('Home');slider.press('ArrowRight');assert percent_input.input_value()=='0,1'
 bounds=slider.bounding_box();x=bounds['x']+bounds['width']*.4;y=bounds['y']+bounds['height']/2
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+20,y);page.mouse.up();fast=float(percent_input.input_value().replace(',','.'));assert fast>44
 page.mouse.move(x,y);page.mouse.down();page.mouse.move(x+20,y-10);page.mouse.up();fine=float(percent_input.input_value().replace(',','.'));assert 40<fine<41
 dlg.get_by_role('button',name='Sulje',exact=True).click();mark('Prosenttisäädin: nuolinäppäimet, nopea vaakaveto ja tarkka viistoveto')
 add(page,'Omaisuus','+ Lisää omaisuuserä',{'name':'Testitili','amount':'6000','category':'Talletukset'})
 linked_asset_id=state(page)['assets'][0]['id']
 add(page,'Velat','+ Lisää velka',{'name':'Testivelka','amount':'2000','rate':'0','payment':'100'},{'linkedAssetId':linked_asset_id})
 add(page,'Sijoitukset','+ Lisää sijoitus',{'name':'Testirahasto','amount':'100','quantity':'2','purchasePrice':'80'})
 add(page,'Tavoitteet','+ Lisää tavoite',{'name':'Testitavoite','amount':'500','target':'1000','monthly':'100'})
 mark('Omaisuus, velka, sijoitus ja tavoite lisätty')
 nav(page,'Yhteenveto');assert '2\u00a0100,00' in page.locator('.hero-value').inner_text();assert '4\u00a0200,00' in page.locator('main').inner_text();mark('Kassavirta 2100 EUR ja nettovarallisuus 4200 EUR')
 nav(page,'Menot');page.get_by_role('button',name='Hallitse kategorioita').click();page.get_by_label('Kategorian Asuminen nimi',exact=True).fill('Koti');page.get_by_label('Kategorian Asuminen nimi',exact=True).press('Tab');assert state(page)['expenses'][0]['category']=='Koti';assert state(page)['budgets']['2026-11']['Koti']==50000;assert state(page)['budgetActuals']['2026-11']['Koti']==100000;assert 'Asuminen' not in state(page)['budgetActuals']['2026-11'];page.locator('dialog[open]').get_by_role('button',name='Sulje',exact=True).click();mark('Kategorian nimeäminen päivittää menot, budjetit ja käsin syötetyt toteumat')
 nav(page,'Asetukset');page.get_by_label('Teema',exact=True).select_option('custom');color_input=page.locator('input[type="color"]');color_input.evaluate("el=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'#f4c95d');el.dispatchEvent(new Event('input',{bubbles:true}))}");accent_text=page.locator('html').evaluate("el=>getComputedStyle(el).getPropertyValue('--custom-on').trim()");assert accent_text=='#101a15',f'Vaalea korostusväri ei valinnut tummaa tekstikontrastia: {accent_text}';page.get_by_label('Teema',exact=True).select_option('blue');page.get_by_label('Väritila',exact=True).select_option('system');page.emulate_media(color_scheme='light');expect(page.locator('html')).to_have_attribute('data-mode','light');page.emulate_media(color_scheme='dark');expect(page.locator('html')).to_have_attribute('data-mode','dark');page.get_by_label('Väritila',exact=True).select_option('dark');assert page.locator('html').get_attribute('data-mode')=='dark';mark('Teemojen vahva kontrasti, mukautetun värin kontrastiteksti ja tumma tila')
 page.get_by_role('button',name='Piilota summat',exact=True).click();nav(page,'Yhteenveto');assert page.locator('.hero-value').inner_text()=='•••••• €';page.get_by_role('button',name='Näytä summat',exact=True).click();mark('Summien piilotus')
 page.keyboard.press('Control+k');expect(page.get_by_role('heading',name='Pikakirjaus ja haku')).to_be_visible();page.keyboard.press('Escape');expect(page.get_by_role('heading',name='Pikakirjaus ja haku')).not_to_be_visible();mark('Ctrl K ja Escape näppäimistöpolku')
 nav(page,'Skenaariot')
 installment=page.locator('.debt-installment-estimate').filter(has_text='Testivelka');expect(installment).to_contain_text('korkoa 0,00 €');expect(installment).to_contain_text('pääoman muutos 100,00 €');expect(installment).to_contain_text('Arvioitu saldo erän jälkeen 1 900,00 €');mark('Velkaerän arvio erottaa koron, pääoman lyhennyksen ja jäljelle jäävän saldon')
 for i in range(3):
  page.get_by_label('Nimi',exact=True).fill('Vertailu '+str(i+1));page.get_by_role('button',name='Tallenna vertailuun',exact=True).click()
 assert len(state(page)['scenarios'])==3;mark('Kolmen skenaarion tallennus')
 nav(page,'Raportit')
 expect(page.get_by_role('table')).to_be_visible()
 assert '70 %' in page.locator('.report-saving-rate').inner_text()
 assert '2\u00a0100,00' in page.locator('.report-kpi.cash').inner_text()
 assert page.locator('.report-period-mode button[aria-pressed="true"]').inner_text()=='Kuukausi';expect(page.get_by_role('button',name=re.compile('Raportointikuukausi:'))).to_be_visible()
 page.get_by_role('button',name='Aikaväli',exact=True).click()
 choose_month(page,'Raportin alkukuukausi','2026-11')
 choose_month(page,'Raportin loppukuukausi','2026-11')
 expect(page.locator('.report-period-summary')).to_contain_text('marraskuu 2026')
 assert '2\u00a0100,00' in page.locator('.report-kpi.cash').inner_text()
 page.get_by_role('button',name='Siirrä aikaväliä kuukausi taaksepäin',exact=True).click()
 expect(page.locator('.report-range-heading')).to_contain_text('lokakuu 2026')
 page.get_by_role('button',name='Siirrä aikaväliä kuukausi eteenpäin',exact=True).click()
 choose_month(page,'Raportin alkukuukausi','2010-01')
 expect(page.locator('.report-panel [role=alert]')).to_contain_text('120 kuukautta')
 choose_month(page,'Raportin alkukuukausi','2017-01')
 expect(page.locator('.chart-scroll')).to_be_visible()
 assert page.locator('.chart-scroll').evaluate('(el) => el.scrollWidth > el.clientWidth')
 page.get_by_label('Raportin esitysmuoto').select_option('area');expect(page.locator('.area-chart')).to_be_visible();page.get_by_role('button',name='Suurenna kaaviota').click();expect(page.get_by_label('Kaavion suurennusprosentti')).to_have_value('1.1');page.get_by_role('button',name='Palauta kaavion oletuskoko').click();mark('Raportin ajanjakso, aluekaavio ja zoomaus')
 page.locator('.report-kpi.income').click()
 expect(page.locator('.report-detail')).to_contain_text('Testipalkka')
 detail_colors=page.locator('.report-detail').evaluate('(el)=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})');assert detail_colors=={'background':'rgb(23, 36, 30)','color':'rgb(255, 255, 255)'},f'Tumman tietokortin teksti ja pinta eivät täsmää: {detail_colors}'
 page.get_by_role('button',name='Sulje raportin tietokortti').click()
 page.locator('.report-kpi.cash').click()
 expect(page.locator('.report-detail')).to_contain_text('Testivuokra')
 expect(page.locator('.report-detail')).to_contain_text('Testipalkka')
 assert '2\u00a0100,00' in page.locator('.report-detail > p strong').inner_text()
 mark('Oma aikaväli, jakson KPI-kooste ja nettokassavirran tietokortti')
 overview_tab=page.get_by_role('tab',name='Tulot ja menot');overview_tab.press('ArrowRight');category_tab=page.get_by_role('tab',name='Kulurakenne');expect(category_tab).to_have_attribute('aria-selected','true');expect(page.get_by_role('tabpanel')).to_be_visible();category_tab.press('ArrowRight');flow_tab=page.get_by_role('tab',name='Rahavirran ajoitus');expect(flow_tab).to_have_attribute('aria-selected','true');flow_tab.press('Home');expect(overview_tab).to_have_attribute('aria-selected','true');overview_tab.press('End');fire_tab=page.get_by_role('tab',name='Säästöaste ja FIRE');expect(fire_tab).to_have_attribute('aria-selected','true');mark('Raporttivälilehtien nuoli-, Home- ja End-näppäimet')
 page.get_by_role('tab',name='Kulurakenne').click();page.get_by_label('Raportin esitysmuoto').select_option('pie');expect(page.locator('.pie-legend')).to_be_visible();page.locator('.pie-legend button').first.click();expect(page.locator('.report-detail')).to_contain_text('Testivuokra');mark('Kuluraportin luokka avaa tapahtumakohtaisen tietokortin')
 page.locator('.pie-slice').first.press('Enter');expect(page.locator('.report-detail')).to_be_visible();mark('Piirakkasektori toimii näppäimistöllä')
 page.get_by_role('tab',name='Rahavirran ajoitus').click();page.locator('.flow-day').first.click();expect(page.locator('.report-detail')).to_contain_text('Testivuokra');mark('Rahavirtapäivä avaa oikean tietokortin')
 page.get_by_role('tab',name='Tulot ja menot').click();page.get_by_label('Raportin esitysmuoto').select_option('bars');page.locator('.chart-mark.expense-bar').last.click();expect(page.locator('.report-detail')).to_contain_text('Testivuokra');mark('Kuukausipylväs avaa oikean tietokortin')
 page.get_by_role('tab',name='Budjetti',exact=True).click();page.get_by_label('Raportin esitysmuoto').select_option('table');expect(page.locator('#report-panel-budget')).to_contain_text('Budjetti ja toteutuneet menot');expect(page.locator('#report-panel-budget')).to_contain_text('Budjetoimattomat kulut');expect(page.locator('#report-panel-budget')).to_contain_text('Toteuma budjetoiduissa kategorioissa');assert '1 000,00 €' in page.locator('#report-panel-budget').inner_text().replace('\u00a0',' ');tools=page.locator('.report-table-controls');tools.locator('input[type=search]').fill('ei-osumaa');expect(tools.locator('small')).to_contain_text('0 / 1');expect(page.locator('#report-panel-budget tbody')).to_contain_text('Suodattimella ei löytynyt');tools.locator('select').select_option('difference-asc');tools.locator('input[type=search]').fill('2026-11');expect(tools.locator('small')).to_contain_text('1 / 1');page.locator('#report-panel-budget').get_by_role('button',name='2026-11',exact=True).click();expect(page.locator('.report-detail')).to_contain_text('Käsin syötetty toteuma korvaa kirjaukset');page.get_by_role('button',name='Sulje raportin tietokortti').click();mark('Raporttitaulukon haku, suodatus, lajittelu ja budjettitietokortti')
 page.get_by_role('tab',name='Varallisuus',exact=True).click();expect(page.locator('#report-panel-wealth')).to_contain_text('Nykyinen varallisuuskuva');expect(page.locator('#report-panel-wealth')).to_contain_text('4 200,00');expect(page.locator('.report-snapshot-context')).to_contain_text('NYKYTILANNE');assert page.locator('.report-range-control').count()==0;mark('Varallisuusraportti erottaa nykytilannekuvan aikavälillä seurattavista raporteista')
 page.get_by_role('tab',name='Velat ja oma pääoma',exact=True).click();expect(page.locator('#report-panel-debt')).to_contain_text('Oma pääoma velkojen maksun jälkeen');expect(page.locator('#report-panel-debt')).to_contain_text('4 000,00');mark('Velkaraportti laskee linkitetyn omaisuuserän nykyisen ja arvioidun pääoman')
 page.get_by_role('tab',name='Säästöaste ja FIRE',exact=True).click();expect(page.locator('#report-panel-fire')).to_contain_text('Arvioitu sijoitusvarallisuuden tavoite');expect(page.locator('#report-panel-fire')).to_contain_text('Säästöaste');mark('FIRE-raportti näyttää säästöasteen ja oletetun pääomatavoitteen')
 nav(page,'Talouden kompassi');expect(page.get_by_role('heading',name='Seuraava hyvä askel')).to_be_visible();assert page.locator('.compass-task').count()>0;active_task_title=page.locator('.compass-task').first.locator('h3').inner_text();reason_details=page.locator('.compass-task').first.locator('.compass-research-details');expect(reason_details.locator('p').first).not_to_be_visible();reason_details.locator('summary').click();expect(reason_details.locator('p').first).to_be_visible();reason_details.locator('summary').click();assert page.locator('.compass-scenario-choice').count()==4;page.locator('.compass-scenario-choice').nth(3).click();expect(page.locator('.compass-story')).to_contain_text('Toisen palkka ja lapsilisä jatkuvat');expect(page.locator('.compass-demo-guidance')).to_contain_text('Kompassi nostaa esiin');assert page.locator('.compass-demo-tip-grid .compass-research-details').count()>0;page.locator('.compass-demo-tip-grid .compass-research-details summary').first.click();assert page.locator('.compass-demo-tip-grid .compass-research-details').first.locator('li strong').count()>0;mark('Kompassin neljä fiktiivistä tarinareittiä, kassavirtavisualisointi ja lähteistetyt vinkit')
 compass_filters=page.get_by_role('group',name='Rajaa kompassin askelia aiheittain')
 assert compass_filters.get_by_role('button').count()==5
 compass_filters.get_by_role('button',name=re.compile('Kassavirta')).click()
 expect(compass_filters.get_by_role('button',name=re.compile('Kassavirta'))).to_have_attribute('aria-pressed','true')
 assert page.locator('.compass-task').count()>0
 compass_filters.get_by_role('button',name=re.compile('Menot')).click()
 expect(compass_filters.get_by_role('button',name=re.compile('Menot'))).to_have_attribute('aria-pressed','true')
 compass_filters.get_by_role('button',name='Kaikki askeleet').click()
 mark('Kompassin askeleet ryhmittyvät kassavirtaan, menoihin, turvaan/velkoihin ja tavoitteisiin')
 page.get_by_role('button',name='Piilota summat',exact=True).click();expect(page.locator('.compass-task').first.locator('small')).to_contain_text('Summat piilotettu');assert '€' not in page.locator('.compass-task').first.locator('small').inner_text();page.get_by_role('button',name='Näytä summat',exact=True).click()
 blocked_action=page.locator('.compass-task').first
 blocked_title=blocked_action.locator('h3').inner_text()
 blocked_action.get_by_role('button',name=re.compile('Ei onnistu nyt')).click()
 expect(page.locator('.compass-task').filter(has_text=blocked_title)).to_have_count(0)
 page.get_by_role('button',name=re.compile('Näytä siirretyt ja valmiit')).click()
 expect(page.locator('.compass-parked')).to_contain_text('Ei mahdollista juuri nyt')
 expect(page.locator('.compass-parked')).to_contain_text(blocked_title)
 page.get_by_role('button',name='Palauta kompassiin').click()
 expect(page.locator('.compass-task').filter(has_text=blocked_title)).to_be_visible()
 page.locator('.compass-task').filter(has_text=active_task_title).get_by_role('button',name=re.compile('Ei onnistu nyt')).click()
 expect(page.locator('.compass-task').filter(has_text=active_task_title)).to_have_count(0)
 page.get_by_role('button',name='Päivitä Talouden kompassin tilanne',exact=True).click()
 expect(page.locator('.compass-task').filter(has_text=active_task_title)).to_be_visible()
 page.locator('.compass-task').filter(has_text=active_task_title).get_by_role('button',name='Merkitse tehdyksi').click()
 expect(page.locator('.compass-task').filter(has_text=active_task_title)).to_have_count(0)
 page.get_by_role('button',name='Päivitä Talouden kompassin tilanne',exact=True).click()
 expect(page.locator('.compass-task').filter(has_text=active_task_title)).to_be_visible()
 expect(page.locator('.compass-refresh-caption')).to_contain_text('aiemmin kuitattua tai siirrettyä askelta arvioitiin uudelleen')
 mark('Kompassin ehdotus voidaan kuitata, siirtää myöhemmäksi ja arvioida käsin uudelleen')
 for width in (320,375,390,600,760,768):
  page.set_viewport_size({'width':width,'height':900})
  for section in ('Yhteenveto','Budjetti','Menot','Skenaariot','Raportit','Talouden kompassi','Tuonti ja vienti'):
   nav(page,section)
   overflow,offenders=page.evaluate("""() => {
    const width=window.innerWidth;
    const nodes=[...document.querySelectorAll('body *')].map((el)=>{
     const r=el.getBoundingClientRect();
     return {tag:el.tagName,cls:typeof el.className==='string'?el.className:'',right:Math.round(r.right),width:Math.round(r.width)};
    }).filter((el)=>el.width>0&&(el.right>width+1||el.right<0)).slice(0,12);
    return [document.documentElement.scrollWidth-width,nodes];
   }""")
   assert overflow<=1,f'{section} aiheuttaa {overflow}px sivuttaisylivuodon {width}px leveydellä: {offenders}'
   escaped=page.locator('.table-wrap').evaluate_all('(els)=>els.some((el)=>el.getBoundingClientRect().right>innerWidth+1)')
   assert not escaped,f'{section} taulukkosäiliö ylittää näytön {width}px leveydellä'
   if width<=600 and section in ('Budjetti','Menot','Skenaariot','Raportit'):
    if section=='Raportit':page.get_by_label('Raportin esitysmuoto').select_option('table')
    display=page.locator('.mobile-card-table tbody tr:not([hidden]),.mobile-entry-table tbody tr:not(.expanded-row)').first.evaluate('(el)=>getComputedStyle(el).display')
    assert display=='grid',f'{section} ei tiivistynyt tietokorteiksi {width}px leveydellä'
   if width==390 and section=='Raportit':
    colors=page.locator('.report-panel').first.evaluate('(el)=>({background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el).color})')
    assert colors=={'background':'rgb(23, 36, 30)','color':'rgb(255, 255, 255)'},f'Tumman raporttipaneelin kontrastivärit poikkeavat teemasta: {colors}'
    mark('Tummassa teemassa raporttikortit käyttävät tummaa pintaa ja valkoista tekstiä')
   if width==390 and section=='Budjetti':page.screenshot(path=str(Path(tempfile.gettempdir())/'oljenkorsi-mobile-budget.png'),full_page=True)
   if width==390 and section=='Raportit':page.screenshot(path=str(Path(tempfile.gettempdir())/'oljenkorsi-mobile-report.png'),full_page=True)
 mark('Mobiilileveydet 320–768 px: sivu ja taulukkosäiliöt eivät ylitä näkymää')
 page.set_viewport_size({'width':1440,'height':1000})
 nav(page,'Yhteenveto');page.screenshot(path=str(ARTIFACTS/'dashboard.png'),full_page=True)
 saved=state(page);c.close()
 c=p.chromium.launch_persistent_context(str(PROFILE),executable_path=BROWSER,headless=True,offline=OFFLINE,accept_downloads=True,args=['--no-sandbox'])
 page=c.pages[0];attach(page);page.goto(URL,wait_until='domcontentloaded');assert state(page)==saved;mark('Selainprosessi suljettu ja uudelleenavattu: data säilyi')
 nav(page,'Asetukset');page.get_by_role('button',name='Varmuuskopiot, tuonti ja vienti',exact=True).click();expect(page.get_by_role('heading',name='Tuonti ja vienti',exact=True)).to_be_visible()
 with page.expect_download() as d:page.get_by_role('button',name='Vie varmuuskopio',exact=True).first.click()
 bfile=ARTIFACTS/'backup.json';d.value.save_as(str(bfile));assert json.loads(bfile.read_text())['data']==saved;mark('JSON backup ladattu ja sisältö tarkistettu')
 nav(page,'Tuonti ja vienti')
 with page.expect_download() as d:page.get_by_role('button',name='Vie menot CSV:nä',exact=True).click()
 d.value.save_as(str(ARTIFACTS/'expenses.csv'));assert 'Testivuokra' in (ARTIFACTS/'expenses.csv').read_text();mark('CSV vienti')
 missing_date_csv=ARTIFACTS/'missing-date.csv';missing_date_csv.write_text('Nimi;Summa\nPuuttuva päivä;19,99\n',encoding='utf-8')
 page.get_by_label('Valitse CSV',exact=True).set_input_files(str(missing_date_csv));expect(page.get_by_text('Rivi 2: Päivämääräsarake puuttuu.')).to_be_visible();assert page.get_by_role('button',name=re.compile('Vahvista ja tuo')).is_disabled();mark('CSV-tuonti estää päivämäärättömän tapahtuman hiljaisen sijoittamisen tälle päivälle')
 csv=ARTIFACTS/'import.csv';csv.write_text('Kirjauspäivä;Saaja/maksaja;Määrä;Luokka\n3.11.2026;CSV ruoka;-19,99;Ruoka\n3.11.2026;CSV ruoka;-19,99;Ruoka\n1.11.2026;Palkka;1500,00;Palkka\n3.11.2026;Virhe;NaN;Ruoka\n',encoding='utf-8')
 page.get_by_label('Valitse CSV',exact=True).set_input_files(str(csv));expect(page.locator('.csv-primary-mapping [aria-label="Nimi"]')).to_have_value('1');expect(page.locator('.csv-primary-mapping [aria-label="Summa (€)"]')).to_have_value('2');expect(page.locator('.csv-primary-mapping [aria-label="Kategoria"]')).to_have_value('3');expect(page.locator('.csv-primary-mapping [aria-label="Päivä"]')).to_have_value('0');assert not page.locator('.csv-advanced-mapping').evaluate('(el)=>el.open');expect(page.get_by_text('Rivi 4: Positiivinen pankkitapahtuma näyttää tulolta. Tuo se Tulot-näkymässä tai suodata CSV.')).to_be_visible();page.get_by_label('Ohita virheelliset rivit',exact=False).check();page.get_by_role('button',name='Vahvista ja tuo 1 tietuetta',exact=True).click();imported=next(x for x in state(page)['expenses'] if x['name']=='CSV ruoka');assert imported['amount']==1999 and imported['date']=='2026-11-03';assert len(state(page)['expenses'])==2;mark('CSV:n suomalaiset otsikot ja pankin summien etumerkit käsitellään turvallisesti; perustiedot näkyvät ja lisäkentät pysyvät suljettuina')
 page.get_by_role('button',name='Kumoa',exact=True).click();assert len(state(page)['expenses'])==1;mark('CSV tuonnin kumoaminen')
 nav(page,'Menot');page.get_by_role('button',name='Poista Testivuokra',exact=True).click();assert not state(page)['expenses'];page.get_by_role('button',name='Kumoa',exact=True).click();assert len(state(page)['expenses'])==1;mark('Tietueen poisto ja kumoaminen')
 nav(page,'Asetukset');page.get_by_role('button',name='Poista kaikki tietoni',exact=True).click();page.get_by_label('Kirjoita POISTA',exact=True).fill('POISTA');page.get_by_role('button',name='Poista pysyvästi',exact=True).click();assert page.evaluate("localStorage.getItem('taloussuunnittelu.v1')") is None;mark('Kaiken datan poisto ja tarkistus')
 page.locator('dialog[open] input[type=file]').set_input_files(str(bfile));expect(page.get_by_role('heading',name='Vahvista varmuuskopion palautus')).to_be_visible();page.get_by_role('button',name='Korvaa ja palauta',exact=True).click();assert state(page)==saved;mark('JSON restore onboardingista: kaikki tiedot palautettu')
 bad=ARTIFACTS/'bad.json';bad.write_text('{"schemaVersion":999}');nav(page,'Tuonti ja vienti');page.get_by_label('Palauta varmuuskopio',exact=True).set_input_files(str(bad));expect(page.locator('.alert[role="status"]')).to_contain_text('Palautus hylätty');assert state(page)==saved;mark('Väärä varmuuskopio hylätty ilman datan muutosta')
 nav(page,'Asetukset');assert page.locator('.demo-household-card').count()==4;demo_labels=['Haastava','Keskiverto','Hyvä eteneminen','Äkillinen kriisi']
 for label in demo_labels:
  page.get_by_role('button',name='Lataa esimerkkitalous: '+label,exact=True).click();sample=state(page);assert sample['settings']['demo'];month=sample['settings']['month'];current_income=[x for x in sample['incomes'] if x['date'].startswith(month)];current_names=[x['name'] for x in current_income];assert 'Aikuisen 2 nettopalkka' in current_names and 'Lapsilisä' in current_names;assert any(x['category']=='Lapset ja perhe' for x in sample['expenses']);assert len(sample['assets'])>0 and len(sample['liabilities'])>0 and len(sample['investments'])==1;assert len(sample['goals'])>0 and len(sample['scenarios'])>0;assert len(sample['budgets'])==24 and '2025-01' in sample['budgets'] and '2026-12' in sample['budgets'];assert {x['date'][:7] for x in sample['incomes']}==set(sample['budgets']);assert {x['date'][:7] for x in sample['expenses']}==set(sample['budgets'])
  if label=='Äkillinen kriisi':assert 'Aikuisen 1 nettopalkka' not in current_names
  else:assert 'Aikuisen 1 nettopalkka' in current_names
  mark('Kompassin demotalous ladattavissa koko sovellukseen: '+label)
  if label!=demo_labels[-1]:nav(page,'Asetukset')
 nav(page,'Talouden kompassi');expect(page.locator('.compass-story')).to_contain_text('Toisen palkka ja lapsilisä jatkuvat');income_text=page.locator('.compass-story-metrics > div').nth(0).locator('strong').inner_text();expected_demo_income=sum(x['amount'] for x in state(page)['incomes'] if x['date'].startswith(state(page)['settings']['month']));assert f'{expected_demo_income/100:,.2f}'.replace(',',' ').replace('.',',') in re.sub(r'\s+',' ',income_text),income_text;page.locator('.compass-demo-load').get_by_role('button',name='Lataa demotalous').click();loaded_demo=state(page);loaded_month=loaded_demo['settings']['month'];loaded_income=sum(x['amount'] for x in loaded_demo['incomes'] if x['date'].startswith(loaded_month));assert loaded_income==expected_demo_income;assert len([x for x in loaded_demo['incomes'] if x['date'].startswith(loaded_month)])==2;mark('Kompassista ladataan sama valittu kriisitalous ja sen kuukausisummat')
 nav(page,'Talouden kompassi');assert page.locator('.compass-story-period').count()==24
 for section in ('Tulot','Menot','Budjetti','Omaisuus','Velat','Sijoitukset','Tavoitteet','Skenaariot'):
  nav(page,section);expect(page.get_by_role('heading',name=section,exact=True)).to_be_visible();assert page.locator('main table tbody tr').count()>0,section+' jäi tyhjäksi demossa'
 nav(page,'Raportit');expect(page.locator('.report-panel')).to_be_visible();mark('Kahden vuoden demo täyttää kaikki tietonäkymät ja kompassissa on 24 kuukausipylvästä')
 c.close()
assert not errors,errors
assert not network,network
assert not consoles,consoles
mark('Ei JavaScript-virheitä, console-virheitä tai verkkopyyntöjä')
(QA/'e2e-results.json').write_text(json.dumps({'browser':browser_version,'offline':OFFLINE,'protocol':'file://' if URL.startswith('file:') else 'localhost HTTP','passed':results,'pageErrors':errors,'consoleErrors':consoles,'networkRequests':network,'notes':'Linux headless persistent profile; localhost-ajossa sama valmis yhden HTML-tiedoston sovellus ilman ulkoisia pyyntöjä.'},ensure_ascii=False,indent=2))
