"""Exercise the single expense scanner, shortcuts and window-wide PDF dropping."""
from pathlib import Path
import base64, json, os
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).parent
checks=[]
def mark(s):checks.append(s);print('PASS:',s,flush=True)
def nav(page,name):
    if not page.get_by_role('navigation').is_visible():page.locator('.mobile-menu-toggle').click()
    page.get_by_role('navigation').get_by_role('button',name=name,exact=True).click()
def data(page,files):
    return page.evaluate_handle('files=>{const d=new DataTransfer();for(const f of files){const b=Uint8Array.from(atob(f.bytes),c=>c.charCodeAt(0));d.items.add(new File([b],f.name,{type:f.type||"application/pdf"}));}return d}',files)
def pdf_file(name='alepa-1.pdf'):
    return {'name':name,'bytes':base64.b64encode((ROOT/'examples/receipts'/name).read_bytes()).decode()}
def drop(page,target,dt):
    page.dispatch_event(target,'dragenter',{'dataTransfer':dt});page.dispatch_event(target,'dragover',{'dataTransfer':dt});page.dispatch_event(target,'drop',{'dataTransfer':dt})
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('TALOUS_BROWSER','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    ctx=browser.new_context(viewport={'width':1280,'height':950});page=ctx.new_page();errors=[];network=[];consoles=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:consoles.append(m.text) if m.type=='error' else None)
    page.on('request',lambda r:network.append(r.url) if not r.url.startswith(('http://127.0.0.1:','http://localhost:','data:','blob:','file:')) else None)
    page.goto(os.environ.get('TALOUS_URL','http://127.0.0.1:8765/index.html'))
    page.get_by_role('button',name='Aloita tyhjästä',exact=True).click()
    state=lambda:page.evaluate("localStorage.getItem('taloussuunnittelu.v1')")
    original=state();nav(page,'Menot');expect(page.locator('.receipt-scanner')).not_to_be_visible()
    launch=page.get_by_role('button',name='Skannaa kuitti',exact=True);expect(launch).to_have_attribute('aria-expanded','false');launch.focus();launch.press('Enter');expect(launch).to_have_attribute('aria-expanded','true')
    expect(page.get_by_role('heading',name='Kuittiskannaus',exact=True)).to_be_focused()
    expect(page.locator('.receipt-scanner')).to_be_visible();page.get_by_role('button',name='Sulje kuittiskannaus',exact=True).click()
    expect(page.get_by_role('button',name='Skannaa kuitti',exact=True)).to_be_focused()
    nav(page,'Budjetti');page.get_by_role('button',name='Skannaa kuitti',exact=True).click()
    expect(page.get_by_role('heading',name='Menot',exact=True)).to_be_visible();assert page.locator('.receipt-scanner').count()==1
    expect(page.locator('.receipt-scanner')).to_be_visible();assert state()==original
    mark('One collapsed scanner in Expenses; keyboard and budget shortcut open the same workspace')
    page.get_by_role('button',name='Sulje kuittiskannaus',exact=True).click()
    dt=data(page,[pdf_file()])
    page.dispatch_event('body','dragenter',{'dataTransfer':dt});page.dispatch_event('main h1','dragenter',{'dataTransfer':dt})
    page.dispatch_event('main h1','dragleave',{'dataTransfer':dt});expect(page.locator('.receipt-drop-overlay')).to_be_visible()
    page.keyboard.press('Escape');expect(page.locator('.receipt-drop-overlay')).to_have_count(0)
    page.dispatch_event('body','dragenter',{'dataTransfer':dt});page.dispatch_event('body','dragleave',{'dataTransfer':dt});expect(page.locator('.receipt-drop-overlay')).to_have_count(0)
    mark('Drop overlay tolerates nested elements and clears on leaving or Escape')
    for section,target in [('Menot','main h1'),('Budjetti','aside .brand'),('Asetukset','main .panel')]:
        nav(page,section);drop(page,target,dt)
        expect(page.get_by_role('heading',name='Menot',exact=True)).to_be_visible()
        expect(page.get_by_role('heading',name='Tarkista kuitti',exact=True)).to_be_visible(timeout=30000)
        expect(page.locator('.receipt-review [role=alert]')).to_have_count(0)
        assert len(page.locator('.receipt-product').all())==29
        assert state()==original
        page.get_by_role('button',name='Hylkää luonnos',exact=True).click()
        mark(f'PDF drop anywhere in {section} opens and parses in Expenses without financial writes')
    # Preserve a manual classification across close, navigation, and reopening.
    drop(page,'main h1',dt);expect(page.locator('.receipt-review')).to_be_visible(timeout=30000)
    first=page.locator('.receipt-product-category select').first;first.select_option('Muu meno')
    page.get_by_role('button',name='Sulje kuittiskannaus',exact=True).click();nav(page,'Budjetti')
    page.get_by_role('button',name='Skannaa kuitti',exact=True).click();expect(first).to_have_value('Muu meno')
    nav(page,'Budjetti');page.once('dialog',lambda d:d.dismiss());drop(page,'main h1',data(page,[pdf_file('prisma-1.pdf')]))
    expect(page.get_by_role('heading',name='Budjetti',exact=True)).to_be_visible()
    page.get_by_role('button',name='Skannaa kuitti',exact=True).click();expect(first).to_have_value('Muu meno')
    mark('Draft and classifications survive closing/navigation; rejecting replacement keeps the original')
    page.once('dialog',lambda d:d.accept());drop(page,'main h1',data(page,[pdf_file('prisma-1.pdf')]))
    expect(page.locator('.receipt-product')).to_have_count(30,timeout=30000)
    mark('Approved replacement parses the new PDF')
    nav(page,'Asetukset')
    for files,message in [([{'name':'image.png','bytes':base64.b64encode(b'image').decode(),'type':'image/png'}],'vain PDF'),([pdf_file(),pdf_file('prisma-1.pdf')],'yksi PDF')]:
        drop(page,'main h1',data(page,files));expect(page.locator('.alert[role=status]')).to_contain_text(message)
        expect(page.get_by_role('heading',name='Asetukset',exact=True)).to_be_visible();assert state()==original
    nav(page,'Menot');page.get_by_role('button',name='Skannaa kuitti',exact=True).click();expect(page.locator('.receipt-product')).to_have_count(30)
    mark('Non-PDF and multi-file drops are rejected before navigation and do not erase the draft')
    page.get_by_role('button',name='Hylkää luonnos',exact=True).click()
    page.get_by_role('button',name='+ Lisää kertaluonteinen meno',exact=True).click()
    drop(page,'dialog[open]',dt);expect(page.locator('dialog[open]')).to_be_visible();assert state()==original
    page.get_by_role('button',name='Sulje',exact=True).click()
    mark('An open editor is protected from file drops')
    nav(page,'Raportit');drop(page,'main h1',dt);expect(page.get_by_role('heading',name='Raportit',exact=True)).to_be_visible()
    expect(page.locator('.receipt-drop-overlay')).to_have_count(0);expect(page.locator('.receipt-review')).to_have_count(0)
    mark('Other views do not start receipt processing or navigate away on file drop')
    nav(page,'Tuonti ja vienti');expect(page.locator('.receipt-scanner')).not_to_be_visible()
    page.get_by_role('button',name='Kuittiskannaus menoissa',exact=True).click();expect(page.get_by_role('heading',name='Menot',exact=True)).to_be_visible()
    mark('Former import location links to Expenses without a second scanner')
    with page.expect_file_chooser() as chooser: page.get_by_role('button',name='Valitse PDF',exact=True).click()
    chooser.value.set_files(ROOT/'examples/receipts/alepa-1.pdf')
    expect(page.locator('.receipt-product')).to_have_count(29,timeout=30000)
    page.get_by_role('button',name='Hylkää luonnos',exact=True).click()
    mark('Accessible PDF button opens the native file chooser and uses the same parser')
    nav(page,'Asetukset');page.get_by_label('Väritila',exact=True).select_option('dark');nav(page,'Menot')
    page.dispatch_event('body','dragenter',{'dataTransfer':dt});expect(page.locator('.receipt-drop-overlay')).to_be_visible()
    page.screenshot(path='/tmp/receipt-drop-desktop.png');page.keyboard.press('Escape')
    for width in [320,390,768]:
        page.set_viewport_size({'width':width,'height':950});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    page.set_viewport_size({'width':390,'height':950});page.locator('.receipt-scanner').scroll_into_view_if_needed();page.screenshot(path='/tmp/receipt-home-mobile.png')
    mark('Expense scanner and shortcuts fit 320–768 px and the drop overlay works in dark mode')
    assert not errors,errors
    assert not consoles,consoles
    assert not network,network
    mark('No JavaScript errors, console errors or external application requests')
    browser.close()
(ROOT/'qa/receipt-drop-results.json').write_text(json.dumps({'passed':checks,'errors':errors,'consoleErrors':consoles,'externalRequests':network},ensure_ascii=False,indent=2)+'\n')
