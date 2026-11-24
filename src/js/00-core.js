  /* ------------------------------------------------------------------
     Settings. Everything here is a placeholder to replace before launch.
     One prize per pack. The odds shown on the page come from these weights.
     ------------------------------------------------------------------ */
  const CONFIG = {
    freeCode: 'FREEPACK',
    freeEmail: 'rideloot@gmail.com',
    packPrice: 20,
    prizes: [
      { id: 'car',      tier: 'grand',     name: 'BMW M3 Competition',             note: 'Grand prize',   weight: 0,    icon: 'car', photo: 'assets/car.webp', at: 10000 },
      { id: 'ent75k',   tier: 'legendary', name: '75,000 entries',     note: '', weight: 500, icon: 'ticket', entries: 75000 },
      { id: 'ent25k',   tier: 'epic',      name: '25,000 entries',     note: '', weight: 1000, icon: 'ticket', entries: 25000 },
      { id: 'ent10k',   tier: 'rare',      name: '10,000 entries',     note: '', weight: 2000, icon: 'ticket', entries: 10000 },
      { id: 'ent2500',  tier: 'uncommon',  name: '2,500 entries',      note: '', weight: 3000, icon: 'ticket', entries: 2500 },
      { id: 'ent1k',    tier: 'common',    name: '1,000 entries',      note: '', weight: 3500, icon: 'ticket', entries: 1000 }
    ]
  };

  /* the rarities, lowest first. A tier's rank is its place in this list, so adding one here is enough. */
  const ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'grand'];
  const TIERS = {
    common:    { label: 'Common',      color: '#b8c4cb' },
    uncommon:  { label: 'Uncommon',    color: '#4be3a0' },
    rare:      { label: 'Rare',        color: '#6cc3ff' },
    epic:      { label: 'Epic',        color: '#b06bff' },
    legendary: { label: 'Legendary',   color: '#ffc93c' },
    grand:     { label: 'Grand prize', color: '#ffffff' }
  };
  ORDER.forEach((t, i) => { TIERS[t].rank = i; });
  const RANK = { rare: TIERS.rare.rank, epic: TIERS.epic.rank, legendary: TIERS.legendary.rank, grand: TIERS.grand.rank };

  const ICONS = {
    wall: '<rect x="12" y="5" width="24" height="38" rx="4"/><path d="M12 33l7-8 6 6 4-4 7 8"/><circle cx="29" cy="15" r="3"/>',
    car: '<path fill="currentColor" stroke="none" d="M2.2 31.5C2.2 29.8 2.9 28.4 4.5 27.8 8 26.3 12 25.2 16 24.6L21.8 19.8C23.2 18.7 24.9 18.2 26.8 18.2H31C33.4 18.2 35.7 18.9 37.7 20.3L43 23.9C44.9 24.6 46 26 46 27.8V31.5H41.5A4.75 4.75 0 0 0 32 31.5H18A4.8 4.8 0 0 0 8.4 31.5Z"/><circle cx="13.2" cy="32" r="3.3" stroke-width="2.2"/><circle cx="36.75" cy="32" r="3.3" stroke-width="2.2"/>',
    wheel: '<circle cx="24" cy="24" r="18"/><circle cx="24" cy="24" r="5"/><path d="{{WHEEL_SPOKES}}"/>',
    spray: '<path d="M17 21h14v19a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z"/><path d="M20 21v-7h8v7M28 14h6l3 4M20 14l-6-3M9 8l-3-2M9 13H5"/>',
    pad: '<path d="M14 15h20a9 9 0 0 1 8.800 7.200l2 9.600a5 5 0 0 1-8.700 4.200L32 31H16l-4.100 5a5 5 0 0 1-8.700-4.200l2-9.600A9 9 0 0 1 14 15z"/><path d="M15 20.500v6M12 23.500h6M31 22h.01M35 25.500h.01"/>',
    tag: '<path d="M7 7h17l17 17-17 17L7 24z"/><circle cx="16" cy="16" r="3"/>',
    plate: '<rect x="4" y="11" width="40" height="26" rx="4.5"/><rect x="10" y="20" width="28" height="11" rx="1.5"/><path d="M15.5 15.5h.01M32.5 15.5h.01"/>',
    star: '<polygon points="{{STAR_POINTS}}"/>',
    ticket: '<path d="M6 14h36v7a3 3 0 0 0 0 6v7H6v-7a3 3 0 0 0 0-6z"/><path d="M30 15v18" stroke-dasharray="3 4"/>'
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name) => '<svg viewBox="0 0 48 48" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name] || '') + '</svg>';
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : many);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad4 = (n) => String(n).padStart(4, '0');
  const pad2 = (n) => String(n).padStart(2, '0');
  const money = (n) => '$' + (Number.isInteger(n) ? n : n.toFixed(2));
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOTAL = CONFIG.prizes.reduce((s, p) => s + p.weight, 0);

  /* ---------- state: this browser only, preview convenience. No email address is ever kept. ---------- */
  const KEY = 'rideloot-preview-v3';
  let state = clean(null);

  function clean(s) {
    const o = { claimed: false, packs: 0, opened: 0, pulls: {}, force: 'random' };
    if (!s || typeof s !== 'object') return o;
    o.claimed = s.claimed === true;
    if (Number.isFinite(s.packs)) o.packs = clamp(Math.floor(s.packs), 0, 999);
    if (Number.isFinite(s.opened)) o.opened = Math.max(0, Math.floor(s.opened));
    if (s.pulls && typeof s.pulls === 'object') {
      CONFIG.prizes.forEach((p) => { if (Number.isFinite(s.pulls[p.id]) && s.pulls[p.id] > 0) o.pulls[p.id] = Math.floor(s.pulls[p.id]); });
    }
    if (s.force === 'random' || TIERS[s.force]) o.force = s.force;
    return o;
  }
  function load() { try { const raw = localStorage.getItem(KEY); if (raw) state = clean(JSON.parse(raw)); } catch (e) { /* storage unavailable: run from memory */ } }
  function save() { if (LIVE.on) return; try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  /* ---------- live mode: served with its back end, packs, pulls and the pack count live on the server.
     Without a back end (the preview) everything above keeps working from this browser alone. ---------- */
  const LIVE = { on: false, checkout: false, next: 1, wallpaper: '' };
  const WKEY = 'rideloot-wallet';
  let walletToken = '';
  try { walletToken = localStorage.getItem(WKEY) || ''; } catch (e) { /* storage unavailable */ }
  async function api(path, data, method) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 12000);
    try {
      const res = await fetch('/api/' + path, {
        method: method || (data ? 'POST' : 'GET'), cache: 'no-store', signal: ctl.signal,
        headers: Object.assign({ 'x-wallet': walletToken }, data ? { 'content-type': 'application/json' } : {}),
        body: data ? JSON.stringify(data) : undefined
      });
      let out = null;
      try { out = await res.json(); } catch (e) { /* not JSON: no back end here */ }
      return out && typeof out === 'object' ? out : { ok: false, error: 'server' };
    } catch (e) { return { ok: false, error: 'network' }; } finally { clearTimeout(timer); }
  }
  /* the server's word on this visitor replaces whatever the page was holding */
  function applyWallet(w) {
    const c = clean({ claimed: w.claimed === true, packs: w.packs, opened: w.opened, pulls: w.pulls, force: 'random' });
    state.claimed = c.claimed; state.packs = c.packs; state.opened = c.opened; state.pulls = c.pulls; state.force = 'random';
    if (Number.isFinite(w.next_no)) LIVE.next = w.next_no;
    if ('wallpaper' in w) LIVE.wallpaper = typeof w.wallpaper === 'string' && w.wallpaper.indexOf('/api/wallpaper?o=') === 0 ? w.wallpaper : '';
  }

  /* ---------- the draw: one prize per pack ---------- */
  function rand() {
    try { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; } catch (e) { return Math.random(); }
  }
  function pick(list) {
    let r = rand() * list.reduce((s, p) => s + p.weight, 0);
    for (const p of list) { r -= p.weight; if (r < 0) return p; }
    return list[list.length - 1];
  }
  function drawPrize(force) {
    if (force && force !== 'random') {
      const pool = CONFIG.prizes.filter((p) => p.tier === force);
      if (pool.length) return pick(pool);
    }
    /* the grand prize is not random: it sits in one numbered pack, counting every pack opened, free or paid */
    const milestone = CONFIG.prizes.find((p) => p.at && state.opened + 1 === p.at);
    return milestone || pick(CONFIG.prizes);
  }
  /* entries held in the final draw: the sum of what each pulled card carries */
  function entriesTotal() { return CONFIG.prizes.reduce((n, p) => n + (p.entries || 0) * (state.pulls[p.id] || 0), 0); }
  const num = (n) => n.toLocaleString('en-US');
  function oddsText(p) {
    if (p.at) return '1 in ' + p.at.toLocaleString('en-US');
    /* shown as a share of packs: 1%, 2.5%, 0.01% */
    const pct = p.weight / TOTAL * 100;
    return (pct >= 10 ? Math.round(pct) : Number(pct.toPrecision(2))) + '%';
  }

  /* ---------- pack markup: the flat artwork, and the same artwork wrapped as a 3D object ---------- */
  function packArt(no) {
    const shine = '<span class="pk__foilfx"></span><span class="pk__holo"></span><span class="pk__sheen"></span><span class="pk__glare"></span>';
    return '<div class="pk"><span class="pk__mouth"></span>' +
      '<span class="pk__front foil"><span class="pk__weave"></span><span class="pk__burst"></span>' +
        '<span class="pk__band"><span class="pk__series">Series 01</span><span class="pk__num">No. ' + pad4(no) + '</span></span>' +
        '<span class="pk__frame"></span>' +
        '<img class="pk__logo" src="assets/logo.webp" alt="" width="1100" height="956" draggable="false">' +
        '<span class="pk__plate"><b>Giveaway pack</b><span>1 prize inside</span></span>' +
        '<span class="pk__info"><i class="pk__bars"></i><span class="pk__pips">' + ORDER.map((t) => '<i data-tier="' + t + '"></i>').join('') + '</span>' +
          '<span class="pk__small">1 prize card inside<br>Odds posted on site<br>No purchase necessary</span></span>' +
        '<span class="pk__seal pk__seal--b"></span>' + shine +
        '<span class="pk__glint pk__glint--a"></span><span class="pk__glint pk__glint--b"></span><span class="pk__glint pk__glint--c"></span>' +
        '<span class="pk__shade"></span></span>' +
      '<span class="pk__sticker"><i>First pack</i><b>Free</b><i>On us</i></span>' +
      '<span class="pk__lid"><span class="pk__strip foil"><span class="pk__weave"></span><span class="pk__seal pk__seal--t"></span><span class="pk__slot"></span>' +
        '<span class="pk__perf"></span><span class="pk__tearhere">Tear here</span>' + shine + '<span class="pk__shade"></span></span></span>' +
      '<svg class="pk__burn" viewBox="0 0 100 140" aria-hidden="true"><path pathLength="1" d="{{TEAR_PATH}}"/></svg>' +
      '<span class="pk__spark"></span></div>';
  }
  function pack3D(no) {
    let edges = '';
    for (let z = 2; z <= 10; z += 2) edges += '<span class="p3__edge" style="--z:-' + z + 'px"></span>';
    return '<div class="p3">' + edges +
      '<div class="p3__back foil"><span class="pk__weave"></span><span class="pk__seal pk__seal--t"></span><span class="pk__seal pk__seal--b"></span><span class="bk__seam"></span>' +
        '<span class="bk__title">RideLoot</span>' +
        '<span class="bk__lines">One prize card inside. Rip the top seal to open.</span>' +
        '<span class="bk__odds"><b>Odds</b>Posted on the site for every prize. No purchase necessary.</span>' +
        '<span class="bk__bars"></span><span class="bk__fine">Series 01<br>Placeholder print</span><span class="pk__foilfx"></span><span class="pk__sheen"></span><span class="pk__shade"></span></div>' +
      packArt(no) + '</div>';
  }
  /* shown over a sealed pack in the rip room: where to rip, and how */
  const GUIDE = '<div class="guide" aria-hidden="true"><span class="guide__track"></span><span class="guide__trail"></span><span class="guide__tag">Rip here</span>' +
    '<span class="guide__hand"><svg viewBox="0 0 48 48"><path fill="#fff" stroke="#05080a" stroke-width="2.2" stroke-linejoin="round" d="M18 4.500a3.400 3.400 0 0 0-3.400 3.400v18.600l-2.600-2.700a3.300 3.300 0 0 0-4.800 4.500l7.400 9.600c2.300 3 5.400 5.100 9.800 5.100h4.400c6.100 0 10.600-4.400 10.600-10.500v-7.900a2.900 2.900 0 0 0-5.800-.3v-1.300a3 3 0 0 0-6-.4v-1.200a3.100 3.100 0 0 0-6.200-.2V7.900A3.400 3.400 0 0 0 18 4.500z"/></svg></span></div>';

  /* ---------- prize card markup ---------- */
  function cardInner(p, no) {
    const art = p.photo
      ? '<span class="pc__art pc__art--photo"><img src="' + esc(p.photo) + '" alt="" draggable="false"></span>'
      : '<span class="pc__art">' + icon(p.icon) + '</span>';
    const rank = TIERS[p.tier].rank;
    let gems = '';
    for (let i = 0; i < ORDER.length; i++) gems += '<i' + (i <= rank ? ' class="is-on"' : '') + '></i>';
    return '<span class="pc__bg"></span><span class="pc__rays"></span><span class="pc__foil"></span><span class="pc__frame"></span>' +
      '<span class="pc__top"><b>RideLoot</b><em>' + oddsText(p) + '</em></span>' +
      '<span class="pc__artglow"></span>' +
      '<span class="pc__tier">' + TIERS[p.tier].label + '</span>' + art +
      '<span class="pc__gems">' + gems + '</span>' +
      '<span class="pc__name">' + esc(p.name) + '</span>' +
      '<span class="pc__note">' + esc(p.note) + '</span>' +
      '<span class="pc__no">Series 1 &#183; ' + (no ? 'No. ' + pad4(no) : 'Prize card') + '</span>' +
      '<span class="pc__holo"></span><span class="pc__spark"></span><span class="pc__glare"></span>';
  }
  function cardHTML(p, no, cls) {
    return '<div class="pc ' + (cls || '') + '"' + (p ? ' data-tier="' + p.tier + '"' : '') + '><div class="pc__lift"><div class="pc__tilt"><span class="pc__shadow"></span><div class="pc__flip">' +
      '<div class="pc__face pc__back"><span class="pc__backglow"></span><span class="pc__q">?</span></div>' +
      '<div class="pc__face pc__front">' + (p ? cardInner(p, no) : '') + '</div>' +
      '</div></div></div></div>';
  }
