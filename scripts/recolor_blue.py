"""One-off: move the page from the old lime / cyan / gold look to the new logo's blue, white and black."""
import pathlib

files = sorted(p for p in pathlib.Path('src').rglob('*') if p.suffix in ('.css', '.js', '.html'))
text = {p: p.read_text(encoding='utf-8') for p in files}


def everywhere(pairs):
    for old, new in pairs:
        n = sum(t.count(old) for t in text.values())
        if n == 0:
            raise SystemExit(f'nothing matched: {old!r}')
        for p in text:
            text[p] = text[p].replace(old, new)
        print(f'{n:3d} x {old}')


def once(path, pairs):
    p = pathlib.Path(path)
    for old, new in pairs:
        n = text[p].count(old)
        if n != 1:
            raise SystemExit(f'{path}: matched {n} times: {old[:80]!r}')
        text[p] = text[p].replace(old, new)


# ---- the mechanical part: lime -> brand blue, cyan -> sky
everywhere([
    ('var(--lime)', 'var(--brand)'),
    ('var(--cyan)', 'var(--sky)'),
    ('rgba(166,255,0,', 'rgba(10,132,255,'),
    ('rgba(34,212,255,', 'rgba(120,196,255,'),
    ('#a6ff00', '#0a84ff'),
    ('#22d4ff', '#6cc3ff'),
])

B = 'src/css/base.css'
once(B, [
    ('  /* RideLoot: a showroom at night. Glass and chrome, lit by the lime, cyan and gold of the logo. */',
     '  /* RideLoot: a showroom at night. Black glass and white chrome, lit by the blue of the logo. */'),
    ('  --lime:#0a84ff;\n  --cyan:#6cc3ff;\n  --gold:#ffc61a;\n  --orange:#ff7a1a;\n',
     '  --brand:#0a84ff;\n  --brand-hi:#5db8ff;\n  --brand-lo:#0052d6;\n  --sky:#9fd6ff;\n  --gold:#ffc93c;\n'),
    ('  --night:#040607;\n  --ink-1:#0b1014;\n  --ink-2:#121a20;\n  --ink-3:#19232b;', '  --night:#03060a;\n  --ink-1:#0a1118;\n  --ink-2:#111b26;\n  --ink-3:#182534;'),
    ('  --text:#e8eef1;\n  --muted:#98abb5;', '  --text:#eaf1f7;\n  --muted:#94a9bb;'),
    ('.ph{background:rgba(255,198,26,.14);color:var(--gold);padding:0 6px;border-radius:3px;font-weight:600;font-style:normal}',
     '.ph{background:rgba(159,214,255,.1);color:var(--sky);padding:0 6px;border-radius:3px;outline:1px dashed rgba(159,214,255,.6);outline-offset:-1px;font-weight:600;font-style:normal}'),
    ('[data-tier="legendary"]{--tc:#ffc61a}\n[data-tier="grand"]{--tc:#ff7a1a}', '[data-tier="legendary"]{--tc:#ffc93c}\n[data-tier="grand"]{--tc:#ffffff}'),
    ('.t-loot{background-image:linear-gradient(180deg,#f0ff5a 0%,var(--brand) 36%,var(--gold) 72%,var(--orange) 100%)}',
     '.t-loot{background-image:linear-gradient(180deg,#bfe4ff 0%,var(--brand-hi) 26%,var(--brand) 58%,var(--brand-lo) 100%)}'),
    ('text-transform:uppercase;text-decoration:none;white-space:nowrap;color:#081000;\n  background:linear-gradient(180deg,#f4ff86 0%,#bfff26 36%,#92e400 64%,#e0c000 135%);',
     'text-transform:uppercase;text-decoration:none;white-space:nowrap;color:#fff;text-shadow:0 1px 0 rgba(0,24,70,.5);\n  background:linear-gradient(180deg,#6cc0ff 0%,#2a97ff 34%,#0a7cf2 66%,#0050d0 130%);'),
    ('.btn--ghost{color:var(--text);background:', '.btn--ghost{color:var(--text);text-shadow:none;background:'),
    ('.formmsg.is-ok{color:var(--brand)}', '.formmsg.is-ok{color:var(--sky)}'),
    ('.chip--lime{border-color:rgba(10,132,255,.5);color:var(--brand);background:rgba(10,132,255,.08)}', '.chip--lime{border-color:rgba(93,184,255,.6);color:var(--brand-hi);background:rgba(10,132,255,.12)}'),
])

