"""One-off: lift the parts of the v2 page that carry over unchanged (prize card, rip room, sound, particles) into part files."""
import pathlib

lines = pathlib.Path('tmp/v2/index.src.html').read_text(encoding='utf-8').split('\n')


def cut(a, b):
    return '\n'.join(lines[a - 1:b]) + '\n'


def patch(text, pairs):
    for old, new in pairs:
        n = text.count(old)
        if n != 1:
            raise SystemExit(f'patch matched {n} times: {old[:70]!r}')
        text = text.replace(old, new)
    return text


def between(text, start, end, new):
    a, b = text.index(start), text.index(end)
    assert a < b
    return text[:a] + new + text[b:]


# ---- prize card css
card = cut(178, 213)
pathlib.Path('src/css/card.css').write_text(card, encoding='utf-8')

# ---- rip room css + shared keyframes
rip = cut(290, 335) + '\n' + cut(337, 347)
rip = patch(rip, [
    ('@keyframes chev{0%{opacity:.15}30%{opacity:1}60%,100%{opacity:.15}}\n', ''),
    ('@keyframes pack-drop{from{opacity:0;transform:translateY(-70px) rotateY(-34deg)}}\n', ''),
])
pathlib.Path('src/css/rip.css').write_text(rip, encoding='utf-8')

# ---- js: sound, dust, particles
pathlib.Path('src/js/10-sfx.js').write_text(cut(785, 843), encoding='utf-8')
pathlib.Path('src/js/20-dust.js').write_text(cut(845, 880), encoding='utf-8')
pathlib.Path('src/js/30-fx.js').write_text(cut(882, 946), encoding='utf-8')

