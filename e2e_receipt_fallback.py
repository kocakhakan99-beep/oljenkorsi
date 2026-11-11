"""Text-only fallback regression. Fictitious data and mock Worker responses."""
import json, os, tempfile
from pathlib import Path
import fitz
from playwright.sync_api import sync_playwright, expect

with tempfile.TemporaryDirectory() as tmp:
    file = Path(tmp) / 'receipt.pdf'
    doc = fitz.open(); sheet = doc.new_page()
    for n, line in enumerate(['TESTIKAUPPA', '12.11.2026 12:30', 'MAITO 2,50', 'LEIPA 3,00', 'YHTEENSÄ 5,50', 'ASIAKASNUMERO PRIVATE']):
        sheet.insert_text((35, 40 + n * 20), line)
    doc.save(file); doc.close()
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        page = browser.new_page(); calls = []; bad = [False]
        def handle(route):
            body = route.request.post_data_json; calls.append(body)
            text = body['messages'][1]['content']
            data = json.loads(text)
            if isinstance(data, list):
                assert 'PRIVATE' not in text
                result = {'merchant': 'TESTIKAUPPA', 'merchant_source': 'p1-l1', 'date': '2026-11-12', 'date_source': 'p1-l2', 'total_cents': 550, 'total_source': 'p1-l5', 'products': [{'name':'MAITO','net_cents':251 if bad[0] else 250,'source':'p1-l3'},{'name':'LEIPA','net_cents':300,'source':'p1-l4'}]}
            else:
                result = {'categories': [{'id': item['id'], 'category': 'Ruoka'} for item in data['products']]}
            route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin':'*'}, body=json.dumps({'choices':[{'message':{'content':json.dumps(result)}}]}))
        page.route('https://api-worker.kocakhakan99.workers.dev/chat', handle)
        page.goto(os.environ.get('TALOUS_URL', 'http://127.0.0.1:8765/index.html'))
        page.get_by_role('button', name='Aloita tyhjästä').click()
        page.get_by_role('navigation').get_by_role('button', name='Menot', exact=True).click()
        page.get_by_role('button', name='Lisää kuitti', exact=True).click()
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(file)
        page.get_by_role('button', name='Lisää avain', exact=True).click()
        dialog = page.get_by_role('dialog', name='Analyysin avain')
        dialog.get_by_label('Avain', exact=True).fill('test-key')
        dialog.get_by_role('button', name='Tallenna', exact=True).click()
        review = page.get_by_label('Tarkistin tämän kuitin tuotteet ja hinnat.')
        expect(review).to_be_visible(timeout=30000)
        save = page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)
        expect(save).to_be_disabled()
        review.check(); expect(save).to_be_enabled(); save.click()
        stored = page.evaluate("JSON.parse(localStorage.getItem('taloussuunnittelu.v1')).data")
        assert sum(item['amount'] for item in stored['expenses']) == 550
        assert 'PRIVATE' not in json.dumps(stored) and 'test-key' not in json.dumps(stored)
        assert len(calls) == 2
        bad[0] = True
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(file)
        expect(page.get_by_text('Kuitin rakennetta ei voitu varmistaa.', exact=False)).to_be_visible(timeout=30000)
        assert page.evaluate("JSON.parse(localStorage.getItem('taloussuunnittelu.v1')).data") == stored
        bad[0] = False
        page.get_by_role('button', name='Yritä tätä kuittia uudelleen').click()
        expect(page.get_by_label('Tarkistin tämän kuitin tuotteet ja hinnat.')).to_be_visible(timeout=30000)
        page.get_by_label('Täsmäytä kuitti', exact=True).select_option('separate')
        page.get_by_label('Tarkistin tämän kuitin tuotteet ja hinnat.').check()
        expect(page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)).to_be_enabled()
        assert page.evaluate("JSON.parse(localStorage.getItem('taloussuunnittelu.v1')).data") == stored
        print('PASS: generic text receipt fallback, source verification, manual review, private-line filtering and invalid proposal rejection')
        browser.close()