P = 'src/css/page.css'
once(P, [
    ('background:linear-gradient(90deg,#e0a800,var(--gold) 30%,var(--gold) 70%,#e0a800);color:#0a0700;', 'background:linear-gradient(90deg,#c9d3db,#ffffff 30%,#ffffff 70%,#c9d3db);color:#04070b;'),
    ('padding:2px 12px 3px;background:var(--gold);color:#0a0700;', 'padding:2px 12px 3px;background:#fff;color:#04070b;'),
    ('transform:rotate(8deg) skewX(-8deg);box-shadow:0 6px 16px -4px rgba(0,0,0,.8)}', 'transform:rotate(8deg) skewX(-8deg);box-shadow:4px 4px 0 var(--brand),0 8px 18px -4px rgba(0,0,0,.8)}'),
    ('border-radius:999px;cursor:pointer;text-align:left;color:#0a0700;\n  background:linear-gradient(180deg,#ffe07a,var(--gold) 46%,#f09a00);box-shadow:inset 0 1px 0 rgba(255,255,255,.7),0 16px 34px -10px rgba(255,160,0,.55),0 2px 0 #000;',
     'border-radius:999px;cursor:pointer;text-align:left;color:#fff;text-shadow:0 1px 0 rgba(0,24,70,.5);\n  background:linear-gradient(180deg,#5db8ff,var(--brand) 46%,#0056d8);box-shadow:inset 0 1px 0 rgba(255,255,255,.55),0 16px 34px -10px rgba(10,132,255,.6),0 2px 0 #000;'),
    ('.fab__ico{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#0a0700;color:var(--gold)}', '.fab__ico{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:#fff;color:var(--brand)}'),
    ('.hdr__packs b{min-width:30px;height:30px;padding:0 8px;border-radius:999px;display:grid;place-items:center;background:#06090b;color:var(--brand);', '.hdr__packs b{min-width:30px;height:30px;padding:0 8px;border-radius:999px;display:grid;place-items:center;background:#06090b;color:var(--brand-hi);'),
])

once('src/css/overlays.css', [
    ('.gate__preview{color:var(--gold)}', '.gate__preview{color:var(--sky)}'),
    ('.pv__stock i{width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px var(--gold)}', '.pv__stock i{width:8px;height:8px;border-radius:50%;background:var(--sky);box-shadow:0 0 8px var(--sky)}'),
])

once('src/css/rip.css', [
    ('.rip__note.is-gold{color:var(--gold)}', '.rip__note.is-gold{color:var(--sky)}'),
    ('@keyframes prism{0%,100%{--tc:#ff7a1a}35%{--tc:#ffc61a}60%{--tc:#fff1b0}80%{--tc:#ffc61a}}', '@keyframes prism{0%,100%{--tc:#ffffff}35%{--tc:#9fd6ff}60%{--tc:#0a84ff}80%{--tc:#9fd6ff}}'),
])

once('src/css/ripx.css', [
    ('background:var(--brand);color:#071000;font-family:var(--font-display);font-style:italic;font-weight:800;font-size:6.2cqw;', 'background:var(--brand);color:#fff;font-family:var(--font-display);font-style:italic;font-weight:800;font-size:6.2cqw;'),
    ('.rip__prompt b{font-weight:800;color:var(--brand)}', '.rip__prompt b{font-weight:800;color:var(--brand-hi)}'),
    ('filter:drop-shadow(0 4cqw 4cqw rgba(0,0,0,.8)) drop-shadow(0 0 5cqw color-mix(in srgb,var(--tc) 45%,transparent))}', 'filter:drop-shadow(0 4cqw 4cqw rgba(0,0,0,.8)) drop-shadow(0 0 5cqw color-mix(in srgb,var(--tc) 32%,transparent))}'),
])