# ---- js: the rip room
r = cut(948, 1183)
r = patch(r, [
    ("  const ripEl = $('rip'), rig = $('rig'), stage = $('ripStage'), heroPack = $('heroPack');\n  let R = null, rainId = 0;\n  const tilt = { hero: { px: 0, py: 0, cx: 0, cy: 0, vis: true }, feat: { px: 0, py: 0, cx: 0, cy: 0, vis: false }, rev: { px: 0, py: 0, cx: 0, cy: 0 } };",
     "  const ripEl = $('rip'), rig = $('rig'), stage = $('ripStage');\n  let R = null, rainId = 0, ripSrc = null, ripReturn = null;\n  const tilt = { rev: { px: 0, py: 0, cx: 0, cy: 0 } };"),
    ("  function enterRip(fromHero) {\n    if (state.packs < 1 || (R && !R.done)) return;\n    if (R) endRun(R);\n",
     "  function enterRip(src) {\n    if (state.packs < 1 || (R && !R.done)) return;\n    if (R) endRun(R); else ripReturn = document.activeElement;\n"),
    ("    const from = heroPack.getBoundingClientRect();\n    rig.innerHTML = '<div class=\"rig__glow\"></div><div class=\"rig__ring\"></div><div class=\"rig__shadow\"></div>' + cardHTML(null, 0, '');\n    const pk = $('pkArt').cloneNode(true);\n    pk.removeAttribute('id'); pk.classList.add('pk--rip');\n    rig.appendChild(pk);\n    ctx.pk = pk; ctx.strip = pk.querySelector('.pk__strip');\n",
     "    const from = src ? src.getBoundingClientRect() : null;\n    const no = state.opened + 1;\n    rig.style.setProperty('--p', '0'); rig.style.setProperty('--sx', '0');\n    rig.innerHTML = '<div class=\"rig__glow\"></div><div class=\"rig__ring\"></div><div class=\"rig__shadow\"></div><div class=\"pkrays\"></div>' +\n      '<div class=\"pkback\"><span class=\"pkback__crimp\"></span><span class=\"pkback__shade\"></span></div>' + cardHTML(null, 0, '') + packArt(no) + GUIDE;\n    const pk = rig.querySelector('.pk');\n    pk.classList.add('pk--rip');\n    ctx.pk = pk; ctx.strip = pk.querySelector('.pk__lid'); ctx.back = rig.querySelector('.pkback'); ctx.guide = rig.querySelector('.guide');\n"),
    ("    $('ripLive').textContent = ''; $('toast').classList.remove('is-on');\n",
     "    $('ripLive').textContent = ''; $('toast').classList.remove('is-on');\n    $('ripChip').textContent = 'Pack No. ' + pad4(no) + (state.packs > 1 ? ' \\u00b7 ' + plural(state.packs - 1, 'more pack', 'more packs') + ' after this' : '');\n"),
    ("    document.documentElement.classList.add('is-locked');\n    heroPack.classList.add('is-away');\n",
     "    syncLock();\n    if (ripSrc) ripSrc.classList.remove('is-away');\n    ripSrc = src || null;\n    if (ripSrc) ripSrc.classList.add('is-away');\n"),
    ("    const onScreen = fromHero && from.width > 0 && from.bottom > 0 && from.top < window.innerHeight;",
     "    const onScreen = !!from && from.width > 0 && from.bottom > 0 && from.top < window.innerHeight;"),
    ("    bindTear(ctx);\n    $('tapRipBtn').focus({ preventScroll: true });", "    $('tapRipBtn').focus({ preventScroll: true });"),
    ("    ctx.pk.style.setProperty('--p', p.toFixed(3));\n    ctx.pk.style.setProperty('--sx', (dir > 0 ? p : 1 - p).toFixed(3));",
     "    rig.style.setProperty('--p', p.toFixed(3));\n    rig.style.setProperty('--sx', (dir > 0 ? p : 1 - p).toFixed(3));"),
    ("    $('tapRipBtn').hidden = true; $('ripPrompt').hidden = true;\n    tween(",
     "    $('tapRipBtn').hidden = true; $('ripPrompt').hidden = true;\n    if (ctx.guide) ctx.guide.classList.add('is-off');\n    tween("),
    ("    state.packs -= 1; state.opened += 1; state.entries += 1;", "    state.packs -= 1; state.opened += 1;"),
    ("    play(ctx, ctx.pk, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(16%)', opacity: 1, offset: 0.34 }, { transform: 'translateY(125%) rotate(-7deg)', opacity: 0 }], { duration: 780, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' });",
     "    const drop = [{ transform: 'none', opacity: 1 }, { transform: 'translateY(16%)', opacity: 1, offset: 0.34 }, { transform: 'translateY(125%) rotate(-7deg)', opacity: 0 }];\n    const dropOpts = { duration: 780, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' };\n    play(ctx, ctx.pk, drop, dropOpts);\n    if (ctx.back) play(ctx, ctx.back, drop, dropOpts);"),
    ("    $('ripName').textContent = ctx.rank >= 4 ? 'The car' : prize.name;", "    $('ripName').textContent = prize.name;"),
    ("'Pack No. ' + pad4(ctx.no) + ' is in your garage and counts as 1 entry in the draw for the car.'",
     "'Pack No. ' + pad4(ctx.no) + ' is saved in My pulls and counts as 1 entry in the final draw for the M3.'"),
    ("    renderGarage();\n    await wait(ctx, 380);", "    renderPulls();\n    await wait(ctx, 380);"),
    ("'Rip another pack' : 'Get more packs';", "'Rip another pack' : 'Get another pack';"),
    ("    renderGarage(); renderCounts();\n    setTimeout(() => {", "    renderPulls(); renderCounts();\n    setTimeout(() => {"),
    ("      document.documentElement.classList.remove('is-locked');\n      heroPack.classList.remove('is-away');\n      if (state.packs > 0 && !reduced) { heroPack.classList.remove('is-drop'); void heroPack.offsetWidth; heroPack.classList.add('is-drop'); }\n      if (then) then(); else $('ripBtn').focus({ preventScroll: true });\n",
     "      syncLock();\n      if (ripSrc) { ripSrc.classList.remove('is-away'); ripSrc = null; }\n      if (then) then(); else if (ripReturn && ripReturn.isConnected) { try { ripReturn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }\n"),
])
new_bind = '''  /* one set of listeners on the whole stage, so a swipe can start beside the pack as well as on it */
  function bindTear() {
    stage.addEventListener('pointerdown', (e) => {
      const ctx = R; if (!ctx || ctx.phase !== 'ready' || (e.button && e.button !== 0)) return;
      ctx.drag = { x0: e.clientX, w: ctx.pk.getBoundingClientRect().width, moved: false, onPack: !!(e.target.closest && e.target.closest('.pk--rip')) };
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    stage.addEventListener('pointermove', (e) => {
      const ctx = R; if (!ctx) return;
      const d = ctx.drag; if (!d || ctx.phase !== 'ready') return;
      const dx = e.clientX - d.x0;
      if (Math.abs(dx) > 8 && !d.moved) { d.moved = true; ctx.pk.classList.remove('is-ready'); if (ctx.guide) ctx.guide.classList.add('is-off'); }
      if (!d.moved) return;
      setTear(ctx, clamp(Math.abs(dx) / (d.w * 0.78), 0, 1), dx >= 0 ? 1 : -1);
      tearFx(ctx);
      if (ctx.p >= 1) { ctx.drag = null; autoTear(ctx, ctx.dir); }
    });
    const release = () => {
      const ctx = R; if (!ctx) return;
      const d = ctx.drag; if (!d) return;
      ctx.drag = null;
      if (ctx.phase !== 'ready') return;
      if (!d.moved) { if (d.onPack) autoTear(ctx, 1); }
      else if (ctx.p >= 0.42) autoTear(ctx, ctx.dir);
      else tween(ctx, 0, 220, () => { if (!ctx.dead && ctx.phase === 'ready') { ctx.pk.classList.add('is-ready'); if (ctx.guide) ctx.guide.classList.remove('is-off'); } });
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
  }
  bindTear();

'''
r = between(r, '  function bindTear(ctx) {', '  async function afterTear(ctx) {', new_bind)
pathlib.Path('src/js/40-rip.js').write_text(r, encoding='utf-8')
print('ported', {p.name: p.stat().st_size for p in sorted(pathlib.Path('src').rglob('*.*'))})
