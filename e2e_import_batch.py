"""Batch routing and optional AI regression. Synthetic PDFs, mocked AI only."""
import base64, json, os, tempfile
from pathlib import Path
import fitz
from playwright.sync_api import sync_playwright, expect
ROOT = Path(__file__).parent
with tempfile.TemporaryDirectory() as tmp:
    files = []
    for key in ['jan', 'mar']:
        lines = [line for p in json.loads((ROOT / f'src/test/fixtures/receipt-{key}.json').read_text())['pages'] for line in p['lines']]
        pdf = fitz.open()
        for offset in range(0, len(lines), 60):
            page = pdf.new_page()
            page.insert_font(fontname='FixtureMono', fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')
            for i, line in enumerate(lines[offset:offset+60]): page.insert_text((25, 30+i*12), line, fontsize=9, fontname='FixtureMono')
        path = Path(tmp) / f'{key}.pdf'; pdf.save(path); pdf.close(); files.append(path)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True, args=['--no-sandbox'])
        page = browser.new_page(); requests = []
        def handle(route):
            body = route.request.post_data_json
            requests.append(body)
            data = json.loads(body['messages'][1]['content'])
            if isinstance(data, list):
                result = {'invoices': [{'id': item['id'], 'name': f'Testilasku {item["id"]}', 'amount_eur': 10 if item['id'] == 0 else None, 'due_date': '2026-11-25'} for item in data]}
            else:
                expect(page.locator('.document-processing--receipt')).to_be_visible()
                expect(page.locator('.document-processing--receipt').get_by_role('status')).to_contain_text('AI luokittelee')
                result = {'categories': [{'id': item['id'], 'category': data['categories'][0]} for item in data['products']]}
                assert all(set(item) == {'id', 'name'} for item in data['products'])
            route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps({'choices': [{'message': {'content': json.dumps(result)}}]}))
        page.route('https://api-worker.kocakhakan99.workers.dev/chat', handle)
        page.goto(os.environ.get('TALOUS_URL', 'http://127.0.0.1:8765/index.html'))
        page.get_by_role('button', name='Aloita tyhjästä').click()
        payload = [{'name': f.name, 'base64': base64.b64encode(f.read_bytes()).decode()} for f in files]
        def drop():
            page.evaluate('''items => {
                const dataTransfer = new DataTransfer();
                for (const item of items) dataTransfer.items.add(new File([Uint8Array.from(atob(item.base64), c => c.charCodeAt(0))], item.name, {type:'application/pdf'}));
                document.body.dispatchEvent(new DragEvent('drop', {bubbles:true, dataTransfer}));
            }''', payload)
        # First receipt batch: choose an API key, then one AI action and one save.
        drop(); page.get_by_role('button', name='Kuitti', exact=True).click()
        expect(page.get_by_label('AI-avusteinen kategorisointi')).to_have_count(0)
        expect(page.locator('.receipt-review')).to_have_count(2, timeout=30000)
        assert not requests
        page.locator('.receipt-scanner').get_by_role('button', name='Lisää avain', exact=True).click()
        page.get_by_role('dialog', name='Analyysin avain').get_by_label('Avain', exact=True).fill('test-key')
        page.get_by_role('dialog', name='Analyysin avain').get_by_role('button', name='Tallenna', exact=True).click()
        save = page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)
        expect(save).to_be_enabled(timeout=30000)
        page.set_viewport_size({'width': 320, 'height': 850})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        if os.environ.get('TALOUS_REVIEW_SCREENSHOT'): page.locator('.document-review--receipt').screenshot(path=os.environ['TALOUS_REVIEW_SCREENSHOT'])
        page.set_viewport_size({'width': 1280, 'height': 900})
        assert len(requests) == 1
        assert page.get_by_label('Tarkistin tuotteet', exact=False).count() == 0
        before = page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses.length')
        save.click()
        expect(page.locator('.receipt-review')).to_have_count(0)
        after = page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses')
        assert len(after) == before + 2 and sum(e['amount'] for e in after) == 12146 + 7385
        # A duplicate or invalid source blocks the entire batch, even after AI.
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files([str(files[0]), str(files[0])])
        expect(page.get_by_text('Erässä on saman kuitin kopioita. Poista ylimääräiset ennen kirjaamista.')).to_be_visible(timeout=30000)
        expect(page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)).to_be_disabled()
        assert page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses') == after
        # Existing session key starts AI for both invoices automatically.
        drop(); page.get_by_role('button', name='Lasku', exact=True).click()
        expect(page.get_by_role('heading', name='Laskujen yhteenveto')).to_be_visible(timeout=30000)
        invoice_save = page.get_by_role('button', name='Kirjaa laskut menoihin', exact=True)
        expect(invoice_save).to_be_disabled()
        page.get_by_label('Summa (€)', exact=True).nth(1).fill('10,00')
        expect(invoice_save).to_be_enabled()
        invoice_save.click()
        expect(page.get_by_role('heading', name='Laskujen yhteenveto')).to_have_count(0)
        final = page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses')
        assert len(final) == len(after) + 2
        assert sum(e['amount'] for e in final) == 12146 + 7385 + 2000
        # Identical-looking invoices require one explicit batch-level decision.
        drop(); page.get_by_role('button', name='Lasku', exact=True).click()
        expect(page.get_by_role('heading', name='Laskujen yhteenveto')).to_be_visible(timeout=30000)
        page.get_by_label('Summa (€)', exact=True).nth(1).fill('10,00')
        page.get_by_role('button', name='Kirjaa laskut menoihin', exact=True).click()
        expect(page.get_by_role('alert').filter(has_text='Sama lasku')).to_be_visible()
        assert page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses') == final
        accept = page.get_by_label('Olen tarkistanut, että samanlaiset laskut ovat erillisiä.')
        accept.check()
        page.get_by_label('Summa (€)', exact=True).nth(1).fill('11,00')
        expect(accept).not_to_be_checked()
        accept.check()
        page.get_by_role('button', name='Kirjaa laskut menoihin', exact=True).click()
        expect(page.get_by_role('heading', name='Laskujen yhteenveto')).to_have_count(0)
        assert 'test-key' not in page.evaluate('localStorage.getItem("taloussuunnittelu.v1")')
        print('PASS: AI receipt and invoice batches, one-click atomic saves, duplicate protection')
        browser.close()
