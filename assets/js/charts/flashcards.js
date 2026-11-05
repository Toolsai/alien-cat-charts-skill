/* flashcards — data: {cards:[{front, back, icon?}], intro?}   3-10 cards; tap card to flip. */
Journey.register('flashcards', function (ctx) {
  const d = ctx.data, C = d.cards, n = C.length, stage = ctx.stage;
  const root = Kit.h('div', 'fl'); stage.appendChild(root);
  const count = Kit.fb('chip fl-count', '', { min: 11, max: 14, nowrap: true }); stage.appendChild(count);
  const card = Kit.h('div', 'fl-card', { role: 'button', tabindex: 0, 'aria-label': 'flip card' }), inner = Kit.h('div', 'fl-in');
  const mk = (cls) => { const f = Kit.h('div', 'card fl-face ' + cls); const ic = Kit.h('div', 'ic'), t = Kit.fb('', '', { min: 13, max: cls === 'back' ? 24 : 34 }); f.append(ic, t); return { f, ic, t }; };
  const F = mk('front'), B = mk('back'); inner.append(F.f, B.f); card.appendChild(inner); root.appendChild(card);
  const hint = Kit.fb('fl-hint', '👆 點擊卡片翻面', { min: 11, max: 14 }); hint.style.width = '240px'; root.appendChild(hint);
  const peekL = Kit.sprite(Kit.fixSprite(d.peek) || 'alien_green', 'fl-peek'), peekR = Kit.sprite('space_dog', 'fl-peek'); peekL.style.left = '0'; peekR.style.right = '0'; peekR.style.transform = 'scaleX(-1)'; stage.append(peekL, peekR);
  let cur = 0, flip = false;
  function show(i, say) {
    cur = Kit.clamp(i, 0, n - 1); flip = false; card.classList.remove('flip');
    F.ic.textContent = C[cur].icon || '💡'; B.ic.textContent = '✨'; Kit.setText(F.t, C[cur].front); Kit.setText(B.t, C[cur].back); Kit.setText(count, `🃏 ${cur + 1} / ${n}`);
    ctx.enable('prev', cur > 0); ctx.enable('next', cur < n - 1); if (say !== false) ctx.say(`🃏 ${cur + 1}/${n}：${C[cur].front}（㩒卡片睇答案）`);
    Kit.fitAll(card);
  }
  function doFlip() { flip = !flip; card.classList.toggle('flip', flip); ctx.say(flip ? `✨ ${C[cur].front} → ${C[cur].back}` : `🃏 ${C[cur].front}`); }
  card.addEventListener('click', doFlip); card.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); doFlip(); } });
  ctx.setButtons([
    { id: 'prev', label: '⏮ 上一張', on: () => show(cur - 1) },
    { id: 'flip', label: '🔄 翻面', cls: 'mint', on: doFlip },
    { id: 'next', label: '⏭ 下一張', on: () => show(cur + 1) },
    { id: 'reset', label: '↺ 由頭', cls: 'blue', on: () => show(0) }
  ]);
  show(0, false); ctx.say(d.intro || '㩒卡片翻面，睇睇背面嘅答案。');
  return { layout(narrow, W) {
    const cw = Math.min(W - (narrow ? 8 : 40), 640), ch = narrow ? 270 : 290; ctx.height(narrow ? 400 : 440);
    card.style.width = cw + 'px'; card.style.height = ch + 'px'; card.style.marginTop = '40px';
    peekL.style.width = peekR.style.width = narrow ? '58px' : '96px'; Kit.fitAll(card);
  } };
});
