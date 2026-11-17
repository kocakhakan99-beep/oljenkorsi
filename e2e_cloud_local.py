"""Browser integration using an isolated local Supabase and synthetic data.

Start Vite with VITE_CLOUD_SAVE_ENABLED=true on port 5180 and supply
LOCAL_SUPABASE_URL and LOCAL_SUPABASE_ANON_KEY. No production data is used.
"""
import json
import os
import uuid
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

url = os.environ['LOCAL_SUPABASE_URL'].rstrip('/')
key = os.environ['LOCAL_SUPABASE_ANON_KEY']
if urlparse(url).hostname not in ('localhost', '127.0.0.1', '::1'):
    raise ValueError('A local Supabase URL is required')
prod = 'https://xabfflmujxejqzhphpkh.supabase.co'

with sync_playwright() as p:
    api = p.request.new_context()
    email = f'{uuid.uuid4()}@example.com'
    response = api.post(f'{url}/auth/v1/signup', headers={'apikey': key}, data={
        'email': email, 'password': f'{uuid.uuid4()}aA1!',
    })
    assert response.ok, f'Local signup failed: {response.status}'
    session = response.json()
    assert session.get('access_token')
    browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER') or None,
                                headless=True, args=['--no-sandbox'])
    context = browser.new_context()
    context.add_init_script("localStorage.setItem('sb-xabfflmujxejqzhphpkh-auth-token', " +
                            json.dumps(json.dumps(session)) + ")")

    def forward(route):
        request = route.request
        headers = dict(request.headers)
        headers['apikey'] = key
        result = route.fetch(url=url + request.url[len(prod):], headers=headers)
        route.fulfill(response=result)

    context.route(f'{prod}/**', forward)
    page = context.new_page()
    page.goto('http://127.0.0.1:5180/')
    expect(page.get_by_text('Ei vielä tallennettu', exact=True)).to_be_visible(timeout=30000)
    page.get_by_role('button', name='Lisää meno', exact=True).click()
    dialog = page.locator('dialog[open]')
    dialog.locator('[name=name]').fill('Paikallinen pilvitesti')
    dialog.locator('[name=amount]').fill('1000')
    dialog.locator('[name=category]').select_option(label='Asuminen')
    dialog.get_by_role('button', name='Tallenna meno', exact=True).click()
    expect(page.get_by_text('Tallennettu', exact=True)).to_be_visible(timeout=30000)
    page.reload()
    expect(page.get_by_text('Tallennettu', exact=True)).to_be_visible(timeout=30000)
    page.get_by_role('navigation').get_by_role('button', name='Menot', exact=True).click()
    expect(page.get_by_text('Paikallinen pilvitesti', exact=True).first).to_be_visible()
    print('PASS browser automatic save and reload through local Supabase')
    browser.close()
    api.dispose()
