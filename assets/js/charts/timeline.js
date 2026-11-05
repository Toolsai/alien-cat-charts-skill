/* timeline — data: {events:[{when,icon?,title,text}]}   3-8 events. Cards alternate above/below the axis (desktop) or stack (narrow). */
Journey.register('timeline', function (ctx) {
  const ev = ctx.data.events, n = ev.length, stage = ctx.stage;
  const axis = Kit.h('div', 'tl-axis'); stage.appendChild(axis);
  const cards = [], dots = [], stems = [];
  ev.forEach((e, i) => {
    const stem = Kit.h('div', 'tl-stem'); stage.appendChild(stem); stems.push(stem);
    const c = Kit.h('div', 'card tl-card future', { role: 'button', tabindex: 0, 'aria-label': e.title });
    c.append(Kit.h('div', 'tl-top', null, [Kit.fb('chip tl-when', e.when, { min: 10, max: 13, nowrap: true }), Kit.fb('tl-icon', e.icon || '⭐', { min: 14, max: 22, nowrap: true })]),
      Kit.fb('tl-title', e.title, { min: 11, max: 16, left: true }), Kit.fb('tl-text', e.text || '', { min: 10, max: 14, left: true }));
    c.addEventListener('click', () => goto(i)); c.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); goto(i); } });
    stage.appendChild(c); cards.push(c);
    const dt = Kit.h('button', 'tl-dot', { type: 'button', 'aria-label': (i + 1) + '. ' + e.title }, [String(i + 1)]); dt.addEventListener('click', () => goto(i)); stage.appendChild(dt); dots.push(dt);
  });
  const ufo = Kit.h('div', 'tl-ufo'); ufo.appendChild(Kit.sprite(n % 2 ? 'ufo' : 'ufo_pink')); stage.appendChild(ufo);
  let cur = -1, pos = [], running = false, tw = null, narrowMode = false;
  function layout(narrow, W) {
    narrowMode = narrow; pos = [];
    if (!narrow) {
      const H = 440, ay = H / 2, padX = 18, slot = (W - 2 * padX) / n, cw = Math.min(236, slot * 1.9), ch = 150;
      ctx.height(H); Object.assign(axis.style, { left: padX / 2 + 'px', width: W - padX + 'px', top: ay - 2 + 'px', height: '5px', bottom: '', right: '' }); axis.classList.remove('v');
      ev.forEach((e, i) => {
        const x = padX + slot * (i + .5), up = i % 2 === 0, cx = Kit.clamp(x - cw / 2, 0, W - cw), top = up ? ay - 40 - ch - 6 : ay + 40 + 6;
        Object.assign(cards[i].style, { left: cx + 'px', top: top + 'px', width: cw + 'px', height: ch + 'px' });
        Object.assign(stems[i].style, { left: x - 2 + 'px', width: '4px', top: (up ? top + ch : ay) + 'px', height: (up ? ay - (top + ch) : top - ay) + 'px' });
        Object.assign(dots[i].style, { left: x + 'px', top: ay + 'px' }); pos.push({ x, y: ay });
      });
    } else {
      const ch = 128, gap = 16, ax = 24, top0 = 58, H = top0 + n * (ch + gap);
      ctx.height(H); Object.assign(axis.style, { left: ax - 2 + 'px', width: '5px', top: top0 - 24 + 'px', height: H - top0 + 8 + 'px' }); axis.classList.add('v');
      ev.forEach((e, i) => {
        const y = top0 + i * (ch + gap);
        Object.assign(cards[i].style, { left: ax + 34 + 'px', top: y + 'px', width: W - ax - 38 + 'px', height: ch + 'px' });
        Object.assign(stems[i].style, { left: ax + 2 + 'px', width: '34px', top: y + ch / 2 - 2 + 'px', height: '4px' });
        Object.assign(dots[i].style, { left: ax + 'px', top: y + ch / 2 + 'px' }); pos.push({ x: ax, y: y + ch / 2 });
      });
    }
    placeUfo(cur < 0 ? 0 : cur);
  }
  function placeUfo(i) { const p = pos[i]; if (!p) return; ufo.style.left = p.x + 'px'; ufo.style.top = (narrowMode ? p.y - 8 : p.y - 16) + 'px'; }
  function paint() {
    cards.forEach((c, i) => { c.classList.toggle('active', i === cur); c.classList.toggle('done', i < cur); c.classList.toggle('future', i > cur); dots[i].classList.toggle('active', i === cur); dots[i].classList.toggle('done', i < cur); });
    ctx.enable('prev', cur > 0); ctx.enable('next', cur < n - 1);
  }
  function goto(i, quiet) {
    i = Kit.clamp(i, 0, n - 1); const from = pos[Math.max(cur, 0)] || pos[0], to = pos[i]; cur = i; paint();
    if (tw) tw.cancel();
    if (from && to) tw = Kit.tween(700, t => { ufo.style.left = Kit.lerp(from.x, to.x, t) + 'px'; ufo.style.top = Kit.lerp(from.y, to.y, t) + (narrowMode ? -8 : -16) - Math.sin(t * Math.PI) * 14 + 'px'; });
    if (!quiet) ctx.say(`⭐ 第 ${i + 1}/${n} 站 · ${ev[i].when}：${ev[i].title}`);
  }
  async function play() {
    if (running) { running = false; ctx.label('play', '▶ 播放'); return; }
    running = true; ctx.label('play', '⏸ 暫停'); if (cur >= n - 1) cur = -1;
    while (running && cur < n - 1) { goto(cur + 1); await Kit.sleep(2200); }
    running = false; ctx.label('play', '▶ 播放');
  }
  ctx.setButtons([
    { id: 'prev', label: '⏮ 上一站', on: () => { running = false; goto(cur - 1); } },
    { id: 'play', label: '▶ 播放', cls: 'mint', on: play },
    { id: 'next', label: '⏭ 下一站', on: () => { running = false; goto(cur + 1); } },
    { id: 'reset', label: '↺ 重來', cls: 'blue', on: () => { running = false; cur = -1; paint(); placeUfo(0); ctx.label('play', '▶ 播放'); ctx.say(ctx.data.intro || '㩒「下一站」或「播放」，飛碟會帶你沿時間軸飛。'); ctx.enable('prev', false); } }
  ]);
  ctx.enable('prev', false); ctx.say(ctx.data.intro || '㩒「下一站」或「播放」，飛碟會帶你沿時間軸飛。');
  return { layout };
});
