"""Local receipt regression. Accepts three legacy PDFs or the documented nine-document suite.
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
        for key in ['example', 'jan', 'mar', 'smarket-korso', 'prisma-nov2', 'prisma-nov9', 'alepa', 'smarket-koivukyla']:
            lines = [line for p in json.loads((ROOT / f'src/test/fixtures/receipt-{key}.json').read_text())['pages'] for line in p['lines']]
            doc = fitz.open()
            for offset in range(0, len(lines), 60):
                page = doc.new_page()
                page.insert_font(fontname='FixtureMono', fontfile='/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf')
                for i, line in enumerate(lines[offset:offset + 60]): page.insert_text((25, 30+i*12), line, fontsize=9, fontname='FixtureMono')
            path = Path(tmp) / f'{key}.pdf'; doc.save(path); doc.close(); files.append(path)
        copy = fitz.open(files[3]); copy.set_metadata({'title':'Different PDF encoding of same purchase'})
        copy_path = Path(tmp) / 'duplicate.pdf'; copy.save(copy_path); copy.close(); files.append(copy_path)
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        ctx = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = ctx.new_page(); errors = []; network = []; consoles = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: consoles.append(m.text) if m.type == 'error' else None)
        page.on('request', lambda r: network.append(r.url) if not r.url.startswith(('http://127.0.0.1:', 'http://localhost:', 'data:', 'blob:', 'file:')) else None)
        page.goto(os.environ.get('TALOUS_URL', 'http://127.0.0.1:8765/index.html'))
        page.get_by_role('button', name='Aloita tyhjästä', exact=True).click(); nav(page, 'Menot'); page.get_by_role('button', name='Skannaa kuitti', exact=True).click()
        expected = [(3287, 15, '2026-04-05'), (12146, 22, '2026-01-02'), (7385, 27, '2026-03-16'), (2400, 9, '2026-11-01'), (2244, 9, '2026-11-02'), (9285, 20, '2026-11-09'), (165, 2, '2026-11-09'), (1692, 6, '2026-11-07')]
        initial = state(page)
        for i, (path, (total, count, date)) in enumerate(zip(files, expected)):
            page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(path)
            expect(page.get_by_role('heading', name='Tarkista kuitti', exact=True)).to_be_visible(timeout=30000)
            issues = page.locator('.receipt-review [role=alert]').all_text_contents()
            assert not issues, issues
            assert page.locator('.receipt-product').count() == count
            summary = page.locator('.receipt-summary')
            expect(summary).to_contain_text(date.split('-')[2]+'.'+date.split('-')[1]+'.'+date.split('-')[0])
            assert state(page) == initial if i == 0 else len(state(page)['receiptImports']) == i
            mark(f'PDF {i+1}: {count} products, exact total {total} cents, no draft writes')
            # Force one unknown category, then classify it through the multi-select path.
            selector = page.locator('.receipt-product-category select').first
            selector.select_option('')
            unresolved = sum(1 for select in page.locator('.receipt-product-category select').all() if not select.input_value())
            page.get_by_role('checkbox', name=f'Vain luokittelemattomat ({unresolved})', exact=True).check()
            page.get_by_role('button', name='Valitse näkyvät', exact=True).click()
            page.get_by_label('Luokittele valitut tuotteet', exact=True).select_option('Ruoka')
            page.locator('.receipt-controls input[type=checkbox]').uncheck()
            for select in page.locator('.receipt-product-category select').all():
                if not select.input_value(): select.select_option('Muu meno')
            save = page.get_by_role('button', name=f'Kirjaa {total//100},{total%100:02d} € menoihin', exact=True)
            expect(save).to_be_disabled()
            page.get_by_role('checkbox', name='Tarkistin tuotteet', exact=False).check(); expect(save).to_be_enabled()
            if i == 1:
                for width in [320, 390, 768]:
                    page.set_viewport_size({'width': width, 'height': 950})
                    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                page.set_viewport_size({'width':390, 'height':950})
                page.locator('.receipt-review').evaluate('(el)=>el.scrollIntoView()')
                page.screenshot(path=os.environ.get('TALOUS_RECEIPT_SCREENSHOT', str(Path(tmp) / 'receipt-mobile.png')))
                mark('Receipt review fits 320/390/768 px; bulk classification and confirmation work')
                page.set_viewport_size({'width':1280, 'height':900})
            before = state(page); save.click()
            expect(page.locator('.receipt-review')).to_have_count(0)
            after = state(page); group = after['receiptImports'][-1]
            entries = [e for e in after['expenses'] if e['id'] in group['entryIds']]
            assert sum(e['amount'] for e in entries) == total
            assert all(e['date'] == date for e in entries)
            assert after['budgets'] == before['budgets']
            # Original payment and loyalty data must not enter saved state.
            assert not any(word in json.dumps(group).lower() for word in ['visa', 'jäsennumero', 'varmennus', 'contactless'])
            mark(f'PDF {i+1}: grouped expenses saved in purchase month, no duplicate total/payment/VAT')
            page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(path)
            expect(page.locator('.receipt-review')).to_be_visible(timeout=30000)
            expect(page.get_by_text('Tämä kuitti on jo tuotu. Uutta kirjausta ei tehdä.', exact=True)).to_be_visible()
            expect(page.get_by_role('button', name='Kirjaa', exact=False)).to_be_disabled()
            assert state(page) == after
            page.get_by_role('button', name='Hylkää luonnos', exact=True).click()
            if i == 0:
                page.get_by_role('button', name='Kumoa', exact=True).click()
                assert state(page) == before
                # Re-import after undo must be possible.
                page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(path)
                expect(page.locator('.receipt-review')).to_be_visible(timeout=30000)
                for select in page.locator('.receipt-product-category select').all():
                    if not select.input_value(): select.select_option('Muu meno')
                page.get_by_role('checkbox', name='Tarkistin tuotteet', exact=False).check()
                page.get_by_role('button', name='Kirjaa', exact=False).click()
                expect(page.locator('.receipt-review')).to_have_count(0)
                mark('Duplicate receipt blocked; undo restores exact state and allows re-import')
        saved = state(page)
        if len(files) == 9:
            import hashlib
            assert hashlib.sha256(files[3].read_bytes()).digest() != hashlib.sha256(files[-1].read_bytes()).digest()
            page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(files[-1])
            expect(page.get_by_text('Tämä kuitti on jo tuotu. Uutta kirjausta ei tehdä.', exact=True)).to_be_visible(timeout=30000)
            expect(page.get_by_role('button', name='Kirjaa', exact=False)).to_be_disabled()
            assert state(page) == saved
            page.get_by_role('button', name='Hylkää luonnos', exact=True).click()
            mark('A different PDF of the same purchase is blocked by semantic identity')
        expect(page.get_by_role('button', name='Kumoa', exact=True)).to_be_visible()
        # Receipt undo must expire after a later saved change, never erase that change.
        nav(page, 'Asetukset'); page.get_by_label('Väritila', exact=True).select_option('dark')
        expect(page.get_by_role('button', name='Kumoa', exact=True)).to_have_count(0)
        nav(page, 'Menot'); page.get_by_role('button', name='Skannaa kuitti', exact=True).click(); saved = state(page)
        mark('Later saved change expires receipt undo safely')
        page.reload(); nav(page, 'Menot'); page.get_by_role('button', name='Skannaa kuitti', exact=True).click()
        assert state(page)['receiptImports'] == saved['receiptImports']
        mark('All receipt groups and product details persist after reload')
        bad = Path(tmp) / 'bad.pdf'; bad.write_text('not a PDF')
        page.get_by_label('Skannaa PDF-kuitti', exact=True).set_input_files(bad)
        expect(page.get_by_text('Tiedosto ei ole PDF.', exact=True)).to_be_visible()
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
        expect(page.locator('.receipt-issue-source')).to_contain_text('TUNTEMATON ???')
        page.get_by_role('checkbox', name='Tarkistin tuotteet', exact=False).check()
        expect(page.get_by_role('button', name='Kirjaa', exact=False)).to_be_disabled()
        page.set_viewport_size({'width':320, 'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
        page.locator('.receipt-issue-source').scroll_into_view_if_needed(); page.screenshot(path='/tmp/receipt-source-error.png')
        assert state(page) == saved
        mark('Unknown structural row is shown with its source, blocks saving and fits 320px')
        assert not errors, errors
        assert not consoles, consoles
        assert not network, network
        mark('No JavaScript errors, console errors or external application requests')
        unique_purchases = len(state(page)["receiptImports"])
        browser.close()
Path(os.environ.get('TALOUS_RECEIPT_REPORT', str(ROOT / 'qa/receipt-e2e-results.json'))).write_text(json.dumps({'checks':results, 'suppliedPDFs':bool(args.pdfs), 'documentCount':len(files), 'uniquePurchases':unique_purchases, 'errors':errors, 'externalRequests':network}, ensure_ascii=False, indent=2)+'\n')
