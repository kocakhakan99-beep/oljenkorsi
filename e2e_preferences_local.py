"""Test synthetic users against a local Supabase stack; never targets production."""
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
    def signup():
        result = api.post(url + '/auth/v1/signup', headers={'apikey': key}, data={
            'email': f'{uuid.uuid4()}@example.com', 'password': f'{uuid.uuid4()}aA1!',
        })
        assert result.ok, f'Local signup failed: {result.status}'
        return result.json()
    browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER') or None, headless=True, args=['--no-sandbox'])
    def open_session(session):
        context = browser.new_context()
        context.add_init_script("localStorage.setItem('sb-xabfflmujxejqzhphpkh-auth-token', " + json.dumps(json.dumps(session)) + ")")
        def forward(route):
            request = route.request
            headers = dict(request.headers)
            headers['apikey'] = key
            route.fulfill(response=route.fetch(url=url + request.url[len(prod):], headers=headers))
        context.route(prod + '/**', forward)
        page = context.new_page()
        page.goto('http://127.0.0.1:5196/#settings-appearance')
        expect(page.get_by_label('Teema', exact=True)).to_be_visible(timeout=30000)
        return context, page
    first, second = signup(), signup()
    context, page = open_session(first)
    page.get_by_label('Teema', exact=True).select_option('blue')
    expect(page.get_by_text('Asetukset tallennettu', exact=True)).to_be_visible(timeout=30000)
    context.unroute_all(behavior='wait')
    context.close()
    context, page = open_session(first)
    expect(page.get_by_label('Teema', exact=True)).to_have_value('blue')
    context.unroute_all(behavior='wait')
    context.close()
    context, page = open_session(second)
    expect(page.get_by_label('Teema', exact=True)).to_have_value('neutral')
    context.unroute_all(behavior='wait')
    context.close()
    browser.close()
    api.dispose()
    print('PASS browser preferences through local Supabase Auth and database, with user isolation')
