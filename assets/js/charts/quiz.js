/* quiz — data: {questions:[{q, options:[2-4], answer:index, explain?}], intro?}   tap an option to reveal. */
Journey.register('quiz', function (ctx) {
  const Q = ctx.data.questions, n = Q.length, stage = ctx.stage;
  const root = Kit.h('div', 'qz'); stage.appendChild(root);
  const prog = Kit.h('div', 'qz-prog'), score = Kit.fb('chip qz-score', '', { min: 11, max: 15, nowrap: true });
  root.appendChild(Kit.h('div', 'qz-top', null, [prog, score]));
  const qbox = Kit.fb('qz-q', '', { min: 13, max: 26, left: true }); root.appendChild(qbox);
  const opts = Kit.h('div', 'qz-opts'), exp = Kit.fb('qz-exp', '', { min: 11, max: 16, left: true });
  const left = Kit.h('div', '', { style: 'display:flex;flex-direction:column;gap:10px;min-height:0;min-width:0' }, [opts, exp]); opts.style.flex = '1';
  const side = Kit.h('div', 'qz-side'); let face = Kit.sprite(ctx.mascot); side.appendChild(face);
  const body = Kit.h('div', 'qz-body', null, [left, side]); root.appendChild(body);
  const end = Kit.h('div', 'qz-end'); let eImg = Kit.sprite('cat_cheer'); const eBig = Kit.fb('big', '', { min: 16, max: 34 }), eSm = Kit.fb('sm', '', { min: 11, max: 18 }); end.append(eImg, eBig, eSm); stage.appendChild(end);
  let cur = 0, correct = 0, answered = [], narrow = false;
  const letters = 'ABCD';
  function pips() { prog.textContent = ''; Q.forEach((_, i) => prog.appendChild(Kit.h('i', i === cur && answered[i] == null ? 'now' : answered[i] == null ? '' : answered[i] ? 'ok' : 'no'))); }
  function setFace(name) { const f = Kit.sprite(name); side.replaceChild(f, face); face = f; }
  function render() {
    end.style.display = 'none'; root.style.display = ''; const q = Q[cur];
    Kit.setText(score, `⭐ ${correct} / ${n}`); pips(); Kit.setText(qbox, `Q${cur + 1}. ${q.q}`);
    opts.textContent = ''; exp.classList.remove('show'); Kit.setText(exp, '');
    q.options.forEach((o, i) => {
      const b = Kit.h('button', 'qz-opt', { type: 'button', id: 'opt-' + i }); b.append(Kit.h('span', 'mk', null, [letters[i]]), Kit.fb('', o, { min: 11, max: 19, left: true }));
      b.addEventListener('click', () => choose(i)); opts.appendChild(b);
    });
    setFace(ctx.mascot); ctx.enable('next', answered[cur] != null); ctx.enable('peek', answered[cur] == null);
    ctx.say(ctx.data.intro && cur === 0 ? ctx.data.intro : '🤔 揀一個答案，㩒落去就知對唔對！');
    Kit.fitAll(root);
  }
  function reveal(pick) {
    const q = Q[cur]; [...opts.children].forEach((b, i) => { b.disabled = true; b.classList.toggle('right', i === q.answer); b.classList.toggle('wrong', pick === i && i !== q.answer); });
    Kit.setText(exp, (pick === q.answer ? '✅ 答啱！' : pick == null ? '👀 答案：' + q.options[q.answer] + '。' : '❌ 唔啱，答案係「' + q.options[q.answer] + '」。') + ' ' + (q.explain || '')); exp.classList.add('show');
    Kit.fitAll(exp.parentNode);
  }
  function choose(i) {
    if (answered[cur] != null) return; const ok = i === Q[cur].answer; answered[cur] = ok; if (ok) correct++;
    reveal(i); pips(); Kit.setText(score, `⭐ ${correct} / ${n}`); setFace(ok ? 'cat_cheer' : 'cat_think');
    ctx.say(ok ? '🎉 答啱喇！' : '💡 唔緊要，睇睇解釋再繼續。'); ctx.enable('next', true); ctx.enable('peek', false); ctx.label('next', cur === n - 1 ? '🏁 睇結果' : '⏭ 下一題');
  }
  function next() {
    if (answered[cur] == null) return;
    if (cur >= n - 1) { root.style.display = 'none'; end.style.display = 'flex'; const pct = correct / n; Kit.setText(eBig, `全部 ${n} 題，答啱 ${correct} 題！`); Kit.setText(eSm, pct >= .75 ? '🏆 好叻呀，你已經掌握呢一站！' : pct >= .4 ? '👍 唔錯，再睇一次內容會更穩陣。' : '🌱 返去睇睇上面嘅重點，再玩一次！'); end.textContent = ''; end.append(eImg = Kit.sprite(pct >= .5 ? 'cat_cheer' : 'cat_think'), eBig, eSm); Kit.fitAll(end); ctx.say('🏁 小測驗完成：' + correct + '/' + n); ctx.enable('next', false); ctx.label('next', '⏭ 下一題'); return; }
    cur++; render(); ctx.label('next', cur === n - 1 ? '🏁 睇結果' : '⏭ 下一題');
  }
  function reset() { cur = 0; correct = 0; answered = []; end.textContent = ''; end.append(eImg = Kit.sprite('cat_cheer'), eBig, eSm); ctx.label('next', '⏭ 下一題'); render(); }
  ctx.setButtons([
    { id: 'next', label: '⏭ 下一題', cls: 'mint', on: next },
    { id: 'peek', label: '👀 睇答案', on: () => { if (answered[cur] == null) { answered[cur] = false; reveal(null); pips(); setFace('cat_think'); ctx.enable('next', true); ctx.enable('peek', false); ctx.say('👀 已經顯示答案。'); } } },
    { id: 'reset', label: '↺ 重玩', cls: 'blue', on: reset }
  ]);
  render();
  return { layout(nw, W) { narrow = nw; if (!nw) { ctx.height(440); root.style.cssText = ''; body.style.gridTemplateColumns = ''; side.style.display = ''; opts.style.gridTemplateColumns = ''; qbox.style.height = ''; }
      else { const oh = Q.reduce((m, q) => Math.max(m, q.options.length), 2); ctx.height(30 + 12 + 108 + 12 + oh * 58 + 8 + 86 + 12); body.style.gridTemplateColumns = '1fr'; side.style.display = 'none'; opts.style.gridTemplateColumns = '1fr'; qbox.style.height = '108px'; }
    Kit.fitAll(root); } };
});
