/* compare — data: {left:{title,char?}, right:{title,char?}, rows:[{label,a,b}], verdict?, intro?}   2-6 rows revealed one by one. */
Journey.register('compare', function (ctx) {
  const d = ctx.data, R = d.rows, n = R.length, stage = ctx.stage;
  const root = Kit.h('div', 'cp'); stage.appendChild(root);
  const side = (o, cls, fb) => Kit.h('div', 'cp-side ' + cls, null, [Kit.sprite(Kit.fixSprite(o.char) || fb), Kit.fb('', (o.icon ? o.icon + ' ' : '') + o.title, { min: 13, max: 24 })]);
  root.appendChild(Kit.h('div', 'cp-head', null, [side(d.left, 'a', 'alien_green'), Kit.h('div', 'cp-vs', null, ['VS']), side(d.right, 'b', 'blob_buddy')]));
  const rows = R.map((r, i) => {
    const el = Kit.h('div', 'cp-row hidden', { role: 'button', tabindex: 0 });
    el.append(Kit.h('div', 'cp-cell a', null, [Kit.fb('', r.a, { min: 10, max: 16, left: true })]), Kit.h('div', 'cp-mid', null, [Kit.fb('', r.label, { min: 10, max: 14, nowrap: false })]), Kit.h('div', 'cp-cell b', null, [Kit.fb('', r.b, { min: 10, max: 16, left: true })]));
    el.addEventListener('click', () => toggle(i)); el.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); toggle(i); } });
    root.appendChild(el); return el;
  });
  const verdict = Kit.fb('cp-verdict hidden', d.verdict || '', { min: 11, max: 18, left: true }); verdict.style.display = d.verdict ? 'flex' : 'none'; root.appendChild(verdict);
  const shown = new Array(n).fill(false); let running = false;
  function paint(hot) {
    rows.forEach((r, i) => { r.classList.toggle('hidden', !shown[i]); r.classList.toggle('hot', i === hot); });
    verdict.classList.toggle('hidden', !shown.every(Boolean)); ctx.enable('next', !shown.every(Boolean));
  }
  function toggle(i) { shown[i] = !shown[i]; paint(shown[i] ? i : -1); ctx.say(shown[i] ? `🔎 ${R[i].label}：${d.left.title}「${R[i].a}」 vs ${d.right.title}「${R[i].b}」` : '🙈 已收埋，再㩒一次可以睇返。'); }
  function next() { const i = shown.indexOf(false); if (i < 0) return; shown[i] = true; paint(i); ctx.say(`🔎 ${R[i].label}：${d.left.title}「${R[i].a}」 vs ${d.right.title}「${R[i].b}」`); if (shown.every(Boolean) && d.verdict) ctx.say('🏁 ' + d.verdict); }
  async function play() {
    if (running) { running = false; ctx.label('play', '▶ 逐行揭曉'); return; }
    running = true; ctx.label('play', '⏸ 暫停'); if (shown.every(Boolean)) { shown.fill(false); paint(-1); }
    while (running && shown.indexOf(false) >= 0) { next(); await Kit.sleep(1900); }
    running = false; ctx.label('play', '▶ 逐行揭曉');
  }
  ctx.setButtons([
    { id: 'play', label: '▶ 逐行揭曉', cls: 'mint', on: play },
    { id: 'next', label: '⏭ 下一項', on: () => { running = false; next(); } },
    { id: 'all', label: '👁 全部顯示', cls: 'pink', on: () => { running = false; shown.fill(true); paint(-1); ctx.say(d.verdict ? '🏁 ' + d.verdict : '👁 全部顯示晒。'); } },
    { id: 'reset', label: '↺ 重置', cls: 'blue', on: () => { running = false; shown.fill(false); paint(-1); ctx.label('play', '▶ 逐行揭曉'); ctx.say(d.intro || '㩒每一行，或者按「逐行揭曉」，睇兩邊有咩唔同。'); } }
  ]);
  paint(-1); ctx.say(d.intro || '㩒每一行，或者按「逐行揭曉」，睇兩邊有咩唔同。');
  return { layout(narrow, W) {
    const head = narrow ? 92 : 104, rh = narrow ? 112 : 54, gap = 8, vh = d.verdict ? (narrow ? 64 : 52) + gap : 0;
    root.querySelector('.cp-head').style.height = head + 'px';
    rows.forEach(r => { r.style.height = rh + 'px'; r.style.gridTemplateColumns = narrow ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,1fr) 96px minmax(0,1fr)'; r.style.gridTemplateRows = narrow ? '28px minmax(0,1fr)' : '1fr';
      const [a, m, b] = r.children; if (narrow) { m.style.cssText = 'grid-column:1/3;grid-row:1'; a.style.cssText = 'grid-column:1;grid-row:2'; b.style.cssText = 'grid-column:2;grid-row:2'; } else { m.style.cssText = ''; a.style.cssText = ''; b.style.cssText = ''; } });
    verdict.style.height = (narrow ? 64 : 52) + 'px'; verdict.style.marginTop = 'auto';
    ctx.height(head + gap + n * (rh + gap) + vh + 4); } };
});
