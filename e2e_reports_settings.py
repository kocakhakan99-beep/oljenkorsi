from playwright.sync_api import sync_playwright, expect
import json
import os
from pathlib import Path
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from threading import Thread

class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self, *_args):
  pass

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(Path(__file__).resolve().parent)))
Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER', '/usr/bin/chromium'),args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':900},accept_downloads=True)
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.on('dialog',lambda d:d.accept())
 page.goto(f'http://127.0.0.1:{server.server_port}')
 page.get_by_role('button',name='Jatka vieraana',exact=True).click()
 def navigate(label):
  button=page.locator('#main-navigation').get_by_role('button',name=label,exact=True)
  if not button.is_visible():page.locator('.mobile-menu-toggle').click()
  button.click()
 navigate('Tuonti ja vienti')
 with page.expect_download() as d:page.get_by_role('button',name='Vie varmuuskopio',exact=True).click()
 month=json.load(open(d.value.path()))['data']['settings']['month']
 for kind,rows,count in [('expenses',f'Testimeno A;10,00;Ruoka;{month}-01\nTestimeno B;5,00;Ruoka;{month}-03\n',2),('incomes',f'Testitulo;30,00;Palkka;{month}-02\n',1)]:
  page.get_by_label('Tietotyyppi',exact=True).select_option(kind)
  page.locator('input[accept=".csv,text/csv"]').set_input_files({'name':'synthetic.csv','mimeType':'text/csv','buffer':('name;amount;category;date\n'+rows).encode()})
  page.get_by_role('button',name=f'Vahvista ja tuo {count} tietuetta',exact=True).click()
 navigate('Raportit')
 page.get_by_role('tab',name='Rahavirran ajoitus',exact=True).click()
 expect(page.locator('.flow-day')).to_have_count(3)
 expect(page.locator('.flow-summary')).to_contain_text('Kertymä käy miinuksella')
 expect(page.locator('.flow-summary')).to_contain_text('Kertymä palautuu plussalle')
 page.locator('.flow-day').first.click()
 expect(page.locator('.report-detail')).to_contain_text('Testimeno A')
 page.get_by_label('Raportin esitysmuoto',exact=True).select_option('table')
 expect(page.locator('.flow-table tbody tr')).to_have_count(3)
 page.get_by_label('Lajittele raporttitaulukko',exact=True).select_option('date-desc')
 expect(page.locator('.flow-table tbody tr').first).to_contain_text('03.')
 page.get_by_label('Suodata raporttitaulukkoa',exact=True).fill('ei-osumia')
 expect(page.locator('.flow-table')).to_contain_text('Suodattimella ei löytynyt päiviä.')
 page.get_by_label('Suodata raporttitaulukkoa',exact=True).fill('')
 page.get_by_role('button',name='Aikaväli',exact=True).click()
 page.set_viewport_size({'width':390,'height':844})
 start=page.get_by_role('button',name=__import__('re').compile('^Raportin alkukuukausi:'))
 start.click()
 popup=page.locator('.month-popover');expect(popup).to_be_visible()
 box=popup.bounding_box();assert box['x']>=0 and box['x']+box['width']<=391,box
 popup.locator('.month-grid-button[aria-pressed="true"]').click()
 expect(start).to_be_focused()
 page.set_viewport_size({'width':1280,'height':900})
 navigate('Asetukset')
 appearance=page.get_by_role('tab',name='Ulkoasu ja käyttö',exact=True)
 appearance.focus();appearance.press('End')
 expect(page.get_by_role('tab',name='Tiedot',exact=True)).to_be_focused()
 page.get_by_role('tab',name='Tiedot',exact=True).press('Home')
 expect(appearance).to_be_focused()
 page.get_by_label('Teema',exact=True).select_option('blue')
 page.get_by_label('Väritila',exact=True).select_option('dark')
 expect(page.locator('html')).to_have_attribute('data-theme','blue')
 expect(page.locator('html')).to_have_attribute('data-mode','dark')
 page.get_by_role('tab',name='Talous',exact=True).click()
 field=page.get_by_label('Välttämättömät, tavoite (%)',exact=True);field.fill('40');field.press('Tab')
 page.get_by_role('button',name='Tallenna ryhmien osuudet',exact=True).click()
 expect(page.get_by_role('alert')).to_contain_text('summan pitää olla 100')
 field=page.get_by_label('Valinnaiset, tavoite (%)',exact=True);field.fill('40');field.press('Tab')
 page.get_by_role('button',name='Tallenna ryhmien osuudet',exact=True).click()
 expect(page.get_by_role('alert')).to_have_count(0)
 for width in [390,1280]:
  page.set_viewport_size({'width':width,'height':900})
  assert page.locator('main').evaluate('(e)=>e.scrollWidth <= e.clientWidth+1')
 page.set_viewport_size({'width':1280,'height':900});navigate('Tuonti ja vienti')
 with page.expect_download() as d:page.get_by_role('button',name='Vie varmuuskopio',exact=True).click()
 state=json.load(open(d.value.path()))['data']
 assert state['settings']['theme']=='blue' and state['settings']['mode']=='dark'
 assert state['settings']['budgetGuidance']['needs']==40 and state['settings']['budgetGuidance']['wants']==40
 assert len(state['expenses'])==2 and len(state['incomes'])==1
 assert not errors,errors
 print('Flow report, filters/sort, mobile month picker, settings keyboard navigation/theme/budget validation and JSON persistence: OK.')
 b.close()
server.shutdown()
server.server_close()
