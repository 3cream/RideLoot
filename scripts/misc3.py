"""Odd corners: the back of the pack after a drag, reduced motion, and the phone menu."""
import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
PHASE = "document.getElementById('rip').dataset.phase"
SEED = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:2,opened:3,pulls:{},sound:true,force:'rare'}))}catch(e){}"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        log = lambda tag: (lambda m: errs.append((tag, m.type, m.text)) if m.type in ('error', 'warning') else None)
        # 1) drag the big viewer to see the back of the pack
        ctx = await b.new_context(viewport={'width': 1408, 'height': 790})
        await ctx.add_init_script(SEED)
        pg = await ctx.new_page(); pg.on('console', log('d')); pg.on('pageerror', lambda e: errs.append(('d-pageerror', str(e))))
        await pg.goto(URL); await pg.wait_for_timeout(900)
        await pg.evaluate("document.getElementById('packViewer').scrollIntoView({block:'center'})")
        await pg.wait_for_timeout(700)
        r = await pg.evaluate("(() => { const r = document.getElementById('packViewer').getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:r.height}; })()")
        cx, cy = r['x'] + r['w'] / 2, r['y'] + r['h'] / 2
        await pg.mouse.move(cx - 150, cy); await pg.mouse.down()
        for i in range(1, 31):
            await pg.mouse.move(cx - 150 + i * 10.2, cy - i * 0.6, steps=1); await pg.wait_for_timeout(12)
        await pg.wait_for_timeout(200)
        await pg.screenshot(path=f'{OUT}/x_back.png', clip={'x': r['x'], 'y': r['y'], 'width': r['w'], 'height': r['h']})
        await pg.mouse.up()
        print('viewer ry after drag:', await pg.evaluate("getComputedStyle(document.querySelector('#packViewer .p3')).getPropertyValue('--ry')"), 'rip open:', await pg.evaluate("!document.getElementById('rip').hidden"))
        # a plain click on the viewer pack opens the rip room
        await pg.wait_for_timeout(300)
        await pg.mouse.click(cx, cy)
        await pg.wait_for_timeout(1200)
        print('click on viewer pack -> phase:', await pg.evaluate(PHASE))
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        print('after Escape, rip hidden:', await pg.evaluate("document.getElementById('rip').hidden"))
        await ctx.close()
        # 2) reduced motion: the whole rip still completes
        ctx = await b.new_context(viewport={'width': 1408, 'height': 790}, reduced_motion='reduce')
        await ctx.add_init_script(SEED)
        pg = await ctx.new_page(); pg.on('console', log('r')); pg.on('pageerror', lambda e: errs.append(('r-pageerror', str(e))))
        await pg.goto(URL); await pg.wait_for_timeout(900)
        await pg.click('#heroPack'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{OUT}/x_reduced_ready.png')
        await pg.click('#tapRipBtn'); await pg.wait_for_timeout(1200)
        print('reduced motion phase:', await pg.evaluate(PHASE), await pg.evaluate("document.getElementById('ripName').textContent"))
        await pg.screenshot(path=f'{OUT}/x_reduced_done.png')
        await ctx.close()
        # 3) phone menu, then a link from it
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script(SEED)
        pg = await ctx.new_page(); pg.on('console', log('m')); pg.on('pageerror', lambda e: errs.append(('m-pageerror', str(e))))
        await pg.goto(URL); await pg.wait_for_timeout(900)
        await pg.tap('.hdr__menu'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{OUT}/x_menu.png')
        await pg.tap('#menuDlg a[href="#inside"]'); await pg.wait_for_timeout(1400)
        print('menu closed:', not await pg.evaluate("document.getElementById('menuDlg').open"), 'scrolled to:', await pg.evaluate("Math.round(scrollY)"), 'inside top:', await pg.evaluate("Math.round(document.getElementById('inside').getBoundingClientRect().top)"))
        await pg.evaluate("document.getElementById('pack').scrollIntoView()"); await pg.wait_for_timeout(600)
        await pg.evaluate("window.scrollBy(0, 760)"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{OUT}/x_m_cards.png')
        await ctx.close()
        print('errors:', [e for e in errs if 'ERR_TUNNEL' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        await b.close()
asyncio.run(main())