C = 'src/css/card.css'
once(C, [
    ('inset 0 0 0 1.4cqw #c8930a,inset 0 0 0 1.75cqw #ffe9a3,inset 0 0 0 2.3cqw #000,inset 0 0 0 2.6cqw rgba(255,198,26,.45)', 'inset 0 0 0 1.4cqw #0a6fe0,inset 0 0 0 1.75cqw #d5ecff,inset 0 0 0 2.3cqw #000,inset 0 0 0 2.6cqw rgba(10,132,255,.5)'),
    ('rgba(255,198,26,.13) 0 2deg,rgba(255,198,26,0) 2deg 8deg', 'rgba(93,184,255,.16) 0 2deg,rgba(93,184,255,0) 2deg 8deg'),
    ('background-image:linear-gradient(180deg,#fff6c4 0%,var(--gold) 46%,#c98200 100%)', 'background-image:linear-gradient(180deg,#ffffff 0%,#9fd6ff 42%,#0a84ff 100%)'),
    ('filter:drop-shadow(0 0 5cqw rgba(255,198,26,.5))', 'filter:drop-shadow(0 0 5cqw rgba(10,132,255,.6))'),
    ('.pc__crown{position:absolute;left:50%;bottom:7%;width:20%;transform:translateX(-50%);fill:var(--gold)}', '.pc__crown{display:none}'),
    ('rgba(10,132,255,.5) 46%,rgba(255,198,26,.6) 58%,rgba(255,122,26,0) 74%', 'rgba(255,255,255,.5) 46%,rgba(10,132,255,.6) 58%,rgba(10,132,255,0) 74%'),
])

K = 'src/css/pack.css'
once(K, [
    ('.bk__odds b{display:block;font-family:var(--font-display);font-size:4.2cqw;letter-spacing:.1em;color:var(--gold)}', '.bk__odds b{display:block;font-family:var(--font-display);font-size:4.2cqw;letter-spacing:.1em;color:var(--sky)}'),
    ('  radial-gradient(130% 90% at 50% 26%,#26343d 0%,#131b21 46%,#070a0c 100%)}', '  radial-gradient(130% 90% at 50% 26%,#1d3150 0%,#0e1828 46%,#05080d 100%)}'),
    ('rgba(255,240,170,.5) 16%,rgba(255,198,26,.16) 42%,rgba(255,198,26,0) 68%', 'rgba(190,228,255,.55) 16%,rgba(10,132,255,.2) 42%,rgba(10,132,255,0) 68%'),
    ('padding:0 2.4cqw;background:#172029;', 'padding:0 2.4cqw;background:#13233a;'),
    ('--c:rgba(255,198,26,.8);--l:7cqw;', '--c:rgba(255,255,255,.75);--l:7cqw;'),
    ('letter-spacing:.16em;text-transform:uppercase;color:rgba(255,198,26,.9)}', 'letter-spacing:.16em;text-transform:uppercase;color:rgba(159,214,255,.95)}'),
    ('.pk__logo{position:absolute;left:1%;top:16.6%;width:98%;max-width:none;filter:drop-shadow(0 2.4cqw 3cqw rgba(0,0,0,.8))}', '.pk__logo{position:absolute;left:8.5%;top:16%;width:83%;max-width:none;filter:drop-shadow(0 2.4cqw 3cqw rgba(0,0,0,.8))}'),
    ('border:1px solid rgba(255,198,26,.65);', 'border:1px solid rgba(93,184,255,.85);'),
    ('background-image:linear-gradient(180deg,#f3ff66 0%,var(--brand) 42%,var(--gold) 100%)', 'background-image:linear-gradient(180deg,#ffffff 0%,#bfe4ff 38%,#2a97ff 100%)'),
    ('rgba(10,132,255,.2) 50%,rgba(255,198,26,.26) 56%,rgba(255,122,26,0) 64%', 'rgba(255,255,255,.22) 50%,rgba(10,132,255,.3) 56%,rgba(10,132,255,0) 64%'),
    ('filter:drop-shadow(0 0 1.2cqw #ffd45a) drop-shadow(0 0 3.2cqw rgba(255,198,26,.85))}', 'filter:drop-shadow(0 0 1.2cqw #8fd0ff) drop-shadow(0 0 3.2cqw rgba(10,132,255,.95))}'),
    ('.pk__burn path{fill:none;stroke:#fffbe6;', '.pk__burn path{fill:none;stroke:#f4fbff;'),
    ('background:radial-gradient(closest-side,#fff,rgba(255,236,150,.92) 30%,rgba(255,198,26,0) 70%)}', 'background:radial-gradient(closest-side,#fff,rgba(170,220,255,.92) 30%,rgba(10,132,255,0) 70%)}'),
    # the FREE sticker in the logo's own language: white saw-edged rim, blue seal, white lettering
    ('.pk__sticker::before{content:"";position:absolute;inset:0;clip-path:polygon({{BURST_POLY}});background:radial-gradient(circle at 32% 26%,#fffbd0 0,#ffe24a 26%,#ffc21a 58%,#f59300 100%)}',
     '.pk__sticker::before{content:"";position:absolute;inset:0;clip-path:polygon({{BURST_POLY}});background:radial-gradient(circle at 32% 26%,#ffffff 0,#f2f7fb 55%,#cfdbe6 100%)}'),
    ('.pk__sticker::after{content:"";position:absolute;inset:8.5%;border-radius:50%;border:max(1px,.55cqw) dashed rgba(10,7,0,.6);box-shadow:inset 0 0 0 max(1px,.35cqw) rgba(255,255,255,.35)}',
     '.pk__sticker::after{content:"";position:absolute;inset:9.5%;border-radius:50%;background:radial-gradient(circle at 34% 26%,#6cc0ff 0,#0a84ff 46%,#0050d0 100%);box-shadow:0 0 0 max(1px,.9cqw) #04070b,inset 0 0 0 max(1px,.5cqw) rgba(255,255,255,.4)}'),
    ('.pk .pk__sticker b,.pk .pk__sticker i{position:relative;z-index:1;color:#0a0700;text-transform:uppercase;font-family:var(--font-display)}',
     '.pk .pk__sticker b,.pk .pk__sticker i{position:relative;z-index:1;color:#fff;text-transform:uppercase;font-family:var(--font-display);text-shadow:0 max(1px,.5cqw) 0 rgba(0,20,60,.6)}'),
])

