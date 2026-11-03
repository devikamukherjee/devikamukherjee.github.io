// Suminagashi ink — hero only. The canvas lives inside the hero, so the ink
// never follows the reader down the page. Rings bloom under the pointer; on
// touch devices (or until the pointer arrives) a slow automatic drip keeps
// the landing page alive.
(function () {
  const hero = document.getElementById('top');
  const canvas = document.getElementById('ink');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  function resize() {
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
  }
  window.addEventListener('resize', resize);
  resize();

  const palette = [
    [235, 165, 178], [148, 212, 204], [195, 178, 232], [235, 205, 148],
    [240, 175, 152], [162, 185, 232], [200, 232, 175],
  ];
  let colorIdx = 0;
  const drops = [];

  function ring(x, y, r, seed, alpha, col, lineW) {
    if (r <= 0 || alpha <= 0.004) return;
    const pts = 72;
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const wobble = 1
        + Math.sin(a * 2 + seed) * 0.06
        + Math.sin(a * 3 + seed * 1.7) * 0.038
        + Math.cos(a * 5 + seed * 0.9) * 0.022
        + Math.sin(a * 7 + seed * 2.3) * 0.012;
      const px = x + Math.cos(a) * r * wobble;
      const py = y + Math.sin(a) * r * wobble;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
    ctx.lineWidth = lineW;
    ctx.stroke();
  }

  function addDrop(x, y, idx, scale) {
    drops.push({
      x, y, col: palette[idx % palette.length], seed: Math.random() * Math.PI * 2,
      r: 2, maxR: (70 + Math.random() * 120) * scale,
      speed: (0.55 + Math.random() * 0.85) * scale,
      alpha: 0.38 + Math.random() * 0.12, ringW: 1.8 + Math.random() * 1.6, frame: 0,
    });
  }
  function splash(x, y) {
    addDrop(x, y, colorIdx, 1);
    addDrop(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, colorIdx + 1, 0.55);
    colorIdx++;
  }

  // Pointer-driven drops, relative to the hero box.
  let lastX = -999, lastY = -999, lastPointer = 0;
  if (finePointer) {
    hero.addEventListener('mousemove', (e) => {
      const b = hero.getBoundingClientRect();
      const x = e.clientX - b.left, y = e.clientY - b.top;
      const dx = x - lastX, dy = y - lastY;
      if (dx * dx + dy * dy > 900) { splash(x, y); lastX = x; lastY = y; lastPointer = performance.now(); }
    }, { passive: true });
  }
  hero.addEventListener('touchmove', (e) => {
    const t = e.touches[0]; if (!t) return;
    const b = hero.getBoundingClientRect();
    splash(t.clientX - b.left, t.clientY - b.top); lastPointer = performance.now();
  }, { passive: true });

  // Opening gesture: a few drops bloom around the name so the page never
  // starts blank, then a slow idle drip while nobody is moving the pointer.
  const seedDrops = reduced ? 3 : 7;
  for (let i = 0; i < seedDrops; i++) {
    setTimeout(() => splash(W * (0.15 + Math.random() * 0.7), H * (0.2 + Math.random() * 0.6)), 300 + i * 260);
  }
  let nextIdle = performance.now() + 2500;

  const FADE_ALPHA = 0.003, FADE_START = 300;
  let running = true;
  function frame(now) {
    if (!running) return;
    if (!reduced && now > nextIdle && now - lastPointer > 1800) {
      splash(W * (0.1 + Math.random() * 0.8), H * (0.15 + Math.random() * 0.7));
      nextIdle = now + 1400 + Math.random() * 1600;
    }
    ctx.fillStyle = `rgba(255,255,255,${FADE_ALPHA})`;
    ctx.fillRect(0, 0, W, H);
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.frame++;
      let alpha = d.alpha;
      if (d.frame > FADE_START) alpha = Math.max(0, d.alpha * (1 - (d.frame - FADE_START) / 60));
      const p = d.r / d.maxR;
      ring(d.x, d.y, d.r + 2, d.seed, alpha * 0.12 * (1 - p), d.col, d.ringW * 0.5);
      ring(d.x, d.y, d.r, d.seed, alpha * 0.65 * (1 - p * 0.7), d.col, d.ringW);
      ring(d.x, d.y, d.r - 4, d.seed, alpha * 0.38 * (1 - p * 0.5), d.col, d.ringW * 0.7);
      ring(d.x, d.y, d.r - 8, d.seed, alpha * 0.18 * (1 - p * 0.4), d.col, d.ringW * 0.45);
      d.r += d.speed;
      if (d.r >= d.maxR || alpha <= 0.004) drops.splice(i, 1);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Stop painting once the hero has scrolled out of view.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      const vis = entries[0].isIntersecting;
      if (vis && !running) { running = true; requestAnimationFrame(frame); }
      else if (!vis) running = false;
    }).observe(hero);
  }
})();
