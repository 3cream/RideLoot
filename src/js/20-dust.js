  /* ---------- hero atmosphere: drifting dust in three depths ---------- */
  const dust = (function () {
    const cv = $('dust'), g = cv.getContext('2d');
    const cols = ['255,70,110', '120,196,255', '255,255,255', '10,132,255'];
    let W = 0, H = 0, ps = [];
    function resize() {
      const d = Math.min(window.devicePixelRatio || 1, 1.5);
      W = cv.clientWidth; H = cv.clientHeight;
      cv.width = Math.round(W * d); cv.height = Math.round(H * d);
      g.setTransform(d, 0, 0, d, 0, 0);
    }
    function seed() {
      ps = [];
      for (let i = 0; i < 36; i++) {
        const z = 0.35 + Math.random() * 1.4;
        ps.push({ x: Math.random(), y: Math.random(), z: z, r: (1.1 + Math.random() * 2) * z * z, vx: (Math.random() - 0.5) * 0.008, vy: -(0.005 + Math.random() * 0.014) * z, a: (0.12 + Math.random() * 0.34) / (z > 1 ? z * 1.5 : 1), c: cols[i % 4], ph: Math.random() * 6.28 });
      }
    }
    function draw(dt, mx, my, s) {
      if (!W) return;
      g.clearRect(0, 0, W, H);
      for (const p of ps) {
        if (!reduced) { p.x += p.vx * dt; p.y += p.vy * dt; }
        if (p.y < -0.06) { p.y = 1.06; p.x = Math.random(); }
        if (p.x < -0.06) p.x = 1.06; else if (p.x > 1.06) p.x = -0.06;
        const x = p.x * W + mx * 20 * p.z, y = p.y * H + my * 14 * p.z, r = p.r * (p.z > 1 ? 3.4 : 1.4);
        const a = p.a * (0.7 + 0.3 * Math.sin(s * 1.3 + p.ph));
        const grd = g.createRadialGradient(x, y, 0, x, y, r * 3);
        grd.addColorStop(0, 'rgba(' + p.c + ',' + a.toFixed(3) + ')');
        grd.addColorStop(1, 'rgba(' + p.c + ',0)');
        g.fillStyle = grd; g.beginPath(); g.arc(x, y, r * 3, 0, 6.2832); g.fill();
      }
    }
    resize(); seed();
    return { draw: draw, resize: resize };
  })();
