"""Are the four keys on the top bar, and do they fit, at every width and shape?"""
import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
SEED = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:3,opened:6,pulls:{},sound:true,force:'random'}))}catch(e){}"
FIT = """(() => { const bar = document.querySelector('.hdr__bar');
  const kids = Array.from(bar.children).filter(k => getComputedStyle(k).display !== 'none').map(k => k.getBoundingClientRect());
  const gaps = []; for (let i = 1; i < kids.length; i++) gaps.push(Math.round(kids[i].left - kids[i - 1].right));
  const keys = Array.from(document.querySelectorAll('.hdr__links a, .hdr__links button')).filter(k => k.offsetParent).map(k => Math.round(k.getBoundingClientRect().width));
  return { bar: Math.round(bar.getBoundingClientRect().width), over: bar.scrollWidth - bar.clientWidth, gaps: gaps, keys: keys,
    word: getComputedStyle(document.querySelector('.brand__word')).display !== 'none', menu: getComputedStyle(document.querySelector('.hdr__menu')).display !== 'none', docOver: document.documentElement.scrollWidth - innerWidth }; })()"""
SIZES = [(820, 700), (860, 700), (861, 700), (880, 760), (900, 800), (930, 850), (960, 900), (961, 900), (980, 900), (1000, 900), (1100, 800), (1121, 800),
         (900, 1000), (960, 1100), (1024, 1366), (834, 1194), (390, 844)]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        for (w, h) in SIZES:
            ctx = await b.new_context(viewport={'width': w, 'height': h})
            await ctx.add_init_script(SEED)
            pg = await ctx.new_page()
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(450)
            print(f'{w}x{h}', await pg.evaluate(FIT))
            if (w, h) in ((861, 700), (960, 900), (900, 1000), (1024, 1366)):
                await pg.screenshot(path=f'{OUT}/b4_{w}x{h}.png', clip={'x': 0, 'y': 0, 'width': w, 'height': min(h, 520)})
            await ctx.close()
        print('errors:', errs or 'none')
        await b.close()
asyncio.run(main())
