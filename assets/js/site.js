// Site-wide motion: hero letter stagger, nav state, scroll progress,
// reveal-on-scroll, counters, timeline drawing, magnetic buttons, cursor.
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // --- hero name: split into letters and stagger in ---
  $$('.hero-name .word').forEach((word, wi) => {
    const text = word.textContent;
    word.textContent = '';
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.className = 'ch'; s.textContent = ch;
      s.style.animationDelay = (0.15 + wi * 0.35 + i * 0.045) + 's';
      word.appendChild(s);
    });
  });

  // --- hero parallax (content drifts up and fades as you scroll) ---
  const heroInner = $('.hero-inner');
  const nav = $('#nav');
  const progress = $('.progress');
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (heroInner && !reduced && y < window.innerHeight) {
        heroInner.style.transform = `translateY(${y * 0.25}px)`;
        heroInner.style.opacity = String(Math.max(0, 1 - y / (window.innerHeight * 0.75)));
      }
      nav.classList.toggle('scrolled', y > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + '%';
      drawTimeline();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- mobile nav ---
  const toggle = $('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => nav.classList.toggle('open'));
    $$('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  }

  // --- active section in nav ---
  const sections = $$('section[id], header[id]');
  const navLinks = $$('.nav-links a[href^="#"]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(s => io.observe(s));
  }

  // --- reveal on scroll, with stagger inside groups ---
  const targets = $$('.reveal, .reveal-clip');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('in'));
  } else {
    const groups = new Map();
    targets.forEach(el => {
      if (el.hasAttribute('data-stagger')) {
        const p = el.parentElement;
        const n = groups.get(p) || 0;
        el.style.setProperty('--d', (Math.min(n, 8) * 0.09) + 's');
        groups.set(p, n + 1);
      }
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(el => io.observe(el));
  }

  // --- counters ---
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
        const start = performance.now(), dur = reduced ? 0 : 1400;
        const step = (t) => {
          const k = dur ? Math.min(1, (t - start) / dur) : 1;
          const eased = 1 - Math.pow(1 - k, 3);
          el.textContent = (end * eased).toFixed(dec);
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(c => io.observe(c));
  }

  // --- timeline: line draws as you scroll past it, dots fill ---
  const tl = $('.timeline'), tlFill = $('.timeline-line i');
  function drawTimeline() {
    if (!tl || !tlFill) return;
    const r = tl.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / r.height));
    tlFill.style.setProperty('--p', (p * 100) + '%');
    $$('.job', tl).forEach(j => j.classList.toggle('in', j.getBoundingClientRect().top < vh * 0.6));
  }

  // --- magnetic buttons ---
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.btn').forEach(b => {
      b.addEventListener('mousemove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18, y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.transform = `translate(${x}px, ${y}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
    // card tilt
    $$('.card').forEach(c => {
      c.addEventListener('mousemove', (e) => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        c.style.transform = `perspective(800px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateY(-4px)`;
      });
      c.addEventListener('mouseleave', () => { c.style.transform = ''; });
    });
  }

  // --- research threads: expand on hover/click/keyboard ---
  const threads = $$('.thread');
  function activate(t) { threads.forEach(x => x.classList.toggle('active', x === t)); }
  threads.forEach(t => {
    t.addEventListener('mouseenter', () => activate(t));
    t.addEventListener('click', () => activate(t));
    t.addEventListener('focus', () => activate(t));
  });

  // --- custom cursor ---
  (function () {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const dot = $('.cur-dot'), ring = $('.cur-ring');
    if (!dot || !ring) return;
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, shown = false;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      if (reduced) { ring.style.left = mx + 'px'; ring.style.top = my + 'px'; }
      if (!shown) { shown = true; dot.classList.add('active'); ring.classList.add('active'); }
    }, { passive: true });
    document.addEventListener('mouseleave', () => { dot.classList.remove('active'); ring.classList.remove('active'); shown = false; });
    if (!reduced) {
      const tick = () => {
        rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
        ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    const hot = 'a, button, summary, .thread, .chip, .card, input, textarea, .belt-wrap, .pad';
    document.addEventListener('mouseover', (e) => { if (e.target.closest(hot)) ring.classList.add('hover'); });
    document.addEventListener('mouseout', (e) => { if (e.target.closest(hot)) ring.classList.remove('hover'); });
  })();

  // --- footer year ---
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();
})();
