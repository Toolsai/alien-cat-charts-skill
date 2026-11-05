/* Alien Journey — animated space backgrounds (original work).
   Bg.mount(el, theme, seedIndex)   themes: starfield | cosmos | nebula | blackhole | asteroids | moonbase
   Canvas (stars, rocks, spiralling stars) + CSS clouds + inline SVG (black hole, moon base) + roaming character sprites.
   ~30 fps, pauses when the tab is hidden, static when prefers-reduced-motion. */
(function () {
  'use strict';
  const THEMES = ['starfield', 'cosmos', 'nebula', 'blackhole', 'asteroids', 'moonbase'];
  const FLOATERS = {
    starfield: [['ufo_pink', 78, 9, 70], ['space_dog', 70, 62, 95]],
    cosmos: [['ufo', 90, 14, 80], ['blob_buddy', 64, 72, 110], ['tentacle_buddy', 60, 40, 130]],
    nebula: [['ufo_pink', 80, 20, 75], ['alien_green', 52, 66, 100]],
    blackhole: [['robot_buddy', 56, 18, 120], ['ufo', 70, 74, 90]],
    asteroids: [['space_dog', 72, 12, 85], ['ufo_pink', 70, 66, 70]],
    moonbase: [['ufo', 84, 10, 75], ['cat_wave', 60, 32, 140]]
  };
  const SVGNS = 'http://www.w3.org/2000/svg';
  const S = (t, a, k) => { const e = document.createElementNS(SVGNS, t); for (const x in a || {}) e.setAttribute(x, a[x]); (k || []).forEach(c => e.appendChild(c)); return e; };
  const rng = seed => { let s = (seed >>> 0) || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };

  function blackholeSVG() {
    const svg = S('svg', { class: 'bh-svg', viewBox: '-300 -200 600 400' });
    const defs = S('defs'), rg = S('radialGradient', { id: 'bhglow' }), lg = S('linearGradient', { id: 'bhdisk', x1: 0, y1: 0, x2: 1, y2: 0 });
    [['0', '#000'], ['.55', '#000'], ['.7', '#6a2cff55'], ['1', '#00000000']].forEach(([o, c]) => rg.appendChild(S('stop', { offset: o, 'stop-color': c })));
    [['0', '#ff4fa0'], ['.35', '#ffb347'], ['.6', '#fff3a8'], ['1', '#7a4bff']].forEach(([o, c]) => lg.appendChild(S('stop', { offset: o, 'stop-color': c })));
    defs.append(rg, lg); svg.appendChild(defs);
    svg.appendChild(S('circle', { r: 190, fill: 'url(#bhglow)' }));
    const g = S('g', { transform: 'rotate(-18)' }), disk = S('g', { class: 'bh-disk-flat' });
    [[230, 52, 14, .5], [200, 44, 10, .75], [168, 36, 8, .95]].forEach(([rx, ry, sw, op]) => disk.appendChild(S('ellipse', { rx, ry, fill: 'none', stroke: 'url(#bhdisk)', 'stroke-width': sw, opacity: op, 'stroke-dasharray': '120 18 40 24', style: 'animation:march 6s linear infinite' })));
    g.appendChild(disk); svg.appendChild(g);
    svg.appendChild(S('circle', { r: 74, fill: '#000', stroke: '#ffcf70', 'stroke-width': 3, opacity: 1 }));
    svg.appendChild(S('path', { d: 'M-230 0 A230 52 0 0 0 230 0', transform: 'rotate(-18)', fill: 'none', stroke: 'url(#bhdisk)', 'stroke-width': 12, opacity: .9, 'stroke-linecap': 'round' }));
    return svg;
  }
  function moonSVG() {
    const svg = S('svg', { class: 'moon-svg', viewBox: '0 0 1200 300', preserveAspectRatio: 'xMidYMax slice' });
    svg.appendChild(S('circle', { cx: 960, cy: 70, r: 46, fill: '#59d7ff', stroke: '#17123a', 'stroke-width': 5 }));
    svg.appendChild(S('path', { d: 'M930 55 q20 -20 40 -6 q10 14 -8 24 q-24 8 -32 -18z M980 96 q16 -10 30 4 q-6 14 -24 10z', fill: '#5ef0c8' }));
    svg.appendChild(S('path', { d: 'M0 230 Q150 170 320 215 T640 205 T960 210 T1200 190 L1200 300 L0 300Z', fill: '#8a82d6', stroke: '#17123a', 'stroke-width': 5 }));
    svg.appendChild(S('path', { d: 'M0 262 Q200 225 420 255 T820 250 T1200 240 L1200 300 L0 300Z', fill: '#6c63c4', stroke: '#17123a', 'stroke-width': 5 }));
    [[170, 262, 34, 10], [530, 270, 26, 8], [880, 268, 40, 11], [1090, 262, 22, 7]].forEach(([x, y, rx, ry]) => svg.appendChild(S('ellipse', { cx: x, cy: y, rx, ry, fill: '#574fb0', stroke: '#17123a', 'stroke-width': 3 })));
    const dome = (x, y, s) => { const g = S('g', { transform: `translate(${x} ${y}) scale(${s})` }); g.appendChild(S('rect', { x: -60, y: -14, width: 120, height: 26, rx: 6, fill: '#d9d4ff', stroke: '#17123a', 'stroke-width': 5 })); g.appendChild(S('path', { d: 'M-48 -14 A48 48 0 0 1 48 -14Z', fill: '#59d7ff', stroke: '#17123a', 'stroke-width': 5, opacity: .9 })); [-30, 0, 30].forEach(wx => g.appendChild(S('rect', { x: wx - 7, y: -6, width: 14, height: 12, rx: 3, fill: '#ffd93b' }))); g.appendChild(S('path', { d: 'M0 -62 V-92 M0 -92 l16 6', stroke: '#17123a', 'stroke-width': 5, fill: 'none' })); g.appendChild(S('circle', { cx: 0, cy: -94, r: 6, fill: '#ff5fa8', stroke: '#17123a', 'stroke-width': 3 })); return g; };
    svg.append(dome(260, 222, 1), dome(760, 212, .8));
    svg.appendChild(S('path', { d: 'M1010 212 V150', stroke: '#17123a', 'stroke-width': 5 })); svg.appendChild(S('path', { d: 'M1010 150 h44 v28 h-44z', fill: '#ff5fa8', stroke: '#17123a', 'stroke-width': 4 }));
    return svg;
  }

  function mount(el, theme, seedIdx) {
    if (THEMES.indexOf(theme) < 0) theme = 'starfield';
    el.textContent = ''; el.className = 't-' + theme; el.dataset.theme = theme;
    const R = rng(1000 + (seedIdx || 0) * 77 + theme.length);
    const reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    // CSS / SVG layers
    if (theme === 'nebula') [['#ff4fa0', 46, 40, 55], ['#59d7ff', 70, 62, 45], ['#8a5cf0', 22, 70, 60], ['#5ef0c8', 80, 20, 35]].forEach(([c, x, y, s], i) => { const d = document.createElement('div'); d.className = 'cloud'; d.style.cssText = `left:${x - s / 2}%;top:${y - s / 2}%;width:${s}vw;height:${s * .8}vw;background:${c};animation-delay:${-i * 6}s`; el.appendChild(d); });
    if (theme === 'blackhole') el.appendChild(blackholeSVG());
    if (theme === 'moonbase') el.appendChild(moonSVG());
    const cv = document.createElement('canvas'); el.appendChild(cv);
    const ctx = cv.getContext('2d');
    let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const stars = [], rocks = [], shoot = { on: false, x: 0, y: 0, v: 0, life: 0 };
    const nStars = theme === 'cosmos' ? 220 : theme === 'asteroids' ? 90 : theme === 'blackhole' ? 150 : theme === 'nebula' ? 110 : 150;
    function resize() {
      W = el.clientWidth; H = el.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars.length = 0;
      for (let i = 0; i < nStars; i++) stars.push({ x: R() * W, y: R() * H, r: .5 + R() * 1.8, z: .2 + R() * .8, ph: R() * 6.28, sp: .5 + R() * 2, c: R() < .15 ? '#ffd93b' : R() < .3 ? '#5ef0c8' : '#ffffff', a: R() * 6.28, d: 40 + R() * Math.max(W, H) * .6 });
      rocks.length = 0;
      if (theme === 'asteroids') for (let i = 0; i < 16; i++) { const s = 14 + R() * 46, n = 7 + (R() * 3 | 0), pts = []; for (let k = 0; k < n; k++) { const a = k / n * 6.283, rr = s * (.75 + R() * .35); pts.push([Math.cos(a) * rr, Math.sin(a) * rr]); } rocks.push({ x: R() * W, y: R() * H, s, pts, rot: R() * 6.28, vr: (R() - .5) * .01, vx: -(.15 + R() * .5) * (s / 30), vy: .05 + R() * .2, c: ['#9a7bd6', '#c28b6a', '#7e86d6', '#b36ba1'][R() * 4 | 0], cr: [[.3, .2, .3], [-.35, -.1, .2]] }); }
    }
    function drawRock(r) {
      ctx.save(); ctx.translate(r.x, r.y); ctx.rotate(r.rot);
      ctx.beginPath(); r.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = r.c; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#17123a'; ctx.stroke();
      ctx.fillStyle = 'rgba(23,18,58,.28)'; r.cr.forEach(c => { ctx.beginPath(); ctx.arc(c[0] * r.s, c[1] * r.s, r.s * .16, 0, 6.283); ctx.fill(); });
      ctx.restore();
    }
    function drawStar(s, t) {
      const tw = .55 + .45 * Math.sin(t * s.sp + s.ph);
      ctx.globalAlpha = tw; ctx.fillStyle = s.c;
      if (s.r > 1.6) { ctx.beginPath(); const r = s.r * 2.2; ctx.moveTo(s.x, s.y - r); ctx.lineTo(s.x + r * .28, s.y - r * .28); ctx.lineTo(s.x + r, s.y); ctx.lineTo(s.x + r * .28, s.y + r * .28); ctx.lineTo(s.x, s.y + r); ctx.lineTo(s.x - r * .28, s.y + r * .28); ctx.lineTo(s.x - r, s.y); ctx.lineTo(s.x - r * .28, s.y - r * .28); ctx.closePath(); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); }
    }
    let t = 0, last = 0, raf = 0;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      if (document.hidden || now - last < 33) return; last = now; t += .033;
      ctx.clearRect(0, 0, W, H);
      if (theme === 'blackhole') {
        const cx = W * .78, cy = H * .5;
        stars.forEach(s => { s.a += .004 / Math.max(.3, s.d / 300); s.d -= .35 * s.z; if (s.d < 70) { s.d = Math.max(W, H) * .7; s.a = R() * 6.28; } s.x = cx + Math.cos(s.a) * s.d * 1.35; s.y = cy + Math.sin(s.a) * s.d * .8; drawStar(s, t); });
      } else {
        const drift = theme === 'cosmos' ? .25 : theme === 'asteroids' ? .1 : .05;
        stars.forEach(s => { s.x -= drift * s.z; if (s.x < -4) s.x = W + 4; drawStar(s, t); });
      }
      ctx.globalAlpha = 1;
      if (theme === 'cosmos') { // slow spinning galaxy
        const gx = W * .74, gy = H * .3; ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * .05); ctx.scale(1, .45);
        for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 90; i++) { const a = i * .13 + arm * 3.14, r = 6 + i * 2.1; ctx.globalAlpha = .75 * (1 - i / 95); ctx.fillStyle = i % 3 ? '#b9a4ff' : '#ff9fd0'; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2 + (1 - i / 90) * 2, 0, 6.283); ctx.fill(); }
        ctx.globalAlpha = .9; ctx.fillStyle = '#fff3a8'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 6.283); ctx.fill(); ctx.restore(); ctx.globalAlpha = 1;
      }
      if (theme === 'asteroids') rocks.forEach(r => { r.x += r.vx; r.y += r.vy; r.rot += r.vr; if (r.x < -80) { r.x = W + 80; r.y = R() * H; } if (r.y > H + 80) r.y = -80; drawRock(r); });
      if (theme === 'starfield' || theme === 'moonbase' || theme === 'nebula') { // occasional shooting star
        if (!shoot.on && R() < .006) { shoot.on = true; shoot.x = R() * W * .8 + W * .2; shoot.y = R() * H * .4; shoot.v = 9 + R() * 6; shoot.life = 1; }
        if (shoot.on) { ctx.strokeStyle = `rgba(255,255,255,${shoot.life})`; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(shoot.x, shoot.y); ctx.lineTo(shoot.x + shoot.v * 5, shoot.y - shoot.v * 2.2); ctx.stroke(); shoot.x -= shoot.v; shoot.y += shoot.v * .45; shoot.life -= .03; if (shoot.life <= 0) shoot.on = false; }
      }
    }
    resize(); window.addEventListener('resize', () => { resize(); if (reduced) frame(1e6); });
    if (reduced) { frame(1e6); cancelAnimationFrame(raf); } else raf = requestAnimationFrame(frame);
    // roaming characters (behind content; purely decorative)
    if (!reduced) (FLOATERS[theme] || []).forEach(([name, w, y, dur], i) => {
      const f = document.createElement('div'); f.className = 'floater'; f.setAttribute('aria-hidden', 'true');
      const img = new Image(); img.alt = ''; img.src = ((window.JOURNEY && JOURNEY.assets) || 'assets/') + 'sprites/' + name + '.webp'; f.appendChild(img);
      f.style.cssText = `width:${w}px;--y:${y}vh;--dy:${(R() * 16 - 8).toFixed(0)}vh;animation:${i % 2 ? 'flyL' : 'fly'} ${dur}s linear infinite;animation-delay:${-R() * dur}s`;
      el.appendChild(f);
    });
  }
  window.Bg = { mount, THEMES };
})();
