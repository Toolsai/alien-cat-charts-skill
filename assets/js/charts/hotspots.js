/* hotspots — data: {scene:'planet'|'moonbase'|'space', spots:[{x,y (0-100 %), icon, title, text}], intro?}   3-6 clickable hotspots. */
Journey.register('hotspots', function (ctx) {
  const d = ctx.data, SP = d.spots, n = SP.length, stage = ctx.stage;
  const scene = Kit.h('div', 'hs-scene'), info = Kit.h('div', 'card hs-info');
  const iic = Kit.h('div', 'ic', null, ['🔍']), it = Kit.fb('t', '', { min: 13, max: 20, left: true }), id_ = Kit.fb('d', '', { min: 11, max: 16, left: true });
  info.append(iic, it, id_);
  const count = Kit.fb('chip hs-count', '', { min: 11, max: 14, nowrap: true });
  const tip = Kit.h('div', 'hs-tip'); const guide = Kit.h('div', 'hs-guide'); guide.appendChild(Kit.sprite(Kit.fixSprite(d.guide) || 'robot_buddy'));
  const R = Kit.rng(5), svg = Kit.s('svg', { viewBox: '0 0 160 100', preserveAspectRatio: 'xMidYMid slice' });
  const kind = d.scene || 'planet';
  const defs = Kit.s('defs'); const g1 = Kit.s('linearGradient', { id: 'hsb', x1: 0, y1: 0, x2: 0, y2: 1 });
  (kind === 'moonbase' ? [['0', '#06061f'], ['1', '#2b2a73']] : kind === 'space' ? [['0', '#1b1060'], ['1', '#09062a']] : [['0', '#0b0830'], ['1', '#27208a']]).forEach(([o, c]) => g1.appendChild(Kit.s('stop', { offset: o, 'stop-color': c }))); defs.appendChild(g1); svg.appendChild(defs);
  svg.appendChild(Kit.s('rect', { width: 160, height: 100, fill: 'url(#hsb)' }));
  for (let i = 0; i < 40; i++) svg.appendChild(Kit.s('circle', { cx: R() * 160, cy: R() * 70, r: .3 + R() * .7, fill: '#fff', opacity: .5 + R() * .5 }));
  const ink = { stroke: '#17123a', 'stroke-width': 1.2, 'stroke-linejoin': 'round' };
  if (kind === 'planet') {
    svg.appendChild(Kit.s('ellipse', Object.assign({ cx: 80, cy: 150, rx: 150, ry: 92, fill: '#3aa7e8' }, ink)));
    [['M30 70 q14 -8 26 2 q6 10 -8 14 q-18 2 -18 -16z', '#6fd36f'], ['M90 62 q18 -10 34 4 q4 14 -14 14 q-20 -2 -20 -18z', '#6fd36f'], ['M62 88 q12 -6 24 2 q-4 10 -20 8z', '#e8c76a']].forEach(([dd, f]) => svg.appendChild(Kit.s('path', Object.assign({ d: dd, fill: f }, ink))));
    svg.appendChild(Kit.s('path', Object.assign({ d: 'M104 42 q6 -8 14 -2 q8 -2 10 4 q-2 6 -12 6 h-10z', fill: '#fff' }, ink)));
    svg.appendChild(Kit.s('path', Object.assign({ d: 'M18 40 q8 -6 14 0 q8 -2 8 4 h-22z', fill: '#fff' }, ink)));
    svg.appendChild(Kit.s('circle', Object.assign({ cx: 140, cy: 20, r: 9, fill: '#ffd93b' }, ink)));
  } else if (kind === 'moonbase') {
    svg.appendChild(Kit.s('circle', Object.assign({ cx: 128, cy: 22, r: 12, fill: '#59d7ff' }, ink)));
    svg.appendChild(Kit.s('path', Object.assign({ d: 'M0 72 Q40 58 80 70 T160 66 V100 H0Z', fill: '#8a82d6' }, ink)));
    svg.appendChild(Kit.s('path', Object.assign({ d: 'M0 88 Q50 76 100 86 T160 84 V100 H0Z', fill: '#6c63c4' }, ink)));
    [[26, 80, 8, 2.4], [104, 90, 10, 2.8], [140, 78, 6, 2]].forEach(([x, y, rx, ry]) => svg.appendChild(Kit.s('ellipse', Object.assign({ cx: x, cy: y, rx, ry, fill: '#574fb0' }, ink))));
    svg.appendChild(Kit.s('path', Object.assign({ d: 'M44 70 a16 14 0 0 1 32 0z', fill: '#59d7ff' }, ink))); svg.appendChild(Kit.s('rect', Object.assign({ x: 40, y: 69, width: 40, height: 7, rx: 2, fill: '#d9d4ff' }, ink)));
  } else {
    [[30, 30, 14, '#ff5fa8', '#c2307a'], [120, 62, 20, '#8a5cf0', '#5a35b8'], [74, 78, 9, '#5ef0c8', '#2fa58a']].forEach(([x, y, r, c1, c2]) => { svg.appendChild(Kit.s('circle', Object.assign({ cx: x, cy: y, r, fill: c1 }, ink))); svg.appendChild(Kit.s('path', { d: `M${x - r} ${y + r * .2} q${r} ${-r * .3} ${2 * r} ${r * .2} a${r} ${r} 0 0 1 ${-2 * r} 0z`, fill: c2, opacity: .85 })); });
    svg.appendChild(Kit.s('ellipse', Object.assign({ cx: 120, cy: 62, rx: 32, ry: 6, fill: 'none', stroke: '#ffd93b', 'stroke-width': 2.4, transform: 'rotate(-16 120 62)' })));
  }
  scene.appendChild(svg);
  const seen = new Set(); let cur = -1, labels = false;
  const spots = SP.map((s, i) => {
    const b = Kit.h('button', 'hs-spot', { type: 'button', title: s.title, 'aria-label': s.title, style: `left:${s.x}%;top:${s.y}%` }, [s.icon || '⭐']);
    b.addEventListener('click', () => select(i));
    b.addEventListener('mouseenter', () => showTip(i)); b.addEventListener('focus', () => showTip(i)); b.addEventListener('mouseleave', hideTip); b.addEventListener('blur', hideTip);
    scene.appendChild(b); return b;
  });
  function showTip(i) { const s = SP[i]; tip.textContent = s.title; tip.style.left = s.x + '%'; tip.style.top = s.y + '%'; tip.classList.add('show'); }
  function hideTip() { if (!labels) tip.classList.remove('show'); }
  const labs = SP.map(s => { const t = Kit.h('div', 'hs-tip', { style: `left:${s.x}%;top:${s.y}%` }, [s.title]); return t; });
  scene.append(...labs, tip, guide, count);
  function select(i) {
    cur = i; seen.add(i);
    spots.forEach((b, k) => { b.classList.toggle('on', k === i); b.classList.toggle('seen', seen.has(k) && k !== i); });
    const s = SP[i]; iic.textContent = s.icon || '⭐'; Kit.setText(it, s.title); Kit.setText(id_, s.text || '');
    guide.style.left = s.x + '%'; guide.style.top = `calc(${s.y}% - 24px)`;
    Kit.setText(count, `🔍 ${seen.size} / ${n}`); ctx.say(`${s.icon || '⭐'} ${s.title}：${s.text || ''}` + (seen.size === n ? '  🎉 全部探索完！' : ''));
  }
  function nextSpot() { for (let k = 1; k <= n; k++) { const i = (cur + k + n) % n; if (!seen.has(i) || seen.size === n) { select(i); return; } } }
  ctx.setButtons([
    { id: 'next', label: '⏭ 下一個熱點', cls: 'mint', on: nextSpot },
    { id: 'labels', label: '🏷 顯示名稱', on: () => { labels = !labels; labs.forEach(l => l.classList.toggle('show', labels)); if (labels) tip.classList.remove('show'); ctx.label('labels', labels ? '🏷 隱藏名稱' : '🏷 顯示名稱'); } },
    { id: 'reset', label: '↺ 重來', cls: 'blue', on: () => { seen.clear(); cur = -1; spots.forEach(b => b.classList.remove('on', 'seen')); iic.textContent = '🔍'; Kit.setText(it, '搵搵閃閃發光嘅圓點'); Kit.setText(id_, d.intro || '㩒任何一個圓點，睇睇入面有咩資料。'); Kit.setText(count, `🔍 0 / ${n}`); guide.style.left = '8%'; guide.style.top = '90%'; ctx.say(d.intro || '㩒任何一個圓點，睇睇入面有咩資料。'); } }
  ]);
  stage.append(scene, info);
  Kit.setText(it, '搵搵閃閃發光嘅圓點'); Kit.setText(id_, d.intro || '㩒任何一個圓點，睇睇入面有咩資料。'); Kit.setText(count, `🔍 0 / ${n}`);
  guide.style.left = '8%'; guide.style.top = '90%'; ctx.say(d.intro || '㩒任何一個圓點，睇睇入面有咩資料。');
  return { layout(narrow, W) {
    const sh = narrow ? Math.min(Math.round(W * 1.0), 380) : 300, ih = narrow ? 138 : 124;
    scene.style.height = sh + 'px'; info.style.top = sh + 10 + 'px'; info.style.height = ih + 'px'; ctx.height(sh + 10 + ih + 2);
    labs.forEach(l => (l.style.maxWidth = narrow ? '46%' : '30%'));
  } };
});
