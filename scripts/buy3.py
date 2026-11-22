"""Out of packs: the floating button just says Buy now, and it opens the pack page."""
import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
SEED = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:0,opened:1,pulls:{sticker:1},sound:true,force:'random'}))}catch(e){}"
async def run(b, w, h, mobile, tag, errs):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
    await ctx.add_init_script(SEED)
    pg = await ctx.new_page()
    pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
    await pg.goto(URL); await pg.wait_for_timeout(800)
    await pg.evaluate("document.getElementById('how').scrollIntoView({block: 'center'})"); await pg.wait_for_timeout(1600)
    print(tag, await pg.evaluate("(() => { const f = document.getElementById('fab'), r = f.getBoundingClientRect(); return { on: f.classList.contains('is-on'), text: f.innerText.replace(/\\n/g, ' | '), aria: f.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), hero: document.querySelector('.hero__copy [data-cta-label]').textContent, page: document.body.innerText.toLowerCase().includes('out of packs') }; })()"))
    bx = await pg.evaluate("(() => { const r = document.getElementById('fab').getBoundingClientRect(); return {x: r.left, y: r.top, w: r.width, h: r.height}; })()")
    await pg.screenshot(path=f'{OUT}/buy_{tag}.png', clip={'x': max(0, bx['x'] - 60), 'y': bx['y'] - 40, 'width': min(w, bx['w'] + 120), 'height': bx['h'] + 70})
    if mobile: await pg.tap('#fab')
    else: await pg.click('#fab')
    await pg.wait_for_timeout(700)
    print(tag, 'pack page open:', await pg.evaluate("document.getElementById('productDlg').open"))
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
