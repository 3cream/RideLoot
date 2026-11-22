"""The prize sheet and odds with the uncommon tier, the foot of the page, and the floating button."""
import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
SEED = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:3,opened:6,pulls:{frame:2,sticker:3,car:1},sound:true,force:'random'}))}catch(e){}"
async def run(b, w, h, mobile, tag, errs):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
    await ctx.add_init_script(SEED)
    pg = await ctx.new_page()
    pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
    await pg.goto(URL); await pg.wait_for_timeout(900)
    print(tag, 'sheet:', await pg.evaluate("({count: document.getElementById('sheetCount').textContent, of: document.getElementById('sheetOf').textContent, rows: Array.from(document.querySelectorAll('#sheetList .sheet__item')).map(li => li.dataset.tier + ' | ' + li.querySelector('.sheet__name').textContent + ' | ' + li.querySelector('.sheet__odds').textContent)})"))
    print(tag, 'odds table:', await pg.evaluate("Array.from(document.querySelectorAll('#pvOdds tr')).map(tr => tr.textContent)"))
    print(tag, 'weights total:', await pg.evaluate("(() => { let s = 0; document.querySelectorAll('#pvOdds tr').length; return document.querySelectorAll('#sheetList .sheet__item').length; })()"))
    # the uncommon row of the sheet in focus
    await pg.evaluate("document.querySelector('#sheetList .sheet__item[data-tier=uncommon]').scrollIntoView({block: 'center'})"); await pg.wait_for_timeout(900)
    await pg.screenshot(path=f'{OUT}/s7_{tag}_sheet.png')
    # my pulls drawer with an uncommon pull in it
    await pg.evaluate("document.querySelector('[data-open=pullsDlg]').click()"); await pg.wait_for_timeout(600)
    await pg.screenshot(path=f'{OUT}/s7_{tag}_pulls.png')
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    # final call + floating button
    await pg.evaluate("document.querySelector('.final').scrollIntoView({block: 'center'})"); await pg.wait_for_timeout(900)
    await pg.screenshot(path=f'{OUT}/s7_{tag}_final.png')
    await pg.evaluate("document.querySelector('.foot').scrollIntoView({block: 'start'})"); await pg.wait_for_timeout(700)
    await pg.screenshot(path=f'{OUT}/s7_{tag}_foot.png')
    # the floating button: somewhere in the middle of the page
    await pg.evaluate("document.getElementById('how').scrollIntoView({block: 'center'})"); await pg.wait_for_timeout(900)
    print(tag, 'fab on:', await pg.evaluate("document.getElementById('fab').classList.contains('is-on')"))
    await pg.screenshot(path=f'{OUT}/s7_{tag}_fab.png')
    print(tag, 'overflow-x:', await pg.evaluate("document.documentElement.scrollWidth - innerWidth"))
    await ctx.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        await run(b, 1408, 790, False, 'd', errs)
        await run(b, 390, 844, True, 'm', errs)
        print('errors:', [e for e in errs if 'ERR_' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        await b.close()
asyncio.run(main())
