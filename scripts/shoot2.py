import asyncio
from playwright.async_api import async_playwright

URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
FORCE = "document.getElementById('forceSel').value='%s'; document.getElementById('forceSel').dispatchEvent(new Event('change'))"
PHASE = "document.getElementById('rip').dataset.phase"

async def until_done(pg, limit=9000):
    t = 0
    while t < limit:
        if await pg.evaluate(PHASE) == 'done':
            return True
        await pg.wait_for_timeout(150); t += 150
    return False

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        errs = []
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append(('console', m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/v2_d1_top.png')
        await pg.screenshot(path=f'{OUT}/v2_d2_full.png', full_page=True)
        await pg.evaluate("document.getElementById('addPacksBtn').click()")
        await pg.evaluate(FORCE % 'legendary')
        await pg.click('#ripBtn')
        await pg.wait_for_timeout(1100)
        await pg.screenshot(path=f'{OUT}/v2_d3_ready.png')
        box = await pg.evaluate("(() => { const r = document.querySelector('.pk--rip').getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:r.height}; })()")
        y = box['y'] + box['h'] * 0.08
        await pg.mouse.move(box['x'] + 6, y)
        await pg.mouse.down()
        for i in range(1, 9):
            await pg.mouse.move(box['x'] + 6 + box['w'] * 0.055 * i, y, steps=2)
            await pg.wait_for_timeout(30)
        await pg.screenshot(path=f'{OUT}/v2_d4_tearing.png')
        for i in range(9, 16):
            await pg.mouse.move(box['x'] + 6 + box['w'] * 0.055 * i, y, steps=2)
            await pg.wait_for_timeout(30)
        await pg.mouse.up()
        await pg.wait_for_timeout(1250)
        await pg.screenshot(path=f'{OUT}/v2_d5_peek.png')
        ok = await until_done(pg)
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/v2_d6_done.png')
        print('desktop done:', ok, await pg.evaluate("({phase: document.getElementById('rip').dataset.phase, name: document.getElementById('ripName').textContent, status: document.getElementById('packStatus').textContent, open: !!document.querySelector('.rig .pc.is-open'), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})"))
        # rip another by tap
        await pg.click('#againBtn')
        await pg.wait_for_timeout(900)
        await pg.click('#tapRipBtn')
        ok = await until_done(pg)
        print('desktop second rip done:', ok, await pg.evaluate("document.getElementById('ripName').textContent"))
        await pg.click('#doneBtn')
        await pg.wait_for_timeout(900)
        await pg.evaluate("document.getElementById('garage').scrollIntoView()")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{OUT}/v2_d7_garage.png')
        await ctx.close()

        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append(('m-console', m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('m-pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/v2_m1_top.png')
        await pg.screenshot(path=f'{OUT}/v2_m2_full.png', full_page=True)
        await pg.evaluate(FORCE % 'grand')
        await pg.tap('#ripBtn')
        await pg.wait_for_timeout(1100)
        await pg.screenshot(path=f'{OUT}/v2_m3_ready.png')
        await pg.tap('#tapRipBtn')
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/v2_m4_peek.png')
        ok = await until_done(pg)
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/v2_m5_done.png')
        print('mobile done:', ok, await pg.evaluate("({phase: document.getElementById('rip').dataset.phase, name: document.getElementById('ripName').textContent, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})"))
        await ctx.close()
        await b.close()
        print('errors:', [e for e in errs if 'ERR_TUNNEL' not in str(e)] or 'none (besides the blocked font request)')

asyncio.run(main())
