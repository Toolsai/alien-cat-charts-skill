/* Alien Journey — ambient sound module (original work). One <audio loop> + a toggle button (#sound-btn) on every page.
   Browsers block autoplay, so sound starts OFF; the user taps "開啟宇宙聲效". The choice is remembered (localStorage)
   and, on the next page, we try to resume; if the browser refuses, the button pulses and one tap resumes.
   State is exposed on window.__sound = {on, playing, error} for tests. */
(function () {
  'use strict';
  const btn = document.getElementById('sound-btn');
  const S = (window.__sound = { on: false, playing: false, error: null });
  const store = (window.Kit && Kit.store) || { get() { return null; }, set() {} };
  const src = ((window.JOURNEY && JOURNEY.assets) || 'assets/') + 'audio/ambient.wav';
  const a = new Audio(); a.loop = true; a.preload = 'auto'; a.volume = 0.5; a.src = src; a.id = 'ambient';
  window.__ambient = a;
  const label = (on, playing) => {
    if (!btn) return;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.classList.toggle('nudge', on && !playing);
    btn.textContent = !on ? '🔇 開啟宇宙聲效' : playing ? '🔊 聲效開' : '🔈 點擊繼續';
    btn.title = !on ? 'Turn on ambient UFO sound' : 'Mute ambient sound';
  };
  const sync = () => { S.playing = !a.paused; label(S.on, S.playing); };
  a.addEventListener('playing', sync); a.addEventListener('pause', sync);
  a.addEventListener('error', () => { S.error = 'audio load error'; });
  const play = () => a.play().then(() => { S.error = null; sync(); }).catch(e => { S.error = String(e && e.name); sync(); });
  const t0 = parseFloat(store.get('aj-sound-t') || '0');
  a.addEventListener('loadedmetadata', () => { if (t0 > 0 && a.duration) { try { a.currentTime = t0 % a.duration; } catch (e) {} } });
  setInterval(() => { if (!a.paused) store.set('aj-sound-t', String(a.currentTime)); }, 1000);
  window.addEventListener('pagehide', () => { if (!a.paused) store.set('aj-sound-t', String(a.currentTime)); });
  if (btn) btn.addEventListener('click', () => {
    if (!S.on || !S.playing) { S.on = true; store.set('aj-sound', 'on'); play(); }   // turn on, or resume after a page change
    else { S.on = false; store.set('aj-sound', 'off'); a.pause(); sync(); }           // mute
    label(S.on, S.playing);
  });
  S.on = store.get('aj-sound') === 'on';
  label(S.on, false);
  if (S.on) play();   // may be refused after navigation -> button pulses, one tap resumes
})();
