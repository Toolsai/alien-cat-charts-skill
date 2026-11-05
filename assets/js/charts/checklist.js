/* checklist — data: {items:[{text, detail?, icon?}], intro?, done?}   3-8 tasks; rocket flies as you tick them. */
Journey.register('checklist', function (ctx) {
  const d = ctx.data, I = d.items, n = I.length, stage = ctx.stage;
  const root = Kit.h('div', 'ck'); stage.appendChild(root);
  const bar = Kit.h('div', 'ck-bar'), fill = Kit.h('div', 'ck-fill'), rocket = Kit.h('div', 'ck-rocket'), pct = Kit.fb('ck-pct', '0%', { min: 11, max: 16, nowrap: true });
  rocket.appendChild(Kit.sprite('ufo_pink')); bar.append(fill, rocket, pct); root.appendChild(bar);
  const list = Kit.h('div', 'ck-list'); root.appendChild(list);
  const state = new Array(n).fill(false);
  const rows = I.map((it, i) => {
    const r = Kit.h('div', 'card ck-item', { role: 'checkbox', 'aria-checked': 'false', tabindex: 0 });
    r.append(Kit.h('div', 'ck-box', null, ['']), Kit.h('div', 'ck-ic', null, [it.icon || '📌']), Kit.fb('ck-txt', it.text, { min: 11, max: 17, left: true }));
    r.addEventListener('click', () => toggle(i)); r.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); toggle(i); } });
    list.appendChild(r); return r;
  });
  const cheer = Kit.sprite('cat_cheer', 'ck-cheer'); const conf = Kit.h('div', 'ck-conf'); stage.append(cheer, conf);
  function paint() {
    const k = state.filter(Boolean).length, p = k / n;
    rows.forEach((r, i) => { r.classList.toggle('done', state[i]); r.setAttribute('aria-checked', state[i]); r.firstChild.textContent = state[i] ? '✓' : ''; });
    fill.style.width = p * 100 + '%'; rocket.style.left = Math.max(4, p * 100) + '%'; Kit.setText(pct, Math.round(p * 100) + '%');
    cheer.classList.toggle('show', k === n); ctx.enable('next', k < n); ctx.enable('all', k < n);
    if (k === n) { confetti(); }
    return k;
  }
  function confetti() { conf.textContent = ''; const r = Kit.rng(9); for (let i = 0; i < 28; i++) conf.appendChild(Kit.h('i', '', { style: `left:${r() * 100}%;background:${['#ffd93b', '#ff5fa8', '#5ef0c8', '#59d7ff'][i % 4]};animation-delay:${r() * .6}s;border-radius:${r() < .5 ? '50%' : '2px'}` })); setTimeout(() => (conf.textContent = ''), 2400); }
  function toggle(i) { state[i] = !state[i]; const k = paint(); ctx.say(state[i] ? `✅ ${I[i].text}${I[i].detail ? ' —— ' + I[i].detail : ''}` : `⬜ 取消：${I[i].text}`); if (k === n) ctx.say('🎉 ' + (d.done || '全部完成！你已經走完呢份清單。')); }
  ctx.setButtons([
    { id: 'next', label: '✅ 完成下一項', cls: 'mint', on: () => { const i = state.indexOf(false); if (i >= 0) toggle(i); } },
    { id: 'all', label: '☑ 全部完成', cls: 'pink', on: () => { state.fill(true); paint(); ctx.say('🎉 ' + (d.done || '全部完成！')); } },
    { id: 'reset', label: '↺ 重置', cls: 'blue', on: () => { state.fill(false); paint(); ctx.say(d.intro || '逐項㩒一下，將完成嘅任務剔起，火箭就會飛得越遠。'); } }
  ]);
  paint(); ctx.say(d.intro || '逐項㩒一下，將完成嘅任務剔起，火箭就會飛得越遠。');
  return { layout(narrow) {
    const rh = narrow ? 64 : 52, gap = 8, top = 42 + 10 + 14; list.style.gridTemplateRows = `repeat(${n},${rh}px)`; list.style.gap = gap + 'px'; list.style.marginTop = '14px';
    ctx.height(top + n * (rh + gap) + 6); cheer.style.height = narrow ? '70px' : '92px';
  } };
});
