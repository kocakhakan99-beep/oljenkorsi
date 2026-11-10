"""Check every downloadable fictional PDF through the actual browser PDF scanner."""
from pathlib import Path
import json, os
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).parent
manifest = json.loads((ROOT/'examples/receipts/manifest.json').read_text())
results=[]; errors=[]; consoles=[]; network=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1100,'height':950});page=ctx.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:consoles.append(m.text) if m.type=='error' else None)
    page.on('request',lambda r:network.append(r.url) if not r.url.startswith(('http://127.0.0.1:','http://localhost:','data:','blob:','file:')) else None)
    page.goto(os.environ.get('TALOUS_URL','http://127.0.0.1:8765/index.html'))
    page.get_by_role('button',name='Aloita tyhjästä',exact=True).click()
    page.get_by_role('navigation').get_by_role('button',name='Tuonti ja vienti',exact=True).click()
    baseline=page.evaluate("localStorage.getItem('taloussuunnittelu.v1')")
    for receipt in manifest['receipts']:
        page.get_by_label('Skannaa PDF-kuitti',exact=True).set_input_files(ROOT/'examples/receipts'/receipt['file'])
        expect(page.get_by_role('heading',name='Tarkista kuitti',exact=True)).to_be_visible(timeout=30000)
        issues=page.locator('.receipt-review [role=alert]').all_text_contents()
        assert not issues,(receipt['file'],issues)
        expect(page.locator('.receipt-summary')).to_contain_text(f"{receipt['total']//100},{receipt['total']%100:02d}")
        actual_names=page.locator('.receipt-product-select strong').all_text_contents()
        actual_prices=[int(t.replace('€','').replace('\u00a0','').replace(' ','').replace(',','').strip()) for t in page.locator('.receipt-price').all_text_contents()]
        assert actual_names==[p['name'] for p in receipt['products']],receipt['file']
        assert actual_prices==[p['net'] for p in receipt['products']],receipt['file']
        assert sum(actual_prices)==receipt['total']
        assert page.evaluate("localStorage.getItem('taloussuunnittelu.v1')")==baseline
        results.append({'file':receipt['file'],'products':len(actual_names),'total':sum(actual_prices)})
        print('PASS:',receipt['file'],len(actual_names),sum(actual_prices),flush=True)
        page.get_by_role('button',name='Hylkää luonnos',exact=True).click()
    assert not errors,errors
    assert not consoles,consoles
    assert not network,network
    browser.close()
(ROOT/'qa/fictional-receipts-results.json').write_text(json.dumps({'fictional':True,'passed':results,'errors':errors,'consoleErrors':consoles,'externalRequests':network},ensure_ascii=False,indent=2)+'\n')
