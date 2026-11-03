// Interactive demos, one per piece of work. Each is self-contained and
// silently skips if its markup is absent.
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ================================================================
     1. Haptic belt — lower-body collision awareness (Belt and Whistles)
     Eight vibrotactile motors around the waist. Move the obstacle and
     the motors facing it pulse; intensity rises as the obstacle nears.
     ================================================================ */
  (function belt() {
    const wrap = $('#belt'); if (!wrap) return;
    const S = 400, C = S / 2, R = 62, N = 8;
    const svg = el('svg', { viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': 'Top-down haptic belt demo' }, wrap);
    // range rings
    [170, 130, 95].forEach((r, i) => el('circle', { cx: C, cy: C, r, fill: 'none', stroke: 'rgba(255,255,255,.12)', 'stroke-dasharray': i === 0 ? '3 6' : 'none' }, svg));
    // body + belt
    el('circle', { cx: C, cy: C, r: R + 14, fill: 'none', stroke: 'rgba(255,255,255,.25)', 'stroke-width': 10 }, svg);
    el('ellipse', { cx: C, cy: C, rx: 34, ry: 44, fill: '#F4F2EC', opacity: .9 }, svg);
    el('path', { d: `M${C - 6} ${C - 50} l6 -10 l6 10`, fill: 'none', stroke: '#141311', 'stroke-width': 2 }, svg); // facing marker
    el('text', { x: C, y: C + 5, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#141311', 'font-family': 'Manrope, sans-serif' }, svg).textContent = 'YOU';
    const names = ['Front', 'Front-right', 'Right', 'Back-right', 'Back', 'Back-left', 'Left', 'Front-left'];
    const motors = [];
    for (let i = 0; i < N; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / N;
      const x = C + Math.cos(a) * (R + 14), y = C + Math.sin(a) * (R + 14);
      const glow = el('circle', { cx: x, cy: y, r: 10, fill: '#EBA5B2', opacity: 0 }, svg);
      const dot = el('circle', { cx: x, cy: y, r: 7, fill: '#3A3833', stroke: '#F4F2EC', 'stroke-width': 1.5 }, svg);
      motors.push({ a, x, y, glow, dot, v: 0 });
    }
    // obstacle
    const ob = el('g', {}, svg);
    el('circle', { cx: 0, cy: 0, r: 16, fill: '#EBCD94', stroke: '#141311', 'stroke-width': 2 }, ob);
    el('text', { x: 0, y: 4, 'text-anchor': 'middle', 'font-size': 9, 'font-weight': 700, fill: '#141311', 'font-family': 'Manrope, sans-serif' }, ob).textContent = 'OBJ';
    const line = el('line', { stroke: 'rgba(255,255,255,.35)', 'stroke-dasharray': '4 4' }, svg);

    let ox = C + 120, oy = C - 90, target = { x: ox, y: oy }, auto = true, t0 = performance.now();
    let mode = 'distance';
    const outMotor = $('#belt-motor'), outInt = $('#belt-int'), outDist = $('#belt-dist');

    function setPointer(e) {
      const b = wrap.getBoundingClientRect();
      const p = e.touches ? e.touches[0] : e;
      target = { x: ((p.clientX - b.left) / b.width) * S, y: ((p.clientY - b.top) / b.height) * S };
      auto = false;
    }
    wrap.addEventListener('mousemove', setPointer);
    wrap.addEventListener('touchmove', (e) => { setPointer(e); e.preventDefault(); }, { passive: false });
    wrap.addEventListener('mouseleave', () => { auto = true; t0 = performance.now() - 2000; });
    $$('#belt-mode button').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.mode; $$('#belt-mode button').forEach(x => x.classList.toggle('on', x === b));
    }));

    function frame(now) {
      if (auto) {
        const t = (now - t0) / 1000;
        target = { x: C + Math.cos(t * 0.5) * (120 + Math.sin(t * 0.9) * 50), y: C + Math.sin(t * 0.5) * (120 + Math.cos(t * 0.7) * 50) };
      }
      ox += (target.x - ox) * 0.12; oy += (target.y - oy) * 0.12;
      ob.setAttribute('transform', `translate(${ox} ${oy})`);
      const dx = ox - C, dy = oy - C;
      const dist = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
      // distance 0..1 in "metres": belt radius ~0.4 m, outer ring 1.7 m
      const metres = Math.max(0, (dist - R) / 110) * 1.0;
      const near = clamp(1 - (dist - R - 10) / 130, 0, 1);
      const pulse = 0.75 + 0.25 * Math.sin(now / 90);
      let best = -1, bestV = 0;
      motors.forEach((m, i) => {
        let d = Math.abs(((ang - m.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        const dir = clamp(1 - d / (Math.PI / N * 1.6), 0, 1);
        const v = mode === 'distance' ? dir * near : dir * (near > 0.05 ? 1 : 0);
        m.v += (v - m.v) * 0.25;
        m.glow.setAttribute('opacity', (m.v * 0.9 * pulse).toFixed(3));
        m.glow.setAttribute('r', (10 + m.v * 16 * pulse).toFixed(1));
        m.dot.setAttribute('fill', m.v > 0.05 ? '#EBA5B2' : '#3A3833');
        m.dot.setAttribute('r', (7 + m.v * 3).toFixed(1));
        if (m.v > bestV) { bestV = m.v; best = i; }
      });
      line.setAttribute('x1', C); line.setAttribute('y1', C); line.setAttribute('x2', ox); line.setAttribute('y2', oy);
      if (outMotor) outMotor.textContent = bestV > 0.05 ? names[best] : '—';
      if (outInt) outInt.textContent = Math.round(bestV * 100) + '%';
      if (outDist) outDist.textContent = metres.toFixed(1) + ' m';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();

  /* ================================================================
     2. Signal or Noise — alert budget vs. detection, burden-matched.
     Curves reproduce the headline numbers from the README at 1 alert
     per nurse per day; the shape (composite saturating at ~0.8) is the
     finding that changes the design.
     ================================================================ */
  (function budget() {
    const range = $('#budget-range'); if (!range) return;
    const val = $('#budget-val'), ceiling = $('#ceiling');
    const rules = {
      A: { sens: b => Math.min(0.86, 0.425 * Math.pow(b, 0.62)), k: 0.27 },
      B: { sens: b => Math.min(0.88, 0.425 * Math.pow(b, 0.6)), k: 0.257 },
      C: { sens: b => Math.min(1, Math.pow(b / 0.8, 0.72)), k: 0.27 },
    };
    function render() {
      const b = parseFloat(range.value);
      val.firstChild.nodeValue = b.toFixed(1);
      for (const r in rules) {
        const s = rules[r].sens(b), p = clamp(rules[r].k * s / b, 0, 1);
        const bs = $(`.bar[data-rule="${r}"][data-m="sens"]`), bp = $(`.bar[data-rule="${r}"][data-m="ppv"]`);
        bs.querySelector('i').style.width = (s * 100) + '%'; bs.querySelector('b').textContent = Math.round(s * 100) + '%';
        bp.querySelector('i').style.width = (p * 100) + '%'; bp.querySelector('b').textContent = Math.round(p * 100) + '%';
      }
      if (b > 0.85) {
        ceiling.classList.add('hot');
        ceiling.innerHTML = `<strong>Past the ceiling.</strong> At ${b.toFixed(1)} alerts/nurse/day the composite rule is already catching every decompensation it can. Every extra alert you are paying for here is a false alarm — a staffing decision, not a modelling one.`;
      } else {
        ceiling.classList.remove('hot');
        ceiling.innerHTML = `<strong>Under budget.</strong> At ${b.toFixed(1)} alerts/nurse/day the composite rule finds roughly <strong>${Math.round(rules.C.sens(b) / Math.max(0.01, rules.A.sens(b)) * 10) / 10}×</strong> as many true events as the weight threshold, for the same nurse time.`;
      }
    }
    range.addEventListener('input', render);
    render();
  })();

  /* ================================================================
     3. LLM voting-advice audit — a tiny deterministic VAA.
     Set your positions; the L1-nearest party is the ground truth. The
     condition buttons change only the *presentation* the model would
     see — order, a priming sentence, anonymised names — and the correct
     answer never moves. That is what makes model reliability testable.
     ================================================================ */
  (function vaa() {
    const box = $('#vaa-theses'); if (!box) return;
    const theses = [
      'Raise the minimum wage above inflation',
      'Phase out combustion-engine cars by 2035',
      'Introduce a national speed limit on motorways',
      'Increase defence spending to 3% of GDP',
      'Lower income tax for high earners',
      'Expand social housing with public money',
    ];
    const parties = [
      { name: 'Party Aster', pos: [1, 1, 1, -1, -1, 1] },
      { name: 'Party Birch', pos: [-1, -1, -1, 1, 1, -1] },
      { name: 'Party Cedar', pos: [0, 1, 0, 1, 0, 1] },
      { name: 'Party Dune', pos: [1, -1, -1, 0, 1, 0] },
    ];
    const voter = [1, 1, 0, -1, -1, 1];
    let cond = 'baseline';
    const lab = { 1: 'Agree', 0: 'Neutral', '-1': 'Disagree' };
    const sym = { 1: '+1', 0: '0', '-1': '−1' };
    // thesis rows
    theses.forEach((t, i) => {
      const row = document.createElement('div'); row.className = 'vaa-thesis';
      row.innerHTML = `<span>${i + 1}. ${t}</span><span class="seg"></span>`;
      const seg = row.lastChild;
      [1, 0, -1].forEach(v => {
        const b = document.createElement('button'); b.textContent = lab[v]; b.dataset.v = v;
        b.addEventListener('click', () => { voter[i] = v; render(); });
        seg.appendChild(b);
      });
      box.appendChild(row);
    });
    const partiesBox = $('#vaa-parties'), promptBox = $('#vaa-prompt'), verdict = $('#vaa-verdict');
    const cards = parties.map((p, i) => {
      const c = document.createElement('div'); c.className = 'vaa-party';
      c.innerHTML = `<b></b><span></span><small>L1 distance</small>`;
      partiesBox.appendChild(c); return c;
    });
    $$('#vaa-cond button').forEach(b => b.addEventListener('click', () => {
      cond = b.dataset.cond; $$('#vaa-cond button').forEach(x => x.classList.toggle('on', x === b)); render();
    }));
    const order = { baseline: [0, 1, 2, 3], shuffled: [2, 0, 3, 1], primed: [0, 1, 2, 3], anonymised: [0, 1, 2, 3] };
    function render() {
      $$('.vaa-thesis').forEach((row, i) => $$('button', row).forEach(b => b.classList.toggle('on', +b.dataset.v === voter[i])));
      const d = parties.map(p => p.pos.reduce((s, v, i) => s + Math.abs(v - voter[i]), 0));
      const min = Math.min(...d), winners = d.map((x, i) => x === min ? i : -1).filter(i => i >= 0);
      const tie = winners.length > 1;
      const ord = order[cond];
      cards.forEach((c, i) => {
        const shown = cond === 'anonymised' ? 'Party ' + 'ABCD'[ord.indexOf(i)] : parties[i].name;
        c.querySelector('b').textContent = shown;
        c.querySelector('span').textContent = d[i];
        c.style.order = ord.indexOf(i);
        c.classList.toggle('win', !tie && winners[0] === i);
        c.classList.toggle('tie', tie && winners.includes(i));
      });
      const lines = ord.map((i, k) => {
        const nm = cond === 'anonymised' ? 'Party ' + 'ABCD'[k] : parties[i].name;
        return `${nm}: [${parties[i].pos.map(v => sym[v]).join(', ')}]`;
      });
      promptBox.textContent =
        (cond === 'primed' ? 'Voter: "I usually vote centre-left."\n' : '') +
        `Voter positions: [${voter.map(v => sym[v]).join(', ')}]\n` +
        lines.join('\n') +
        '\nReturn JSON {"party", "confidence", "reasoning"}.';
      const wn = tie ? winners.map(i => parties[i].name).join(' and ') : parties[winners[0]].name;
      verdict.innerHTML = tie
        ? `<strong>Tied ground truth</strong> between ${wn} (distance ${min}). The harness records this explicitly and excludes the profile from accuracy rather than silently breaking the tie.`
        : `<strong>Ground truth: ${wn}</strong> (distance ${min}). Whatever the condition shows the model, this is the answer it is scored against.`;
    }
    render();
  })();

  /* ================================================================
     4. TikTok Shop on Reddit — rule-based theme coding + sentiment.
     Keyword lists are the project's actual config.yaml coding scheme.
     ================================================================ */
  (function themes() {
    const input = $('#theme-input'); if (!input) return;
    const scheme = [
      ['Trust & scam anxiety', 'rose', ['scam', 'scammed', 'fraud', 'fake seller', 'too good to be true', 'sketchy', 'is this legit', 'counterfeit', 'knockoff', 'phishing', 'stolen', 'not what it seems']],
      ['Product quality vs. expectation', 'honey', ['not as described', 'cheap quality', 'broke after', 'fell apart', 'different from picture', 'low quality', 'poor quality', 'flimsy', "doesn't match", 'misleading listing']],
      ['Refunds & returns friction', 'peach', ['refund', 'return policy', 'money back', 'dispute', 'chargeback', 'denied refund', 'return label', 'restocking fee', "can't return", 'refused refund']],
      ['Shipping & delivery', 'corn', ['shipping', 'delivery', 'arrived late', 'never arrived', 'tracking', 'lost package', 'delayed', 'wrong address', 'package damaged', 'long wait']],
      ['Seller communication', 'lav', ["seller won't respond", 'no response', 'ignored my message', 'seller blocked me', 'unresponsive', 'contacted seller', 'seller replied', 'customer service']],
      ['Checkout & payment issues', 'teal', ['checkout', 'payment failed', 'double charged', 'card declined', "coupon didn't work", 'price changed', 'hidden fees', 'payment error', 'glitch at checkout']],
      ['Discovery & recommendation', 'mint', ['for you page', 'fyp', 'found this on tiktok', 'recommended', 'algorithm', 'live shopping', 'tiktok made me buy it', 'discovered', 'viral product', "didn't know i needed"]],
      ['Impulse purchase / regret', 'honey', ['impulse buy', "shouldn't have bought", 'why did i buy', 'regret', 'wasted money', "buyer's remorse", "didn't need it", 'spent too much']],
      ['Creator & affiliate trust', 'lav', ['influencer', 'creator promo', 'affiliate link', 'sponsored', 'paid promotion', 'creator recommended', 'trusted the creator', 'creator scam', 'fake review by creator']],
    ];
    const pos = ['love', 'great', 'amazing', 'perfect', 'happy', 'obsessed', 'worth it', 'fast', 'good', 'recommend', 'cute', 'excellent', 'works'];
    const neg = ['scam', 'broke', 'never', 'worst', 'terrible', 'regret', 'refused', 'denied', 'wasted', 'awful', 'bad', 'late', 'lost', 'fake', 'flimsy', 'ignored', 'damaged'];
    const samples = [
      'Found this on my fyp and tiktok made me buy it. Honestly obsessed, arrived in 3 days and the quality is great.',
      "Ordered a jacket, it was not as described and fell apart after one wash. Seller won't respond and the refund got denied. Total scam.",
      'Impulse buy at 2am, kind of regret it. Coupon didn\'t work at checkout so I got double charged, still waiting on customer service.',
      'The influencer swore by it in a sponsored live shopping stream. Package never arrived and tracking has said "delayed" for two weeks.',
    ];
    const themesBox = $('#themes'), hl = $('#theme-hl'), sdot = $('#sent-dot'), slab = $('#sent-label'), sbox = $('#theme-samples');
    scheme.forEach(([name, col]) => { const t = document.createElement('span'); t.className = 'theme'; t.style.setProperty('--c', `var(--${col})`); t.textContent = name; themesBox.appendChild(t); });
    samples.forEach((s, i) => { const b = document.createElement('button'); b.textContent = 'Sample ' + (i + 1); b.addEventListener('click', () => { input.value = s; run(); }); sbox.appendChild(b); });
    const esc = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    function run() {
      const raw = input.value, text = raw.toLowerCase();
      const hits = [];
      $$('.theme', themesBox).forEach((t, i) => {
        const kws = scheme[i][2].filter(k => text.includes(k));
        t.classList.toggle('hit', kws.length > 0);
        hits.push(...kws);
      });
      let html = esc(raw);
      hits.sort((a, b) => b.length - a.length).forEach(k => {
        html = html.replace(new RegExp(k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), m => `<mark>${m}</mark>`);
      });
      hl.innerHTML = html || '<em>Type or pick a sample post.</em>';
      const p = pos.filter(w => text.includes(w)).length, n = neg.filter(w => text.includes(w)).length;
      const score = (p - n) / Math.max(1, p + n);
      sdot.style.left = (50 + score * 45) + '%';
      slab.textContent = score > 0.05 ? 'positive' : score < -0.05 ? 'negative' : 'neutral';
    }
    input.addEventListener('input', run);
    input.value = samples[1]; run();
  })();

  /* ================================================================
     5. Verification Space — agentic XR, proposals before changes.
     An AI proposal lands in a preview; the live scene only changes
     after confirm, can be repaired first, and can always be rolled back.
     ================================================================ */
  (function verify() {
    const input = $('#vs-input'); if (!input) return;
    const biomes = {
      forest: { sky: '#CFE6F7', ground: '#A9D7A1', prop: '#5E8A52', sun: '#F5D56B', label: 'Forest' },
      desert: { sky: '#FBE3B8', ground: '#EBCD94', prop: '#C98A4E', sun: '#F39C5A', label: 'Desert' },
      snow: { sky: '#E6EEF7', ground: '#F4F6F9', prop: '#B9C8D9', sun: '#E8EEF6', label: 'Snowfield' },
      ocean: { sky: '#CFE6F7', ground: '#94D4CC', prop: '#5C8FB0', sun: '#F5D56B', label: 'Coast' },
      night: { sky: '#3A3A5A', ground: '#2F3F3A', prop: '#1F2A26', sun: '#F4F2EC', label: 'Night forest' },
      lava: { sky: '#5A3A3A', ground: '#C0503A', prop: '#2A1A1A', sun: '#F0AF98', label: 'Volcanic' },
      candy: { sky: '#F9DCE8', ground: '#EBA5B2', prop: '#C3B2E8', sun: '#F5D56B', label: 'Candy world' },
    };
    const kw = { forest: ['forest', 'tree', 'wood', 'jungle'], desert: ['desert', 'sand', 'dune'], snow: ['snow', 'ice', 'winter', 'frozen'], ocean: ['ocean', 'sea', 'beach', 'coast', 'water'], night: ['night', 'dark', 'moon'], lava: ['lava', 'volcano', 'fire'], candy: ['candy', 'pink', 'sweet'] };
    const preview = $('#vs-preview'), live = $('#vs-live'), log = $('#vs-log');
    const bConfirm = $('#vs-confirm'), bRepair = $('#vs-repair'), bRoll = $('#vs-rollback'), bPropose = $('#vs-propose');
    let liveState = null, prevState = null, proposal = null;
    function paint(scene, st) {
      scene.classList.toggle('empty', !st);
      if (!st) { scene.querySelector('.lbl').textContent = 'empty'; return; }
      scene.style.setProperty('--sky', st.sky); scene.style.setProperty('--ground', st.ground);
      scene.style.setProperty('--prop', st.prop); scene.style.setProperty('--sun', st.sun);
      scene.querySelector('.lbl').textContent = st.label;
    }
    function parse(text) {
      const t = text.toLowerCase();
      for (const k in kw) if (kw[k].some(w => t.includes(w))) return { ...biomes[k] };
      return { ...biomes.forest, label: 'Forest (default)' };
    }
    function propose() {
      if (!input.value.trim()) { log.textContent = 'Describe a world first, e.g. "a snowy forest at night".'; return; }
      proposal = parse(input.value);
      paint(preview, proposal);
      bConfirm.disabled = false; bRepair.disabled = false;
      log.textContent = `AI proposes "${proposal.label}". The live scene has not changed — review it in the preview.`;
    }
    bPropose.addEventListener('click', propose);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') propose(); });
    bConfirm.addEventListener('click', () => {
      if (!proposal) return;
      prevState = liveState; liveState = proposal; proposal = null;
      paint(live, liveState); paint(preview, null);
      bConfirm.disabled = true; bRepair.disabled = true; bRoll.disabled = !prevState && liveState === null;
      bRoll.disabled = false;
      log.textContent = `Confirmed. "${liveState.label}" is now live. Rollback is available.`;
    });
    bRepair.addEventListener('click', () => {
      if (!proposal) return;
      const keys = Object.keys(biomes), cur = keys.find(k => biomes[k].label === proposal.label.replace(' (default)', '')) || 'forest';
      const next = keys[(keys.indexOf(cur) + 1) % keys.length];
      proposal = { ...biomes[next] };
      paint(preview, proposal);
      log.textContent = `Repaired: swapped the proposal to "${proposal.label}". Still only in preview.`;
    });
    bRoll.addEventListener('click', () => {
      liveState = prevState; prevState = null;
      paint(live, liveState);
      bRoll.disabled = true;
      log.textContent = liveState ? `Rolled back to "${liveState.label}".` : 'Rolled back to the empty scene.';
    });
    paint(preview, null); paint(live, null);
    bConfirm.disabled = true; bRepair.disabled = true; bRoll.disabled = true;
  })();

  /* ================================================================
     6. LIFT-printed graphene pressure sensor. Press (hold) on the pad:
     the resistance of the printed track drops with contact pressure, a
     trace shows the response, and neighbouring cells pick up the load.
     ================================================================ */
  (function pad() {
    const pad = $('#pad'); if (!pad) return;
    const COLS = 10, ROWS = 5, cells = [];
    for (let i = 0; i < COLS * ROWS; i++) { const c = document.createElement('i'); pad.appendChild(c); cells.push(c); }
    const outR = $('#pad-r'), outF = $('#pad-force'), outC = $('#pad-cell'), trace = $('#pad-trace polyline');
    const R0 = 1200; // ohms, nominal track resistance
    let px = -1, py = -1, down = false, force = 0;
    const hist = new Array(80).fill(0);
    function pos(e) {
      const b = pad.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e;
      px = ((p.clientX - b.left) / b.width) * COLS; py = ((p.clientY - b.top) / b.height) * ROWS;
    }
    pad.addEventListener('pointermove', pos);
    pad.addEventListener('pointerdown', e => { down = true; pos(e); pad.setPointerCapture(e.pointerId); });
    pad.addEventListener('pointerup', () => { down = false; });
    pad.addEventListener('pointercancel', () => { down = false; });
    pad.addEventListener('pointerleave', () => { if (!down) { px = py = -1; } });
    function frame() {
      const targetF = px < 0 ? 0 : down ? 1 : 0.35;
      force += (targetF - force) * (down ? 0.08 : 0.2);
      let hot = -1, hotV = 0;
      cells.forEach((c, i) => {
        const cx = (i % COLS) + 0.5, cy = Math.floor(i / COLS) + 0.5;
        const d = px < 0 ? 99 : Math.hypot(cx - px, cy - py);
        const v = clamp(1 - d / (1.2 + force * 1.6), 0, 1) * force;
        const g = Math.round(243 - v * 200), gb = Math.round(241 - v * 205), gc = Math.round(235 - v * 210);
        c.style.background = `rgb(${g},${gb},${gc})`;
        c.style.transform = `scale(${1 - v * 0.2})`;
        if (v > hotV) { hotV = v; hot = i; }
      });
      const R = R0 * (1 - 0.62 * force);
      hist.push(R); hist.shift();
      if (trace) trace.setAttribute('points', hist.map((r, i) => `${(i / (hist.length - 1)) * 100},${44 - ((r - R0 * 0.38) / (R0 * 0.62)) * 40}`).join(' '));
      if (outR) outR.textContent = Math.round(R) + ' Ω';
      if (outF) outF.textContent = (force * 2.4).toFixed(1) + ' N';
      if (outC) outC.textContent = hot >= 0 && hotV > 0.05 ? `R${Math.floor(hot / COLS) + 1}C${(hot % COLS) + 1}` : '—';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  })();
})();
