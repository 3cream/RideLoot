"""A tour of the site on a phone screen: the page top to bottom, then opening a pack."""
import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
W, H = 390, 844
PHASE = "document.getElementById('rip').dataset.phase"
NOSMOOTH = "document.documentElement.style.scrollBehavior = 'auto'"
async def until(pg, want, limit=12000):
    t = 0
    while t < limit:
        if await pg.evaluate(PHASE) == want: return True
        await pg.wait_for_timeout(100); t += 100
    return False
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        def watch(pg):
            pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
            pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        kw = dict(viewport={'width': W, 'height': H}, device_scale_factor=3, is_mobile=True, has_touch=True)

        # ---------- the page, as a first-time visitor (the free pack popup held back so the page shows) ----------
        ctx = await b.new_context(**kw)
        await ctx.add_init_script("try{sessionStorage.setItem('rl-gate','1')}catch(e){}")
        pg = await ctx.new_page(); watch(pg)
        await pg.goto(URL); await pg.wait_for_timeout(1500); await pg.evaluate(NOSMOOTH)
        await pg.screenshot(path=f'{OUT}/pt_a1.png')
        async def at(sel, block, name, extra=0, wait=1100):
            await pg.evaluate(f"(() => {{ const el = document.querySelector('{sel}'); el.scrollIntoView({{block: '{block}'}}); window.scrollBy(0, {extra}); }})()")
            await pg.wait_for_timeout(wait); await pg.screenshot(path=f'{OUT}/{name}.png')
        await at('#pack .sec__head', 'start', 'pt_a2', -70)
        await at('#pack .pcard--big:nth-of-type(2)', 'center', 'pt_a3')
        info = await pg.evaluate("(() => { const s = document.getElementById('prize'); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, vh: innerHeight, n: document.querySelectorAll('#prize .slide').length }; })()")
        for i, name in ((0, 'pt_a4'), (6, 'pt_a5')):
            prog = 0.14 + (i + 0.5) * 0.86 / info['n']
            await pg.evaluate(f"window.scrollTo(0, {info['top'] + prog * (info['h'] - info['vh'])})"); await pg.wait_for_timeout(1400)
            await pg.screenshot(path=f'{OUT}/{name}.png')
        await at('#how .sec__head', 'start', 'pt_a6', -60)
        await at('#inside .sheet__view', 'start', 'pt_a7', -90, 1300)
        await pg.evaluate("document.getElementById('free-packs').open = true")
        await at('#free-packs', 'start', 'pt_a8', -100)
        await at('.final', 'center', 'pt_a9')
        await at('.foot', 'start', 'pt_a10', -20)
        await pg.evaluate("window.scrollTo(0, 0)"); await pg.wait_for_timeout(700)
        await pg.tap('.hdr__menu'); await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/pt_a11.png')
        await ctx.close()

        # ---------- opening a pack ----------
        ctx = await b.new_context(**kw)
        pg = await ctx.new_page(); watch(pg)
        await pg.goto(URL); await pg.wait_for_timeout(4300)      # the free pack popup opens by itself
        print('popup open:', await pg.evaluate("document.getElementById('gateDlg').open"))
        await pg.screenshot(path=f'{OUT}/pt_b1.png')
        await pg.fill('#gateEmail', 'driver@example.com')
        await pg.evaluate("document.getElementById('forceSel').value='legendary'; document.getElementById('forceSel').dispatchEvent(new Event('change'))")
        await pg.tap('#gateForm button[type=submit]')
        await until(pg, 'ready'); await pg.wait_for_timeout(2300)
        await pg.screenshot(path=f'{OUT}/pt_b2.png')
        await pg.tap('#tapRipBtn')
        await until(pg, 'charge'); await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{OUT}/pt_b3.png')
        await until(pg, 'done'); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/pt_b4.png')
        print('pull:', await pg.evaluate("document.getElementById('ripName').textContent"))
        await pg.tap('#againBtn'); await pg.wait_for_timeout(1200)   # out of packs: this opens the pack page
        print('pack page open:', await pg.evaluate("document.getElementById('productDlg').open"))
        await pg.screenshot(path=f'{OUT}/pt_b5.png')
        await pg.evaluate("document.querySelector('#productDlg [data-close]').click()"); await pg.wait_for_timeout(500)
        if await pg.evaluate("!document.getElementById('rip').hidden"):
            await pg.evaluate("document.getElementById('doneBtn').click()"); await pg.wait_for_timeout(900)
        await pg.evaluate("document.querySelector('[data-open=pullsDlg]').click()"); await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{OUT}/pt_b6.png')
        await ctx.close()
        print('errors:', [e for e in errs if 'ERR_' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        await b.close()
asyncio.run(main())
