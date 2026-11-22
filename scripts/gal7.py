"""Every gallery slide, in order, on a desktop and a phone screen."""
import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
SEED = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:3,opened:6,pulls:{},sound:true,force:'random'}))}catch(e){}"
async def run(b, w, h, mobile, tag, errs):
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1, is_mobile=mobile, has_touch=mobile)
    await ctx.add_init_script(SEED)
    pg = await ctx.new_page()
    pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
    pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
    await pg.goto(URL); await pg.wait_for_timeout(900)
    n = await pg.evaluate("document.querySelectorAll('#prize .slide').length")
    info = await pg.evaluate("(() => { const s = document.getElementById('prize'); return { top: s.getBoundingClientRect().top + scrollY, h: s.offsetHeight, vh: innerHeight }; })()")
    shots = []
    for i in range(n):
        prog = 0.14 + (i + 0.5) * 0.86 / n
        y = info['top'] + prog * (info['h'] - info['vh'])
        await pg.evaluate(f"window.scrollTo(0, {y})"); await pg.wait_for_timeout(1300)
        st = await pg.evaluate("({n: document.getElementById('stageN').textContent, of: document.getElementById('stageOf').textContent, cap: document.getElementById('stageCap').textContent, on: Array.from(document.querySelectorAll('#prize .slide')).findIndex(s => s.classList.contains('is-on')), src: document.querySelector('#prize .slide.is-on .slide__cover').getAttribute('src'), loaded: document.querySelector('#prize .slide.is-on .slide__cover').naturalWidth})")
        print(tag, i + 1, st)
        path = f'{OUT}/g7_{tag}_{i + 1}.png'
        await pg.screenshot(path=path); shots.append(path)
    print(tag, 'overflow-x:', await pg.evaluate("document.documentElement.scrollWidth - innerWidth"))
    await ctx.close()
    ims = [Image.open(s).convert('RGB') for s in shots]
    tw = 470 if not mobile else 200
    th = round(tw * ims[0].height / ims[0].width)
    cols = 4 if not mobile else 7
    rows = -(-len(ims) // cols)
    sheet = Image.new('RGB', (cols * (tw + 4), rows * (th + 4)), (30, 30, 30))
    for k, im in enumerate(ims):
        sheet.paste(im.resize((tw, th), Image.LANCZOS), ((k % cols) * (tw + 4), (k // cols) * (th + 4)))
    sheet.save(f'{OUT}/_g7_{tag}.jpg', quality=88); print(tag, 'sheet', sheet.size)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        await run(b, 1408, 790, False, 'd', errs)
        await run(b, 390, 844, True, 'm', errs)
        print('errors:', [e for e in errs if 'ERR_' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        await b.close()
asyncio.run(main())
