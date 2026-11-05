/* Alien Journey — core kit (original work, MIT).
   Kit.*       DOM/SVG helpers, text-fit system (never overflows), tween helpers, code-drawn decorations
   Journey.*   chart registry, chart mount (stage + controls + status), page boot, index map, visited tracking
   Loaded on every page after window.JOURNEY (data) and window.PAGE_ID are defined by build_site.py. */
(function () {
  'use strict';
  const Kit = (window.Kit = {});
  const Journey = (window.Journey = { charts: {} });
  const SVGNS = 'http://www.w3.org/2000/svg';
  const J = () => window.JOURNEY;
  Kit.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- DOM helpers ---------- */
  Kit.h = function (tag, cls, attrs, kids) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (attrs) for (const k in attrs) { if (k === 'style') e.style.cssText = attrs[k]; else e.setAttribute(k, attrs[k]); }
    if (kids) [].concat(kids).forEach(c => c != null && e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
    return e;
  };
  Kit.s = function (tag, attrs, kids) {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (kids) [].concat(kids).forEach(c => c && e.appendChild(c));
    return e;
  };
  Kit.assetUrl = p => ((J() && J().assets) || 'assets/') + p;
  Kit.spriteUrl = name => Kit.assetUrl('sprites/' + name + '.webp');
  Kit.sprite = function (name, cls) {
    const i = new Image();
    i.src = Kit.spriteUrl(name); i.alt = ''; i.draggable = false; i.className = 'sprite' + (cls ? ' ' + cls : '');
    return i;
  };
  Kit.rng = function (seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  Kit.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  Kit.lerp = (a, b, t) => a + (b - a) * t;
  Kit.pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
  Kit.CAST = ['cat_wave', 'alien_green', 'blob_buddy', 'space_dog', 'tentacle_buddy', 'robot_buddy', 'cat_point', 'cat_cheer', 'cat_think'];
  Kit.fixSprite = n => (Kit.CAST.concat(['cat_head', 'ufo', 'ufo_pink']).indexOf(n) >= 0 ? n : null);

  /* ---------- TEXT FITTING ----------
     A "fit box" is any element with a CSS-defined size (flex/grid child needs min-width:0/min-height:0; .fit has it).
     Kit.text(box, str, {min,max,left,nowrap}) puts the text inside <span.ft>. Kit.fitOne chooses the largest
     font-size in [min,max] that fits; if even `min` overflows the text is line-clamped with "…" (full text in title). */
  Kit.text = function (box, str, o) {
    o = o || {};
    box.classList.add('fit');
    if (o.left) box.classList.add('left');
    if (o.min) box.dataset.min = o.min;
    if (o.max) box.dataset.max = o.max;
    if (o.nowrap) box.dataset.nowrap = '1';
    let ft = box.firstElementChild && box.firstElementChild.classList.contains('ft') ? box.firstElementChild : null;
    if (!ft) { box.textContent = ''; ft = document.createElement('span'); ft.className = 'ft'; box.appendChild(ft); }
    ft.textContent = str == null ? '' : String(str);
    return box;
  };
  Kit.fb = function (cls, str, o, attrs) { return Kit.text(Kit.h('div', cls || '', attrs), str, o); };
  Kit.fitOne = function (box) {
    const ft = box.firstElementChild;
    if (!ft || !ft.classList.contains('ft')) return;
    const cs = getComputedStyle(box);
    const aw = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (aw <= 2 || ah <= 2) return;
    const min = +box.dataset.min || 10, max = +box.dataset.max || 22;
    ft.classList.remove('clamp'); ft.style.webkitLineClamp = ''; box.removeAttribute('data-clamped'); box.removeAttribute('title');
    const fits = () => ft.offsetHeight <= ah + 0.5 && ft.scrollWidth <= aw + 0.5;
    ft.style.whiteSpace = '';
    const search = (lo, hi) => { while (hi - lo > 0.5) { const mid = (lo + hi) / 2; box.style.fontSize = mid + 'px'; if (fits()) lo = mid; else hi = mid; } box.style.fontSize = lo + 'px'; box.dataset.fs = lo; };
    if (box.dataset.nowrap) {
      ft.style.whiteSpace = 'nowrap'; box.style.fontSize = min + 'px';
      if (fits()) { box.style.fontSize = max + 'px'; if (fits()) { box.dataset.fs = max; return; } search(min, max); return; }
      ft.style.whiteSpace = '';
    }
    box.style.fontSize = max + 'px';
    if (fits()) { box.dataset.fs = max; return; }
    box.style.fontSize = min + 'px';
    if (fits()) { search(min, max); return; }
    const lh = parseFloat(getComputedStyle(ft).lineHeight) || min * 1.25;
    const lines = Math.max(1, Math.floor(ah / lh));
    ft.classList.add('clamp'); ft.style.webkitLineClamp = lines;
    for (let n = lines; n > 1 && ft.offsetHeight > ah + 0.5; n--) ft.style.webkitLineClamp = n - 1;
    box.dataset.clamped = '1'; box.dataset.fs = min; box.title = ft.textContent;
  };
  Kit.fitAll = function (root) { (root || document).querySelectorAll('.fit').forEach(Kit.fitOne); };
  Kit.setText = function (box, str) { Kit.text(box, str); Kit.fitOne(box); };

  /* ---------- timing ---------- */
  Kit.sleep = ms => new Promise(r => setTimeout(r, Kit.reduced ? Math.min(ms, 80) : ms));
  Kit.ease = { inOut: t => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), out: t => 1 - Math.pow(1 - t, 3), lin: t => t };
  Kit.tween = function (ms, fn, ease) {
    ms = Kit.reduced ? Math.min(ms, 120) : ms;
    let raf, stop = false, res;
    const done = new Promise(r => (res = r));
    const t0 = performance.now(), e = ease || Kit.ease.inOut;
    const step = now => {
      if (stop) return;
      const t = Math.min(1, (now - t0) / Math.max(1, ms));
      fn(e(t));
      if (t < 1) raf = requestAnimationFrame(step); else res(true);
    };
    raf = requestAnimationFrame(step);
    return { done, cancel() { stop = true; cancelAnimationFrame(raf); res(false); } };
  };
  Kit.samplePath = function (path, n) {
    const L = path.getTotalLength(), pts = [];
    for (let i = 0; i <= n; i++) { const p = path.getPointAtLength(L * i / n); pts.push({ x: p.x, y: p.y }); }
    return pts;
  };
  Kit.polyLen = pts => pts.reduce((a, p, i) => (i ? a + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0), 0);
  Kit.polyAt = function (pts, d) {
    let acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const seg = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
      if (acc + seg >= d || i === pts.length - 1) { const k = seg ? Math.min(1, (d - acc) / seg) : 0; return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * k, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * k }; }
      acc += seg;
    }
    return { x: pts[0].x, y: pts[0].y };
  };

  /* ---------- code-drawn decorations ---------- */
  Kit.planet = function (size, o) {
    o = o || {};
    const c1 = o.c1 || '#ff5fa8', c2 = o.c2 || '#c2307a', id = 'pg' + Math.random().toString(36).slice(2, 7);
    const svg = Kit.s('svg', { viewBox: '-60 -60 120 120', width: size, height: size });
    const defs = Kit.s('defs'); svg.appendChild(defs);
    const clip = Kit.s('clipPath', { id }); clip.appendChild(Kit.s('circle', { r: 40 })); defs.appendChild(clip);
    if (o.ring) { svg.appendChild(Kit.s('ellipse', { rx: 58, ry: 15, fill: 'none', stroke: '#17123a', 'stroke-width': 11, transform: 'rotate(-18)' })); svg.appendChild(Kit.s('ellipse', { rx: 58, ry: 15, fill: 'none', stroke: o.ringc || '#ffd93b', 'stroke-width': 5, transform: 'rotate(-18)' })); }
    svg.appendChild(Kit.s('circle', { r: 40, fill: c1, stroke: '#17123a', 'stroke-width': 5 }));
    const g = Kit.s('g', { 'clip-path': `url(#${id})` });
    g.appendChild(Kit.s('path', { d: 'M-50 10 Q0 -8 50 12 L50 50 L-50 50Z', fill: c2 }));
    g.appendChild(Kit.s('circle', { cx: -14, cy: -14, r: 8, fill: c2, opacity: .8 }));
    g.appendChild(Kit.s('circle', { cx: 15, cy: 22, r: 6, fill: '#fff', opacity: .35 }));
    svg.appendChild(g);
    if (o.ring) { const d = 'M-58 0 A58 15 0 0 0 58 0'; svg.appendChild(Kit.s('path', { d, fill: 'none', stroke: '#17123a', 'stroke-width': 11, transform: 'rotate(-18)', 'stroke-linecap': 'round' })); svg.appendChild(Kit.s('path', { d, fill: 'none', stroke: o.ringc || '#ffd93b', 'stroke-width': 5, transform: 'rotate(-18)', 'stroke-linecap': 'round' })); }
    return svg;
  };
  Kit.PLANET_COLORS = [['#ff5fa8', '#c2307a'], ['#5ef0c8', '#2fa58a'], ['#ffd93b', '#e0a000'], ['#8a5cf0', '#5a35b8'], ['#59d7ff', '#2a8ec4'], ['#ff9340', '#d4601a'], ['#a8e86a', '#5aa02a'], ['#ff7b7b', '#c23a3a']];

  /* ---------- progress memory (visited sections) ---------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  Kit.store = store;
  Journey.visited = function () { try { return JSON.parse(store.get('aj-visited-' + J().id) || '[]'); } catch (e) { return []; } };
  Journey.markVisited = function (id) { const v = Journey.visited(); if (v.indexOf(id) < 0) { v.push(id); store.set('aj-visited-' + J().id, JSON.stringify(v)); } };

  /* ---------- chart registry & mount ---------- */
  Journey.register = (type, fn) => { Journey.charts[type] = fn; };
  Journey.mountChart = function (panel, section, idx) {
    const fn = Journey.charts[section.chartType];
    if (!fn) throw new Error('Unknown chartType: ' + section.chartType);
    const mascotName = Kit.fixSprite(section.mascot) || Kit.pick(Kit.CAST, idx);
    const stage = Kit.h('div', 'stage'), controls = Kit.h('div', 'controls', { role: 'group', 'aria-label': 'chart controls' });
    const stText = Kit.fb('status', '', { min: 11, max: 18, left: true }); stText.setAttribute('aria-live', 'polite');
    const statusbar = Kit.h('div', 'statusbar', null, [Kit.sprite('cat_head'), stText]);
    panel.append(stage, controls, statusbar);
    const btn = {};
    const ctx = {
      data: section.data || {}, section, index: idx, stage, panel, mascot: mascotName, narrow: false,
      sprite: Kit.sprite,
      say(msg) { Kit.setText(stText, msg); statusbar.classList.remove('pop'); void statusbar.offsetWidth; statusbar.classList.add('pop'); window.__lastStatus = msg; },
      setButtons(list) {
        if (list.length > 4) throw new Error('at most 4 control buttons');
        controls.textContent = '';
        list.forEach(b => {
          const e = Kit.h('button', 'btn ' + (b.cls || ''), { type: 'button', id: 'btn-' + b.id });
          const lab = Kit.fb('', b.label, { min: 10, max: 17, nowrap: true }); lab.style.cssText = 'flex:1;min-width:0;height:100%'; e.appendChild(lab);
          e.addEventListener('click', () => { if (!e.disabled) b.on(); });
          controls.appendChild(e); btn[b.id] = e;
        });
        Kit.fitAll(controls);
      },
      label(id, text) { const l = btn[id].firstElementChild; Kit.text(l, text, { min: 10, max: 17, nowrap: true }); Kit.fitOne(l); },
      enable(id, on) { if (btn[id]) { btn[id].disabled = !on; btn[id].classList.toggle('off', !on); } },
      height(px) { stage.style.height = Math.round(px) + 'px'; }
    };
    const api = fn(ctx) || {};
    let lastW = -1, raf = 0;
    const run = () => {
      lastW = panel.clientWidth;
      ctx.narrow = panel.classList.toggle('narrow', lastW < 640);
      if (api.layout) api.layout(ctx.narrow, stage.clientWidth);
      Kit.fitAll(panel);
    };
    Kit.ready.then(() => {
      run(); window.__kitReady = true;
      new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { if (panel.clientWidth !== lastW) run(); }); }).observe(panel);
      if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => Kit.fitAll(panel));
    });
    Journey.chart = { ctx, api, btn };
    return ctx;
  };
  Kit.ready = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise(r => setTimeout(r, 2500))]);

  /* test hook: replace every fit box's text with ~400 chars + a 60-char unbroken word, then refit */
  window.__stress = function (root) {
    const long = '這是一段很長很長的壓力測試文字，用來確認文字永遠不會走出框外。 '.repeat(8) + ' Supercalifragilisticexpialidocious_Supercalifragilisticexpialidocious_ok';
    (root || document).querySelectorAll('.fit').forEach(b => { if (b.closest('.topbar') || b.classList.contains('tb-title') || b.clientWidth < 48) return; const ft = b.firstElementChild; if (ft && ft.classList.contains('ft')) ft.textContent = long; });
    Kit.fitAll(root || document);
  };

  /* ---------- page boot ---------- */
  Journey.boot = function () {
    const jd = J(), pid = window.PAGE_ID;
    const sections = jd.sections;
    document.documentElement.lang = jd.lang || 'zh-Hant';
    // background
    const bgEl = document.getElementById('bg');
    const idx = sections.findIndex(s => s.id === pid);
    const theme = pid === 'index' ? (jd.indexBackground || 'starfield') : (sections[idx] && sections[idx].background) || 'starfield';
    if (window.Bg) Bg.mount(bgEl, theme, idx);
    // title fit boxes (top bar)
    document.querySelectorAll('.tb-title').forEach(b => Kit.text(b, b.textContent, { min: 12, max: 18, left: true }));
    // visited dots
    const vis = Journey.visited();
    if (pid !== 'index') Journey.markVisited(pid);
    const vis2 = Journey.visited();
    document.querySelectorAll('.dot[data-id]').forEach(d => d.classList.toggle('visited', vis2.indexOf(d.dataset.id) >= 0 && d.dataset.id !== pid));
    // keyboard: left/right = previous/next page (ignored while typing / with modifiers)
    document.addEventListener('keydown', e => {
      if (e.altKey || e.ctrlKey || e.metaKey || /input|textarea|select/i.test((e.target.tagName || ''))) return;
      const id = e.key === 'ArrowLeft' ? 'nav-prev' : e.key === 'ArrowRight' ? 'nav-next' : e.key === 'Home' ? 'nav-home' : null;
      const a = id && document.getElementById(id); if (a) { e.preventDefault(); a.click(); }
    });
    if (pid === 'index') return Journey.bootIndex(vis2);
    const s = sections[idx];
    const panel = document.getElementById('chart');
    Journey.mountChart(panel, s, idx);
    Kit.ready.then(() => Kit.fitAll(document));
  };

  /* ---------- index: journey map ---------- */
  Journey.bootIndex = function (visited) {
    const map = document.querySelector('.map'), wrap = document.querySelector('.mapwrap');
    document.querySelectorAll('.stop').forEach(li => li.classList.toggle('visited', visited.indexOf(li.dataset.id) >= 0));
    if (location.hash === '#done') { const b = document.querySelector('.donebanner'); if (b) b.classList.add('show'); }
    const svg = Kit.s('svg', { class: 'mapsvg' }); wrap.insertBefore(svg, map);
    const draw = () => {
      svg.textContent = '';
      const wr = wrap.getBoundingClientRect(), pts = [...document.querySelectorAll('.stop a')].map(b => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2 - wr.left, y: r.top + r.height / 2 - wr.top }; });
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i], vertical = Math.abs(b.y - a.y) > Math.abs(b.x - a.x) * 1.5;
        const d = vertical ? `M${a.x} ${a.y} C${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}` : `M${a.x} ${a.y} C${(a.x + b.x) / 2} ${a.y - 30} ${(a.x + b.x) / 2} ${b.y + 30} ${b.x} ${b.y}`;
        svg.appendChild(Kit.s('path', { d }));
      }
    };
    Kit.ready.then(() => { draw(); window.__kitReady = true; });
    window.addEventListener('resize', () => requestAnimationFrame(draw));
  };

  document.addEventListener('DOMContentLoaded', () => { try { Journey.boot(); } catch (e) { console.error(e); } });
})();
