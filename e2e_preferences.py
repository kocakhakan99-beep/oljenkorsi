"""Synthetic browser test; Vite must enable cloud and user preferences on port 5196."""
import base64
import json
import os
import time
from playwright.sync_api import sync_playwright, expect

def encode(value):
    return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')

users = {}
for number in (1, 2):
    user_id = f'a0000000-0000-4000-8000-00000000000{number}'
    token = encode({'alg': 'none', 'typ': 'JWT'}) + '.' + encode({'sub': user_id, 'exp': int(time.time()) + 3600, 'role': 'authenticated'}) + '.signature'
    user = {'id': user_id, 'aud': 'authenticated', 'role': 'authenticated', 'email': f'test{number}@example.invalid', 'app_metadata': {'provider': 'google'}, 'user_metadata': {}, 'created_at': '2026-01-01T00:00:00Z'}
    users[token] = {'user': user, 'preferences': None, 'revision': 0}

headers = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET, POST, OPTIONS'}
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER') or None, headless=True, args=['--no-sandbox'])
    def open_user(token):
        user = users[token]['user']
        session = {'access_token': token, 'refresh_token': 'fake-refresh', 'token_type': 'bearer', 'expires_in': 3600, 'expires_at': int(time.time()) + 3600, 'user': user}
        context = browser.new_context()
        context.add_init_script("localStorage.setItem('sb-xabfflmujxejqzhphpkh-auth-token', " + json.dumps(json.dumps(session)) + ")")
        context.add_init_script("localStorage.setItem('taloussuunnittelu.dismissed-help.v1', JSON.stringify(['dashboard-start']))")
        def handle(route):
            request = route.request
            if request.method == 'OPTIONS': return route.fulfill(status=204, headers=headers)
            if '/auth/v1/settings' in request.url: return route.fulfill(status=200, headers=headers, json={'external': {'google': True}})
            account = users[request.headers['authorization'].removeprefix('Bearer ')]
            if '/rpc/cloud_ensure_personal' in request.url: data = user['id']
            elif '/rpc/cloud_list_households' in request.url: data = [{'id': user['id'], 'name': 'Oma talous', 'kind': 'personal', 'revision': 0}]
            elif '/rpc/cloud_get_household' in request.url: data = {'id': user['id'], 'name': 'Oma talous', 'kind': 'personal', 'revision': 0, 'state': None}
            elif '/rpc/family_get' in request.url: data = None
            elif '/rpc/user_preferences_get' in request.url: data = {'revision': account['revision'], 'preferences': account['preferences']}
            elif '/rpc/user_preferences_save' in request.url:
                body = request.post_data_json
                if body['p_expected_revision'] != account['revision']: data = {'ok': False, 'conflict': True}
                else:
                    account['revision'] += 1
                    account['preferences'] = body['p_preferences']
                    data = {'ok': True, 'revision': account['revision']}
            else: raise AssertionError('Unexpected request: ' + request.url)
            return route.fulfill(status=200, headers=headers, json=data)
        context.route('https://xabfflmujxejqzhphpkh.supabase.co/**', handle)
        page = context.new_page()
        page.goto(os.environ.get('TALOUS_URL', 'http://127.0.0.1:5196/').rstrip('/') + '/#scenarios')
        expect(page.get_by_role('heading', name='Laskurit', exact=True)).to_be_visible(timeout=20000)
        return context, page

    token_a, token_b = users.keys()
    context, page = open_user(token_a)
    expect(page.get_by_text('Tiedot ovat vain tämän välilehden muistissa', exact=False)).not_to_be_visible()
    page.set_viewport_size({'width': 1280, 'height': 800})
    page.get_by_label('Oma profiili', exact=True).click()
    expect(page.get_by_label('Talouden valinta', exact=True)).to_be_visible()
    card = page.locator('.profile-popover').bounding_box()
    assert card['x'] >= 0 and card['x'] + card['width'] <= 1280
    page.keyboard.press('Escape')
    page.set_viewport_size({'width': 390, 'height': 844})
    profile = page.get_by_label('Oma profiili', exact=True)
    profile.click()
    expect(page.get_by_label('Talouden valinta', exact=True)).to_be_visible()
    menu_rect = page.locator('.mobile-menu-toggle').bounding_box()
    profile_rect = profile.bounding_box()
    assert abs(menu_rect['y'] - profile_rect['y']) < 5
    card = page.locator('.profile-popover').bounding_box()
    assert card['x'] >= 0 and card['x'] + card['width'] <= 390
    page.keyboard.press('Escape')
    expect(page.get_by_label('Talouden valinta', exact=True)).not_to_be_visible()
    page.set_viewport_size({'width': 1440, 'height': 900})
    expect(page.get_by_role('heading', name='FI-pääomatavoite')).to_be_visible()
    page.get_by_role('button', name='Korkoa korolle', exact=True).click()
    expect(page.get_by_role('heading', name='Korkoa korolle ja kulujen vaikutus')).to_be_visible()
    page.get_by_role('navigation').get_by_role('button', name='Asetukset', exact=True).click()
    page.get_by_label('Teema', exact=True).select_option('blue')
    expect(page.get_by_text('Asetukset tallennettu', exact=True)).to_be_visible(timeout=15000)
    assert users[token_a]['preferences']['theme'] == 'blue'
    assert users[token_a]['preferences']['dismissedHelp'] == []
    page.get_by_role('button', name='Tuo tämän selaimen vanhat ohjeasetukset').click()
    expect(page.get_by_text('Asetukset tallennettu', exact=True)).to_be_visible(timeout=15000)
    assert users[token_a]['preferences']['dismissedHelp'] == ['dashboard-start']
    page.get_by_role('tab', name='Talous', exact=True).click()
    expect(page.get_by_role('tabpanel', name='Talous')).to_be_visible()
    page.reload()
    page.get_by_role('tab', name='Ulkoasu ja käyttö').click()
    expect(page.get_by_label('Teema', exact=True)).to_have_value('blue')
    second_context, second_page = open_user(token_a)
    second_page.get_by_role('navigation').get_by_role('button', name='Asetukset', exact=True).click()
    page.get_by_label('Teema', exact=True).select_option('green')
    expect(page.get_by_text('Asetukset tallennettu', exact=True)).to_be_visible(timeout=15000)
    second_page.get_by_label('Väritila', exact=True).select_option('dark')
    expect(second_page.get_by_text('Asetusten versioristiriita', exact=True)).to_be_visible(timeout=15000)
    assert users[token_a]['preferences']['theme'] == 'green'
    assert users[token_a]['preferences']['mode'] != 'dark'
    second_page.on('dialog', lambda dialog: dialog.accept())
    second_page.get_by_role('button', name='Lataa pilven asetukset').click()
    expect(second_page.get_by_label('Teema', exact=True)).to_have_value('green', timeout=15000)
    second_context.close()
    context.close()
    context, page = open_user(token_b)
    page.get_by_role('navigation').get_by_role('button', name='Asetukset', exact=True).click()
    expect(page.get_by_label('Teema', exact=True)).to_have_value('neutral')
    assert users[token_b]['preferences'] is None
    print('PASS old link, calculators, settings tabs, preference reload, conflict and user isolation')
    context.close()
    browser.close()
