"""Close look at the rip guide: several frames of the ready state, then a slow swipe to check the reveal is not skipped."""
import asyncio, sys
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
W = int(sys.argv[1]) if len(sys.argv) > 1 else 1408
H = int(sys.argv[2]) if len(sys.argv) > 2 else 790
MOBILE = W < 600
PHASE = "document.getElementById('rip').dataset.phase"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2 if MOBILE else 1, is_mobile=MOBILE, has_touch=MOBILE)
        await ctx.add_init_script("try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:3,opened:6,pulls:{},sound:true,force:'epic'}))}catch(e){}")
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/g{W}_0_hero.png')
        if MOBILE: await pg.tap('#heroPack')
        else: await pg.click('#heroPack')
        await pg.wait_for_timeout(1300)
        for i in range(4):
            await pg.screenshot(path=f'{OUT}/g{W}_1_ready{i}.png')
            await pg.wait_for_timeout(560)
        box = await pg.evaluate("(() => { const r = document.querySelector('.pk--rip').getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:r.height}; })()")
        y = box['y'] + box['h'] * 0.11; x0 = box['x'] + 4
        await pg.mouse.move(x0, y); await pg.mouse.down()
        for i in range(1, 12):
            await pg.mouse.move(x0 + box['w'] * 0.05 * i, y, steps=2); await pg.wait_for_timeout(25)
        await pg.screenshot(path=f'{OUT}/g{W}_2_half.png')
        for i in range(12, 20):
            await pg.mouse.move(x0 + box['w'] * 0.05 * i, y, steps=2); await pg.wait_for_timeout(25)
        await pg.mouse.up()
        await pg.wait_for_timeout(450)
        print('phase 0.45s after release:', await pg.evaluate(PHASE))
        await pg.screenshot(path=f'{OUT}/g{W}_3_torn.png')
        await pg.wait_for_timeout(900)
        print('phase 1.35s after release:', await pg.evaluate(PHASE))
        await pg.screenshot(path=f'{OUT}/g{W}_4_peek.png')
        t = 0
        while t < 9000 and await pg.evaluate(PHASE) != 'done':
            await pg.wait_for_timeout(120); t += 120
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/g{W}_5_done.png')
        print('done after', t, 'ms; selection:', repr(await pg.evaluate("String(getSelection())")))
        print('errors:', [e for e in errs if 'ERR_TUNNEL' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        await b.close()
asyncio.run(main())