once('src/js/00-core.js', [
    ("    legendary: { label: 'Legendary',   rank: 3, color: '#ffc61a' },\n    grand:     { label: 'Grand prize', rank: 4, color: '#ff7a1a' }",
     "    legendary: { label: 'Legendary',   rank: 3, color: '#ffc93c' },\n    grand:     { label: 'Grand prize', rank: 4, color: '#ffffff' }"),
    ('<img class="pk__logo" src="assets/logo.webp" alt="" width="1400" height="955" draggable="false">', '<img class="pk__logo" src="assets/logo.webp" alt="" width="1100" height="956" draggable="false">'),
    ('<span class="pc__q">?</span><svg class="pc__crown" viewBox="0 0 48 40" aria-hidden="true"><path d="M4 34 8 12l10 10 6-14 6 14 10-10 4 22z"/></svg></div>', '<span class="pc__q">?</span></div>'),
])
once('src/js/20-dust.js', [
    ("    const cols = ['255,70,110', '255,198,26', '255,255,255', '166,255,0'];", "    const cols = ['255,70,110', '120,196,255', '255,255,255', '10,132,255'];"),
])
once('src/js/30-fx.js', [
    ("    const C = { lime: '#0a84ff', cyan: '#6cc3ff', gold: '#ffc61a', white: '#ffffff' };", "    const C = { lime: '#0a84ff', cyan: '#6cc3ff', gold: '#9fd6ff', white: '#ffffff', coin: '#f2f8ff', rim: '#0a5bd0' };"),
    ("s: rnd(8, 13), col: C.gold, life: life, max: life }); }", "s: rnd(8, 13), col: C.coin, life: life, max: life }); }"),
    ("g.fillStyle = p.col; g.fill(); g.lineWidth = 2; g.strokeStyle = '#7a4b00'; g.stroke();", "g.fillStyle = p.col; g.fill(); g.lineWidth = 2; g.strokeStyle = C.rim; g.stroke();"),
])
once('src/body.html', [
    ('      <img src="assets/logo-sm.webp" alt="" width="560" height="382">\n      <span class="brand__word">', '      <img src="assets/logo-sm.webp" alt="" width="420" height="365">\n      <span class="brand__word">'),
    ('<img class="story__mark" src="assets/logo-sm.webp" alt="" width="560" height="382" loading="lazy">', '<img class="story__mark" src="assets/logo-sm.webp" alt="" width="420" height="365" loading="lazy">'),
    ('        <img src="assets/logo-sm.webp" alt="RideLoot" width="560" height="382" loading="lazy">', '        <img src="assets/logo-sm.webp" alt="RideLoot" width="420" height="365" loading="lazy">'),
])

for p, t in text.items():
    p.write_text(t, encoding='utf-8')
print('recoloured', len(text), 'files')
