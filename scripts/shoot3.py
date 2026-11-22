"""Screenshot checks for the v3 page. usage: shoot3.py <what> [width height]"""
import asyncio, sys
from playwright.async_api import async_playwright

URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
what = sys.argv[1] if len(sys.argv) > 1 else 'hero'
W = int(sys.argv[2]) if len(sys.argv) > 2 else 1408
H = int(sys.argv[3]) if len(sys.argv) > 3 else 790
MOBILE = W < 600

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        errs = []
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2 if MOBILE else 1, is_mobile=MOBILE, has_touch=MOBILE)
        if what != 'gate':
            await ctx.add_init_script("try{sessionStorage.setItem('rl-gate','1')}catch(e){}")
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(1300)
        tag = f'{what}_{W}'
        if what == 'hero':
            await pg.screenshot(path=f'{OUT}/v3_{tag}.png')
        elif what == 'gate':
            await pg.wait_for_timeout(2400)
            await pg.screenshot(path=f'{OUT}/v3_{tag}.png')
        elif what == 'scroll':
            total = await pg.evaluate('document.documentElement.scrollHeight')
            print('doc height', total)
            ys = [float(a) for a in sys.argv[4:]] if len(sys.argv) > 4 else []
            for i, y in enumerate(ys):
                await pg.evaluate(f'window.scrollTo({{top:{y},behavior:"instant"}})')
                await pg.wait_for_timeout(900)
                await pg.screenshot(path=f'{OUT}/v3_{tag}_{i}.png')
        elif what == 'sections':
            ids = sys.argv[4:]
            for i in ids:
                off = 0
                if ':' in i: i, off = i.split(':'); off = float(off)
                await pg.evaluate(f'(() => {{ const r = document.getElementById("{i}").getBoundingClientRect(); window.scrollTo({{top: r.top + scrollY + {off}, behavior:"instant"}}); }})()')
                await pg.wait_for_timeout(900)
                await pg.screenshot(path=f'{OUT}/v3_{tag}_{i}_{int(off)}.png')
        print('errors:', [e for e in errs if 'ERR_TUNNEL' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        print('overflow-x:', await pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'))
        await b.close()

asyncio.run(main())
