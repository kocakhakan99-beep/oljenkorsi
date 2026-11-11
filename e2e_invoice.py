"""Default build invoice flow; API is mocked and no real keys or documents are used."""
import json, os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

url = os.environ.get('TALOUS_URL', (Path(__file__).parent / 'index.html').as_uri())
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER') or None, headless=True, args=['--no-sandbox'])
    page = browser.new_page()
    requests = []
    def handle(route):
        if route.request.method == 'POST':
            requests.append(route.request.post_data_json)
        route.fulfill(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS'}, content_type='application/json', body=json.dumps({'choices': [{'message': {'content': json.dumps({'name': 'Testilasku', 'amount_eur': 42.55, 'due_date': '2026-11-25'})}}]}))
    page.route('https://openrouter.ai/api/v1/chat/completions', handle)
    page.goto(url)
    page.get_by_role('button', name='Aloita tyhjästä').click()
    page.get_by_role('navigation').get_by_role('button', name='Budjetti', exact=True).click()
    page.get_by_role('button', name='Analysoi lasku', exact=True).click()
    page.get_by_label('Lähetettävä laskuteksti').fill('Fiktiivinen lasku 42,55')
    page.get_by_label('AI-palvelu').select_option('openrouter')
    page.get_by_label('OpenRouter API-avain').fill('test-key')
    assert not requests
    expect(page.get_by_role('button', name='Lähetä teksti analysoitavaksi')).to_be_enabled()
    page.get_by_role('button', name='Lähetä teksti analysoitavaksi').click()
    expect(page.get_by_role('heading', name='Tarkista ehdotus')).to_be_visible()
    assert len(requests) == 1 and requests[0]['model'] == 'nvidia/nemotron-3-ultra-550b-a55b:free'
    page.get_by_role('button', name='Jatka toistuvana laskuna').click()
    dialog = page.locator('dialog[open]')
    expect(dialog.locator('[name=name]')).to_have_value('Testilasku')
    expect(dialog.locator('[name=amount]')).to_have_value('42,55')
    dialog.locator('.quick-entry-details summary').click()
    expect(dialog.locator('[name=recurrence]')).to_have_value('monthly')
    dialog.get_by_role('button', name='Tallenna meno', exact=True).click()
    state = page.evaluate("localStorage.getItem('taloussuunnittelu.v1')")
    assert 'test-key' not in state and 'Fiktiivinen lasku 42,55' not in state
    print('PASS: index.html, OpenRouter mock, review, recurring expense, and data minimization')
    worker_page = browser.new_page()
    worker_requests = []
    worker_headers = []
    def worker_handle(route):
        if route.request.method == 'POST':
            worker_requests.append(route.request.post_data_json)
            worker_headers.append(route.request.headers)
        route.fulfill(status=200, headers={'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS'}, content_type='application/json', body=json.dumps({'choices': [{'message': {'content': json.dumps({'name': 'Testilasku', 'amount_eur': 42.55, 'due_date': '2026-11-25'})}}]}))
    worker_page.route('https://api-worker.kocakhakan99.workers.dev/chat', worker_handle)
    worker_page.goto(url)
    worker_page.get_by_role('button', name='Aloita tyhjästä').click()
    worker_page.get_by_role('navigation').get_by_role('button', name='Menot', exact=True).click()
    worker_page.get_by_role('button', name='Analysoi lasku', exact=True).click()
    expect(worker_page.get_by_label('AI-palvelu')).to_have_value('worker')
    worker_page.get_by_label('Lähetettävä laskuteksti').fill('Fiktiivinen lasku')
    submit = worker_page.get_by_role('button', name='Lähetä teksti analysoitavaksi')
    expect(submit).to_be_disabled()
    worker_page.get_by_label('Worker API-avain').fill('worker-test-key')
    expect(submit).to_be_enabled()
    submit.click()
    expect(worker_page.get_by_role('heading', name='Tarkista ehdotus')).to_be_visible()
    expect(worker_page.get_by_label('Worker API-avain')).to_have_value('')
    expect(submit).to_be_disabled()
    assert len(worker_requests) == 1 and worker_requests[0]['model'] == 'nvidia/nemotron-3-ultra-550b-a55b:free'
    assert worker_headers[0].get('authorization') == 'Bearer worker-test-key'
    assert 'worker-test-key' not in worker_page.evaluate("localStorage.getItem('taloussuunnittelu.v1')")
    assert 'Fiktiivinen lasku' not in worker_page.evaluate("localStorage.getItem('taloussuunnittelu.v1')")
    print('PASS: Worker requires a Bearer key and requests a free model')
    browser.close()
