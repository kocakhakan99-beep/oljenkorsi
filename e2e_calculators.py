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
 page.locator('#main-navigation').get_by_role('button',name='Laskurit',exact=True).click()
 fi=page.locator('section.panel-plan:visible')
 fi.get_by_label('Vuosikulut (€)',exact=True).fill('2400000')
 fi.get_by_label('Vuosikulut (€)',exact=True).press('Tab')
 expect(fi.locator('.stat').filter(has_text='FI-pääomatavoite').locator('strong')).to_have_text('600\u00a0000,00\u00a0€')
 page.get_by_role('button',name='Korkoa korolle',exact=True).click()
 invest=page.locator('section.panel-cash:visible')
 invest.get_by_label('Nimi',exact=True).fill('Auditin laskuri')
 for label,value in [('Alkupääoma (€)','100000'),('Kuukausisijoitus (€)','0'),('Tuotto-oletus (% / vuosi)','0'),('Vuosikulut (%)','0'),('Inflaatio (% / vuosi)','0'),('Aika (vuotta, 1–50)','1')]:
  field=invest.get_by_label(label,exact=True);field.fill(value);field.press('Tab')
 slider=invest.get_by_role('slider',name='Tuotto-oletus (% / vuosi), säädin',exact=True)
 slider.focus();slider.press('ArrowRight');expect(slider).to_have_attribute('aria-valuenow','0.1')
 invest.get_by_label('Tuotto-oletus (% / vuosi)',exact=True).fill('0')
 invest.get_by_label('Tuotto-oletus (% / vuosi)',exact=True).press('Tab')
 page.get_by_role('button',name='Tallenna vertailuun',exact=True).click()
 page.get_by_role('button',name='Tallennetut suunnitelmat',exact=True).click()
 expect(page.locator('.scenario-table')).to_contain_text('Auditin laskuri')
 page.get_by_role('button',name='Lataa laskuriin',exact=True).click()
 expect(invest.get_by_label('Nimi',exact=True)).to_have_value('Auditin laskuri')
 for width in [390,1280]:
  page.set_viewport_size({'width':width,'height':900})
  assert page.locator('main').evaluate('(e)=>e.scrollWidth <= e.clientWidth+1')
 page.set_viewport_size({'width':1280,'height':900})
 page.locator('#main-navigation').get_by_role('button',name='Tuonti ja vienti',exact=True).click()
 with page.expect_download() as d:page.get_by_role('button',name='Vie varmuuskopio',exact=True).click()
 data=json.load(open(d.value.path()))['data']
 plan=data['scenarios'][0]
 assert (plan['initial'],plan['monthly'],plan['rate'],plan['fee'],plan['inflation'],plan['years'])==(100000,0,0,0,0,1)
 assert not errors,errors
 print('FI calculation, money input, percentage keyboard adjustment, scenario save/load/JSON and mobile layout: OK.')
 b.close()

server.shutdown()
server.server_close()
