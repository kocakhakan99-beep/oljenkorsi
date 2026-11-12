"""Local receipt regression using anonymized fixtures derived from real receipt PDFs.
Without files, generates anonymized PDFs from committed text fixtures (PyMuPDF).
Never copies supplied PDFs into the repository or test artifacts.
"""
from pathlib import Path
import argparse, json, os, tempfile
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).parent
parser = argparse.ArgumentParser()
parser.add_argument('pdfs', nargs='*', type=Path)
args = parser.parse_args()
assert len(args.pdfs) in (0, 3, 9), 'Give no files, three legacy PDFs, or nine PDFs in the documented suite order'
results = []
def mark(name):
    results.append(name)
    print('PASS:', name, flush=True)
def state(page):
    return page.evaluate("JSON.parse(localStorage.getItem('taloussuunnittelu.v1')).data")
def nav(page, name):
    if not page.get_by_role('navigation').is_visible(): page.locator('.mobile-menu-toggle').click()
    page.get_by_role('navigation').get_by_role('button', name=name, exact=True).click()
with tempfile.TemporaryDirectory(prefix='receipt-check-') as tmp:
    files = args.pdfs
    if not files:
        import fitz
        files = []
        for key in ['example', 'jan', 'mar', 'smarket-korso', 'prisma-nov2', 'prisma-nov9', 'alepa', 'smarket-koivukyla', 'prisma-plain-7556', 'prisma-credit-4767', 'prisma-plain-9285']:
            lines = [line for p in json.loads((ROOT / f'src/test/fixtures/receipt-{key}.json').read_text())['pages'] for line in p['lines']]
            doc = fitz.open()
            for offset in range(0, len(lines), 60):
                page = doc.new_page()
                page.insert_font(fontname='FixtureMono', fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')
                for i, line in enumerate(lines[offset:offset + 60]): page.insert_text((25, 30+i*12), line, fontsize=9, fontname='FixtureMono')
            path = Path(tmp) / f'{key}.pdf'; doc.save(path); doc.close(); files.append(path)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = ctx.new_page(); page.on('dialog', lambda dialog: dialog.accept()); errors = []; network = []; consoles = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: consoles.append(m.text) if m.type == 'error' and not m.location.get('url','').endswith('/favicon.ico') else None)
        page.on('request', lambda r: network.append(r.url) if not r.url.startswith(('http://127.0.0.1:', 'http://localhost:', 'data:', 'blob:', 'file:', 'https://api-worker.kocakhakan99.workers.dev/')) else None)
        def mock_ai(route):
            payload = json.loads(route.request.post_data_json['messages'][1]['content'])
            result = {} if isinstance(payload, list) else {'categories': [{'id': product['id'], 'category': 'Ruoka'} for product in payload['products']]}
            route.fulfill(status=200, content_type='application/json', headers={'Access-Control-Allow-Origin': '*'}, body=json.dumps({'choices': [{'message': {'content': json.dumps(result)}}]}))
        page.route('https://api-worker.kocakhakan99.workers.dev/chat', mock_ai)
        page.goto(os.environ.get('TALOUS_URL', 'http://127.0.0.1:8765/index.html'))
        page.get_by_role('button', name='Jatka vieraana', exact=True).click(); nav(page, 'Menot'); page.get_by_role('button', name='Lisää kuitti', exact=True).click()
        page.get_by_role('button', name='Lisää avain', exact=True).click()
        page.get_by_role('dialog', name='Analyysin avain').get_by_label('Avain', exact=True).fill('test-key')
        page.get_by_role('dialog', name='Analyysin avain').get_by_role('button', name='Tallenna', exact=True).click()
        expected_originals = [(3287, 15, '2026-04-05'), (12146, 22, '2026-01-02'), (7385, 27, '2026-03-16'), (2400, 9, '2026-11-01'), (2244, 9, '2026-11-02'), (9285, 20, '2026-11-09'), (165, 2, '2026-11-09'), (1692, 6, '2026-11-07')]
        expected = expected_originals + [(7556, 22, '2026-10-17'), (4767, 15, '2026-04-12'), (9285, 20, '2026-11-09')] if not args.pdfs else expected_originals
        for i, (path, (total, count, date)) in enumerate(zip(files, expected)):
            before = state(page)
            page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(path)
            expect(page.get_by_role('img', name='Ostosten jakauma kategorioittain; summat näkyvät kaavion vieressä')).to_be_visible(timeout=30000)
            assert page.locator('.receipt-review').count() == 0
            assert state(page) == before
            matching = page.get_by_label('Täsmäytä kuitti', exact=True)
            if matching.is_visible(): matching.select_option('separate')
            save = page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)
            expect(save).to_be_enabled()
            if i == 1:
                for width in [320, 390, 768]:
                    page.set_viewport_size({'width': width, 'height': 950})
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                page.set_viewport_size({'width':1280, 'height':900})
                mark('Receipt summary fits 320/390/768 px')
            save.click()
            expect(page.get_by_role('img', name='Ostosten jakauma kategorioittain; summat näkyvät kaavion vieressä')).to_have_count(0)
            after = state(page)
            assert 'receiptImports' not in after
            existing_ids = {e['id'] for e in before['expenses']}
            entries = [e for e in after['expenses'] if e['id'] not in existing_ids]
            assert sum(e['amount'] for e in entries) == total
            assert all(e['date'] == date and e['description'] == '' for e in entries)
            assert after['budgets'] == before['budgets']
            mark(f'PDF {i+1}: exact total {total} cents, purchase month and no receipt archive')
            if i == 0:
                page.get_by_role('button', name='Sulje kuittiskannaus').click()
                page.get_by_role('button', name='Kumoa', exact=True).click()
                page.get_by_role('button', name='Lisää kuitti', exact=True).click()
                assert state(page) == before
                page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(path)
                save = page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)
                expect(save).to_be_enabled(timeout=30000)
                save.click()
                expect(page.get_by_role('img', name='Ostosten jakauma kategorioittain; summat näkyvät kaavion vieressä')).to_have_count(0)
                assert 'receiptImports' not in state(page)
                mark('Undo restores financial data; re-import leaves no receipt archive')
        saved = state(page)
        page.get_by_role('button', name='Sulje kuittiskannaus').click()
        expect(page.get_by_role('button', name='Kumoa', exact=True)).to_be_visible()
        # Receipt undo must expire after a later saved change, never erase that change.
        nav(page, 'Asetukset'); page.get_by_label('Väritila', exact=True).select_option('dark')
        expect(page.get_by_role('button', name='Kumoa', exact=True)).to_have_count(0)
        nav(page, 'Menot'); page.get_by_role('button', name='Lisää kuitti', exact=True).click(); saved = state(page)
        mark('Later saved change expires receipt undo safely')
        page.reload(); nav(page, 'Menot'); page.get_by_role('button', name='Lisää kuitti', exact=True).click()
        assert state(page) == saved and 'receiptImports' not in saved
        assert not any(e['description'].startswith('Kuittituonti ') for e in saved['expenses'])
        mark('Only ordinary expenses persist after reload; receipt and product details do not')
        bad = Path(tmp) / 'bad.pdf'; bad.write_text('not a PDF')
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(bad)
        expect(page.get_by_text('Tiedosto ei ole PDF.', exact=False)).to_be_visible()
        assert state(page) == saved
        mark('Invalid PDF does not change financial state')
        import fitz
        image_pdf = Path(tmp) / 'image-only.pdf'
        image_doc = fitz.open(); image_page = image_doc.new_page()
        pixels = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 40, 40), False); pixels.clear_with(255)
        image_page.insert_image(image_page.rect, pixmap=pixels); image_doc.save(image_pdf); image_doc.close()
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(image_pdf)
        expect(page.get_by_text('Sivu 1 on kuvallinen.', exact=False)).to_be_visible()
        assert state(page) == saved
        mark('Image-only PDF clearly requests OCR and creates no guessed expenses')
        protected = Path(tmp) / 'protected.pdf'; protected_doc = fitz.open(); protected_doc.new_page()
        protected_doc.save(protected, encryption=fitz.PDF_ENCRYPT_AES_256, owner_pw='fixture-owner', user_pw='fixture-password'); protected_doc.close()
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(protected)
        expect(page.get_by_text('PDF on salasanasuojattu.', exact=False)).to_be_visible()
        assert state(page) == saved
        mark('Password-protected PDF is rejected without financial changes')
        too_large = Path(tmp) / 'too-large.pdf'
        with too_large.open('wb') as f: f.write(b'%PDF-'); f.truncate(20 * 1024 * 1024 + 1)
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(too_large)
        expect(page.get_by_text('PDF saa olla enintään 20 Mt.', exact=True)).to_be_visible()
        assert state(page) == saved
        mark('PDF size limit is enforced before parsing')
        # A blocked structural row is visible to the user; it is never silently discarded.
        ambiguous = Path(tmp) / 'ambiguous.pdf'; ambiguous_doc = fitz.open(); ambiguous_page = ambiguous_doc.new_page()
        ambiguous_page.insert_font(fontname='FixtureMono', fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')
        for i, line in enumerate(['ALEPA ESIMERKKI', 'K001 M000001/0001 9.11.2026 12:00', '*TUNTEMATON ??? *', '*MAITO 1,25 *', '*YHTEENSÄ 1,25 *']): ambiguous_page.insert_text((25, 30+i*15), line, fontsize=9, fontname='FixtureMono')
        ambiguous_doc.save(ambiguous); ambiguous_doc.close()
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(ambiguous)
        expect(page.locator('.receipt-issue-source')).to_contain_text('TUNTEMATON ???', timeout=30000)
        save = page.get_by_role('button', name='Kirjaa koko erä menoihin', exact=True)
        assert save.count() == 0 or save.is_disabled()
        page.set_viewport_size({'width':320, 'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        page.locator('.receipt-issue-source').scroll_into_view_if_needed(); page.screenshot(path='/tmp/receipt-source-error.png')
        assert state(page) == saved
        mark('Unknown structural row is shown with its source, blocks saving and fits 320px')
        assert not errors, errors
        assert not consoles, consoles
        assert not network, network
        mark('No JavaScript errors, console errors or unmocked external requests')
        browser.close()
Path(os.environ.get('TALOUS_RECEIPT_REPORT', str(ROOT / 'qa/receipt-e2e-results.json'))).write_text(json.dumps({'checks':results, 'suppliedPDFs':bool(args.pdfs), 'documentCount':len(files), 'receiptDetailsPersisted':False, 'errors':errors, 'externalRequests':network}, ensure_ascii=False, indent=2)+'\n')
