from playwright.sync_api import sync_playwright, expect
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from pathlib import Path
from datetime import date
import json
class QuietHandler(SimpleHTTPRequestHandler):
 def log_message(self, *_args):
  pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=str(Path(__file__).resolve().parent)))
Thread(target=server.serve_forever,daemon=True).start()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':390,'height':844},accept_downloads=True)
 page.on('dialog',lambda d:d.accept())
 page.goto(f'http://127.0.0.1:{server.server_port}')
 page.get_by_role('button',name='Jatka vieraana',exact=True).click()
 def nav(label):
  button=page.locator('#main-navigation').get_by_role('button',name=label,exact=True)
  if not button.is_visible():page.locator('.mobile-menu-toggle').click()
  button.click()
 nav('Tuonti ja vienti')
 page.get_by_label('Tietotyyppi',exact=True).select_option('expenses')
 month=date.today().isoformat()[:7]
 data=f'name;amount;category;date;recurrence\nTestivuokra;100,00;Asuminen;{month}-01;monthly\n'
 page.locator('input[accept=".csv,text/csv"]').set_input_files({'name':'synthetic.csv','mimeType':'text/csv','buffer':data.encode()})
 page.get_by_role('button',name='Vahvista ja tuo 1 tietuetta',exact=True).click()
 nav('Menot')
 page.get_by_role('button',name='Avaa Testivuokra',exact=True).click()
 page.locator('dialog[open]').get_by_role('button',name='Kokeile hinnanmuutosta',exact=True).click()
 panel=page.locator('.trial-mode-panel')
 expect(panel).to_be_visible()
 expect(panel.get_by_label('Kokeiltava toistuva meno')).to_have_value(__import__('re').compile('.+'))
 expect(panel.get_by_label('Mitä jos?')).to_have_value('price')
 expect(panel.get_by_label('Uusi hinta (€)')).to_have_value('100,00')
 panel.get_by_label('Uusi hinta (€)').fill('150,00')
 panel.get_by_label('Uusi hinta (€)').press('Tab')
 expect(panel.locator('.trial-projection-grid')).to_contain_text('Muutos 12 kuukaudessa')
 page.get_by_role('button',name='Lopeta kokeilu',exact=True).click()
 nav('Tuonti ja vienti')
 with page.expect_download() as d:page.get_by_role('button',name='Vie varmuuskopio',exact=True).click()
 state=json.load(open(d.value.path()))['data']; assert state['expenses'][0]['amount']==10000
 assert not state['expenses'][0].get('priceHistory')
 print('Hinnanmuutoskokeilu lähtökirjauksesta ja alkuperäisen datan säilyminen OK')
 b.close()
server.shutdown()
