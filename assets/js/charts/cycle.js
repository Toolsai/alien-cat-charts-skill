/* cycle — data: {center?:{text,char}, stages:[{title,text,icon?}], intro?}   3-8 stages. UFO orbits the ring. */
Journey.register('cycle', function (ctx) {
  const d = ctx.data, S = d.stages, n = S.length, stage = ctx.stage;
  const ring = Kit.h('div', 'cy-ring'), hub = Kit.h('div', 'cy-hub'), ufo = Kit.h('div', 'cy-ufo');
  const hubImg = Kit.sprite(Kit.fixSprite((d.center || {}).char) || ctx.mascot); hub.appendChild(hubImg); ufo.appendChild(Kit.sprite('ufo'));
  const planets = S.map((s, i) => {
    const b = Kit.h('button', 'cy-planet', { type: 'button', 'aria-label': (i + 1) + '. ' + s.title });
    const col = Kit.PLANET_COLORS[i % 8]; b.appendChild(Kit.planet(80, { c1: col[0], c2: col[1], ring: i % 4 === 1 }));
    b.append(Kit.h('span', 'ic', null, [s.icon || '🪐']), Kit.h('span', 'no', null, [String(i + 1)]));
    b.addEventListener('click', () => { running = false; ctx.label('play', '▶ 播放'); goto(i); }); return b;
  });
  const hubText = Kit.fb('', (d.center || {}).text || '', { min: 10, max: 14 }); hubText.style.cssText = 'position:absolute;left:12%;right:12%;bottom:8%;height:26%;color:#fff;font-weight:700';
  hub.appendChild(hubText);
  const card = Kit.h('div', 'card cy-card');
  const tag = Kit.fb('chip', '', { min: 10, max: 13, nowrap: true }); tag.style.cssText = 'width:130px;height:26px';
  const ttl = Kit.fb('', '', { min: 13, max: 22, left: true }), txt = Kit.fb('', '', { min: 11, max: 16, left: true }), nxt = Kit.fb('', '', { min: 10, max: 13, left: true });
  ttl.style.fontWeight = '700'; txt.style.color = '#3b3470'; nxt.style.color = '#6a63a8';
  card.append(tag, ttl, txt, nxt);
  const legend = Kit.h('div', 'cy-legend'), legs = S.map((s, i) => { const l = Kit.fb('cy-leg', (i + 1) + ' ' + (s.icon || '') + ' ' + s.title, { min: 10, max: 14, left: true }, { role: 'button', tabindex: 0 }); l.addEventListener('click', () => { running = false; goto(i); }); l.addEventListener('keydown', k => { if (k.key === 'Enter') goto(i); }); legend.appendChild(l); return l; });
  stage.append(ring, hub, ...planets, ufo, card, legend);
  let cur = 0, dir = 1, running = false, geo = null, ang = 0, tw = null;
  const angOf = i => -Math.PI / 2 + dir * i * 2 * Math.PI / n;
  function place() {
    const g = geo; if (!g) return;
    planets.forEach((p, i) => { const a = angOf(i); p.style.left = g.cx + Math.cos(a) * g.R + 'px'; p.style.top = g.cy + Math.sin(a) * g.R + 'px'; });
    setUfo(ang);
  }
  function setUfo(a) { const g = geo; ufo.style.left = g.cx + Math.cos(a) * g.R * 1.0 + 'px'; ufo.style.top = g.cy + Math.sin(a) * g.R * 1.0 - 38 + 'px'; }
  function layout(narrow, W) {
    let S0, H, cardBox, legBox;
    if (!narrow) { H = 440; S0 = Math.min(H, W * .5); const x0 = S0 + 24; cardBox = { l: x0, t: 4, w: W - x0, h: 250 }; legBox = { l: x0, t: 264, w: W - x0, h: Math.ceil(n / 2) * 36 }; }
    else { S0 = Math.min(W, 340); cardBox = { l: 0, t: S0 + 10, w: W, h: 196 }; legBox = { l: 0, t: S0 + 216, w: W, h: Math.ceil(n / 2) * 36 }; H = legBox.t + legBox.h + 6; }
    const psz = n <= 5 ? 74 : 62, R = S0 / 2 - psz / 2 - 6, cx = S0 / 2, cy = (narrow ? S0 / 2 : H / 2);
    geo = { cx, cy, R };
    ctx.height(H);
    Object.assign(ring.style, { left: cx - R + 'px', top: cy - R + 'px', width: 2 * R + 'px', height: 2 * R + 'px' });
    const hs = Math.max(90, R * 1.05); Object.assign(hub.style, { left: cx + 'px', top: cy + 'px', width: hs + 'px', height: hs + 'px' });
    planets.forEach(p => { p.style.width = p.style.height = psz + 'px'; });
    Object.assign(card.style, { left: cardBox.l + 'px', top: cardBox.t + 'px', width: cardBox.w + 'px', height: cardBox.h + 'px' });
    Object.assign(legend.style, { left: legBox.l + 'px', top: legBox.t + 'px', width: legBox.w + 'px', height: legBox.h + 'px' });
    ang = angOf(cur); place();
  }
  function paint() {
    const s = S[cur];
    planets.forEach((p, i) => p.classList.toggle('active', i === cur)); legs.forEach((l, i) => l.classList.toggle('on', i === cur));
    Kit.setText(tag, `第 ${cur + 1} / ${n} 階段`); Kit.setText(ttl, (s.icon || '') + ' ' + s.title); Kit.setText(txt, s.text || '');
    const nx = S[(cur + dir + n) % n]; Kit.setText(nxt, '➡ 下一個：' + nx.title);
    ctx.say(`🪐 ${cur + 1}/${n} ${s.title}：${s.text || ''}`);
  }
  function goto(i) {
    const from = ang; cur = ((i % n) + n) % n; const to = angOf(cur); let delta = to - from;
    // travel in the current direction
    if (dir > 0) while (delta < 0) delta += 2 * Math.PI; else while (delta > 0) delta -= 2 * Math.PI;
    if (Math.abs(delta) > 2 * Math.PI - .001) delta = 0;
    paint(); if (tw) tw.cancel();
    tw = Kit.tween(800, t => { ang = from + delta * t; setUfo(ang); }); tw.done.then(ok => { if (ok) ang = to; });
  }
  async function play() {
    if (running) { running = false; ctx.label('play', '▶ 播放'); return; }
    running = true; ctx.label('play', '⏸ 暫停');
    for (let k = 0; k < n && running; k++) { goto(cur + dir); await Kit.sleep(2200); }
    running = false; ctx.label('play', '▶ 播放');
  }
  ctx.setButtons([
    { id: 'prev', label: '⏮ 上一個', on: () => { running = false; goto(cur - dir); } },
    { id: 'play', label: '▶ 播放', cls: 'mint', on: play },
    { id: 'next', label: '⏭ 下一個', on: () => { running = false; goto(cur + dir); } },
    { id: 'dir', label: '🔄 順時針', cls: 'orange', on: () => { dir = -dir; ctx.label('dir', dir > 0 ? '🔄 順時針' : '🔄 逆時針'); ang = angOf(cur); place(); paint(); } }
  ]);
  paint();
  return { layout };
});
