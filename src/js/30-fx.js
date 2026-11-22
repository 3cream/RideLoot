  /* ---------- rip room particles: shards, coins and sparks ---------- */
  const fx = (function () {
    const cv = $('fx'), g = cv.getContext('2d');
    const C = { lime: '#0a84ff', cyan: '#6cc3ff', gold: '#9fd6ff', white: '#ffffff', coin: '#f2f8ff', rim: '#0a5bd0' };
    let W = 0, H = 0, parts = [], raf = 0, last = 0;
    const rnd = (a, b) => a + Math.random() * (b - a);
    function resize() {
      const d = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    function add(p) { parts.push(p); if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
    function shard(x, y, ang, spd, col, life) { add({ k: 0, x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, g: 950, drag: 0.7, rot: rnd(0, 6.28), vr: rnd(-9, 9), s: rnd(6, 16), col: col, life: life, max: life }); }
    function coin(x, y, vx, vy, life) { add({ k: 1, x: x, y: y, vx: vx, vy: vy, g: 1300, drag: 0.15, sp: rnd(0, 6.28), vs: rnd(8, 16), s: rnd(8, 13), col: C.coin, life: life, max: life }); }
    function spark(x, y, ang, spd, col, life) { add({ k: 2, x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, g: 300, drag: 2.2, s: rnd(1.5, 3), col: col, life: life, max: life }); }
    function frame(t) {
      const dt = Math.min(0.034, (t - last) / 1000); last = t;
      g.clearRect(0, 0, W, H);
      const keep = [];
      for (const p of parts) {
        p.life -= dt;
        if (p.life <= 0 || p.y > H + 60) continue;
        p.vy += p.g * dt;
        const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d;
        p.x += p.vx * dt; p.y += p.vy * dt;
        g.globalAlpha = Math.min(1, p.life / (p.max * 0.35));
        if (p.k === 0) {
          p.rot += p.vr * dt;
          g.save(); g.translate(p.x, p.y); g.rotate(p.rot);
          g.beginPath(); g.moveTo(p.s, 0); g.lineTo(-p.s * 0.55, p.s * 0.5); g.lineTo(-p.s * 0.3, -p.s * 0.45); g.closePath();
          g.fillStyle = p.col; g.fill(); g.restore();
        } else if (p.k === 1) {
          p.sp += p.vs * dt;
          g.beginPath(); g.ellipse(p.x, p.y, Math.max(1.2, Math.abs(Math.cos(p.sp)) * p.s), p.s, 0, 0, 6.2832);
          g.fillStyle = p.col; g.fill(); g.lineWidth = 2; g.strokeStyle = C.rim; g.stroke();
        } else {
          g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 0.03, p.y - p.vy * 0.03);
          g.lineWidth = p.s; g.lineCap = 'round'; g.strokeStyle = p.col; g.stroke();
        }
        keep.push(p);
      }
      g.globalAlpha = 1; parts = keep;
      raf = parts.length ? requestAnimationFrame(frame) : 0;
    }
    return {
      resize: resize,
      clear() { parts = []; if (raf) cancelAnimationFrame(raf); raf = 0; g.clearRect(0, 0, W, H); },
      sparks(x, y, n) { if (reduced) return; for (let i = 0; i < n; i++) spark(x, y, rnd(-2.9, -0.2), rnd(160, 620), i % 2 ? C.white : C.gold, rnd(0.25, 0.55)); },
      tear(x, y) {
        if (reduced) return;
        const cols = [C.lime, C.cyan, C.gold, C.white];
        for (let i = 0; i < 44; i++) shard(x + rnd(-60, 60), y, rnd(-2.6, -0.54), rnd(350, 1050), cols[i % 4], rnd(1.1, 2));
        for (let i = 0; i < 12; i++) coin(x + rnd(-40, 40), y, rnd(-320, 320), rnd(-1100, -600), rnd(1.8, 2.6));
        for (let i = 0; i < 40; i++) spark(x + rnd(-50, 50), y, rnd(0, 6.283), rnd(300, 1300), i % 3 ? C.white : C.gold, rnd(0.35, 0.7));
      },
      burst(x, y, rank, col) {
        if (reduced) return;
        const n = [14, 20, 26, 40, 58, 110][rank], coins = [0, 0, 0, 0, 14, 30][rank];
        for (let i = 0; i < n; i++) (i % 3 === 0 ? spark : shard)(x, y, rnd(0, 6.283), rnd(240, 860), i % 4 === 3 ? C.white : col, rnd(0.6, 1.4));
        for (let i = 0; i < coins; i++) coin(x, y, rnd(-460, 460), rnd(-950, -300), rnd(1.6, 2.4));
      },
      rain() { if (reduced) return; for (let i = 0; i < 5; i++) coin(rnd(0, W), -20, rnd(-60, 60), rnd(150, 420), 3); }
    };
  })();
