"""Walk the whole flow: free pack gate -> rip room (guide, swipe, reveal) -> product view -> buy (preview) -> rip again -> my pulls."""
import asyncio, sys
from playwright.async_api import async_playwright

URL = 'file:///home/claude/rideloot/site/index.html'
OUT = '/home/claude/rideloot/tmp'
W = int(sys.argv[1]) if len(sys.argv) > 1 else 1408
H = int(sys.argv[2]) if len(sys.argv) > 2 else 790
MOBILE = W < 600
T = f'f{W}'
PHASE = "document.getElementById('rip').dataset.phase"

async def until(pg, want, limit=16000):
    t = 0
    while t < limit:
        if await pg.evaluate(PHASE) == want: return True
        await pg.wait_for_timeout(120); t += 120
    return False

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--autoplay-policy=no-user-gesture-required'])
        errs = []
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=2 if MOBILE else 1, is_mobile=MOBILE, has_touch=MOBILE)
        pg = await ctx.new_page()
        pg.on('console', lambda m: errs.append((m.type, m.text)) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(('pageerror', str(e))))
        await pg.goto(URL)
        await pg.wait_for_timeout(4200)   # the free pack gate opens by itself
        print('gate open:', await pg.evaluate("document.getElementById('gateDlg').open"))
        await pg.screenshot(path=f'{OUT}/{T}_1_gate.png')
        await pg.click('#gateForm button[type=submit]')
        await pg.wait_for_timeout(300)
        print('empty email msg:', await pg.evaluate("document.getElementById('gateMsg').textContent"))
        await pg.fill('#gateEmail', 'driver@example.com')
        await pg.evaluate("document.getElementById('forceSel').value='legendary'; document.getElementById('forceSel').dispatchEvent(new Event('change'))")
        await pg.click('#gateForm button[type=submit]')
        ok = await until(pg, 'ready')
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{OUT}/{T}_2_ready.png')
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/{T}_2b_ready.png')
        box = await pg.evaluate("(() => { const r = document.querySelector('.pk--rip').getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:r.height}; })()")
        y = box['y'] + box['h'] * 0.11
        x0 = box['x'] - 20
        if MOBILE:
            await pg.tap('#tapRipBtn')
        else:
            await pg.mouse.move(x0, y); await pg.mouse.down()
            for i in range(1, 9):
                await pg.mouse.move(x0 + box['w'] * 0.055 * i, y, steps=2); await pg.wait_for_timeout(30)
            await pg.screenshot(path=f'{OUT}/{T}_3_tearing.png')
            for i in range(9, 18):
                await pg.mouse.move(x0 + box['w'] * 0.055 * i, y, steps=2); await pg.wait_for_timeout(30)
            await pg.mouse.up()
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/{T}_4_torn.png')
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/{T}_5_peek.png')
        ok = await until(pg, 'done')
        await pg.wait_for_timeout(800)
        await pg.screenshot(path=f'{OUT}/{T}_6_done.png')
        print('first rip done:', ok, await pg.evaluate("({name: document.getElementById('ripName').textContent, again: document.getElementById('againLabel').textContent, chip: document.getElementById('ripChip').textContent})"))
        await pg.click('#againBtn')          # out of packs -> product view
        await pg.wait_for_timeout(1000)
        print('product open:', await pg.evaluate("document.getElementById('productDlg').open"))
        await pg.screenshot(path=f'{OUT}/{T}_7_product.png')
        await pg.click('#qty label:nth-of-type(2)')
        await pg.click('#buyBtn')
        await pg.wait_for_timeout(300)
        await pg.evaluate("document.getElementById('productDlg').scrollTo(0, 99999)")
        await pg.wait_for_timeout(400)
        await pg.screenshot(path=f'{OUT}/{T}_8_product_bottom.png')
        print('after buy:', await pg.evaluate("({msg: document.getElementById('buyMsg').textContent, packs: document.getElementById('chipCount').textContent})"))
        await pg.evaluate("document.getElementById('forceSel').value='grand'; document.getElementById('forceSel').dispatchEvent(new Event('change'))")
        await pg.evaluate("document.getElementById('buyRip').click()")
        ok = await until(pg, 'ready')
        await pg.wait_for_timeout(600)
        await pg.click('#tapRipBtn')
        ok = await until(pg, 'done')
        await pg.wait_for_timeout(1200)
        await pg.screenshot(path=f'{OUT}/{T}_9_grand.png')
        print('grand rip done:', ok, await pg.evaluate("({name: document.getElementById('ripName').textContent, note: document.getElementById('ripNote').textContent, chip: document.getElementById('ripChip').textContent})"))
        await pg.click('#doneBtn')
        await pg.wait_for_timeout(700)
        await pg.evaluate("document.querySelector('[data-open=pullsDlg]').click()")
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/{T}_10_pulls.png')
        await pg.evaluate("document.querySelector('#pullsDlg [data-close]').click()")
        await pg.evaluate("document.querySelector('[data-open=rulesDlg]').click()")
        await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{OUT}/{T}_11_rules.png')
        await pg.evaluate("document.querySelector('#rulesDlg [data-close]').click()")
        await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{OUT}/{T}_12_after.png')
        print('state:', await pg.evaluate("localStorage.getItem('rideloot-preview-v3')"))
        print('locked:', await pg.evaluate("document.documentElement.classList.contains('is-locked')"), 'overflow-x:', await pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth'))
        print('errors:', [e for e in errs if 'ERR_TUNNEL' not in str(e) and 'fonts.g' not in str(e)] or 'none')
        await b.close()

asyncio.run(main())
