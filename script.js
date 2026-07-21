/* ===================================================================
   ONEPARK — script.js
   All interaction logic, data-driven sections, motion & a11y features
   =================================================================== */
(() => {
  'use strict';

  const html = document.documentElement;
  const prefersReducedMotionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* -----------------------------------------------------------------
     0. Utility helpers
  ----------------------------------------------------------------- */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* -----------------------------------------------------------------
     1. Theme (dark / light) with persistence
  ----------------------------------------------------------------- */
  const ThemeModule = (() => {
    const KEY = 'onepark-theme';
    const toggle = $('#themeToggle');

    function apply(mode) {
      html.classList.toggle('dark', mode === 'dark');
      localStorage.setItem(KEY, mode);
    }
    function init() {
      const saved = localStorage.getItem(KEY);
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      apply(saved || (systemDark ? 'dark' : 'light'));
      toggle?.addEventListener('click', () => {
        apply(html.classList.contains('dark') ? 'light' : 'dark');
      });
    }
    return { init, apply };
  })();

  /* -----------------------------------------------------------------
     2. Accessibility panel (reduce motion / contrast / text size)
  ----------------------------------------------------------------- */
  const A11yModule = (() => {
    const panel = $('#a11yPanel');
    const openBtn = $('#a11yToggle');
    const closeBtn = $('#a11yClose');
    const reduceMotion = $('#reduceMotionToggle');
    const highContrast = $('#highContrastToggle');
    const largeText = $('#largeTextToggle');

    const FLAGS = {
      'reduce-motion': reduceMotion,
      'high-contrast': highContrast,
      'large-text': largeText
    };

    function loadFlags() {
      Object.entries(FLAGS).forEach(([cls, input]) => {
        const saved = localStorage.getItem('onepark-' + cls) === '1';
        html.classList.toggle(cls, saved);
        if (input) input.checked = saved;
      });
      if (prefersReducedMotionMQ.matches) html.classList.add('reduce-motion');
    }

    function bind() {
      openBtn?.addEventListener('click', () => {
        const isHidden = panel.hasAttribute('hidden');
        panel.toggleAttribute('hidden', !isHidden);
        openBtn.setAttribute('aria-expanded', String(isHidden));
      });
      closeBtn?.addEventListener('click', () => {
        panel.setAttribute('hidden', '');
        openBtn.setAttribute('aria-expanded', 'false');
      });
      Object.entries(FLAGS).forEach(([cls, input]) => {
        input?.addEventListener('change', () => {
          html.classList.toggle(cls, input.checked);
          localStorage.setItem('onepark-' + cls, input.checked ? '1' : '0');
        });
      });
    }

    function init() { loadFlags(); bind(); }
    return { init };
  })();

  /* -----------------------------------------------------------------
     3. Loader
  ----------------------------------------------------------------- */
  function initLoader() {
    const loader = $('#loader');
    window.addEventListener('load', () => {
      setTimeout(() => loader?.classList.add('is-hidden'), 400);
    });
    // Fallback in case load event is delayed
    setTimeout(() => loader?.classList.add('is-hidden'), 2600);
  }

  /* -----------------------------------------------------------------
     4. Custom cursor
  ----------------------------------------------------------------- */
  function initCursor() {
    if (window.matchMedia('(hover:none), (pointer:coarse)').matches) return;
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });

    function raf() {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(raf);
    }
    raf();

    $$('a, button, .system-card, .gallery-tile, .eco-item').forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('is-active'));
      el.addEventListener('mouseleave', () => ring.classList.remove('is-active'));
    });
  }

  /* -----------------------------------------------------------------
     5. Magnetic buttons
  ----------------------------------------------------------------- */
  function initMagnetic() {
    if (prefersReducedMotionMQ.matches) return;
    $$('.btn--magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.28}px, ${y * 0.5}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
    });
  }

  /* -----------------------------------------------------------------
     6. Nav: scroll state, mega menu keyboard, search, mobile menu
  ----------------------------------------------------------------- */
  function initNav() {
    const nav = $('#siteNav');
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Mobile menu
    const burger = $('#burgerToggle');
    const mobileMenu = $('#mobileMenu');
    burger?.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      mobileMenu.hidden = !isOpen;
      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    $$('.mobile-menu a, .mobile-menu .btn').forEach(a => a.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      mobileMenu.hidden = true;
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));

    // Search panel
    const searchToggle = $('#searchToggle');
    const searchPanel = $('#searchPanel');
    const searchInput = $('#searchInput');
    const resultsEl = $('#searchResults');

    const SEARCH_INDEX = [
      { label: 'Botanical Gardens', hint: 'Zone · Map', target: '#map' },
      { label: 'Solar Plaza', hint: 'Zone · Map', target: '#map' },
      { label: 'Sky Walk', hint: 'Zone · Map', target: '#map' },
      { label: 'Observation Tower', hint: 'Zone · Map', target: '#map' },
      { label: 'Solar Energy', hint: 'System', target: '#sustainability' },
      { label: 'Wind Energy', hint: 'System', target: '#sustainability' },
      { label: 'Carbon Capture', hint: 'System', target: '#sustainability' },
      { label: 'School Field Program', hint: 'Community', target: '#community' },
      { label: 'Volunteer Corps', hint: 'Community', target: '#community' },
      { label: 'Digital Twin', hint: 'Innovation', target: '#innovation' },
      { label: 'Visiting hours', hint: 'Visit', target: '#contact' },
      { label: 'Newsletter', hint: 'Visit', target: '#contact' },
    ];

    function renderResults(query) {
      const q = query.trim().toLowerCase();
      const list = q ? SEARCH_INDEX.filter(i => i.label.toLowerCase().includes(q)) : SEARCH_INDEX.slice(0, 6);
      resultsEl.innerHTML = list.map(i => `<li><a href="${i.target}"><span>${i.label}</span><span>${i.hint}</span></a></li>`).join('') || '<li style="padding:10px 14px;color:var(--ink-soft);font-size:14px;">No matches — try “solar” or “garden”.</li>';
    }

    function openSearch() {
      searchPanel.hidden = false;
      searchToggle.setAttribute('aria-expanded', 'true');
      renderResults('');
      requestAnimationFrame(() => searchInput.focus());
    }
    function closeSearch() {
      searchPanel.hidden = true;
      searchToggle.setAttribute('aria-expanded', 'false');
      searchInput.value = '';
    }
    searchToggle?.addEventListener('click', () => searchPanel.hidden ? openSearch() : closeSearch());
    searchInput?.addEventListener('input', e => renderResults(e.target.value));
    resultsEl?.addEventListener('click', () => closeSearch());

    document.addEventListener('keydown', e => {
      if (e.key === '/' && !isTyping(e.target)) { e.preventDefault(); openSearch(); }
      if (e.key === 'Escape') { closeSearch(); }
    });

    document.addEventListener('click', e => {
      if (!searchPanel.hidden && !searchPanel.contains(e.target) && e.target !== searchToggle) closeSearch();
    });
  }

  function isTyping(el) {
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  /* -----------------------------------------------------------------
     7. Scroll progress bar
  ----------------------------------------------------------------- */
  function initScrollProgress() {
    const bar = $('#scrollProgressBar');
    const update = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      bar.style.width = (height > 0 ? (scrolled / height) * 100 : 0) + '%';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* -----------------------------------------------------------------
     8. Reveal-on-scroll (IntersectionObserver)
  ----------------------------------------------------------------- */
  function initReveal() {
    const targets = $$('.reveal-up');
    if (!('IntersectionObserver' in window) || prefersReducedMotionMQ.matches) {
      targets.forEach(t => t.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    targets.forEach(t => io.observe(t));
  }

  /* -----------------------------------------------------------------
     9. Hero: contour parallax + lightweight particle canvas
  ----------------------------------------------------------------- */
  function initHeroContours() {
    const svg = $('#heroContours');
    if (!svg) return;
    window.addEventListener('mousemove', e => {
      if (prefersReducedMotionMQ.matches) return;
      const x = (e.clientX / window.innerWidth - 0.5) * 16;
      const y = (e.clientY / window.innerHeight - 0.5) * 16;
      svg.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  function initHeroCanvas() {
    const canvas = $('#heroCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, particles;
    const COUNT = 46;

    function resize() {
      w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      h = canvas.height = canvas.offsetHeight * devicePixelRatio;
    }
    function makeParticles() {
      particles = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 1.6 + 0.6) * devicePixelRatio,
        vy: -(Math.random() * 0.35 + 0.08) * devicePixelRatio,
        vx: (Math.random() - 0.5) * 0.18 * devicePixelRatio,
        o: Math.random() * 0.5 + 0.15
      }));
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const isDark = html.classList.contains('dark');
      particles.forEach(p => {
        p.y += p.vy; p.x += p.vx;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? `rgba(110,231,183,${p.o})` : `rgba(16,185,129,${p.o * 0.7})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    }
    resize(); makeParticles();
    if (!prefersReducedMotionMQ.matches) draw(); else ctx.clearRect(0,0,w,h);
    window.addEventListener('resize', () => { resize(); makeParticles(); });
  }

  /* -----------------------------------------------------------------
     10. Fake live weather chip (deterministic, no network calls)
  ----------------------------------------------------------------- */
  function initWeather() {
    const el = $('#weatherText');
    if (!el) return;
    const conditions = ['Clear', 'Partly cloudy', 'Soft breeze', 'Light mist'];
    const hour = new Date().getHours();
    const cond = conditions[hour % conditions.length];
    const temp = 16 + (hour % 9);
    const toGolden = (18 - hour + 24) % 24;
    el.textContent = `${cond} · ${temp}°C · Golden hour in ${toGolden || 1}h`;
  }

  /* -----------------------------------------------------------------
     11. Sustainability systems — data-driven grid
  ----------------------------------------------------------------- */
  const SYSTEMS = [
    { icon: 'sun', title: 'Solar Energy', metric: '38 MW capacity', desc: 'A canopy of 62,000 panels shades the main plazas while generating well over half the park\u2019s power.' },
    { icon: 'rain', title: 'Rainwater Harvesting', metric: '40M gallons / yr', desc: 'Every roof and hardscape drains into a filtration wetland before returning water to the lake.' },
    { icon: 'wind', title: 'Wind Energy', metric: '12 turbines', desc: 'Vertical-axis turbines along the ridgeline supply power through calm and storm alike.' },
    { icon: 'forest', title: 'Native Forest Restoration', metric: '112 acres restored', desc: 'Cleared rail corridors have been replanted with regionally native canopy and understory species.' },
    { icon: 'shield', title: 'Wildlife Protection', metric: '200+ species', desc: 'Wildlife corridors and quiet zones keep human traffic separated from nesting and denning sites.' },
    { icon: 'capture', title: 'Carbon Capture', metric: '4,800 t CO₂ / yr', desc: 'Soil carbon farming and fast-growing buffer stands sequester more carbon than the park emits.' },
    { icon: 'building', title: 'Green Buildings', metric: '9 living-roof structures', desc: 'Visitor centers are built from mass timber with living roofs that insulate and host pollinators.' },
    { icon: 'drop', title: 'Smart Irrigation', metric: '65% less water use', desc: 'Soil-moisture sensors trigger drip irrigation only where and when plantings actually need it.' },
    { icon: 'garden', title: 'Vertical Gardens', metric: '3,200 m² of wall', desc: 'Living walls along the transit corridor filter air and cool the plaza by up to 4°C in summer.' },
    { icon: 'farm', title: 'Urban Farming', metric: '6 acres in production', desc: 'A working farm supplies the park\u2019s cafés and donates surplus to community kitchens weekly.' },
    { icon: 'bolt', title: 'Electric Transport', metric: '100% electric fleet', desc: 'Shuttles, maintenance vehicles, and rentable bikes run entirely on park-generated power.' },
    { icon: 'recycle', title: 'Recycling Systems', metric: '92% diversion rate', desc: 'Closed-loop composting turns green waste back into soil amendment within six weeks.' },
    { icon: 'leaf', title: 'Biodiversity', metric: '200+ documented species', desc: 'Ongoing habitat surveys track everything from soil microbiota to migratory bird populations.' },
    { icon: 'radar', title: 'AI Environmental Monitoring', metric: '4,200 live sensors', desc: 'A sensor mesh reads soil, air, and water conditions every 90 seconds across all 500 acres.' },
    { icon: 'zero', title: 'Net Zero Operations', metric: 'Achieved 2024', desc: 'Total on-site generation has exceeded total park energy consumption every month since May 2024.' },
  ];

  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8"/>',
    rain: '<path d="M7 15a4.5 4.5 0 0 1 .8-8.9A6 6 0 0 1 19 8.5 4 4 0 0 1 18 16H7Z"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/>',
    wind: '<path d="M3 8h10a3 3 0 1 0-3-3M3 16h13a3 3 0 1 1-3 3M3 12h16a2.5 2.5 0 1 0-2.5-2.5"/>',
    forest: '<path d="M12 2 7 10h3l-4 6h4v4h4v-4h4l-4-6h3z"/>',
    shield: '<path d="M12 2 4 5v6c0 5 3.4 8.6 8 9 4.6-.4 8-4 8-9V5z"/>',
    capture: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
    building: '<rect x="4" y="8" width="16" height="13" rx="1.5"/><path d="M4 8 12 3l8 5"/>',
    drop: '<path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11Z"/>',
    garden: '<path d="M6 21V9a3 3 0 0 1 6 0v12M18 21V13a3 3 0 0 0-6 0v8"/>',
    farm: '<path d="M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6"/>',
    bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"/>',
    recycle: '<path d="M7 8 4.5 12.5 7 17M17 8l2.5 4.5L17 17M9 3.5h6M9 20.5h6M4.5 12.5h15"/>',
    leaf: '<path d="M5 19c9 0 14-5 14-14C10 5 5 10 5 19Z"/><path d="M5 19c3-6 6-9 14-14"/>',
    radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M21 12h-2M12 21v-2M3 12h2"/>',
    zero: '<circle cx="12" cy="12" r="8"/><path d="M8 8l8 8"/>'
  };

  function renderSystems() {
    const grid = $('#systemsGrid');
    if (!grid) return;
    grid.innerHTML = SYSTEMS.map(s => `
      <div class="system-card reveal-up" data-tilt>
        <div class="system-card__icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[s.icon] || ''}</svg>
        </div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
        <div class="system-card__metric">${s.metric}</div>
      </div>
    `).join('');

    // subtle spotlight-follow effect
    $$('.system-card', grid).forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* -----------------------------------------------------------------
     12. Interactive park map
  ----------------------------------------------------------------- */
  const ZONES = [
    { name: 'Botanical Gardens', x: 60, y: 520, desc: 'Six climate-zoned glasshouses hold plant collections from cloud forest to desert, all irrigated by harvested rain.' },
    { name: 'Nature Trails', x: 220, y: 300, desc: '14 miles of packed-earth trail wind through restored forest, wetland, and prairie habitat.' },
    { name: 'Botanical Overlook', x: 320, y: 200, desc: 'A raised timber walkway gives a canopy-level view over the eastern restoration zone.' },
    { name: 'Solar Plaza', x: 420, y: 140, desc: 'The park\u2019s energy heart — a shaded plaza roofed entirely in photovoltaic canopy.' },
    { name: 'Innovation Hub', x: 540, y: 175, desc: 'Home to the sensor mesh control room and rotating exhibits on climate technology.' },
    { name: 'Lake', x: 620, y: 210, desc: 'A 40-acre constructed lake filters and stores rainwater while supporting native waterfowl.' },
    { name: 'Sky Walk', x: 700, y: 150, desc: 'A 900-foot elevated bridge crossing the wetland canopy, best visited at dawn.' },
    { name: 'Education Centre', x: 800, y: 90, desc: 'Classrooms and labs host 400+ school visits each spring, built around the working park itself.' },
    { name: 'Observation Tower', x: 855, y: 110, desc: 'At 140 feet, the tallest point in the park — clear views to the coastal range on a good day.' },
    { name: 'Urban Farm', x: 760, y: 230, desc: 'Six acres of working farmland supply the park\u2019s cafés and a weekly community market.' },
    { name: 'Kids Discovery Zone', x: 500, y: 350, desc: 'An acre of hands-on exhibits — compost stations, a pollinator maze, and a mini turbine workshop.' },
    { name: 'Outdoor Theatre', x: 350, y: 420, desc: 'A 1,200-seat amphitheatre built into the hillside, home to the summer concert series.' },
  ];

  function renderMap() {
    const svg = $('#parkMap');
    if (!svg) return;
    const ns = 'http://www.w3.org/2000/svg';

    ZONES.forEach((zone, i) => {
      const g = document.createElementNS(ns, 'g');
      g.classList.add('zone-marker');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', zone.name);
      g.dataset.index = i;

      const pulse = document.createElementNS(ns, 'circle');
      pulse.classList.add('pulse');
      pulse.setAttribute('cx', zone.x); pulse.setAttribute('cy', zone.y); pulse.setAttribute('r', 8);

      const circle = document.createElementNS(ns, 'circle');
      circle.setAttribute('cx', zone.x); circle.setAttribute('cy', zone.y); circle.setAttribute('r', 7);

      const text = document.createElementNS(ns, 'text');
      text.setAttribute('x', zone.x + 14);
      text.setAttribute('y', zone.y + 4);
      text.textContent = zone.name;

      g.append(pulse, circle, text);
      svg.appendChild(g);

      const activate = () => setActiveZone(i);
      g.addEventListener('mouseenter', activate);
      g.addEventListener('focus', activate);
      g.addEventListener('click', activate);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(); } });
    });

    function setActiveZone(i) {
      const zone = ZONES[i];
      $$('.zone-marker', svg).forEach(m => m.classList.toggle('is-active', Number(m.dataset.index) === i));
      $('#mapCardTitle').textContent = zone.name;
      $('#mapCardDesc').textContent = zone.desc;
      $('.map-card__eyebrow').textContent = `Zone ${String(i + 1).padStart(2, '0')} / ${ZONES.length}`;
    }
  }

  /* -----------------------------------------------------------------
     13. Animated stat counters
  ----------------------------------------------------------------- */
  function initCounters() {
    const stats = $$('.stat__num');
    if (!stats.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.5 });
    stats.forEach(s => io.observe(s));

    function animateCount(el) {
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const duration = prefersReducedMotionMQ.matches ? 1 : 1400;
      const start = performance.now();
      function step(now) {
        const t = clamp((now - start) / duration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = Math.round(target * eased);
        el.textContent = val + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  }

  /* -----------------------------------------------------------------
     14. Timeline scroll fill
  ----------------------------------------------------------------- */
  function initTimeline() {
    const items = $$('.timeline__item');
    const fill = $('#timelineFill');
    const rail = $('.timeline__rail');
    if (!items.length || !fill || !rail) return;

    function update() {
      const railRect = rail.getBoundingClientRect();
      const viewportCenter = window.innerHeight * 0.55;
      const progressPx = clamp(viewportCenter - railRect.top, 0, railRect.height);
      fill.style.height = (progressPx / railRect.height) * 100 + '%';

      items.forEach(item => {
        const r = item.getBoundingClientRect();
        item.classList.toggle('is-active', r.top < viewportCenter);
      });
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* -----------------------------------------------------------------
     15. Ecosystem tabs
  ----------------------------------------------------------------- */
  const ECO_DATA = {
    fauna: [
      { emoji: '🦉', name: 'Barn Owl', note: '14 nesting pairs recorded in the 2025 canopy survey.' },
      { emoji: '🦫', name: 'North American Beaver', note: 'Reintroduced in 2023; now shaping wetland hydrology naturally.' },
      { emoji: '🦋', name: 'Monarch Butterfly', note: 'A dedicated milkweed corridor supports the fall migration route.' },
      { emoji: '🐟', name: 'Brook Trout', note: 'Cold-water refuges keep the lake\u2019s northern inlet fishable year-round.' },
      { emoji: '🦆', name: 'Wood Duck', note: 'Nest boxes along the wetland edge host over 60 breeding pairs.' },
      { emoji: '🦔', name: 'Eastern Hedgehog', note: 'Brush piles left deliberately unmanicured give small mammals cover.' }
    ],
    flora: [
      { emoji: '🌳', name: 'Bur Oak', note: 'Legacy trees anchor the canopy across the eastern restoration zone.' },
      { emoji: '🌾', name: 'Native Prairie Grass', note: '40 acres of tallgrass prairie were reseeded from local seed stock.' },
      { emoji: '🌼', name: 'Black-Eyed Susan', note: 'A pollinator favorite that blankets the meadow trail each July.' },
      { emoji: '🪷', name: 'Water Lily', note: 'Planted along the lake\u2019s shallow margins to filter runoff naturally.' },
      { emoji: '🌿', name: 'Ferns & Understory', note: 'Shade-tolerant understory species were the first plantings, in 2020.' },
      { emoji: '🌸', name: 'Serviceberry', note: 'Early spring blossoms provide the first nectar source of the season.' }
    ],
    water: [
      { emoji: '💧', name: 'Constructed Wetland', note: 'Filters every drop of stormwater before it reaches the lake.' },
      { emoji: '🌊', name: 'The Lake', note: '40 acres, fed entirely by harvested rain and filtered runoff.' },
      { emoji: '🚰', name: 'Greywater Loop', note: 'Visitor-center greywater is treated on-site and reused for irrigation.' },
      { emoji: '🌧️', name: 'Rain Gardens', note: 'Distributed across every plaza to capture and slow storm surges.' }
    ],
    climate: [
      { emoji: '🌡️', name: '−4°C Urban Cooling', note: 'Canopy cover measurably lowers surface temperature versus surrounding streets.' },
      { emoji: '🫁', name: 'Air Filtration', note: 'Living walls and canopy remove an estimated 18 tons of particulates yearly.' },
      { emoji: '🌍', name: 'Carbon Sequestration', note: 'Soil and biomass now sequester more carbon than annual park operations emit.' },
      { emoji: '🐝', name: 'Pollinator Recovery', note: 'Regional pollinator counts within a mile of the park are up 34% since 2021.' }
    ]
  };

  function renderEcosystem() {
    const panels = $('#ecoPanels');
    const tabs = $$('.eco-tab');
    if (!panels) return;

    panels.innerHTML = Object.entries(ECO_DATA).map(([key, items], i) => `
      <div class="eco-panel ${i === 0 ? 'is-active' : ''}" data-panel="${key}" role="tabpanel">
        ${items.map(it => `
          <div class="eco-item">
            <span class="eco-item__emoji" aria-hidden="true">${it.emoji}</span>
            <h4>${it.name}</h4>
            <p>${it.note}</p>
          </div>
        `).join('')}
      </div>
    `).join('');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        $$('.eco-panel', panels).forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab.dataset.tab));
      });
    });
  }

  /* -----------------------------------------------------------------
     16. Gallery + lightbox
  ----------------------------------------------------------------- */
  const GALLERY = [
    { color: '#0B3D2E', big: true,  wide: true,  caption: 'Solar Plaza at dawn' },
    { color: '#10B981', big: false, wide: false, caption: 'Wood duck nest box, Lake edge' },
    { color: '#7DD8F0', big: true,  wide: false, caption: 'Sky Walk over the wetland canopy' },
    { color: '#C6F135', big: false, wide: false, caption: 'Tallgrass prairie in bloom' },
    { color: '#133F30', big: false, wide: true,  caption: 'Education Centre, spring cohort' },
    { color: '#34D399', big: false, wide: false, caption: 'Observation Tower at golden hour' },
    { color: '#0B3D2E', big: false, wide: false, caption: 'Volunteer planting day, Habitat Corps' },
    { color: '#7DD8F0', big: false, wide: false, caption: 'Botanical Gardens, cloud-forest house' },
  ];

  function renderGallery() {
    const grid = $('#galleryGrid');
    if (!grid) return;
    grid.innerHTML = GALLERY.map((g, i) => `
      <div class="gallery-tile ${g.big ? 'gallery-tile--tall' : ''} ${g.wide ? 'gallery-tile--wide' : ''}"
           style="background:linear-gradient(150deg, ${g.color}, ${g.color}cc)" data-index="${i}" tabindex="0" role="button"
           aria-label="Open image: ${g.caption}">
        <span>${g.caption}</span>
      </div>
    `).join('');

    const lightbox = $('#lightbox');
    const figure = $('#lightboxFigure');
    const caption = $('#lightboxCaption');
    let current = 0;

    function open(i) {
      current = i;
      show();
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      $('#lightboxClose').focus();
    }
    function show() {
      const item = GALLERY[current];
      figure.style.background = `linear-gradient(150deg, ${item.color}, ${item.color}cc)`;
      caption.textContent = `${item.caption} — ${current + 1} / ${GALLERY.length}`;
    }
    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
    }
    function next() { current = (current + 1) % GALLERY.length; show(); }
    function prev() { current = (current - 1 + GALLERY.length) % GALLERY.length; show(); }

    $$('.gallery-tile', grid).forEach(tile => {
      tile.addEventListener('click', () => open(Number(tile.dataset.index)));
      tile.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(Number(tile.dataset.index)); } });
    });
    $('#lightboxClose').addEventListener('click', close);
    $('#lightboxNext').addEventListener('click', next);
    $('#lightboxPrev').addEventListener('click', prev);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', e => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });
  }

  /* -----------------------------------------------------------------
     17. Testimonial carousel
  ----------------------------------------------------------------- */
  const TESTIMONIALS = [
    { quote: 'I bring my ecology students here every spring. It\u2019s the only place I know where the syllabus and the site are literally the same thing.', name: 'Priya Anand', role: 'High school biology teacher' },
    { quote: 'We modeled our own campus retrofit on OnePark\u2019s water loop. Seeing infrastructure this legible changed how our team designs.', name: 'Marcus Feld', role: 'Municipal sustainability director' },
    { quote: 'My kids don\u2019t know it\u2019s educational. They just think the compost robots are cool. That\u2019s the whole trick, isn\u2019t it.', name: 'Dana Okafor', role: 'Parent & monthly visitor' },
    { quote: 'Access to the open sensor data let us finish a two-year wetland study in eight months.', name: 'Dr. Elena Ruiz', role: 'Independent wetland researcher' },
  ];

  function renderTestimonials() {
    const track = $('#testimonialTrack');
    const dotsWrap = $('#testimonialDots');
    if (!track) return;
    track.innerHTML = TESTIMONIALS.map((t, i) => `
      <div class="testimonial-slide ${i === 0 ? 'is-active' : ''}" data-index="${i}">
        <blockquote>&ldquo;${t.quote}&rdquo;</blockquote>
        <cite>${t.name} — ${t.role}</cite>
      </div>
    `).join('');
    dotsWrap.innerHTML = TESTIMONIALS.map((_, i) => `<button aria-label="Go to testimonial ${i + 1}" class="${i === 0 ? 'is-active' : ''}"></button>`).join('');

    let index = 0;
    let timer;
    const slides = $$('.testimonial-slide', track);
    const dots = $$('button', dotsWrap);

    function go(i) {
      index = (i + TESTIMONIALS.length) % TESTIMONIALS.length;
      slides.forEach((s, si) => s.classList.toggle('is-active', si === index));
      dots.forEach((d, di) => d.classList.toggle('is-active', di === index));
    }
    function autoplay() {
      clearInterval(timer);
      timer = setInterval(() => go(index + 1), 6000);
    }

    $('#testimonialNext').addEventListener('click', () => { go(index + 1); autoplay(); });
    $('#testimonialPrev').addEventListener('click', () => { go(index - 1); autoplay(); });
    dots.forEach((d, i) => d.addEventListener('click', () => { go(i); autoplay(); }));

    autoplay();
  }

  /* -----------------------------------------------------------------
     18. FAQ accordion
  ----------------------------------------------------------------- */
  const FAQS = [
    { q: 'Is entry to OnePark free?', a: 'Yes — general admission is free, every day, sunrise to sunset. A handful of ticketed programs (guided ecology walks, the observation-tower sunrise tour) help fund the research campus directly.' },
    { q: 'How do I get there without a car?', a: 'The Riverbend transit line stops at Meridian, a two-minute walk from the main entrance. Bike parking and a rentable electric-bike dock are available at every entrance.' },
    { q: 'Can I bring my dog?', a: 'Leashed dogs are welcome on the Nature Trails and Lake path. To protect nesting wildlife, the Botanical Gardens and wetland boardwalks are pet-free.' },
    { q: 'How do school field trips work?', a: 'Teachers can apply through the Education Centre for a guided or self-directed visit. Most units are built around a specific curriculum standard — watershed health, pollinator biology, or renewable systems.' },
    { q: 'Can researchers access the sensor data?', a: 'Yes. The Open Field Station program grants free access to the live sensor mesh and historical datasets for approved independent and academic research.' },
    { q: 'Is the park accessible?', a: 'All twelve zones are connected by a fully paved, step-free trail. Adaptive bikes and all-terrain wheelchairs are available to borrow, free of charge, at the Education Centre.' },
  ];

  function renderFAQ() {
    const wrap = $('#accordion');
    if (!wrap) return;
    wrap.innerHTML = FAQS.map((f, i) => `
      <div class="accordion__item" data-index="${i}">
        <button class="accordion__trigger" aria-expanded="false" aria-controls="faq-panel-${i}" id="faq-trigger-${i}">
          <span>${f.q}</span>
          <span class="accordion__icon" aria-hidden="true"></span>
        </button>
        <div class="accordion__panel" id="faq-panel-${i}" role="region" aria-labelledby="faq-trigger-${i}">
          <div class="accordion__panel-inner">${f.a}</div>
        </div>
      </div>
    `).join('');

    $$('.accordion__trigger', wrap).forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion__item');
        const panel = $('.accordion__panel', item);
        const isOpen = item.classList.contains('is-open');

        // close others
        $$('.accordion__item', wrap).forEach(other => {
          other.classList.remove('is-open');
          $('.accordion__trigger', other).setAttribute('aria-expanded', 'false');
          $('.accordion__panel', other).style.maxHeight = null;
        });

        if (!isOpen) {
          item.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }

  /* -----------------------------------------------------------------
     18b. Live environmental dashboard (simulated telemetry)
  ----------------------------------------------------------------- */
  function initDashboard() {
    const solarEl = $('#dashSolar');
    const waterEl = $('#dashWater');
    const airEl = $('#dashAir');
    const sightingList = $('#sightingList');
    if (!solarEl) return;

    const canvases = {
      solar: $('#chartSolar')?.getContext('2d'),
      water: $('#chartWater')?.getContext('2d'),
      air: $('#chartAir')?.getContext('2d'),
    };
    const series = { solar: [], water: [], air: [] };
    const SPECIES = ['Wood Duck', 'Monarch Butterfly', 'Barn Owl', 'Brook Trout', 'Eastern Hedgehog', 'Great Blue Heron', 'Painted Turtle', 'Red-Tailed Hawk'];
    const ZONE_NAMES = ZONES.map(z => z.name);

    function sample() {
      const hour = new Date().getHours() + new Date().getMinutes() / 60;
      // Solar follows a rough daylight curve, peaking at 13:00
      const daylight = Math.max(0, Math.sin(((hour - 6) / 12) * Math.PI));
      const solar = clamp(daylight * 38 + (Math.random() - 0.5) * 2, 0, 38);
      const water = 78 + Math.sin(hour / 5) * 6 + (Math.random() - 0.5) * 1.5;
      const air = 22 + Math.random() * 10;

      series.solar.push(solar); series.water.push(water); series.air.push(air);
      Object.values(series).forEach(arr => { if (arr.length > 40) arr.shift(); });

      solarEl.textContent = solar.toFixed(1) + ' MW';
      waterEl.textContent = water.toFixed(0) + '%';
      airEl.textContent = air.toFixed(0) + ' AQI';

      drawSpark(canvases.solar, series.solar, '#10B981');
      drawSpark(canvases.water, series.water, '#7DD8F0');
      drawSpark(canvases.air, series.air, '#C6F135');
    }

    function drawSpark(ctx, data, color) {
      if (!ctx || data.length < 2) return;
      const canvas = ctx.canvas;
      const w = canvas.width = canvas.offsetWidth * devicePixelRatio;
      const h = canvas.height = canvas.offsetHeight * devicePixelRatio;
      const max = Math.max(...data), min = Math.min(...data);
      const range = (max - min) || 1;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath();
      data.forEach((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h * 0.8) - h * 0.1;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * devicePixelRatio;
      ctx.lineJoin = 'round';
      ctx.stroke();
      // soft fill under the line
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, color + '33'); grad.addColorStop(1, color + '00');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function addSighting() {
      const species = SPECIES[Math.floor(Math.random() * SPECIES.length)];
      const zone = ZONE_NAMES[Math.floor(Math.random() * ZONE_NAMES.length)];
      const li = document.createElement('li');
      li.innerHTML = `<strong>${species}</strong> · ${zone}<span>${timeAgoLabel()}</span>`;
      sightingList.prepend(li);
      while (sightingList.children.length > 4) sightingList.removeChild(sightingList.lastChild);
    }
    function timeAgoLabel() { return 'now'; }

    sample();
    addSighting(); addSighting();
    setInterval(sample, 2600);
    setInterval(addSighting, 5200);
  }

  /* -----------------------------------------------------------------
     18c. Seasonal preview switcher
  ----------------------------------------------------------------- */
  function initSeasonSwitch() {
    const buttons = $$('.season-switch button');
    if (!buttons.length) return;
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        document.body.setAttribute('data-season', btn.dataset.season);
        showToast(`Previewing ${btn.dataset.season} accents.`);
      });
    });
  }

  /* -----------------------------------------------------------------
     18d. Ambient soundscape (synthesized, no external audio files)
  ----------------------------------------------------------------- */
  function initAmbientSound() {
    const toggle = $('#ambientToggle');
    if (!toggle) return;
    let ctx, nodes, playing = false;

    function build() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const masterGain = ctx.createGain();
      masterGain.gain.value = 0.0001;
      masterGain.connect(ctx.destination);

      // Filtered noise -> wind/leaves bed
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer; noise.loop = true;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass'; noiseFilter.frequency.value = 700; noiseFilter.Q.value = 0.6;
      const noiseGain = ctx.createGain(); noiseGain.gain.value = 0.5;
      noise.connect(noiseFilter).connect(noiseGain).connect(masterGain);

      // Slow LFO on filter frequency for a "wind gust" feel
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 260;
      lfo.connect(lfoGain).connect(noiseFilter.frequency);

      // Soft low drone for calm
      const drone = ctx.createOscillator();
      drone.type = 'sine'; drone.frequency.value = 96;
      const droneGain = ctx.createGain(); droneGain.gain.value = 0.06;
      drone.connect(droneGain).connect(masterGain);

      noise.start(); lfo.start(); drone.start();
      nodes = { masterGain, noise, lfo, drone };
    }

    toggle.addEventListener('click', () => {
      if (!ctx) build();
      if (ctx.state === 'suspended') ctx.resume();

      playing = !playing;
      toggle.setAttribute('aria-pressed', String(playing));
      toggle.setAttribute('aria-label', playing ? 'Pause ambient park soundscape' : 'Play ambient park soundscape');
      const now = ctx.currentTime;
      nodes.masterGain.gain.cancelScheduledValues(now);
      nodes.masterGain.gain.linearRampToValueAtTime(playing ? 0.16 : 0.0001, now + 1.1);
    });
  }

  /* -----------------------------------------------------------------
     18e. Global impact — 3D rotating globe (Three.js)
  ----------------------------------------------------------------- */
  const PARTNER_CITIES = [
    { lat: 51.9, lon: 4.5 },   // Rotterdam
    { lat: -1.3, lon: 36.8 },  // Nairobi
    { lat: 35.1, lon: 129.0 }, // Busan
    { lat: 6.2, lon: -75.6 },  // Medellín
    { lat: 40.4, lon: -3.7 },  // Madrid (illustrative partner)
    { lat: -33.9, lon: 151.2 } // Sydney (illustrative partner)
  ];

  function initGlobe() {
    const canvas = $('#globeCanvas');
    if (!canvas || typeof THREE === 'undefined') return;
    if (prefersReducedMotionMQ.matches) { drawStaticGlobeFallback(canvas); return; }

    const wrap = canvas.parentElement;
    const size = () => Math.min(wrap.clientWidth, wrap.clientHeight) || 420;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(size(), size());

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 6.2;

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Wireframe sphere (the "land")
    const isDark = html.classList.contains('dark');
    const wireColor = isDark ? 0x34D399 : 0x10B981;
    const sphereGeo = new THREE.IcosahedronGeometry(2.2, 3);
    const wireMat = new THREE.MeshBasicMaterial({ color: wireColor, wireframe: true, transparent: true, opacity: 0.35 });
    globeGroup.add(new THREE.Mesh(sphereGeo, wireMat));

    // Soft inner sphere for depth
    const innerMat = new THREE.MeshBasicMaterial({ color: isDark ? 0x081A13 : 0xF6F5EF, transparent: true, opacity: 0.9 });
    globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(2.15, 32, 32), innerMat));

    // Partner city markers
    function latLonToVec3(lat, lon, r) {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    }
    const markerGeo = new THREE.SphereGeometry(0.045, 12, 12);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xC6F135 });
    PARTNER_CITIES.forEach(c => {
      const marker = new THREE.Mesh(markerGeo, markerMat);
      const pos = latLonToVec3(c.lat, c.lon, 2.25);
      marker.position.copy(pos);
      globeGroup.add(marker);
    });

    // Drag-to-rotate interaction
    let isDragging = false, lastX = 0, lastY = 0, velX = 0.0016, velY = 0;
    canvas.addEventListener('pointerdown', e => { isDragging = true; lastX = e.clientX; lastY = e.clientY; });
    window.addEventListener('pointerup', () => isDragging = false);
    window.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      globeGroup.rotation.y += dx * 0.006;
      globeGroup.rotation.x = clamp(globeGroup.rotation.x + dy * 0.006, -1, 1);
      velX = dx * 0.0006;
      lastX = e.clientX; lastY = e.clientY;
    });

    function resize() {
      const s = size();
      renderer.setSize(s, s);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    function animate() {
      if (!isDragging) globeGroup.rotation.y += velX;
      velX = lerp(velX, 0.0016, 0.02);
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate();
  }

  function drawStaticGlobeFallback(canvas) {
    const ctx = canvas.getContext('2d');
    const size = canvas.parentElement.clientWidth || 420;
    canvas.width = size; canvas.height = size;
    ctx.strokeStyle = '#10B981'; ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(size / 2, size / 2, size / 2 - 10, (size / 2 - 10) * Math.abs(Math.cos((i / 8) * Math.PI)), 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.3;
      ctx.stroke();
    }
  }

  /* -----------------------------------------------------------------
     18f. Scroll-spy side rail
  ----------------------------------------------------------------- */
  function initSideRail() {
    const list = $('#sideRailList');
    if (!list) return;
    const sections = [
      { id: 'hero', label: 'Home' },
      { id: 'about', label: 'About' },
      { id: 'sustainability', label: 'Systems' },
      { id: 'map', label: 'Map' },
      { id: 'dashboard', label: 'Live data' },
      { id: 'timeline', label: 'Timeline' },
      { id: 'ecosystem', label: 'Ecosystem' },
      { id: 'innovation', label: 'Innovation' },
      { id: 'impact', label: 'Global' },
      { id: 'community', label: 'Community' },
      { id: 'gallery', label: 'Gallery' },
      { id: 'contact', label: 'Visit' },
    ].filter(s => document.getElementById(s.id));

    list.innerHTML = sections.map(s => `
      <li data-id="${s.id}">
        <a href="#${s.id}" aria-label="Go to ${s.label}">
          <span class="rail-label">${s.label}</span>
          <span class="rail-dot"></span>
        </a>
      </li>
    `).join('');

    const items = $$('li', list);
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const li = items.find(i => i.dataset.id === entry.target.id);
        if (!li) return;
        if (entry.isIntersecting) {
          items.forEach(i => i.classList.remove('is-active'));
          li.classList.add('is-active');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    sections.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el); });
  }

  /* -----------------------------------------------------------------
     19. Forms: newsletter + validation + toast + confetti
  ----------------------------------------------------------------- */
  function initForms() {
    const form = $('#newsletterForm');
    const emailInput = $('#nlEmail');
    const emailError = $('#nlEmailError');

    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

    form?.addEventListener('submit', e => {
      e.preventDefault();
      if (!validEmail(emailInput.value)) {
        emailError.textContent = 'Enter a valid email address.';
        emailInput.setAttribute('aria-invalid', 'true');
        emailInput.focus();
        return;
      }
      emailError.textContent = '';
      emailInput.removeAttribute('aria-invalid');
      showToast('Welcome aboard — check your inbox to confirm.', 'success');
      launchConfetti();
      form.reset();
    });

    const footerForm = $('#footerMiniForm');
    footerForm?.addEventListener('submit', e => {
      e.preventDefault();
      const input = footerForm.querySelector('input');
      if (!validEmail(input.value)) { showToast('That email doesn\u2019t look quite right.'); return; }
      showToast('You\u2019re on the list.', 'success');
      footerForm.reset();
    });
  }

  function showToast(msg, type = '') {
    const stack = $('#toastStack');
    const toast = document.createElement('div');
    toast.className = `toast ${type ? 'toast--' + type : ''}`;
    toast.textContent = msg;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('is-leaving');
      setTimeout(() => toast.remove(), 320);
    }, 3600);
  }

  function launchConfetti() {
    if (prefersReducedMotionMQ.matches) return;
    const colors = ['#10B981', '#C6F135', '#7DD8F0', '#34D399'];
    for (let i = 0; i < 26; i++) {
      const piece = document.createElement('div');
      const size = Math.random() * 6 + 4;
      Object.assign(piece.style, {
        position: 'fixed', zIndex: 4000, top: '20%', left: (45 + Math.random() * 10) + '%',
        width: size + 'px', height: size + 'px', background: colors[i % colors.length],
        borderRadius: Math.random() > 0.5 ? '50%' : '2px', pointerEvents: 'none',
        transform: `rotate(${Math.random() * 360}deg)`
      });
      document.body.appendChild(piece);
      const dx = (Math.random() - 0.5) * 400;
      const dy = Math.random() * 500 + 200;
      const rot = Math.random() * 720 - 360;
      piece.animate([
        { transform: piece.style.transform, opacity: 1 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 1400 + Math.random() * 600, easing: 'cubic-bezier(.2,.6,.3,1)' })
        .onfinish = () => piece.remove();
    }
  }

  /* -----------------------------------------------------------------
     20. Back to top
  ----------------------------------------------------------------- */
  function initBackToTop() {
    const btn = $('#backToTop');
    window.addEventListener('scroll', () => {
      btn.classList.toggle('is-visible', window.scrollY > 900);
      btn.hidden = window.scrollY <= 900 ? false : false;
    }, { passive: true });
    btn.hidden = false;
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: prefersReducedMotionMQ.matches ? 'auto' : 'smooth' }));
  }

  /* -----------------------------------------------------------------
     21. Offline detection
  ----------------------------------------------------------------- */
  function initOffline() {
    const banner = $('#offlineBanner');
    function update() { banner.hidden = navigator.onLine; }
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }

  /* -----------------------------------------------------------------
     22. Keyboard shortcuts panel
  ----------------------------------------------------------------- */
  function initShortcuts() {
    const panel = $('#shortcutsPanel');
    let gPressed = false;

    document.addEventListener('keydown', e => {
      if (isTyping(e.target)) return;
      if (e.key === '?') { panel.hidden = !panel.hidden; }
      if (e.key.toLowerCase() === 't') { $('#themeToggle')?.click(); }
      if (e.key.toLowerCase() === 'a') { $('#ambientToggle')?.click(); }
      if (e.key.toLowerCase() === 'g') { gPressed = true; setTimeout(() => gPressed = false, 600); }
      else if (gPressed && e.key.toLowerCase() === 'm') { document.getElementById('map')?.scrollIntoView({ behavior: 'smooth' }); }
      if (e.key === 'Escape') { panel.hidden = true; }
    });
  }

  /* -----------------------------------------------------------------
     23. Play film button (demo toast — no real video asset)
  ----------------------------------------------------------------- */
  function initPlayFilm() {
    $('#playFilm')?.addEventListener('click', () => {
      showToast('The park film is loading in a new experience…');
    });
  }

  /* -----------------------------------------------------------------
     24. Footer year
  ----------------------------------------------------------------- */
  function initYear() {
    const el = $('#yearNow');
    if (el) el.textContent = new Date().getFullYear();
  }

  /* -----------------------------------------------------------------
     Boot sequence
  ----------------------------------------------------------------- */
  function boot() {
    ThemeModule.init();
    A11yModule.init();
    initLoader();
    initCursor();
    initMagnetic();
    initNav();
    initScrollProgress();
    initHeroContours();
    initHeroCanvas();
    initWeather();
    renderSystems();
    renderMap();
    initCounters();
    initDashboard();
    initSeasonSwitch();
    initAmbientSound();
    initTimeline();
    renderEcosystem();
    renderGallery();
    initGlobe();
    initSideRail();
    renderTestimonials();
    renderFAQ();
    initForms();
    initBackToTop();
    initOffline();
    initShortcuts();
    initPlayFilm();
    initYear();
    initReveal(); // run last so late-added elements are captured
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
