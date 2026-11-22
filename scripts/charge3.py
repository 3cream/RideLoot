"""Watch the new opening: frames through the rattle / rarity sweep, the lock, the peek and the reveal."""
import asyncio, sys
from playwright.async_api import async_playwright
URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
W = int(sys.argv[1]) if len(sys.argv) > 1 else 1408
H = int(sys.argv[2]) if len(sys.argv) > 2 else 790
FORCE = sys.argv[3] if len(sys.argv) > 3 else 'legendary'
MOBILE = W < 600
PHASE = "document.getElementById('rip').dataset.phase"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        errs = []
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2 if MOBILE else 1, is_mobile=MOBILE, has_touch=MOBILE)
        await ctx.add_init_script("try{sessionStorage.setItem('rl-gate','1');localStorage.setItem('rideloot-preview-v3', JSON.stringify({claimed:true,packs:3,opened:6,pulls:{},sound:true,force:'%s'}))}catch(e){}" % FORCE)
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/c{W}_0_hero.png')
        if MOBILE: await pg.tap('#heroPack')
        else: await pg.click('#heroPack')
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/c{W}_1_ready.png')
        await pg.click('#tapRipBtn')
        log = []
        t = 0; shots = {900: 'a', 1800: 'b', 2700: 'c', 3500: 'd'}
        seen = set()
        import time
        t0 = time.time()
        last = None
        while True:
            ms = int((time.time() - t0) * 1000)
            ph = await pg.evaluate(PHASE)
            if ph != last:
                log.append((ms, ph)); last = ph
                if ph in ('peek', 'reveal'):
                    await pg.screenshot(path=f'{OUT}/c{W}_3_{ph}.png')
            for k, name in shots.items():
                if ms >= k and k not in seen:
                    seen.add(k)
                    info = await pg.evaluate("({amp: document.getElementById('rig').style.getPropertyValue('--amp'), on: (document.querySelector('#ripMeter .is-on')||{}).textContent, locked: document.getElementById('ripMeter').classList.contains('is-locked'), tint: document.getElementById('rip').style.getPropertyValue('--tint')})")
                    await pg.screenshot(path=f'{OUT}/c{W}_2_charge_{name}.png')
                    log.append((ms, info))
            if ph == 'done' or ms > 16000: break
            await pg.wait_for_timeout(60)
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/c{W}_4_done.png')
        for row in log: print(row)
        print('result:', await pg.evaluate("document.getElementById('ripName').textContent"), '| meter hidden:', await pg.evaluate("document.getElementById('ripMeter').hidden"))
        print('errors:', [e for e in errs if 'ERR_TUNNEL' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        await b.close()
asyncio.run(main())
