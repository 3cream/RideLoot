"""Top bar (glass + keys) and the push-in buttons: fit at several widths, states, and legibility over bright photos."""
import asyncio, sys
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
SEED = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:3,opened:6,pulls:{},sound:true,force:'random'}))}catch(e){}"
FIT = """(() => { const bar = document.querySelector('.hdr__bar'), r = bar.getBoundingClientRect();
  const kids = Array.from(bar.children).filter(k => getComputedStyle(k).display !== 'none').map(k => k.getBoundingClientRect());
  let overlap = 0; for (let i = 1; i < kids.length; i++) overlap = Math.max(overlap, kids[i - 1].right - kids[i].left);
  const gaps = []; for (let i = 1; i < kids.length; i++) gaps.push(Math.round(kids[i].left - kids[i - 1].right));
  return { bar: Math.round(r.width), over: Math.round(bar.scrollWidth - bar.clientWidth), lastRight: Math.round(r.right - kids[kids.length - 1].right), gaps: gaps,
    nav: getComputedStyle(document.querySelector('.hdr__links')).display, pill: getComputedStyle(document.querySelector('.hdr__pill')).display,
    menu: getComputedStyle(document.querySelector('.hdr__menu')).display, docOver: document.documentElement.scrollWidth - innerWidth }; })()"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        def watch(pg):
            pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
            pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        # ---- fit at many widths
        for w in (861, 900, 981, 1000, 1024, 1120, 1121, 1180, 1280, 1408, 1920):
            ctx = await b.new_context(viewport={'width': w, 'height': 790})
            await ctx.add_init_script(SEED)
            pg = await ctx.new_page(); watch(pg)
            await pg.goto(URL); await pg.wait_for_timeout(500)
            print(w, await pg.evaluate(FIT))
            if w in (981, 1121): await pg.screenshot(path=f'{OUT}/k_bar_{w}.png', clip={'x': 0, 'y': 0, 'width': w, 'height': 130})
            await ctx.close()
        # ---- desktop states
        ctx = await b.new_context(viewport={'width': 1408, 'height': 790})
        await ctx.add_init_script(SEED)
        pg = await ctx.new_page(); watch(pg)
        await pg.goto(URL); await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/k_top.png')
        await pg.screenshot(path=f'{OUT}/k_bar_rest.png', clip={'x': 0, 'y': 20, 'width': 1408, 'height': 110})
        nav = pg.locator('.hdr__links a').nth(1)
        await nav.hover(); await pg.wait_for_timeout(350)
        await pg.screenshot(path=f'{OUT}/k_bar_hover.png', clip={'x': 0, 'y': 20, 'width': 1408, 'height': 110})
        await pg.mouse.down(); await pg.wait_for_timeout(200)
        await pg.screenshot(path=f'{OUT}/k_bar_down.png', clip={'x': 0, 'y': 20, 'width': 1408, 'height': 110})
        await pg.mouse.move(700, 500); await pg.mouse.up(); await pg.wait_for_timeout(300)
        # hero call to action: rest, hover, pushed in
        cta = pg.locator('.hero__copy .btn').first
        bx = await cta.bounding_box()
        clip = {'x': max(0, bx['x'] - 40), 'y': bx['y'] - 30, 'width': bx['width'] + 80, 'height': bx['height'] + 70}
        await pg.mouse.move(5, 400); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{OUT}/k_cta_rest.png', clip=clip)
        await cta.hover(); await pg.wait_for_timeout(350)
        await pg.screenshot(path=f'{OUT}/k_cta_hover.png', clip=clip)
        await pg.mouse.down(); await pg.wait_for_timeout(200)
        info = await pg.evaluate("(() => { const b = document.querySelector('.hero__copy .btn'); const cs = getComputedStyle(b); return { down: b.classList.contains('is-down'), transform: cs.transform, shadow: cs.boxShadow.slice(0, 220) }; })()")
        print('pressed:', info)
        await pg.screenshot(path=f'{OUT}/k_cta_down.png', clip=clip)
        await pg.mouse.move(5, 400); await pg.mouse.up(); await pg.wait_for_timeout(300)
        print('after release is-down:', await pg.evaluate("document.querySelectorAll('.is-down').length"))
        # the bar over the bright gallery photos: scroll into the gallery, then back up a little so the bar returns
        top = await pg.evaluate("document.getElementById('prize').getBoundingClientRect().top + scrollY")
        for frac in (1.2, 2.0):
            await pg.evaluate(f"window.scrollTo(0, {top} + innerHeight * {frac})"); await pg.wait_for_timeout(500)
            await pg.mouse.wheel(0, -60); await pg.wait_for_timeout(700)
            print('gallery', frac, await pg.evaluate("({smoke: document.getElementById('hdr').classList.contains('is-smoke'), hidden: document.getElementById('hdr').classList.contains('is-hidden'), slide: document.getElementById('stageN').textContent})"))
            await pg.screenshot(path=f'{OUT}/k_gal_{str(frac).replace(".", "")}.png', clip={'x': 0, 'y': 0, 'width': 1408, 'height': 150})
        # over the chrome band
        bt = await pg.evaluate("document.querySelector('.bands').getBoundingClientRect().top + scrollY")
        await pg.evaluate(f"window.scrollTo(0, {bt} + 40)"); await pg.wait_for_timeout(400)
        await pg.mouse.wheel(0, -40); await pg.wait_for_timeout(700)
        print('bands', await pg.evaluate("({smoke: document.getElementById('hdr').classList.contains('is-smoke'), hidden: document.getElementById('hdr').classList.contains('is-hidden')})"))
        await pg.screenshot(path=f'{OUT}/k_bands.png', clip={'x': 0, 'y': 0, 'width': 1408, 'height': 150})
        # a dark section further down (pack section)
        pt = await pg.evaluate("document.getElementById('pack').getBoundingClientRect().top + scrollY")
        await pg.evaluate(f"window.scrollTo(0, {pt} + 200)"); await pg.wait_for_timeout(400)
        await pg.mouse.wheel(0, -40); await pg.wait_for_timeout(700)
        print('pack', await pg.evaluate("({smoke: document.getElementById('hdr').classList.contains('is-smoke')})"))
        await pg.screenshot(path=f'{OUT}/k_pack.png', clip={'x': 0, 'y': 0, 'width': 1408, 'height': 420})
        await ctx.close()
        # ---- phone
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        await ctx.add_init_script(SEED)
        pg = await ctx.new_page(); watch(pg)
        await pg.goto(URL); await pg.wait_for_timeout(1000)
        print('phone', await pg.evaluate(FIT))
        await pg.screenshot(path=f'{OUT}/k_m_top.png')
        await ctx.close()
        print('errors:', [e for e in errs if 'ERR_TUNNEL' not in str(e) and 'fonts.g' not in str(e) and 'ERR_' not in str(e)] or 'none')
        await b.close()
asyncio.run(main())
