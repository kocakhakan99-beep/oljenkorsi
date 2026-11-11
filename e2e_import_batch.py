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
                result = {'invoices': [{'id': item['id'], 'name': 'Testilasku', 'amount_eur': 10, 'due_date': '2026-11-25'} for item in data]}
            else:
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
        # Drop from dashboard: choose receipt, inspect queue, no network.
        drop(); page.get_by_role('button', name='Kuitti', exact=True).click()
        expect(page.locator('.receipt-review')).to_have_count(2, timeout=30000)
        assert not requests
        page.get_by_label('AI-avusteinen kategorisointi').check()
        assert not requests
        page.locator('.receipt-scanner').get_by_role('button', name='Lisää avain', exact=True).click()
        page.get_by_role('dialog', name='Analyysin avain').get_by_label('Avain', exact=True).fill('test-key')
        page.get_by_role('dialog', name='Analyysin avain').get_by_role('button', name='Tallenna', exact=True).click()
        page.get_by_role('button', name='Ehdota kategoriat koko erälle').click()
        expect(page.locator('.receipt-scanner').get_by_role('button', name='Vaihda tai poista avain')).to_be_visible()
        page.wait_for_function('!document.querySelector(".receipt-review fieldset") && Array.from(document.querySelectorAll(".receipt-scanner input[type=checkbox]")).every(i => !i.disabled)')
        assert len(requests) == 1
        page.get_by_role('button', name='Vahvista kaikkien kuittien tarkistus').click()
        save = page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)
        expect(save).to_be_enabled()
        before = page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses.length')
        save.click()
        expect(page.locator('.receipt-review')).to_have_count(0)
        after = page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses')
        assert len(after) == before + 2
        assert sum(e['amount'] for e in after) == 12146 + 7385
        # A failed PDF blocks the entire receipt batch without partial writes.
        invalid = Path(tmp) / 'invalid.pdf'; invalid.write_bytes(b'not a PDF')
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files([str(files[0]), str(invalid)])
        expect(page.get_by_role('button', name='Poista erästä')).to_have_count(2, timeout=30000)
        page.get_by_role('button', name='Vahvista kaikkien kuittien tarkistus').click()
        expect(page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)).to_be_disabled()
        assert page.evaluate('JSON.parse(localStorage.getItem("taloussuunnittelu.v1")).data.expenses') == after
        # Repeated source receipts must be removed before saving either copy.
        page.once('dialog', lambda dialog: dialog.accept())
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files([str(files[0]), str(files[0])])
        expect(page.get_by_text('Erässä on saman kuitin kopioita. Poista ylimääräiset ennen kirjaamista.')).to_be_visible(timeout=30000)
        expect(page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)).to_be_disabled()
        # Drop same two PDFs as invoices: one API call, two distinct cards.
        drop(); page.get_by_role('button', name='Lasku', exact=True).click()
        expect(page.locator('.invoice-scanner details')).to_have_count(2)
        page.wait_for_function('!document.querySelector(".invoice-scanner input[type=file]").disabled')
        expect(page.locator('.invoice-scanner').get_by_role('button', name='Vaihda tai poista avain')).to_be_visible()
        page.get_by_role('button', name='Analysoi laskut', exact=True).click()
        expect(page.get_by_role('button', name='Jatka kertamenona')).to_have_count(2, timeout=30000)
        assert len(requests) == 2
        page.get_by_role('button', name='Jatka kertamenona').first.click()
        expect(page.locator('dialog[open] [name=name]')).to_have_value('Testilasku')
        stored = page.evaluate('localStorage.getItem("taloussuunnittelu.v1")')
        assert 'test-key' not in stored
        print('PASS: global drop choice, whole receipt batch, atomic save, opt-in AI, two invoices in one request, review and no stored API key')
        browser.close()
