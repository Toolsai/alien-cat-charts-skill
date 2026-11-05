/* comic — data: {panels:[{title?, scene?:starfield|cosmos|nebula|blackhole|asteroids|moonbase, char?, char2?, speaker?:1|2, say, caption?}]}  3-6 panels */
Journey.register('comic', function (ctx) {
  const P = ctx.data.panels, n = P.length, stage = ctx.stage;
  const wrap = Kit.h('div', 'cm-wrap'), dots = Kit.h('div', 'cm-dots');
  stage.append(wrap, dots);
  let cur = 0, running = false, narrow = false, W = 700, panelEl = null, dir = 'r';
  const SC = { starfield: ['#352c9c', '#150f45'], cosmos: ['#271c70', '#090624'], nebula: ['#7a2f9c', '#241060'], blackhole: ['#2a1050', '#05020f'], asteroids: ['#4a3082', '#2a1c52'], moonbase: ['#12124a', '#4b4aa8'] };
  function sceneBg(name, i) {
    const c = SC[name] || SC.starfield, bg = Kit.h('div', 'cm-bg'); bg.style.background = `linear-gradient(180deg,${c[0]},${c[1]})`;
    const r = Kit.rng(31 + i * 17);
    for (let k = 0; k < 22; k++) { const s = 2 + r() * 4; bg.appendChild(Kit.h('i', '', { style: `position:absolute;left:${r() * 100}%;top:${r() * 100}%;width:${s}px;height:${s}px;border-radius:50%;background:${r() < .3 ? '#ffd93b' : '#fff'};opacity:${.4 + r() * .6};animation:twinkle ${2 + r() * 3}s ease-in-out ${r() * 3}s infinite` })); }
    const pl = Kit.PLANET_COLORS[(i + 2) % 8], pe = Kit.h('div', '', { style: 'position:absolute;right:-4%;bottom:12%;width:22%;aspect-ratio:1;animation:drift 9s ease-in-out infinite' }); const sv = Kit.planet(100, { c1: pl[0], c2: pl[1], ring: i % 2 === 0 }); sv.setAttribute('width', '100%'); sv.setAttribute('height', '100%'); pe.appendChild(sv); bg.appendChild(pe);
    if (name === 'moonbase') bg.appendChild(Kit.h('div', '', { style: 'position:absolute;left:-5%;right:-5%;bottom:-8%;height:22%;background:#8a82d6;border-top:5px solid #17123a;border-radius:50% 50% 0 0' }));
    if (name === 'blackhole') bg.appendChild(Kit.h('div', '', { style: 'position:absolute;left:8%;top:30%;width:26%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,#000 38%,#ff9340 46%,#6a2cff 60%,transparent 70%);animation:spin 14s linear infinite' }));
    return bg;
  }
  function build(i, anim) {
    const p = P[i], el = Kit.h('div', 'cm-panel' + (anim ? ' in-' + dir : '')); el.appendChild(sceneBg(p.scene || ctx.section.background, i));
    const pw = el.clientWidth;
    const c1 = Kit.fixSprite(p.char) || Kit.pick(Kit.CAST, i), c2 = p.char2 ? Kit.fixSprite(p.char2) : null, two = !!c2;
    const T = (cls, txt, o, st) => { const b = Kit.fb(cls, txt, o); b.style.cssText += st; el.appendChild(b); return b; };
    T('cm-title', p.title || ctx.section.title, { min: 11, max: 20, left: true }, '');
    T('chip cm-num', `${i + 1}/${n}`, { min: 11, max: 15, nowrap: true }, '');
    const ch = (name, st) => { const im = Kit.sprite(name, 'cm-char'); im.style.cssText = st; el.appendChild(im); return im; };
    const sp2 = p.speaker === 2 && two;
    if (!narrow) {
      ch(c1, 'left:2%;bottom:3%;height:66%;max-width:26%'); if (two) ch(c2, 'right:2%;bottom:3%;height:66%;max-width:26%;transform:scaleX(-1)');
      const bl = two ? 31 : 33, bw = two ? 38 : 63;
      T('cm-bubble', p.say, { min: 12, max: 24 }, `left:${bl}%;top:19%;width:${bw}%;height:${p.caption ? 38 : 50}%`);
      const tail = Kit.h('div', 'cm-tail', { style: `left:${sp2 ? bl + bw - 6 : bl + 3}%;top:${p.caption ? 55 : 66}%;transform:rotate(${sp2 ? 45 : 135}deg)` }); tail.style.top = `calc(${19 + (p.caption ? 38 : 50)}% - 18px)`; tail.style.transform = `rotate(45deg)`; if (!sp2) { tail.style.left = bl + 2 + '%'; } el.appendChild(tail);
      if (p.caption) T('cm-cap', p.caption, { min: 11, max: 17, left: true }, `left:${two ? 31 : 33}%;right:3%;bottom:5%;height:22%;${two ? 'right:' + 31 + '%;' : ''}`);
    } else {
      ch(c1, 'left:2%;bottom:2%;height:36%;max-width:44%'); if (two) ch(c2, 'right:2%;bottom:2%;height:36%;max-width:44%;transform:scaleX(-1)');
      T('cm-bubble', p.say, { min: 12, max: 22 }, `left:4%;right:4%;top:17%;height:${p.caption ? 30 : 38}%`);
      const tail = Kit.h('div', 'cm-tail', { style: `left:${sp2 ? 72 : 22}%;top:calc(${17 + (p.caption ? 30 : 38)}% - 18px);transform:rotate(45deg)` }); el.appendChild(tail);
      if (p.caption) T('cm-cap', p.caption, { min: 11, max: 16, left: true }, 'left:4%;right:4%;top:50%;height:12%');
    }
    return el;
  }
  function size() { const w = Math.min(W, 780); return narrow ? { w: W, h: Math.round(W * 1.28) } : { w, h: Math.round(w * .52) }; }
  function render(anim) {
    const s = size(); wrap.textContent = ''; ctx.height(s.h + 48);
    panelEl = build(cur, anim); panelEl.style.width = s.w + 'px'; panelEl.style.height = s.h + 'px'; wrap.appendChild(panelEl); Kit.fitAll(panelEl);
    dots.querySelectorAll('button').forEach((b, i) => b.classList.toggle('on', i === cur));
    ctx.enable('prev', cur > 0); ctx.enable('next', cur < n - 1);
    ctx.say(`📖 第 ${cur + 1}/${n} 格：${P[cur].caption || P[cur].say}`);
    requestAnimationFrame(() => Kit.fitAll(panelEl));
  }
  for (let i = 0; i < n; i++) { const b = Kit.h('button', '', { type: 'button', 'aria-label': '第 ' + (i + 1) + ' 格' }); b.addEventListener('click', () => { dir = i >= cur ? 'r' : 'l'; cur = i; render(true); }); dots.appendChild(b); }
  const go = (i) => { dir = i >= cur ? 'r' : 'l'; cur = Kit.clamp(i, 0, n - 1); render(true); };
  async function play() {
    if (running) { running = false; ctx.label('play', '▶ 自動播放'); return; }
    running = true; ctx.label('play', '⏸ 暫停'); if (cur >= n - 1) go(0);
    while (running && cur < n - 1) { await Kit.sleep(2800); if (!running) break; go(cur + 1); }
    running = false; ctx.label('play', '▶ 自動播放');
  }
  ctx.setButtons([
    { id: 'prev', label: '⏮ 上一格', on: () => { running = false; go(cur - 1); } },
    { id: 'next', label: '⏭ 下一格', on: () => { running = false; go(cur + 1); } },
    { id: 'play', label: '▶ 自動播放', cls: 'mint', on: play },
    { id: 'reset', label: '↺ 由頭睇', cls: 'blue', on: () => { running = false; ctx.label('play', '▶ 自動播放'); go(0); } }
  ]);
  return { layout(nw, w) { narrow = nw; W = w; render(false); } };
});
