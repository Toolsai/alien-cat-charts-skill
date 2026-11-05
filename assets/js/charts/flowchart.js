/* flowchart — data: {start, nodes:[{id,type:start|step|decision|end,text,note?,next | yes,no,yesLabel?,noLabel?}], mascot?}
   Auto-layout: ranks (longest path, back-edges ignored) x lanes. Horizontal when <=5 ranks and wide, else vertical. */
Journey.register('flowchart', function (ctx) {
  const d = ctx.data, nodes = d.nodes, byId = {};
  nodes.forEach((n, i) => { n.type = n.type || (n.yes ? 'decision' : i === 0 ? 'start' : !n.next ? 'end' : 'step'); byId[n.id] = n; });
  const outs = n => n.type === 'decision' ? [{ to: n.yes, k: 'yes', label: n.yesLabel || '是' }, { to: n.no, k: 'no', label: n.noLabel || '否' }] : n.next ? [{ to: n.next, k: 'next' }] : [];
  const st = {}, back = new Set(), post = [];
  (function dfs(id) { st[id] = 1; outs(byId[id]).forEach(e => { if (st[e.to] === 1) back.add(id + '>' + e.to); else if (!st[e.to]) dfs(e.to); }); st[id] = 2; post.push(id); })(d.start);
  const topo = post.slice().reverse(), rank = {}; topo.forEach(id => (rank[id] = 0));
  topo.forEach(id => outs(byId[id]).forEach(e => { if (!back.has(id + '>' + e.to)) rank[e.to] = Math.max(rank[e.to], rank[id] + 1); }));
  topo.sort((a, b) => rank[a] - rank[b]);
  const lane = {}, occ = {}, pref = {}; pref[d.start] = 0;
  topo.forEach(id => {
    const p = pref[id] == null ? 0 : pref[id]; let l = p;
    for (const o of [0, 1, -1, 2, -2, 3, -3]) if (!occ[rank[id] + ',' + (p + o)]) { l = p + o; break; }
    lane[id] = l; occ[rank[id] + ',' + l] = 1;
    const n = byId[id];
    if (n.type === 'decision') { if (pref[n.yes] == null) pref[n.yes] = l; if (pref[n.no] == null && !back.has(id + '>' + n.no)) pref[n.no] = l + 1; }
    else if (n.next && pref[n.next] == null) pref[n.next] = l;
  });
  const minL = Math.min(...topo.map(i => lane[i])); topo.forEach(i => (lane[i] -= minL));
  const maxR = Math.max(...topo.map(i => rank[i])), maxL = Math.max(...topo.map(i => lane[i]));
  const hasBack = back.size > 0;

  const stage = ctx.stage, svg = Kit.s('svg', { class: 'fc-svg' }); stage.appendChild(svg);
  const defs = Kit.s('defs'); [['fca', '#cfc9ff'], ['fch', '#ffd93b']].forEach(([id, c]) => { const m = Kit.s('marker', { id: id + '-' + ctx.index, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 5.5, markerHeight: 5.5, orient: 'auto-start-reverse', markerUnits: 'strokeWidth' }); m.appendChild(Kit.s('path', { class: 'arrow', d: 'M0 0 L10 5 L0 10z', fill: c })); defs.appendChild(m); }); svg.appendChild(defs);
  const num = {}; topo.forEach((id, i) => (num[id] = i + 1));
  const els = {};
  topo.forEach(id => {
    const n = byId[id], e = Kit.h('div', 'fc-node ' + n.type, { tabindex: 0, role: 'button', 'aria-label': n.text });
    e.appendChild(Kit.h('span', 'fc-badge', null, [n.type === 'decision' ? '？' : String(num[id])]));
    e.appendChild(Kit.fb('fc-text', n.text, { min: 10, max: 17 }));
    const go = () => { if (running) return; show(id, false); };
    e.addEventListener('click', go); e.addEventListener('keydown', ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } });
    stage.appendChild(e); els[id] = e;
  });
  const edges = [];
  topo.forEach(id => outs(byId[id]).forEach(o => {
    const path = Kit.s('path', { 'marker-end': `url(#fca-${ctx.index})` }); svg.appendChild(path);
    const ed = { from: id, to: o.to, k: o.k, path, back: back.has(id + '>' + o.to) };
    if (o.k !== 'next') {
      ed.chip = Kit.h('button', 'fc-label ' + (o.k === 'no' ? 'no' : ''), { type: 'button', title: o.label }, [o.label]);
      ed.chip.addEventListener('click', e => { e.stopPropagation(); choice[id] = o.k; refreshChips(); ctx.say((byId[id].text || '') + ' → ' + o.label); });
      stage.appendChild(ed.chip);
    }
    edges.push(ed);
  }));
  const tok = Kit.h('div', 'fc-tok'); tok.appendChild(Kit.sprite(ctx.mascot)); tok.style.display = 'none'; stage.appendChild(tok);

  let box = {}, cur = null, running = false, alt = false, steps = 0, moveT = null; const choice = {}, done = new Set();
  const pick = id => choice[id] || (alt ? 'no' : 'yes');
  function refreshChips() { edges.forEach(e => { if (e.chip) e.chip.classList.toggle('chosen', pick(e.from) === e.k); }); }
  function layout(narrow, W) {
    const horiz = !narrow && maxR + 1 <= 5, nR = maxR + 1, nL = maxL + 1;
    let H;
    if (horiz) {
      H = 440; const padX = 16, padY = 26, back = hasBack ? 34 : 0, cw = (W - 2 * padX) / nR, rh = (H - 2 * padY - back) / nL;
      const w = Math.min(190, cw - 46), h = Math.min(104, rh - 38);
      topo.forEach(id => (box[id] = { cx: padX + cw * (rank[id] + .5), cy: padY + rh * (lane[id] + .5), w, h }));
    } else {
      const padX = 12, padY = 24, rowH = narrow ? 100 : 98, rightPad = hasBack ? 30 : 0, colW = (W - 2 * padX - rightPad) / nL;
      const w = Math.min(260, colW - (narrow ? 22 : 34)), h = narrow ? 70 : 74;
      H = padY * 2 + rowH * nR;
      topo.forEach(id => (box[id] = { cx: padX + colW * (lane[id] + .5), cy: padY + rowH * (rank[id] + .5), w, h }));
    }
    ctx.height(H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    topo.forEach(id => { const b = box[id], e = els[id]; Object.assign(e.style, { left: b.cx - b.w / 2 + 'px', top: b.cy - b.h / 2 + 'px', width: b.w + 'px', height: b.h + 'px' }); });
    const bottomMost = Math.max(...topo.map(i => box[i].cy + box[i].h / 2)), rightMost = Math.max(...topo.map(i => box[i].cx + box[i].w / 2));
    let bk = 0;
    edges.forEach(ed => {
      const A = box[ed.from], B = box[ed.to], dec = byId[ed.from].type === 'decision';
      const L = o => ({ l: o.cx - o.w / 2, r: o.cx + o.w / 2, t: o.cy - o.h / 2, b: o.cy + o.h / 2 });
      const a = L(A), b = L(B); let p;
      if (horiz) {
        if (ed.back) { const y = bottomMost + 12 + 6 * bk++; p = `M${A.cx - 14} ${a.b} V${y} H${B.cx + 18} V${b.b}`; }
        else if (lane[ed.from] === lane[ed.to]) p = `M${a.r} ${A.cy} H${b.l}`;
        else if (rank[ed.from] === rank[ed.to]) p = `M${A.cx} ${lane[ed.to] > lane[ed.from] ? a.b : a.t} V${lane[ed.to] > lane[ed.from] ? b.t : b.b}`;
        else if (dec) p = `M${A.cx} ${lane[ed.to] > lane[ed.from] ? a.b : a.t} V${B.cy} H${b.l}`;
        else p = `M${a.r} ${A.cy} H${B.cx} V${lane[ed.to] > lane[ed.from] ? b.t : b.b}`;
      } else {
        if (ed.back) { const x = rightMost + 14 + 6 * bk++; p = `M${a.r} ${A.cy + 14} H${x} V${B.cy + 14} H${b.r}`; }
        else if (lane[ed.from] === lane[ed.to]) p = `M${A.cx} ${a.b} V${b.t}`;
        else if (rank[ed.from] === rank[ed.to]) p = `M${lane[ed.to] > lane[ed.from] ? a.r : a.l} ${A.cy} H${lane[ed.to] > lane[ed.from] ? b.l : b.r}`;
        else if (dec) p = `M${lane[ed.to] > lane[ed.from] ? a.r : a.l} ${A.cy} H${B.cx} V${b.t}`;
        else p = `M${A.cx} ${a.b} V${B.cy} H${lane[ed.to] > lane[ed.from] ? b.l : b.r}`;
      }
      ed.path.setAttribute('d', p); ed.pts = null;
      if (ed.chip) { const len = ed.path.getTotalLength(), pt = ed.path.getPointAtLength(Math.min(len * .5, 34)); ed.chip.style.left = pt.x + 'px'; ed.chip.style.top = pt.y + 'px'; }
    });
    refreshChips();
    if (cur) placeTok(cur);
  }
  function placeTok(id) { const b = box[id]; if (!b) return; tok.style.display = ''; tok.style.left = b.cx - 23 + 'px'; tok.style.top = b.cy - b.h / 2 - 34 + 'px'; }
  function show(id, animate) {
    if (!box[id]) return Promise.resolve();
    done.add(cur); cur = id;
    Object.keys(els).forEach(k => { els[k].classList.toggle('active', k === id); els[k].classList.toggle('done', done.has(k) && k !== id); });
    edges.forEach(e => { const hot = e.from === id; e.path.classList.toggle('hot', hot); e.path.setAttribute('marker-end', `url(#${hot ? 'fch' : 'fca'}-${ctx.index})`); });
    const n = byId[id]; ctx.say((n.type === 'decision' ? '❓ ' : n.type === 'end' ? '🏁 ' : '📍 ') + (n.note || n.text));
    ctx.enable('next', n.type !== 'end'); ctx.enable('play', n.type !== 'end');
    refreshChips(); placeTok(id); return Promise.resolve();
  }
  function walk(ed) { // token travels along the edge, then the node lights up
    return new Promise(res => {
      const pts = Kit.samplePath(ed.path, 28), tot = Kit.polyLen(pts);
      if (moveT) moveT.cancel();
      tok.style.display = '';
      moveT = Kit.tween(650, t => { const p = Kit.polyAt(pts, tot * t); tok.style.left = p.x - 23 + 'px'; tok.style.top = p.y - 34 + 'px'; });
      moveT.done.then(() => { show(ed.to, true); res(); });
    });
  }
  async function step() {
    if (!cur) { show(d.start); return; }
    const n = byId[cur]; if (n.type === 'end') return;
    const ed = edges.find(e => e.from === cur && (n.type !== 'decision' || e.k === pick(cur)));
    if (ed) { steps++; await walk(ed); }
  }
  async function play() {
    if (running) { running = false; ctx.label('play', '▶ 播放'); return; }
    running = true; ctx.label('play', '⏸ 暫停'); steps = 0;
    if (cur && byId[cur].type === 'end') reset();
    if (!cur) { show(d.start); await Kit.sleep(900); }
    while (running && byId[cur].type !== 'end' && steps < 24) { await step(); await Kit.sleep(900); }
    running = false; ctx.label('play', '▶ 播放');
  }
  function reset() { running = false; cur = null; done.clear(); tok.style.display = 'none'; Object.values(els).forEach(e => e.classList.remove('active', 'done')); edges.forEach(e => { e.path.classList.remove('hot'); e.path.setAttribute('marker-end', `url(#fca-${ctx.index})`); }); ctx.label('play', '▶ 播放'); ctx.enable('next', true); ctx.enable('play', true); ctx.say(d.intro || '按「播放」或「下一步」，跟住小角色行過每一步；遇到「？」可以㩒是／否選路線。'); placeTok(d.start); tok.style.display = 'none'; }
  ctx.setButtons([
    { id: 'play', label: '▶ 播放', cls: 'mint', on: play },
    { id: 'next', label: '⏭ 下一步', on: () => { if (!running) step(); } },
    { id: 'alt', label: '🔀 走「是」', cls: 'pink', on: () => { alt = !alt; ctx.label('alt', alt ? '🔀 走「否」' : '🔀 走「是」'); refreshChips(); ctx.say(alt ? '之後遇到「？」會行「否」路線。' : '之後遇到「？」會行「是」路線。'); } },
    { id: 'reset', label: '↺ 重來', cls: 'blue', on: reset }
  ]);
  reset();
  return { layout };
});
