import asyncio, sys
from playwright.async_api import async_playwright

URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        errs = []
        # desktop
        ctx = await b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append(('console', m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/d1_top.png')
        await pg.screenshot(path=f'{OUT}/d2_full.png', full_page=True)
        await pg.evaluate("document.getElementById('forceSel').value='legendary'; document.getElementById('forceSel').dispatchEvent(new Event('change'))")
        await pg.click('#ripBtn')
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/d3_charge.png')
        await pg.wait_for_timeout(520)
        await pg.screenshot(path=f'{OUT}/d4_tear.png')
        await pg.wait_for_timeout(1900)
        await pg.screenshot(path=f'{OUT}/d5_dealt.png')
        await pg.click('#flipAllBtn')
        await pg.wait_for_timeout(4200)
        await pg.screenshot(path=f'{OUT}/d6_result.png')
        info = await pg.evaluate("({phase: document.getElementById('arena').dataset.phase, flipped: document.querySelectorAll('.card.is-flipped').length, status: document.getElementById('packStatus').textContent, h1w: [...document.querySelectorAll('.hero h1 span')].map(s => Math.round(s.getBoundingClientRect().width)), colw: Math.round(document.querySelector('.hero__title').getBoundingClientRect().width), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})")
        print('desktop', info)
        await ctx.close()
        # mobile
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append(('m-console', m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('m-pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{OUT}/m1_top.png')
        await pg.screenshot(path=f'{OUT}/m2_full.png', full_page=True)
        await pg.evaluate("document.getElementById('forceSel').value='grand'; document.getElementById('forceSel').dispatchEvent(new Event('change'))")
        await pg.tap('#ripBtn')
        await pg.wait_for_timeout(3500)
        await pg.screenshot(path=f'{OUT}/m3_dealt.png')
        await pg.tap('#flipAllBtn')
        await pg.wait_for_timeout(4300)
        await pg.screenshot(path=f'{OUT}/m4_jackpot.png')
        await pg.wait_for_timeout(2600)
        await pg.screenshot(path=f'{OUT}/m5_result.png')
        info = await pg.evaluate("({phase: document.getElementById('arena').dataset.phase, flipped: document.querySelectorAll('.card.is-flipped').length, h1w: [...document.querySelectorAll('.hero h1 span')].map(s => Math.round(s.getBoundingClientRect().width)), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})")
        print('mobile', info)
        await ctx.close()
        await b.close()
        print('errors:', errs if errs else 'none')

asyncio.run(main())
