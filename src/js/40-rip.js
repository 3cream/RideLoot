  /* ---------- the rip room ---------- */
  const ripEl = $('rip'), rig = $('rig'), stage = $('ripStage');
  let R = null, rainId = 0, ripSrc = null, ripReturn = null, freeNext = false;
  const tilt = { rev: { px: 0, py: 0, cx: 0, cy: 0 } };

  const setPhase = (ctx, p) => { ctx.phase = p; ripEl.dataset.phase = p; };
  function pulse(cls, ms) { ripEl.classList.remove(cls); void ripEl.offsetWidth; ripEl.classList.add(cls); setTimeout(() => ripEl.classList.remove(cls), ms); }
  function at(el, fx_, fy_) {
    const a = ripEl.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: r.left - a.left + r.width * fx_, y: r.top - a.top + r.height * fy_ };
  }
  function wait(ctx, ms) {
    return new Promise((res) => {
      if (ctx.fast || ctx.dead || reduced) { res(); return; }
      const id = setTimeout(fin, ms);
      function fin() { clearTimeout(id); res(); }
      ctx.waiters.push(fin);
    });
  }
  function later(ctx, fn, ms) {
    if (ctx.fast || reduced || ms <= 0) { fn(); return; }
    const t = { fn: fn, done: false, id: 0 };
    t.id = setTimeout(() => { if (t.done || ctx.dead) return; t.done = true; fn(); }, ms);
    ctx.timers.push(t);
  }
  function play(ctx, el, frames, opts) {
    let a;
    try { a = el.animate(frames, opts); } catch (e) { return Promise.resolve(); }
    ctx.anims.push(a);
    if (ctx.fast || reduced) { try { a.finish(); } catch (e) { /* ignore */ } }
    return a.finished.then(() => {}, () => {});
  }
  function fastForward(ctx) {
    if (ctx.fast || ctx.locked) return;   /* once the card is out of the pack the turn always plays in full */
    ctx.fast = true;
    ctx.waiters.splice(0).forEach((f) => f());
    ctx.timers.splice(0).forEach((t) => { clearTimeout(t.id); if (!t.done) { t.done = true; t.fn(); } });
    ctx.anims.forEach((a) => { try { a.finish(); } catch (e) { /* ignore */ } });
  }
  function endRun(ctx) {
    ctx.dead = true;
    ctx.waiters.splice(0).forEach((f) => f());
    ctx.timers.splice(0).forEach((t) => clearTimeout(t.id));
    ctx.anims.forEach((a) => { try { a.cancel(); } catch (e) { /* ignore */ } });
    stopRain(); fx.clear();
  }
  function stopRain() { if (rainId) { clearInterval(rainId); rainId = 0; } }
  function setTint(tier) { ripEl.style.setProperty('--tint', TIERS[tier].color); }

  function enterRip(src) {
    if (state.packs < 1 || (R && !R.done)) return;
    if (R) endRun(R); else ripReturn = document.activeElement;
    const ctx = R = { phase: 'enter', prize: null, no: 0, rank: 0, p: 0, dir: 1, drag: null, fast: false, dead: false, done: false, anims: [], timers: [], waiters: [] };
    const from = src ? src.getBoundingClientRect() : null;
    const no = LIVE.on ? LIVE.next : state.opened + 1;   /* live: the next pack in the site-wide count */
    rig.style.setProperty('--p', '0'); rig.style.setProperty('--sx', '0');
    rig.innerHTML = '<div class="rig__glow"></div><div class="rig__ring"></div><div class="rig__shadow"></div><div class="pkrays"></div>' +
      '<div class="rig__body"><div class="pkback"><span class="pkback__crimp"></span><span class="pkback__shade"></span></div>' + cardHTML(null, 0, '') + packArt(no) + '</div>' + GUIDE;
    rig.classList.remove('is-rattle', 'is-jolt'); rig.style.setProperty('--amp', '0');
    $('ripMeter').hidden = true;
    rig.dataset.free = freeNext ? '1' : '0'; freeNext = false;   /* the pack just claimed by email keeps its FREE sticker */
    const pk = rig.querySelector('.pk');
    pk.classList.add('pk--rip');
    ctx.pk = pk; ctx.strip = pk.querySelector('.pk__lid'); ctx.back = rig.querySelector('.pkback'); ctx.guide = rig.querySelector('.guide');
    ctx.pc = rig.querySelector('.pc'); ctx.lift = ctx.pc.querySelector('.pc__lift');
    setTint('common');
    $('jackpot').classList.remove('is-on');
    $('ripTitle').hidden = true; $('ripActions').hidden = true; $('againNote').hidden = true;
    $('tapRipBtn').hidden = false; $('ripPrompt').hidden = false;
    $('ripLive').textContent = ''; $('toast').classList.remove('is-on');
    $('ripChip').textContent = 'Pack No. ' + pad4(no) + (state.packs > 1 ? ' \u00b7 ' + plural(state.packs - 1, 'more pack', 'more packs') + ' after this' : '');
    ripEl.hidden = false; ripEl.setAttribute('aria-hidden', 'false');
    syncLock();
    if (ripSrc) ripSrc.classList.remove('is-away');
    ripSrc = src || null;
    if (ripSrc) ripSrc.classList.add('is-away');
    setPhase(ctx, 'enter');
    fx.resize();
    requestAnimationFrame(() => ripEl.classList.add('is-in'));

    const to = rig.getBoundingClientRect();
    const onScreen = !!from && from.width > 0 && from.bottom > 0 && from.top < window.innerHeight;
    const frames = onScreen
      ? [{ transform: 'translate(' + (from.left + from.width / 2 - to.left - to.width / 2).toFixed(1) + 'px,' + (from.top + from.height / 2 - to.top - to.height / 2).toFixed(1) + 'px) scale(' + (from.width / to.width).toFixed(3) + ')' }, { transform: 'none' }]
      : [{ transform: 'translateY(-70vh) rotate(-9deg)' }, { transform: 'none' }];
    play(ctx, rig, frames, { duration: onScreen ? 620 : 560, easing: 'cubic-bezier(.2,.85,.25,1.06)' }).then(() => {
      if (ctx.dead || ctx.phase !== 'enter') return;
      setPhase(ctx, 'ready'); pk.classList.add('is-ready');
    });
    $('tapRipBtn').focus({ preventScroll: true });
    if (reduced) { setPhase(ctx, 'ready'); }
  }

  function setTear(ctx, p, dir) {
    ctx.p = p; ctx.dir = dir;
    rig.style.setProperty('--p', p.toFixed(3));
    rig.style.setProperty('--sx', (dir > 0 ? p : 1 - p).toFixed(3));
    ctx.pk.classList.toggle('is-rtl', dir < 0);
    ctx.pk.classList.toggle('is-tearing', p > 0.01 && p < 1);
  }
  function tearFx(ctx) {
    const sx = ctx.dir > 0 ? ctx.p : 1 - ctx.p, m = at(ctx.pk, sx, 0.114);
    fx.sparks(m.x, m.y, 3);
  }
  function tween(ctx, to, ms, done) {
    const from = ctx.p, t0 = performance.now(), dir = ctx.dir;
    (function step(t) {
      if (ctx.dead) return;
      const k = ms <= 0 ? 1 : clamp((t - t0) / ms, 0, 1), e = to > from ? k * k : 1 - (1 - k) * (1 - k);
      setTear(ctx, from + (to - from) * e, dir);
      if (to > from) tearFx(ctx);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  }
  function autoTear(ctx, dir) {
    if (ctx.phase !== 'ready' && ctx.phase !== 'enter') return;
    setPhase(ctx, 'tearing'); ctx.dir = dir; ctx.pk.classList.remove('is-ready');
    $('tapRipBtn').hidden = true; $('ripPrompt').hidden = true;
    if (ctx.guide) ctx.guide.classList.add('is-off');
    tween(ctx, 1, reduced ? 0 : Math.max(120, (1 - ctx.p) * 380), () => afterTear(ctx));
  }
  /* one set of listeners on the whole stage, so a swipe can start beside the pack as well as on it */
  function bindTear() {
    stage.addEventListener('pointerdown', (e) => {
      const ctx = R; if (!ctx) return;
      ctx.downPhase = ctx.phase;
      if (ctx.phase !== 'ready' || (e.button && e.button !== 0)) return;
      ctx.drag = { x0: e.clientX, w: ctx.pk.getBoundingClientRect().width, moved: false, onPack: !!(e.target.closest && e.target.closest('.pk--rip')) };
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });
    stage.addEventListener('pointermove', (e) => {
      const ctx = R; if (!ctx) return;
      const d = ctx.drag; if (!d || ctx.phase !== 'ready') return;
      const dx = e.clientX - d.x0;
      if (Math.abs(dx) > 8 && !d.moved) { d.moved = true; ctx.pk.classList.remove('is-ready'); if (ctx.guide) ctx.guide.classList.add('is-off'); $('ripPrompt').hidden = true; $('tapRipBtn').hidden = true; }
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
      else tween(ctx, 0, 220, () => { if (!ctx.dead && ctx.phase === 'ready') { ctx.pk.classList.add('is-ready'); if (ctx.guide) ctx.guide.classList.remove('is-off'); $('ripPrompt').hidden = false; $('tapRipBtn').hidden = false; } });
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
  }
  bindTear();

  /* the order the light visits the rarities while the pack rattles. It hops around, landing mostly on rare, epic and
     legendary, now and then on common or grand, and ends on the real one. The mix does not depend on what is inside. */
  const HOPS = { rare: 3, epic: 3, legendary: 3 };
  function sweep(rank) {
    const pool = [];
    ORDER.forEach((t, k) => { for (let j = 0; j < (HOPS[t] || 1); j++) pool.push(k); });
    const n = 20 + Math.floor(rand() * 5), out = [];
    /* open with one full run up the ladder so every rarity lights at least once */
    ORDER.forEach((t, k) => out.push(k));
    let prev = out[out.length - 1];
    for (let i = out.length; i < n - 1; i++) {
      let k;
      /* the light passes every rarity, grand included, but its last stop before the result is never grand: no near miss */
      do { k = pool[Math.floor(rand() * pool.length)]; } while (k === prev || (i === n - 2 && (k === rank || k === RANK.grand)));
      out.push(k); prev = k;
    }
    out.push(rank);
    return out;
  }

  async function afterTear(ctx) {
    if (ctx.dead) return;
    // the pack is committed the moment the seal comes off: the prize is decided and recorded now
    let prize;
    if (LIVE.on) {
      /* live: the server takes the pack, gives it its number in the site-wide count, and decides the card */
      const r = await api('open', {});
      prize = r.ok ? CONFIG.prizes.find((p) => p.id === r.prize_id) : null;
      if (!prize) {
        const w = await api('wallet');
        if (w.ok) applyWallet(w);
        if (R === ctx) closeRip();
        renderCounts(); renderPulls();
        toast(r.error === 'no_packs' ? 'That pack was already opened.' : 'That pack could not be opened. Check your connection and try again.');
        return;
      }
      applyWallet(r); ctx.no = r.pack_no;
      if (ctx.dead) { renderCounts(); renderPulls(); return; }   /* closed mid-tear: the pull is saved in My pulls */
      $('ripChip').textContent = 'Pack No. ' + pad4(ctx.no) + (state.packs > 0 ? ' \u00b7 ' + plural(state.packs, 'more pack', 'more packs') + ' after this' : '');
    } else {
      prize = drawPrize(state.force);
      state.packs -= 1; state.opened += 1;
      state.pulls[prize.id] = (state.pulls[prize.id] || 0) + 1;
      state.force = 'random'; $('forceSel').value = 'random';
      ctx.no = state.opened;
    }
    ctx.prize = prize; ctx.rank = TIERS[prize.tier].rank;
    save(); renderCounts();
    ctx.pc.dataset.tier = prize.tier;
    ctx.pc.querySelector('.pc__front').innerHTML = cardInner(prize, ctx.no);

    setPhase(ctx, 'torn'); ctx.pk.classList.add('is-torn');
    const dir = ctx.dir;
    play(ctx, ctx.strip, [{ transform: getComputedStyle(ctx.strip).transform, opacity: 1 }, { transform: 'translate(' + (dir * 70) + '%,-42%) rotate(' + (dir * -58) + 'deg)', opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
    if (!ctx.fast && !reduced) {
      pulse('is-flash', 600); pulse('is-shake', 420);
      const m = at(ctx.pk, 0.5, 0.114); fx.tear(m.x, m.y);
      buzz(30);
    }
    await wait(ctx, 340);
    if (ctx.dead) return;

    // the pack rattles, building, while the card works loose
    setPhase(ctx, 'charge');
    const meter = $('ripMeter'), pips = Array.from(meter.querySelectorAll('[data-tier]'));
    const light = (k) => { setTint(ORDER[k]); pips.forEach((el, j) => el.classList.toggle('is-on', j === k)); };
    meter.classList.remove('is-locked'); pips.forEach((el) => el.classList.remove('is-on'));
    rig.classList.add('is-rattle');
    play(ctx, ctx.lift, [{ transform: 'translateY(0)' }, { transform: 'translateY(-20%)' }], { duration: 1300, easing: 'cubic-bezier(.6,0,.7,1)', fill: 'forwards' });
    for (let i = 0; i < 8; i++) {
      if (ctx.dead) return;
      rig.style.setProperty('--amp', (0.35 + 1.3 * i / 7).toFixed(2));
      if (!ctx.fast && !reduced && i % 2 === 0) buzz(10);
      await wait(ctx, 1300 / 8);
    }
    if (ctx.dead) return;
    rig.classList.remove('is-rattle'); rig.style.setProperty('--amp', '0');
    if (!ctx.fast && !reduced) { rig.classList.add('is-jolt'); buzz(25); }
    await wait(ctx, 300);
    rig.classList.remove('is-jolt');
    if (ctx.dead) return;

    // the card pushes up out of the mouth
    setPhase(ctx, 'peek');
    ctx.pc.classList.add('is-peek');
    await play(ctx, ctx.lift, [{ transform: 'translateY(-20%)' }, { transform: 'translateY(-52%)' }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.25)', fill: 'forwards' });
    await wait(ctx, 300);
    if (ctx.dead) return;

    // out of the pack and to the middle of the room, still face down
    setPhase(ctx, 'reveal');
    ctx.pc.classList.remove('is-peek');
    const c = ctx.pc.getBoundingClientRect(), s = stage.getBoundingClientRect();
    const grand = ctx.rank >= RANK.grand;
    const dy = (s.top + s.height * (grand ? 0.58 : 0.46)) - (c.top + c.height / 2);
    const sc = clamp(Math.min((s.height - (grand ? 150 : 70)) / c.height, (s.width - 32) / c.width), 0.8, 1.25);
    const drop = [{ transform: 'none', opacity: 1 }, { transform: 'translateY(16%)', opacity: 1, offset: 0.34 }, { transform: 'translateY(125%) rotate(-7deg)', opacity: 0 }];
    const dropOpts = { duration: 780, easing: 'cubic-bezier(.5,0,.8,.5)', fill: 'forwards' };
    play(ctx, ctx.pk, drop, dropOpts);
    if (ctx.back) play(ctx, ctx.back, drop, dropOpts);
    play(ctx, rig.querySelector('.rig__shadow'), [{ opacity: 1 }, { opacity: 0 }], { duration: 500, fill: 'forwards' });
    later(ctx, () => { ctx.pc.style.zIndex = '5'; }, 420);
    await play(ctx, ctx.lift, [{ transform: 'translateY(-52%) scale(1)' }, { transform: 'translateY(-108%) scale(1)', offset: 0.4 }, { transform: 'translateY(' + dy.toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')' }], { duration: 1000, easing: 'cubic-bezier(.3,0,.5,1)', fill: 'forwards' });
    if (ctx.dead) return;

    // held back: the card strains to turn over, slowly, like a spring that keeps pulling it shut, while its back runs
    // through the rarity colours and the shake builds. Every pack gets the same kind of roll. It never stops on, or
    // announces, a rarity the pack does not hold.
    const flip = ctx.pc.querySelector('.pc__flip');
    const seq = sweep(ctx.rank), raw = seq.map((_, i) => 70 + Math.pow(i / (seq.length - 1), 2.4) * 330);
    const total = 2700 + ctx.rank * 90, scale = total / raw.reduce((a, b) => a + b, 0), gaps = raw.map((g) => g * scale);
    const HOLD = 56, frames = [];
    let acc = 0;
    seq.forEach((_, i) => {
      const t = i / (seq.length - 1);
      const a = Math.max(0, HOLD * Math.pow(t, 1.1) - (i % 2 ? 7 + 9 * t : 0));   /* two steps forward, one pulled back */
      frames.push({ transform: 'rotateY(' + a.toFixed(1) + 'deg)', offset: acc / total, easing: 'cubic-bezier(.45,0,.3,1.5)' });
      acc += gaps[i];
    });
    frames.push({ transform: 'rotateY(' + HOLD + 'deg)', offset: 1 });
    ctx.fast = false; ctx.locked = true;   /* a skip carries the card this far and no further */
    meter.hidden = false;
    ctx.pc.classList.add('is-tease'); ctx.pc.style.setProperty('--glow', '1');
    play(ctx, flip, frames, { duration: total, fill: 'forwards' });
    for (let i = 0; i < seq.length; i++) {
      if (ctx.dead) return;
      const t = i / (seq.length - 1);
      light(seq[i]);
      ctx.pc.style.setProperty('--amp', (0.2 + 1.5 * Math.pow(t, 1.5)).toFixed(2));
      if (!ctx.fast && !reduced && i % 2 === 0) buzz(10);
      await wait(ctx, gaps[i]);
    }
    if (ctx.dead) return;

    // locked: a held breath at full strain
    light(ctx.rank); meter.classList.add('is-locked');
    ctx.pc.style.setProperty('--amp', '2.3');
    if (!ctx.fast && !reduced) buzz(ctx.rank >= RANK.legendary ? [40, 40, 90] : 35);
    await wait(ctx, 380 + ctx.rank * 60);
    if (ctx.dead) return;

    // release: it snaps over in a burst of light
    ctx.pc.classList.remove('is-tease'); ctx.pc.style.setProperty('--amp', '0');
    ctx.pc.classList.add('is-open', 'is-pop'); ctx.pc.style.setProperty('--glow', '0');
    {
      const m = at(ctx.lift, 0.5, 0.5);
      if (!ctx.fast) { pulse('is-flash', 600); buzz(ctx.rank >= RANK.legendary ? 80 : 20); }
      fx.burst(m.x, m.y, ctx.rank, TIERS[prize.tier].color);
      if (ctx.rank >= RANK.legendary && !ctx.fast) pulse('is-shake', 420);
      if (grand) jackpot();
    }
    await play(ctx, flip, [{ transform: 'rotateY(' + HOLD + 'deg) scale(1)' }, { transform: 'rotateY(198deg) scale(1.17)', offset: 0.46 }, { transform: 'rotateY(173deg) scale(1.03)', offset: 0.74 }, { transform: 'rotateY(180deg) scale(1)' }], { duration: 500, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
    if (ctx.dead) return;

    $('ripTier').textContent = TIERS[prize.tier].label; $('ripTier').dataset.tier = prize.tier;
    $('ripName').textContent = prize.name;
    const note = $('ripNote');
    note.textContent = grand ? (LIVE.on ? 'Pack No. ' + num(ctx.no) + '. We will contact you by email to verify and arrange the prize.' : 'Preview pull. No real prize is awarded.') : 'Pack No. ' + pad4(ctx.no) + ' is saved in My pulls and adds ' + num(ctx.prize.entries || 0) + ' entries to the final draw for the M3.';
    note.classList.toggle('is-gold', grand);
    $('ripMeter').hidden = true;
    $('ripTitle').hidden = false;
    $('ripLive').textContent = TIERS[prize.tier].label + '. ' + prize.name + '.';
    renderPulls();
    await wait(ctx, 380);
    if (ctx.dead) return;
    $('againLabel').textContent = state.packs > 0 ? 'Rip another pack' : 'Get another pack';
    $('ripActions').hidden = false;
    $('againNote').hidden = state.packs > 0;   /* shown when the button offers another pack rather than one already owned */
    setPhase(ctx, 'done'); ctx.done = true;
    $('againBtn').focus({ preventScroll: true });
  }

  function jackpot() {
    $('jackpot').classList.add('is-on');
    if (reduced) return;
    let n = 0; stopRain();
    rainId = setInterval(() => { fx.rain(); if (++n > 30) stopRain(); }, 90);
  }

  function closeRip(then) {
    const ctx = R; if (!ctx) return;
    R = null; endRun(ctx);
    ripEl.classList.remove('is-in', 'is-flash', 'is-shake');
    renderPulls(); renderCounts();
    setTimeout(() => {
      if (R) return;
      ripEl.hidden = true; ripEl.setAttribute('aria-hidden', 'true'); delete ripEl.dataset.phase;
      rig.innerHTML = '';
      syncLock();
      if (ripSrc) { ripSrc.classList.remove('is-away'); ripSrc = null; }
      if (then) then(); else if (ripReturn && ripReturn.isConnected) { try { ripReturn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
    }, 260);
  }
