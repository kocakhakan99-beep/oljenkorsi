"""PDF invoice UI: Worker authentication, automatic analysis and session key."""
import json, os, tempfile
from pathlib import Path
import fitz
from playwright.sync_api import sync_playwright, expect

with tempfile.TemporaryDirectory() as tmp:
    path = Path(tmp) / 'invoice.pdf'
    pdf = fitz.open(); sheet = pdf.new_page()
    sheet.insert_text((50, 70), 'Fiktiivinen lasku 42,55 eur erapaiva 25.11.2026')
    pdf.save(path); pdf.close()
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER') or None, headless=True, args=['--no-sandbox'])
        page = browser.new_page(); requests = []; headers = []
        def handle(route):
            requests.append(route.request.post_data_json); headers.append(route.request.headers)
            route.fulfill(status=200, headers={'Access-Control-Allow-Origin': '*'}, content_type='application/json', body=json.dumps({'choices': [{'message': {'content': json.dumps({'name': 'Testilasku', 'amount_eur': 42.55, 'due_date': '2026-11-25'})}}]}))
        page.route('https://api-worker.kocakhakan99.workers.dev/chat', handle)
        page.goto(os.environ.get('TALOUS_URL', (Path(__file__).parent / 'index.html').as_uri()))
        page.get_by_role('button', name='Jatka vieraana').click()
        page.get_by_role('navigation').get_by_role('button', name='Menot', exact=True).click()
        for name in ['Lisää kertaluonteinen meno', 'Lisää kuitti', 'Lisää lasku', 'Lisää toistuva lasku']:
            expect(page.locator('.entry-head-actions').get_by_role('button', name=name, exact=True).locator('svg')).to_have_count(1)
        page.get_by_role('button', name='Lisää lasku', exact=True).click()
        expect(page.get_by_role('button', name='Liitä laskuteksti')).to_have_count(0)
        expect(page.get_by_label('Lähetettävä laskuteksti')).to_have_count(0)
        page.get_by_label('Valitse laskujen PDF:t').set_input_files(path)
        expect(page.get_by_text('Lisää avain yläkulman avainpainikkeesta.')).to_be_visible(timeout=30000)
        assert not requests
        page.get_by_role('button', name='Lisää avain', exact=True).click()
        dialog = page.get_by_role('dialog', name='Analyysin avain')
        dialog.get_by_label('Avain', exact=True).fill('test-key')
        dialog.get_by_role('button', name='Tallenna', exact=True).click()
        expect(page.get_by_role('heading', name='Laskujen yhteenveto')).to_be_visible(timeout=30000)
        page.set_viewport_size({'width': 320, 'height': 850})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if os.environ.get('TALOUS_INVOICE_SCREENSHOT'): page.locator('.invoice-review-card').screenshot(path=os.environ['TALOUS_INVOICE_SCREENSHOT'])
        page.set_viewport_size({'width': 1280, 'height': 900})
        assert len(requests) == 1 and requests[0]['model'] == 'openrouter/free'
        assert headers[0].get('authorization') == 'Bearer test-key'
        page.get_by_label('Toistuva lasku kuukausittain').check()
        page.get_by_role('button', name='Kirjaa laskut menoihin').click()
        stored = page.evaluate("localStorage.getItem('taloussuunnittelu.v1')")
        assert 'test-key' not in stored and 'Fiktiivinen lasku' not in stored
        assert any(item['name'] == 'Testilasku' and item['amount'] == 4255 and item['recurrence'] == 'monthly' for item in json.loads(stored)['data']['expenses'])
        page.reload()
        page.get_by_role('button', name='Lisää lasku', exact=True).click()
        expect(page.get_by_role('button', name='Vaihda tai poista avain', exact=True)).to_be_visible()
        page.get_by_role('button', name='Vaihda tai poista avain', exact=True).click()
        page.get_by_role('button', name='Poista avain', exact=True).click()
        expect(page.get_by_role('button', name='Lisää avain', exact=True)).to_be_visible()
        print('PASS: PDF-only invoice UI, automatic Worker analysis, batch save and session key')
        browser.close()
