"""The 'No purchase necessary' line under each Get another pack button: does it fit, and does the hero still clear the headline?"""
import asyncio
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
SEED0 = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:0,opened:1,pulls:{sticker:1},force:'random'}))}catch(e){}"
SEED1 = "try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:1,opened:1,pulls:{sticker:1},force:'rare'}))}catch(e){}"
HERO = """(() => { const R = (el) => el.getBoundingClientRect(); const c = R(document.querySelector('.hero__copy')), l1 = R(document.querySelector('.hero__l1')), l2 = R(document.querySelector('.hero__l2'));
  const hit = (a, b) => !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);
  const lede = R(document.querySelector('.hero__lede')), npn = document.querySelector('.hero__copy .npn'), n = R(npn), hero = R(document.getElementById('top'));
  return { btn: document.querySelector('.hero__copy [data-cta-label]').textContent, npn: npn.innerText.replace(/\\s+/g, ' '), npnVisible: n.height > 0, copyTop: Math.round(c.top), headBottom: Math.round(Math.max(l1.bottom, l2.bottom)), gapToHeadline: Math.round(lede.top - Math.max(l1.bottom, l2.bottom)), overlapHead: hit(c, l1) || hit(c, l2), insideHero: n.bottom <= hero.bottom + 1 }; })()"""
PHASE = "document.getElementById('rip').dataset.phase"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        def watch(pg):
            pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
            pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        # hero at many window shapes, out of packs so the button reads Get another pack
        for (w, h) in ((861, 700), (900, 600), (960, 900), (1000, 640), (1024, 768), (1120, 700), (1121, 700), (1280, 720), (1408, 790), (1920, 1080), (390, 844), (360, 640), (834, 1194)):
            mob = w < 600
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mob else 1, is_mobile=mob, has_touch=mob); await ctx.add_init_script(SEED0)
            pg = await ctx.new_page(); watch(pg)
            await pg.goto(URL); await pg.wait_for_timeout(700)
            print(f'{w}x{h}', await pg.evaluate(HERO))
            if (w, h) in ((861, 700), (960, 900), (1000, 640), (1408, 790), (390, 844)): await pg.screenshot(path=f'{OUT}/np_hero_{w}.png')
            await ctx.close()
        # last call, my pulls, and the end of a pull, on desktop and two phones
        for (w, h, tag) in ((1408, 790, 'd'), (390, 844, 'm'), (360, 640, 's')):
            mob = w < 600
            ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mob else 1, is_mobile=mob, has_touch=mob); await ctx.add_init_script(SEED1)
            pg = await ctx.new_page(); watch(pg)
            await pg.goto(URL); await pg.wait_for_timeout(700); await pg.evaluate("document.documentElement.style.scrollBehavior = 'auto'")
            await pg.evaluate("document.querySelector('.final').scrollIntoView({block: 'center'})"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f'{OUT}/np_final_{tag}.png')
            await pg.evaluate("window.scrollTo(0, 0)"); await pg.wait_for_timeout(300)
            # rip the one pack: afterwards the button offers another pack
            await pg.evaluate("document.querySelector('.hero__copy [data-cta]').click()")
            for _ in range(80):
                if await pg.evaluate(PHASE) == 'ready': break
                await pg.wait_for_timeout(100)
            await pg.wait_for_timeout(600)
            print(tag, 'note hidden while sealed:', await pg.evaluate("document.getElementById('againNote').hidden"))
            await pg.evaluate("document.getElementById('tapRipBtn').click()")
            for _ in range(160):
                if await pg.evaluate(PHASE) == 'done': break
                await pg.wait_for_timeout(100)
            await pg.wait_for_timeout(900)
            print(tag, await pg.evaluate("(() => { const n = document.getElementById('againNote'), r = n.getBoundingClientRect(), a = document.getElementById('ripActions').getBoundingClientRect(), c = document.querySelector('#rig .pc').getBoundingClientRect(), t = document.getElementById('ripTitle').getBoundingClientRect(); return { again: document.getElementById('againLabel').textContent, noteHidden: n.hidden, noteBottom: Math.round(r.bottom), vh: innerHeight, actionsBottom: Math.round(a.bottom), cardBottom: Math.round(c.bottom), titleTop: Math.round(t.top), cardOverTitle: c.bottom > t.top + 2 }; })()"))
            await pg.screenshot(path=f'{OUT}/np_rip_{tag}.png')
            await pg.evaluate("document.getElementById('doneBtn').click()"); await pg.wait_for_timeout(900)
            await pg.evaluate("document.querySelector('[data-open=pullsDlg]').click()"); await pg.wait_for_timeout(700)
            await pg.screenshot(path=f'{OUT}/np_pulls_{tag}.png')
            print(tag, 'overflow-x:', await pg.evaluate("document.documentElement.scrollWidth - innerWidth"))
            await ctx.close()
        print('errors:', [e for e in errs if 'ERR_' not in str(e) and 'fonts.g' not in str(e)] or 'none'); await b.close()
asyncio.run(main())
