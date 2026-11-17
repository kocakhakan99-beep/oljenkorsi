# Run against a Vite server started with VITE_CLOUD_SAVE_ENABLED=true. All data and responses are synthetic.
from playwright.sync_api import sync_playwright, expect
import json, base64, time, os
uid='a0000000-0000-4000-8000-000000000001';hid='a0000000-0000-4000-8000-000000000002'
def enc(x):return base64.urlsafe_b64encode(json.dumps(x).encode()).decode().rstrip('=')
tok=enc({'alg':'none','typ':'JWT'})+'.'+enc({'sub':uid,'exp':int(time.time())+3600,'role':'authenticated'})+'.signature'
u={'id':uid,'aud':'authenticated','role':'authenticated','email':'test@example.invalid','app_metadata':{'provider':'google'},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
session={'access_token':tok,'refresh_token':'fake-refresh','token_type':'bearer','expires_in':3600,'expires_at':int(time.time())+3600,'user':u}
stored={'revision':0,'state':None,'requests':0,'conflict':False,'failLoad':False,'loseResponse':False,'receipts':{},'bodies':[]}
headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET, POST, OPTIONS'}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER') or None,headless=True,args=['--no-sandbox']);c=b.new_context();c.add_init_script("window.__oljenkorsiTestMode=true; localStorage.setItem('sb-xabfflmujxejqzhphpkh-auth-token', "+json.dumps(json.dumps(session))+")")
 def handle(route):
  req=route.request;url=req.url
  if req.method=='OPTIONS':return route.fulfill(status=204,headers=headers)
  if '/auth/v1/logout' in url:return route.fulfill(status=204,headers=headers)
  if '/auth/v1/settings' in url:data={'external':{'google':True,'apple':False}}
  elif '/rpc/cloud_ensure_personal' in url:data=hid
  elif '/rpc/cloud_list_households' in url:data=[{'id':hid,'name':'Oma talous','kind':'personal','revision':stored['revision']}]
  elif '/rpc/cloud_get_household' in url:
   if stored['failLoad']:return route.fulfill(status=500,headers=headers,json={'message':'synthetic failure'})
   data={'id':hid,'name':'Oma talous','kind':'personal','revision':stored['revision'],'state':stored['state']}
  elif '/functions/v1/cloud-save' in url:
   body=req.post_data_json;assert body['householdId']==hid;stored['requests']+=1;stored['bodies'].append(body)
   if body['mutationId'] in stored['receipts']:
    original,revision=stored['receipts'][body['mutationId']];assert body==original;data={'ok':True,'revision':revision}
   elif stored['conflict'] or body['expectedRevision']!=stored['revision']:data={'ok':False,'conflict':True}
   else:
    stored['revision']+=1;stored['state']=body['snapshot'];stored['receipts'][body['mutationId']]=(body,stored['revision']);data={'ok':True,'revision':stored['revision']}
    if stored['loseResponse']:stored['loseResponse']=False;return route.abort('failed')
  else: raise Exception('unexpected request '+url)
  return route.fulfill(status=200,headers=headers,json=data)
 c.route('https://xabfflmujxejqzhphpkh.supabase.co/**',handle)
 page=c.new_page();page.goto(os.environ.get('TALOUS_URL','http://127.0.0.1:5184/'));expect(page.get_by_text('Ei vielä tallennettu',exact=True)).to_be_visible(timeout=20000)
 page.get_by_role('button',name='Lisää meno',exact=True).click();d=page.locator('dialog[open]');d.locator('[name=name]').fill('Pilvitesti');d.locator('[name=amount]').fill('1000');d.locator('[name=category]').select_option(label='Asuminen');d.get_by_role('button',name='Tallenna meno',exact=True).click();expect(page.get_by_text('Tallennettu',exact=True)).to_be_visible(timeout=5000);assert stored['requests']==1
 page.reload();expect(page.get_by_text('Tallennettu',exact=True)).to_be_visible(timeout=20000);page.get_by_role('navigation').get_by_role('button',name='Menot',exact=True).click();expect(page.get_by_text('Pilvitesti',exact=True).first).to_be_visible();print('PASS automatic save and reload',flush=True)
 if os.environ.get('CLOUD_TEST_SNAPSHOT_PATH'):
  from pathlib import Path
  Path(os.environ['CLOUD_TEST_SNAPSHOT_PATH']).write_text(json.dumps(stored['state']))
 stored['loseResponse']=True
 page.get_by_role('button',name='Lisää kertaluonteinen meno',exact=True).click();d=page.locator('dialog[open]');d.locator('[name=name]').fill('Kadonnut kuittaus');d.locator('[name=amount]').fill('1200');d.locator('[name=category]').select_option(label='Asuminen');d.get_by_role('button',name='Tallenna meno',exact=True).click()
 expect(page.get_by_text('Tallennettu',exact=True)).to_be_visible(timeout=20000);assert stored['requests']==3 and stored['revision']==2 and stored['bodies'][-1]==stored['bodies'][-2]
 page.reload();expect(page.get_by_text('Tallennettu',exact=True)).to_be_visible(timeout=20000);page.get_by_role('navigation').get_by_role('button',name='Menot',exact=True).click();expect(page.get_by_text('Kadonnut kuittaus',exact=True).first).to_be_visible();print('PASS lost response retries safely',flush=True)
 stored['conflict']=True
 page.get_by_role('button',name='Lisää kertaluonteinen meno',exact=True).click();d=page.locator('dialog[open]');d.locator('[name=name]').fill('Vientitesti');d.locator('[name=amount]').fill('1100');d.locator('[name=category]').select_option(label='Asuminen');d.get_by_role('button',name='Tallenna meno',exact=True).click()
 expect(page.get_by_text('Versioristiriita',exact=True)).to_be_visible(timeout=20000);expect(page.get_by_text('Vientitesti',exact=True).first).to_be_visible();assert stored['requests']==4;print('PASS conflict preserves local changes',flush=True)
 page.evaluate("async()=>{const {supabase}=await import('/services/supabase.ts');await supabase.auth.signOut({scope:'local'})}")
 expect(page.get_by_text('Muistissa on tallentamattomia tietoja ennen tilin vaihtoa.',exact=False)).to_be_visible(timeout=10000)
 with page.expect_download() as download:page.get_by_role('button',name='Vie varmuuskopio',exact=True).click()
 assert download.value.suggested_filename.endswith('.json')
 page.get_by_role('button',name='Hylkää muistissa olevat tiedot ja jatka',exact=True).click();expect(page.get_by_role('button',name='Jatka vieraana')).to_be_visible();print('PASS unsaved data protected on sign out',flush=True)
 stored['failLoad']=True;before=stored['requests'];c.close();c=b.new_context();c.add_init_script("localStorage.setItem('sb-xabfflmujxejqzhphpkh-auth-token', "+json.dumps(json.dumps(session))+")");c.route('https://xabfflmujxejqzhphpkh.supabase.co/**',handle);page=c.new_page();page.goto(os.environ.get('TALOUS_URL','http://127.0.0.1:5184/'));expect(page.get_by_text('Taloutta ei voitu ladata.',exact=False)).to_be_visible(timeout=20000);assert page.get_by_role('button',name='Lisää meno',exact=True).count()==0 and stored['requests']==before;print('PASS failed initial load cannot overwrite cloud data',flush=True)
 stored['failLoad']=False;stored['state']=stored['state']['backup'];stored['state']['checksum']='00000000';c.close();c=b.new_context();c.add_init_script("localStorage.setItem('sb-xabfflmujxejqzhphpkh-auth-token', "+json.dumps(json.dumps(session))+")");c.route('https://xabfflmujxejqzhphpkh.supabase.co/**',handle);page=c.new_page();page.on('dialog',lambda dialog:dialog.accept());page.goto(os.environ.get('TALOUS_URL','http://127.0.0.1:5184/'));expect(page.get_by_text('Vanhan perhetallennuksen eheyttä ei voida varmistaa.',exact=False)).to_be_visible(timeout=20000);assert stored['requests']==before;page.get_by_role('button',name='Lataa vanha talous',exact=True).click();expect(page.get_by_text('Tallennettu',exact=True)).to_be_visible(timeout=20000);assert stored['requests']==before;page.get_by_role('navigation').get_by_role('button',name='Menot',exact=True).click();expect(page.get_by_text('Pilvitesti',exact=True).first).to_be_visible();print('PASS legacy data requires explicit confirmation',flush=True)
 b.close()
