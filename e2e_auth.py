from playwright.sync_api import sync_playwright, expect
import json, base64, time, os
# Start the Vite development server first; all OAuth responses below are synthetic.
url=os.environ.get('TALOUS_URL', 'http://127.0.0.1:5182/')
def payload(x):return base64.urlsafe_b64encode(json.dumps(x).encode()).decode().rstrip('=')
token=payload({'alg':'none','typ':'JWT'})+'.'+payload({'sub':'11111111-1111-4111-8111-111111111111','exp':int(time.time())+3600,'role':'authenticated'})+'.signature'
user={'id':'11111111-1111-4111-8111-111111111111','aud':'authenticated','role':'authenticated','email':'test@example.invalid','app_metadata':{'provider':'google'},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER') or None,headless=True,args=['--no-sandbox'])
 for mode in ('provider_error','missing_verifier','success'):
  c=b.new_context();c.route('**/auth/v1/settings',lambda route:route.fulfill(status=200,headers={'access-control-allow-origin':'*'},json={'external':{'google':True,'apple':False}}))
  if mode=='success':
   c.add_init_script("localStorage.setItem('sb-xabfflmujxejqzhphpkh-auth-token-code-verifier', JSON.stringify('test-verifier'))")
   def api(route):
    if route.request.method=='OPTIONS': route.fulfill(status=200,headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'POST, OPTIONS'})
    else: route.fulfill(status=200,headers={'access-control-allow-origin':'*'},json={'access_token':token,'refresh_token':'test-refresh','token_type':'bearer','expires_in':3600,'user':user})
   c.route('**/auth/v1/token?grant_type=pkce',api)
  page=c.new_page(); suffix={'provider_error':'#error=server_error&error_code=unexpected_failure&error_description=provider_error','missing_verifier':'?code=fake-code#settings','success':'?code=fake-code#settings'}[mode];page.goto(url+suffix)
  if mode=='success':
   expect(page.get_by_role('button',name='Jatka vieraana')).to_have_count(0,timeout=15000)
   expect(page.get_by_text('Kirjautunut: test@example.invalid')).to_be_visible(timeout=15000)
   assert 'code=' not in page.url
  else:
   expect(page.get_by_text('Kirjautumista ei voitu viimeistellä.',exact=False).last).to_be_visible(timeout=15000)
   assert 'fake-code' not in page.url and 'provider_error' not in page.url
  print('PASS',mode,flush=True);c.close()
 b.close()
