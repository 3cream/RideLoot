  /* ---------- the page around the rip room ---------- */
  const root = document.documentElement;
  const heroEl = $('top'), heroPack = $('heroPack'), hdr = $('hdr'), fab = $('fab');
  const narrow = window.matchMedia('(max-width:860px), (max-aspect-ratio:1/1)');
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const vis = { hero: true, sheet: false };
  tilt.hero = { px: 0, py: 0, cx: 0, cy: 0 };
  tilt.sheet = { px: 0, py: 0, cx: 0, cy: 0 };

  /* the page behind is frozen while the rip room or a dialog is open */
  function syncLock() {
    const on = !!R || !!document.querySelector('dialog[open]');
    root.classList.toggle('is-locked', on);
    document.querySelectorAll('main, .hdr, .foot, .fab').forEach((el) => { el.inert = !!R; });
  }

  /* what the main button does depends on where you are: claim, rip, or get another pack */
  function ctaState() {
    if (!state.claimed) return { label: 'Get my free pack', t: 'Free pack', s: 'Enter your email to claim it' };
    if (state.packs > 0) return { label: state.packs === 1 ? 'Rip my pack' : 'Rip a pack', t: plural(state.packs, 'pack', 'packs') + ' ready', s: 'Tap to rip the top' };
    return { label: 'Get another pack', t: 'Buy now', s: '', say: 'Buy now' };
  }
  function primary(src) {
    if (!state.claimed) { openDlg('gateDlg'); return; }
    if (state.packs > 0) { closeDialogs(); enterRip(src || null); return; }
    openDlg('productDlg');
  }

  function renderCounts() {
    const n = state.packs, c = ctaState();
    $('chipCount').textContent = n;
    $('packChip').setAttribute('aria-label', 'Your packs: ' + n);
    document.querySelectorAll('[data-cta-label]').forEach((el) => { el.textContent = c.label; });
    $('fabT').textContent = c.t; $('fabS').textContent = c.s;
    fab.setAttribute('aria-label', c.say || c.label);
    heroPack.classList.toggle('is-empty', state.claimed && n === 0);
    heroPack.setAttribute('aria-label', c.label);
    /* before the claim the hero pack wears the FREE sticker; after it, a tag asks to be ripped */
    document.querySelectorAll('[data-freepack]').forEach((el) => { el.dataset.free = state.claimed ? '0' : '1'; });
    $('heroTag').hidden = !state.claimed || n === 0;
    $('firstLabel').textContent = state.claimed ? 'Claimed' : 'Free';
    $('firstBtn').setAttribute('aria-label', state.claimed ? 'Free pack claimed' : 'Claim your free pack');
    $('firstBtn').disabled = state.claimed;
    const no = 'No. ' + pad4(LIVE.on ? LIVE.next : state.opened + 1);
    document.querySelectorAll('[data-pack3d] .pk__num').forEach((el) => { el.textContent = no; });
  }

  let sheetIdx = -1, sheetItems = [];
  function renderSheet() {
    const n = CONFIG.prizes.length;
    $('sheetCount').textContent = n;
    $('sheetOf').textContent = '/ ' + pad2(n);
    $('sheetList').innerHTML = CONFIG.prizes.map((p, i) =>
      '<li class="sheet__item" data-i="' + i + '" data-tier="' + p.tier + '"><span class="sheet__i">' + pad2(i + 1) + '</span><h3 class="sheet__name">' + esc(p.name) + '</h3>' +
      '<span class="sheet__odds">' + oddsText(p) + '</span><p class="sheet__meta"><span class="sheet__tier">' + TIERS[p.tier].label + '</span>' + esc(p.note) + '</p></li>'
    ).join('');
    sheetItems = Array.from($('sheetList').children);
    const car = CONFIG.prizes.find((p) => p.tier === 'grand'), carOdds = car ? oddsText(car) : '';
    document.querySelectorAll('[data-odds-car]').forEach((el) => { el.textContent = carOdds; });
    $('faqOdds').innerHTML = CONFIG.prizes.map((p) =>
      '<li data-tier="' + p.tier + '"><span class="faqodds__tier">' + TIERS[p.tier].label + '</span><span class="faqodds__name">' + esc(p.name) + '</span><b>' + (p.at ? p.at.toLocaleString('en-US') + 'th pack' : oddsText(p)) + '</b></li>').join('');
    $('insideGrid').innerHTML = CONFIG.prizes.map((p) =>
      '<article class="inside__item" data-tier="' + p.tier + '"><div class="inside__card">' + cardHTML(p, 0, 'pc--static is-open') + '</div>' +
      '<span class="sheet__tier">' + TIERS[p.tier].label + '</span><h3 class="inside__name">' + esc(p.name) + '</h3><p class="inside__odds">' + oddsText(p) + '</p></article>'
    ).join('');
    sheetIdx = -1; setSheet(0, true);
  }
  function setSheet(i, instant) {
    if (i === sheetIdx || !CONFIG.prizes[i]) return;
    sheetIdx = i;
    const p = CONFIG.prizes[i], holder = $('sheetCard');
    $('sheetView').dataset.tier = p.tier;
    holder.innerHTML = cardHTML(p, 0, 'pc--static is-open');
    if (!instant && !reduced && holder.animate) holder.animate([{ opacity: 0, transform: 'translateY(16px) scale(.93)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.2,.9,.3,1)' });
    $('sheetN').textContent = pad2(i + 1); $('sheetName').textContent = p.name;
    sheetItems.forEach((el, k) => el.classList.toggle('is-on', k === i));
  }

  function renderPulls() {
    $('statOpened').textContent = state.opened;
    $('statEntries').textContent = num(entriesTotal());
    $('statPacks').textContent = state.packs;
    const rows = CONFIG.prizes.filter((p) => state.pulls[p.id]).sort((a, b) => TIERS[b.tier].rank - TIERS[a.tier].rank || a.weight - b.weight);
    $('pulls').className = rows.length ? 'pulls' : '';
    $('pulls').innerHTML = rows.length
      ? rows.map((p) => '<div class="pull" data-tier="' + p.tier + '"><span class="rung__ico">' + icon(p.icon) + '</span><b>' + esc(p.name) + '<small>' + TIERS[p.tier].label + '</small></b><span class="pull__n">x' + state.pulls[p.id] + '</span></div>').join('')
      : '<p class="empty">Nothing here yet. Rip your first pack and your prize lands here.</p>';
  }

  let toastTimer = 0;
  function toast(msg) {
    const t = $('toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('is-on'), 3600);
  }

  /* ---------- one-time builds ---------- */
  function buildBands() {
    const mk = (items) => { const one = '<span>' + items.map((t) => esc(t) + '<i></i>').join('') + '</span>'; return one + one + one + one; };
    $('bandFront').innerHTML = mk(['1 pack = 1 prize', 'Rip the top', 'RideLoot', 'Pull the keys']);
    $('bandBack').innerHTML = mk(['First pack free', 'Odds posted', 'Same odds free or paid', 'No purchase necessary']);
  }
  const viewers = Array.from(document.querySelectorAll('[data-viewer]')).map((el, i) => ({ el: el, p3: null, dlg: el.closest('dialog'), ry: -16, rx: 4, vy: 0, drag: null, idleAt: 0, vis: false, ph: i * 1.7 }));
  function mountPacks() {
    const no = state.opened + 1;
    document.querySelectorAll('[data-pack3d]').forEach((el) => { el.innerHTML = pack3D(no); });
    viewers.forEach((v) => { v.p3 = v.el.querySelector('.p3'); });
  }

  /* ---------- dialogs ---------- */
  function closeDialogs() { document.querySelectorAll('dialog[open]').forEach((d) => d.close()); syncLock(); }
  function openDlg(id, quiet) {
    const d = $(id);
    if (!d || R) return;
    if (d.open) return;
    closeDialogs();
    try { d.showModal(); } catch (e) { return; }
    syncLock();
    d.scrollTop = 0;
    if (quiet && document.activeElement && document.activeElement !== document.body) { try { document.activeElement.blur(); } catch (e) { /* ignore */ } }
    if (id === 'gateDlg') { $('gateMsg').textContent = ''; if (!quiet) setTimeout(() => { try { $('gateEmail').focus(); } catch (e) { /* ignore */ } }, 80); }
    if (id === 'productDlg') { $('buyMsg').textContent = ''; $('buyRip').hidden = true; $('pvCodeMsg').textContent = ''; $('pvCodeInput').value = ''; $('pvCodeAcc').open = false; renderBuy(); }
  }
  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('close', syncLock);
    d.addEventListener('click', (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
  });
  function autoGate() {
    if (state.claimed) return;
    let seen = false;
    try { seen = sessionStorage.getItem('rl-gate') === '1'; } catch (e) { /* ignore */ }
    if (seen) return;
    setTimeout(() => {
      if (state.claimed || R || document.querySelector('dialog[open]') || window.scrollY > window.innerHeight * 0.6) return;
      try { sessionStorage.setItem('rl-gate', '1'); } catch (e) { /* ignore */ }
      openDlg('gateDlg', true);
    }, 2600);
  }

  /* ---------- things that follow the scroll ---------- */
  const footEl = document.querySelector('.foot');
  const bandsEl = document.querySelector('.bands');
  const stageEl = $('prize'), pin = $('stagePin'), slides = Array.from(document.querySelectorAll('#prize .slide'));
  let lastY = 0, dirty = true, stageIdx = 0;
  function onScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    if (y > lastY + 4 && y > 260) hdr.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 260) hdr.classList.remove('is-hidden');
    lastY = y;
    const sr = stageEl.getBoundingClientRect(), br = bandsEl.getBoundingClientRect();
    /* the glass bar darkens while the bright photos or the chrome band are behind it */
    hdr.classList.toggle('is-smoke', (sr.top < 92 && sr.bottom > 8) || (br.top < 92 && br.bottom > 8));
    const pinned = sr.top < vh * 0.4 && sr.bottom > vh * 0.6;
    fab.classList.toggle('is-on', y > heroEl.offsetHeight * 0.5 && !pinned && footEl.getBoundingClientRect().top > vh - 40);
    if (sr.bottom > -vh && sr.top < vh * 2) {
      const p = clamp(-sr.top / Math.max(1, sr.height - vh), 0, 1);
      const open = 1, e = 1;   /* the photos fill the screen from the first moment */
      pin.style.setProperty('--o', e.toFixed(4));
      pin.style.setProperty('--wx', (p * 56).toFixed(2));
      pin.classList.toggle('is-open', open >= 1);
      const n = slides.length, q = clamp(p, 0, 0.9999), i = Math.floor(q * n);
      if (i !== stageIdx) {
        stageIdx = i;
        slides.forEach((s, k) => s.classList.toggle('is-on', k === i));
        $('stageN').textContent = pad2(i + 1); $('stageCap').textContent = slides[i].dataset.cap || '';
      }
      $('stageBar').style.setProperty('--bar', q.toFixed(3));
    }

    const lr = $('sheetList').getBoundingClientRect();
    if (lr.bottom > 0 && lr.top < vh) {
      const focus = vh * (narrow.matches ? 0.76 : 0.5);
      let best = 0, bd = Infinity;
      sheetItems.forEach((el, k) => { const r = el.getBoundingClientRect(), d = Math.abs((r.top + r.bottom) / 2 - focus); if (d < bd) { bd = d; best = k; } });
      setSheet(best);
    }
  }

  /* ---------- ambient loop: the hero pack sways, viewers turn, light follows the pointer ---------- */
  let lastT = 0;
  function lean(st) { st.cx += (st.px - st.cx) * 0.09; st.cy += (st.py - st.cy) * 0.09; }
  function tiltCard(el, st, s, idle) {
    lean(st);
    const ry = (reduced ? 0 : Math.sin(s * 0.9) * 6 * idle) + st.cx * 16, rx = (reduced ? 0 : Math.cos(s * 0.7) * 3 * idle) - st.cy * 12;
    el.style.setProperty('--try', ry.toFixed(2) + 'deg'); el.style.setProperty('--trx', rx.toFixed(2) + 'deg');
    el.style.setProperty('--hx', (50 + ry * 2.4).toFixed(1) + '%'); el.style.setProperty('--hy', (50 + rx * 2.8).toFixed(1) + '%');
    el.style.setProperty('--gx', (50 - ry * 2.6).toFixed(1) + '%'); el.style.setProperty('--gy', (26 + rx * 2.2).toFixed(1) + '%');
  }
  function shine(el, ry, rx) {
    el.style.setProperty('--hx', (50 + ry * 2.6).toFixed(1) + '%'); el.style.setProperty('--hy', (50 + rx * 3).toFixed(1) + '%');
    el.style.setProperty('--gx', (48 - ry * 2.8).toFixed(1) + '%'); el.style.setProperty('--gy', (22 + rx * 2.4).toFixed(1) + '%');
  }
  function ambient(t) {
    requestAnimationFrame(ambient);
    if (document.hidden) { lastT = t; return; }
    const dt = Math.min(0.05, (t - lastT) / 1000) || 0.016, s = t / 1000; lastT = t;
    if (dirty) { dirty = false; onScroll(); }
    if (R) {
      if (R.phase === 'ready' || R.phase === 'enter') {
        R.pk.style.setProperty('--gx', (50 + Math.sin(s * 1.1) * 40).toFixed(1) + '%'); R.pk.style.setProperty('--gy', (22 + Math.cos(s * 0.8) * 9).toFixed(1) + '%');
        R.pk.style.setProperty('--hx', (50 + Math.sin(s * 0.7) * 42).toFixed(1) + '%');
      } else if (R.phase === 'done') {
        tiltCard(R.pc, tilt.rev, s, 1);
      }
      return;
    }
    const gate = $('gateDlg').open;
    if (vis.hero && !gate) {
      const h = tilt.hero; lean(h);
      const ry = (reduced ? -14 : -14 + Math.sin(s * 0.62) * 12) + h.cx * 18, rx = (reduced ? 3 : 3 + Math.cos(s * 0.47) * 3) - h.cy * 10;
      const fy = reduced ? 0 : Math.sin(s * 0.9) * -8;
      heroPack.style.setProperty('--ry', ry.toFixed(2) + 'deg'); heroPack.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      heroPack.style.setProperty('--fy', fy.toFixed(1) + 'px');
      shine(heroPack, ry, rx);
      dust.draw(dt, h.cx, h.cy, s);
    }
    if (gate) {
      const g = $('gatePack'), ry = reduced ? -12 : Math.sin(s * 0.8) * 20, rx = reduced ? 2 : Math.cos(s * 0.6) * 4;
      g.style.setProperty('--ry', ry.toFixed(2) + 'deg'); g.style.setProperty('--rx', rx.toFixed(2) + 'deg');
      g.style.setProperty('--fy', (reduced ? 0 : Math.sin(s * 1.1) * -6).toFixed(1) + 'px');
      shine(g, ry, rx);
    }
    for (const v of viewers) {
      if (!v.p3 || !(v.dlg ? v.dlg.open : v.vis)) continue;
      if (!v.drag) {
        if (t > v.idleAt) {
          const target = reduced ? -16 : Math.sin(s * 0.5 + v.ph) * 22, k = Math.round((v.ry - target) / 360);
          v.ry += (target + k * 360 - v.ry) * 0.05; v.rx += (4 - v.rx) * 0.05;
        } else { v.ry += v.vy; v.vy *= 0.93; }
      }
      v.p3.style.setProperty('--ry', v.ry.toFixed(2) + 'deg'); v.p3.style.setProperty('--rx', v.rx.toFixed(2) + 'deg');
      const a = ((v.ry % 360) + 540) % 360 - 180;
      shine(v.p3, clamp(a, -40, 40), v.rx);
      v.el.style.setProperty('--fs', (0.45 + 0.55 * Math.abs(Math.cos(v.ry * Math.PI / 180))).toFixed(3));
    }
    if (vis.sheet) { const el = $('sheetCard').firstElementChild; if (el) tiltCard(el, tilt.sheet, s, 0.7); }
  }
  function track(el, st, getRect) {
    el.addEventListener('pointermove', (e) => {
      const r = getRect(); if (!r || !r.width) return;
      st.px = clamp((e.clientX - (r.left + r.width / 2)) / r.width, -1, 1);
      st.py = clamp((e.clientY - (r.top + r.height / 2)) / r.height, -1, 1);
    });
    el.addEventListener('pointerleave', () => { st.px = 0; st.py = 0; });
  }

  /* drag a viewer to turn the pack; a plain click on it acts like the main button */
  viewers.forEach((v) => {
    const el = v.el;
    el.addEventListener('pointerdown', (e) => {
      if (e.button && e.button !== 0) return;
      if (e.target.closest && e.target.closest('button, a')) return;
      v.drag = { x: e.clientX, y: e.clientY, ry: v.ry, rx: v.rx, lx: e.clientX, moved: false, onPack: !!e.target.closest('.viewer__pack') };
      v.vy = 0;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    el.addEventListener('pointermove', (e) => {
      const d = v.drag; if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) > 6) { d.moved = true; el.classList.add('is-drag'); }
      if (!d.moved) return;
      v.ry = d.ry + dx * 0.6; v.rx = clamp(d.rx - dy * 0.25, -24, 24);
      v.vy = (e.clientX - d.lx) * 0.6; d.lx = e.clientX;
    });
    const end = (e) => {
      const d = v.drag; if (!d) return;
      v.drag = null; el.classList.remove('is-drag');
      if (d.moved) { v.idleAt = performance.now() + 2200; return; }
      if (e.type === 'pointerup' && d.onPack) {
        if (v.dlg) { if (state.packs > 0) { closeDialogs(); enterRip(null); } } else primary(v.el.querySelector('.viewer__pack'));
      }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  });

  /* ---------- buttons that push in. The look is CSS; this keeps the pushed look under a finger, with a tick of vibration on phones. ---------- */
  const KEYS = '.btn, .fab, button.pill--price, .hdr__links a, .hdr__links button, .hdr__pill, .hdr__packs, .hdr__icon';
  const keyAt = (e) => (e.target && e.target.closest ? e.target.closest(KEYS) : null);
  let heldKey = null;
  const letGo = () => { if (heldKey) { heldKey.classList.remove('is-down'); heldKey = null; } };
  document.addEventListener('pointerdown', (e) => {
    const k = keyAt(e);
    if (!k || k.disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    letGo(); heldKey = k; k.classList.add('is-down');
  }, true);
  window.addEventListener('pointerup', letGo, true);
  window.addEventListener('pointercancel', letGo, true);
  window.addEventListener('blur', letGo);   /* the window itself losing focus, not a control inside it */
  document.addEventListener('touchstart', () => {}, { passive: true });   /* lets :active show under a finger on iOS */
  document.addEventListener('click', (e) => { const k = keyAt(e); if (k && !k.disabled) buzz(8); }, true);

  /* ---------- wiring ---------- */
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest('a[href="#free-packs"]')) $('free-packs').open = true;   /* the link lands on an open answer */
    const c = t.closest('[data-close]');
    if (c) { const d = c.closest('dialog'); if (d && d.open) d.close(); syncLock(); }
    const o = t.closest('[data-open]');
    if (o) { e.preventDefault(); openDlg(o.dataset.open); return; }
    if (t.closest('[data-cta]')) primary(null);
  });
  heroPack.addEventListener('click', () => primary(heroPack));
  heroPack.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); primary(heroPack); } });
  $('packChip').addEventListener('click', () => primary(null));
  $('firstBtn').addEventListener('click', () => primary(null));
  $('sheetList').addEventListener('click', (e) => {
    const li = e.target.closest('.sheet__item'); if (!li) return;
    li.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: narrow.matches ? 'end' : 'center' });
  });

  $('tapRipBtn').addEventListener('click', () => { if (R) autoTear(R, 1); });
  $('ripClose').addEventListener('click', () => closeRip());
  $('doneBtn').addEventListener('click', () => closeRip());
  $('againBtn').addEventListener('click', () => { if (state.packs > 0) enterRip(null); else closeRip(() => openDlg('productDlg')); });
  /* a tap during the reveal skips ahead; the release that ends a swipe is not that tap */
  const skippable = (ph) => ph === 'torn' || ph === 'charge' || ph === 'peek' || ph === 'reveal';
  stage.addEventListener('click', () => { if (R && skippable(R.phase) && skippable(R.downPhase)) fastForward(R); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !R) return;
    if (R.locked && !R.done) return;   /* mid-turn: nothing to skip, and the reveal should not be cut off */
    if (skippable(R.phase)) fastForward(R); else closeRip();
  });
  window.addEventListener('scroll', () => { dirty = true; }, { passive: true });
  window.addEventListener('resize', () => { dirty = true; dust.resize(); if (R) fx.resize(); });

  track(heroEl, tilt.hero, () => heroEl.getBoundingClientRect());
  track($('sheetView'), tilt.sheet, () => $('sheetView').getBoundingClientRect());
  track(stage, tilt.rev, () => (R && R.lift ? R.lift.getBoundingClientRect() : null));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((en) => {
      if (en.target === heroEl) vis.hero = en.isIntersecting;
      else if (en.target.id === 'sheetView') vis.sheet = en.isIntersecting;
      else { const v = viewers.find((x) => x.el === en.target); if (v) v.vis = en.isIntersecting; }
    }));
    io.observe(heroEl); io.observe($('sheetView'));
    viewers.forEach((v) => { if (!v.dlg) io.observe(v.el); });
  } else { vis.sheet = true; viewers.forEach((v) => { v.vis = true; }); }

  /* free pack: the email only has to look like an email here. Nothing is sent or stored in this preview. */
  $('gateForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('gateEmail'), msg = $('gateMsg');
    if (!EMAIL.test(input.value.trim())) {
      msg.textContent = 'Enter a valid email address, like name@example.com.'; msg.className = 'formmsg is-err';
      input.focus(); return;
    }
    if (LIVE.on) { claimLive(input, msg); return; }
    input.value = '';
    if (!state.claimed) { state.claimed = true; state.packs += 1; save(); freeNext = true; }
    renderCounts(); renderPulls();
    closeDialogs();
    enterRip(null);
  });
  /* live: the server gives one free pack per email address */
  let busy = false;
  async function claimLive(input, msg) {
    if (busy) return; busy = true;
    msg.textContent = 'One moment.'; msg.className = 'formmsg';
    const r = await api('claim', { email: input.value.trim() });
    busy = false;
    if (!r.ok) {
      msg.textContent = r.error === 'email_used' ? 'That email address has already claimed its free pack.'
        : r.error === 'bad_email' ? 'Enter a valid email address, like name@example.com.'
        : 'That did not go through. Check your connection and try again.';
      msg.className = 'formmsg is-err'; input.focus(); return;
    }
    const fresh = !r.already;
    applyWallet(r); input.value = ''; msg.textContent = '';
    if (fresh) freeNext = true;
    renderCounts(); renderPulls(); closeDialogs();
    if (state.packs > 0) enterRip(null);
  }

  function qty() { const r = document.querySelector('#qty input:checked'); return r ? Number(r.value) : 1; }
  function renderBuy() { const q = qty(); $('buyLabel').textContent = 'Purchase ' + plural(q, 'pack', 'packs') + ' · ' + money(q * CONFIG.packPrice); }
  $('qty').addEventListener('change', renderBuy);
  $('buyBtn').addEventListener('click', () => {
    const q = qty();
    if (LIVE.on) { buyLive(q); return; }
    state.packs += q; save(); renderCounts(); renderPulls();
    const msg = $('buyMsg');
    msg.textContent = 'Preview only. Checkout is not connected, so ' + plural(q, 'pack was', 'packs were') + ' added for testing.'; msg.className = 'formmsg is-ok';
    $('buyRip').hidden = false;
  });
  $('buyRip').addEventListener('click', () => { closeDialogs(); enterRip(null); });
  $('buyOk').addEventListener('change', () => { $('buyMsg').textContent = ''; });
  /* live: hand the buyer to Stripe Checkout. Packs are added only after Stripe confirms the order. */
  async function buyLive(q) {
    const msg = $('buyMsg');
    if (!$('buyOk').checked) { msg.textContent = 'Tick the box above to confirm you are eligible.'; msg.className = 'formmsg is-err'; $('buyOk').focus(); return; }
    if (!LIVE.checkout) { msg.textContent = 'Checkout is not connected yet.'; msg.className = 'formmsg is-err'; return; }
    if (busy) return; busy = true;
    $('buyBtn').disabled = true; msg.textContent = 'Taking you to checkout.'; msg.className = 'formmsg';
    const r = await api('checkout', { qty: q, eligible: true });
    if (r.ok && typeof r.url === 'string' && /^https:\/\/[a-z0-9.-]*stripe\.com\//.test(r.url)) { location.href = r.url; return; }
    busy = false; $('buyBtn').disabled = false;
    msg.textContent = 'Checkout could not be started. Check your connection and try again.'; msg.className = 'formmsg is-err';
  }

  /* a code is checked the same way wherever it is typed: only a genuine code adds a pack */
  function redeem(input, msg) {
    const v = input.value.trim().toUpperCase();
    if (!v) { msg.textContent = 'Enter the code from our email.'; msg.className = 'formmsg is-err'; return; }
    if (LIVE.on) { redeemLive(v, input, msg); return; }
    if (v === CONFIG.freeCode) {
      state.packs += 1; save(); renderCounts(); renderPulls(); input.value = '';
      msg.textContent = 'Code accepted. 1 pack added.'; msg.className = 'formmsg is-ok';
    } else {
      msg.textContent = 'That code did not work. Check it against our email and try again.'; msg.className = 'formmsg is-err';
    }
  }
  async function redeemLive(code, input, msg) {
    if (busy) return; busy = true;
    msg.textContent = 'Checking.'; msg.className = 'formmsg';
    const r = await api('redeem', { code });
    busy = false;
    if (!r.ok) {
      msg.textContent = r.error === 'bad_code' ? 'That code did not work. It may be mistyped or already used.' : 'That did not go through. Check your connection and try again.';
      msg.className = 'formmsg is-err'; return;
    }
    applyWallet(r); input.value = ''; renderCounts(); renderPulls();
    msg.textContent = 'Code accepted. ' + plural(r.added, 'pack', 'packs') + ' added.'; msg.className = 'formmsg is-ok';
  }
  $('codeForm').addEventListener('submit', (e) => { e.preventDefault(); redeem($('codeInput'), $('codeMsg')); });
  $('pvCodeForm').addEventListener('submit', (e) => { e.preventDefault(); redeem($('pvCodeInput'), $('pvCodeMsg')); });
  $('copyBtn').addEventListener('click', () => {
    const addr = CONFIG.freeEmail;
    const ok = () => toast('Email address copied');
    const no = () => toast('Copy did not work. The address is ' + addr);
    try { navigator.clipboard.writeText(addr).then(ok, no); } catch (err) { no(); }
  });
  $('notifyForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('notifyEmail'), msg = $('notifyMsg');
    if (!EMAIL.test(input.value.trim())) { msg.textContent = 'Enter a valid email address, like name@example.com.'; msg.className = 'formmsg is-err'; input.focus(); return; }
    if (!$('notifyOk').checked) { msg.textContent = 'Tick the box to agree to emails from RideLoot.'; msg.className = 'formmsg is-err'; return; }
    input.value = '';
    msg.textContent = 'Preview only. Nothing was sent or saved.'; msg.className = 'formmsg is-ok';
  });

  $('addPacksBtn').addEventListener('click', () => { if (LIVE.on) return; state.packs += 5; save(); renderCounts(); renderPulls(); toast('5 packs added'); });
  $('forceSel').addEventListener('change', (e) => { if (LIVE.on) return; state.force = e.target.value; save(); });
  $('resetBtn').addEventListener('click', () => {
    if (LIVE.on) return;
    try { localStorage.removeItem(KEY); sessionStorage.removeItem('rl-gate'); } catch (e) { /* ignore */ }
    state = clean(null);
    $('forceSel').value = 'random'; renderCounts(); renderPulls(); toast('Preview reset');
  });

  /* ---------- start ---------- */
  function start(data) {
    if (data && typeof data === 'object' && Number.isFinite(data.packs)) state = clean(data); else load();
    mountPacks(); buildBands(); renderSheet(); renderBuy();
    $('stageOf').textContent = '/ ' + pad2(slides.length);
    $('forceSel').value = state.force;
    document.querySelectorAll('[data-free-email]').forEach((el) => { el.textContent = CONFIG.freeEmail; });
    document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = money(CONFIG.packPrice); });
    renderCounts(); renderPulls();
    requestAnimationFrame(ambient);
    if (location.hash === '#free-packs') $('free-packs').open = true;
    const back = /[?&](paid|canceled)=/.test(location.search);
    if (!back) autoGate();
    goLive();
  }

  /* ---------- live mode: switch to the server if this copy of the site has one ---------- */
  function renderAll() {
    document.querySelectorAll('[data-price]').forEach((el) => { el.textContent = money(CONFIG.packPrice); });
    renderBuy(); renderCounts(); renderPulls();
  }
  async function goLive() {
    if (!/^https?:$/.test(location.protocol)) return;
    const cfg = await api('config');
    if (!cfg.ok || cfg.live !== true) return;
    let w = walletToken ? await api('wallet') : { ok: false, error: 'no_wallet' };
    if (!w.ok && w.error === 'network') return;
    if (!w.ok) {
      w = await api('wallet', {}, 'POST');
      if (!w.ok || typeof w.token !== 'string') return;
      walletToken = w.token;
      try { localStorage.setItem(WKEY, walletToken); } catch (e) { /* this visit only */ }
    }
    LIVE.on = true; LIVE.checkout = cfg.checkout === true;
    if (Number.isFinite(cfg.price_cents)) CONFIG.packPrice = cfg.price_cents / 100;
    document.documentElement.classList.add('is-live');
    $('buyOkRow').hidden = false;
    applyWallet(w); renderAll();

    /* back from Stripe: ask the server to confirm the order, then show the packs */
    const q = new URLSearchParams(location.search), paid = q.get('paid');
    if (paid || q.get('canceled')) { try { history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ } }
    if (paid) {
      const r = await api('confirm', { session_id: paid });
      if (r.ok) {
        applyWallet(r); renderAll();
        toast(r.credited ? 'Order confirmed. ' + plural(r.qty, 'pack', 'packs') + ' added.' : 'Your packs are ready.');
        if (state.packs > 0 && !R) openDlg('pullsDlg');
      } else {
        toast('We could not confirm that order yet. If you paid, your packs will appear shortly.');
      }
    } else if (q.get('canceled')) {
      toast('Checkout canceled. No packs were added.');
    }
  }
  const hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) hot.snapshot(() => state);
  if (hot && hot.ready) hot.ready(start); else start((hot && hot.data) || {});
