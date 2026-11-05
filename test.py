#!/usr/bin/env python3
"""Alien Journey site audit (Playwright / headless Chromium).  Exit code 0 = green.
Usage:  python3 test.py [--site demo/out] [--shots demo/shots] [--widths 1280,390]
Checks, at every width, for index + every section page:
  * 0 console errors / page errors / failed requests (Google-Fonts requests are ignored when offline)
  * Previous / Home / Next links exist (#nav-prev #nav-home #nav-next), point to the right pages, and clicking walks the whole journey and back
  * every control button is clicked (play -> pause), chart-specific clicks (options, hotspots, rows, cards, dots, planets...)
  * overflow audit after each interaction: no horizontal page scroll, every text box fits (no scroll overflow, text inside box), cards stay inside the panel
  * stress test: every text box filled with ~400 chars + a 60-char unbroken word -> still no overflow (clamp with "…" allowed)
  * ambient sound: <audio> loads, the toggle button starts it, a second click mutes it
  * screenshots: shots/<width>-<page>.png and a contact sheet shots/all.png (+ all-390.png)
Needs: pip install playwright pillow && playwright install chromium"""
import argparse, json, os, sys, time
from playwright.sync_api import sync_playwright
from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument('--site', default='demo/out'); ap.add_argument('--shots', default='demo/shots'); ap.add_argument('--widths', default='1280,390')
a = ap.parse_args()
SITE = os.path.abspath(a.site); SHOTS = os.path.abspath(a.shots); os.makedirs(SHOTS, exist_ok=True)
URL = lambda f: 'file://' + os.path.join(SITE, f)

AUDIT = """() => {
  const out = [], vw = innerWidth, tol = 1.5;
  if (document.documentElement.scrollWidth > vw + 1) out.push('page horizontal scroll: ' + document.documentElement.scrollWidth + ' > ' + vw);
  document.querySelectorAll('.fit').forEach(b => {
    const cs = getComputedStyle(b), r = b.getBoundingClientRect();
    if (r.width < 2 || r.height < 2 || cs.display === 'none' || cs.visibility === 'hidden') return;
    let hid = false; for (let e = b; e && e !== document.body; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden') { hid = true; break; } } if (hid) return;
    const ft = b.firstElementChild; if (!ft || !ft.classList.contains('ft')) return;
    const aw = b.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), ah = b.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), name = (ft.textContent || '').slice(0, 24);
    if ((b.dataset.clamped ? ft.clientWidth : ft.scrollWidth) > aw + tol) out.push('text wider than box: "' + name + '" ' + ft.scrollWidth + '>' + Math.round(aw));
    if (ft.offsetHeight > ah + tol) out.push('text taller than box: "' + name + '" ' + ft.offsetHeight + '>' + Math.round(ah));
    if (r.left < -tol || r.right > vw + tol) out.push('box outside viewport: "' + name + '"');
    if (!b.dataset.clamped) { const rg = document.createRange(); rg.selectNodeContents(ft); const rr = rg.getBoundingClientRect(); if (rr.width && (rr.left < r.left - 2 || rr.right > r.right + 2 || rr.top < r.top - 2 || rr.bottom > r.bottom + 2)) out.push('text range outside box: "' + name + '"'); }
  });
  const panel = document.querySelector('.panel');
  if (panel) { const pr = panel.getBoundingClientRect();
    panel.querySelectorAll('.stage > *, .stage .fc-node, .stage .tl-card, .stage .cy-card, .stage .qz-opt, .stage .cp-cell').forEach(e => { const r = e.getBoundingClientRect(); if (r.width < 2) return;
      if (r.left < pr.left - 14 || r.right > pr.right + 14) out.push('element outside panel: .' + (e.className + '').split(' ')[0] + ' ' + Math.round(r.left) + '-' + Math.round(r.right) + ' vs ' + Math.round(pr.left) + '-' + Math.round(pr.right)); }); }
  document.querySelectorAll('.pg small, .pg b').forEach(e => { if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).textOverflow !== 'ellipsis') out.push('pager text clipped: ' + e.textContent.slice(0, 20)); });
  return out;
}"""

report = {'site': SITE, 'widths': {}, 'failures': [], 'ignored': 0}
def fail(msg): report['failures'].append(msg); print('  FAIL', msg)

def run_width(p, W):
    H = 800 if W > 600 else 844
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required'])
    ctx = b.new_context(viewport={'width': W, 'height': H}); pg = ctx.new_page()
    errs = []
    def on_console(m):
        if m.type == 'error':
            u = (m.location or {}).get('url', '')
            if 'googleapis' in u or 'gstatic' in u: report['ignored'] += 1; return
            errs.append('console: ' + m.text)
    pg.on('console', on_console); pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('requestfailed', lambda r: (report.__setitem__('ignored', report['ignored'] + 1) if ('googleapis' in r.url or 'gstatic' in r.url) else errs.append('requestfailed: ' + r.url)))
    res = {'pages': {}}
    def load(f):
        pg.goto(URL(f)); pg.wait_for_function('window.__kitReady===true', timeout=15000); pg.wait_for_timeout(500)
    def audit(tag):
        for m in pg.evaluate(AUDIT): fail(f'[{W}] {tag}: {m}')
    def shot(name, ph=None):
        h = pg.evaluate('Math.max(document.documentElement.scrollHeight, innerHeight)')
        pg.set_viewport_size({'width': W, 'height': min(h, 3000)}); pg.wait_for_timeout(250)
        pg.screenshot(path=os.path.join(SHOTS, f'{W}-{name}.png')); pg.set_viewport_size({'width': W, 'height': H})
    load('index.html')
    J = pg.evaluate('window.JOURNEY'); secs = J['sections']; ids = [s['id'] for s in secs]; report['order'] = ids
    # ---- index
    if pg.locator('.stop').count() != len(secs): fail(f'[{W}] index: expected {len(secs)} stops')
    for nid in ('nav-prev', 'nav-home', 'nav-next'):
        if pg.locator('#' + nid).count() != 1: fail(f'[{W}] index: missing #{nid}')
    audit('index'); shot('index')
    # each stop link opens the right page
    for s in secs:
        pg.click(f'#stop-{s["id"]}'); pg.wait_for_function('window.__kitReady===true'); 
        if not pg.url.endswith(s['id'] + '.html'): fail(f'[{W}] index stop {s["id"]} opened {pg.url}')
        pg.go_back(); pg.wait_for_function('window.__kitReady===true')
    # ---- sections
    for i, s in enumerate(secs):
        sid, t = s['id'], s['chartType']; info = {'type': t, 'clicked': [], 'status_changed': False}
        print(f'[{W}] {sid} ({t})'); load(sid + '.html')
        # nav
        exp_prev = 'index.html' if i == 0 else ids[i - 1] + '.html'; exp_next = 'index.html#done' if i == len(ids) - 1 else ids[i + 1] + '.html'
        for nid, exp in (('nav-prev', exp_prev), ('nav-home', 'index.html'), ('nav-next', exp_next)):
            loc = pg.locator('#' + nid)
            if loc.count() != 1: fail(f'[{W}] {sid}: missing #{nid}'); continue
            href = loc.get_attribute('href')
            if href != exp: fail(f'[{W}] {sid}: #{nid} href {href} != {exp}')
            if not loc.is_visible(): fail(f'[{W}] {sid}: #{nid} not visible')
        if pg.locator('.dot').count() != len(ids): fail(f'[{W}] {sid}: dots count')
        if pg.locator('.intro h1').count() != 1: fail(f'[{W}] {sid}: intro missing')
        audit(sid + ' initial')
        # controls
        btns = pg.evaluate("[...document.querySelectorAll('.controls .btn')].map(b=>b.id)")
        if not btns or len(btns) > 4: fail(f'[{W}] {sid}: control buttons {btns}')
        st0 = pg.evaluate('window.__lastStatus')
        for bid in btns:
            loc = pg.locator('#' + bid)
            if bid == 'btn-play':
                loc.click(); pg.wait_for_timeout(1600); audit(f'{sid} play'); loc.click(); pg.wait_for_timeout(300)
                info['clicked'].append(bid); continue
            n = 0
            while n < 12 and loc.is_enabled():
                loc.click(); pg.wait_for_timeout(260 if t != 'flowchart' else 900); n += 1; audit(f'{sid} {bid}#{n}')
                if bid in ('btn-reset', 'btn-labels', 'btn-flip', 'btn-dir', 'btn-alt', 'btn-all', 'btn-peek') : break
            info['clicked'].append(f'{bid}x{n}')
        # chart-specific clicks
        def clicks(sel, limit=8):
            c = min(pg.locator(sel).count(), limit)
            for k in range(c):
                try:
                    el = pg.locator(sel).nth(k); el.evaluate('e => e.scrollIntoView({block: "center"})'); el.click(timeout=3000)
                except Exception as e: fail(f'[{W}] {sid}: click {sel}[{k}] failed: {str(e)[:80]}'); break
                pg.wait_for_timeout(180); audit(f'{sid} {sel}[{k}]')
            info['clicked'].append(f'{sel}x{c}')
        if t == 'quiz':
            pg.locator('#btn-reset').click(); pg.wait_for_timeout(200)
            for q in range(len(s['data']['questions'])):
                pg.locator('.qz-opt').nth(0).click(); pg.wait_for_timeout(200); audit(f'{sid} q{q}')
                if pg.locator('#btn-next').is_enabled(): pg.locator('#btn-next').click(); pg.wait_for_timeout(200)
            audit(f'{sid} end screen'); info['clicked'].append('quiz-finish')
        elif t == 'hotspots': clicks('.hs-spot')
        elif t == 'compare': pg.locator('#btn-reset').click(); clicks('.cp-row')
        elif t == 'checklist': pg.locator('#btn-reset').click(); clicks('.ck-item')
        elif t == 'flashcards': clicks('.fl-card', 3)
        elif t == 'cycle': clicks('.cy-planet')
        elif t == 'timeline': clicks('.tl-dot')
        elif t == 'comic': clicks('.cm-dots button')
        elif t == 'flowchart': clicks('.fc-node', 12); clicks('.fc-label', 6)
        # status text changed at some point?
        info['status_changed'] = pg.evaluate('window.__lastStatus') != st0
        if not info['status_changed']: fail(f'[{W}] {sid}: status line never changed')
        # sound
        a0 = pg.evaluate('({exists: !!window.__ambient, ns: window.__ambient && window.__ambient.networkState, err: window.__sound && window.__sound.error})')
        if not a0['exists']: fail(f'[{W}] {sid}: no ambient audio element')
        if i == 0:
            pg.click('#sound-btn'); pg.wait_for_timeout(1200)
            st = pg.evaluate('({paused: __ambient.paused, t: __ambient.currentTime, pressed: document.getElementById("sound-btn").getAttribute("aria-pressed"), rs: __ambient.readyState, err: __sound.error, dur: __ambient.duration})')
            info['sound_on'] = st
            if st['paused'] or st['pressed'] != 'true' or st['t'] <= 0: fail(f'[{W}] {sid}: sound did not start {st}')
            if not (st['dur'] and 2 < st['dur'] < 60): fail(f'[{W}] {sid}: audio duration odd {st["dur"]}')
            pg.click('#sound-btn'); pg.wait_for_timeout(300)
            st2 = pg.evaluate('({paused: __ambient.paused, pressed: document.getElementById("sound-btn").getAttribute("aria-pressed")})'); info['sound_off'] = st2
            if not st2['paused'] or st2['pressed'] != 'false': fail(f'[{W}] {sid}: mute failed {st2}')
            pg.click('#sound-btn'); pg.wait_for_timeout(600)   # leave it ON to test resume after navigation
        # stress
        pg.evaluate('__stress()'); pg.wait_for_timeout(200); audit(f'{sid} STRESS'); 
        pg.reload(); pg.wait_for_function('window.__kitReady===true'); pg.wait_for_timeout(500)
        shot(sid)
        res['pages'][sid] = info
    # ---- walk: index -> start -> next ... -> index -> prev back
    load('index.html'); pg.click('#start-btn'); pg.wait_for_function('window.__kitReady===true')
    for i, sid in enumerate(ids):
        if not pg.url.endswith(sid + '.html'): fail(f'[{W}] walk: expected {sid}, at {pg.url}')
        pg.click('#nav-next'); pg.wait_for_function('window.__kitReady===true'); pg.wait_for_timeout(120)
    if 'index.html' not in pg.url: fail(f'[{W}] walk: finish did not return to index ({pg.url})')
    if not pg.locator('.donebanner.show').count(): fail(f'[{W}] walk: done banner not shown')
    pg.click('#nav-prev'); pg.wait_for_function('window.__kitReady===true')
    if not pg.url.endswith(ids[-1] + '.html'): fail(f'[{W}] walk: index prev -> {pg.url}')
    for sid in reversed(ids[:-1]):
        pg.click('#nav-prev'); pg.wait_for_function('window.__kitReady===true')
        if not pg.url.endswith(sid + '.html'): fail(f'[{W}] walk back: expected {sid} at {pg.url}')
    pg.click('#nav-prev'); pg.wait_for_function('window.__kitReady===true')
    if 'index.html' not in pg.url: fail(f'[{W}] walk back: first page prev should go to index ({pg.url})')
    # keyboard + resume sound
    pg.click('#start-btn'); pg.wait_for_function('window.__kitReady===true'); pg.keyboard.press('ArrowRight'); pg.wait_for_function('window.__kitReady===true'); pg.wait_for_timeout(600)
    if not pg.url.endswith(ids[1] + '.html'): fail(f'[{W}] keyboard ArrowRight did not go next ({pg.url})')
    res['sound_after_nav'] = pg.evaluate('({on: __sound.on, playing: __sound.playing, err: __sound.error})')
    if not res['sound_after_nav']['on']: fail(f'[{W}] sound preference lost after navigation')
    if errs:
        for e in errs[:12]: fail(f'[{W}] {e}')
    res['errors'] = len(errs); b.close(); return res

with sync_playwright() as p:
    for W in [int(x) for x in a.widths.split(',')]:
        t0 = time.time(); report['widths'][str(W)] = run_width(p, W); print(f'== width {W} done in {time.time() - t0:.0f}s')

# contact sheets
def sheet(W, out):
    order = [f'{W}-{n}.png' for n in ['index'] + report.get('order', [])]; order = [f for f in order if os.path.exists(os.path.join(SHOTS, f))]
    ims = [Image.open(os.path.join(SHOTS, f)).convert('RGB') for f in order]
    if not ims: return
    cols = 3 if W > 600 else 5; tw = 700 if W > 600 else 260
    th = [int(im.height * tw / im.width) for im in ims]; rows = (len(ims) + cols - 1) // cols
    rh = [max(th[r * cols:(r + 1) * cols]) for r in range(rows)]
    S = Image.new('RGB', (cols * (tw + 10) + 10, sum(rh) + 10 * (rows + 1)), (12, 9, 41)); y = 10
    for r in range(rows):
        for c in range(cols):
            k = r * cols + c
            if k < len(ims): S.paste(ims[k].resize((tw, th[k]), Image.LANCZOS), (10 + c * (tw + 10), y))
        y += rh[r] + 10
    S.save(os.path.join(SHOTS, out)); print('contact sheet', out, S.size)
sheet(1280, 'all.png'); sheet(390, 'all-390.png')
report['ok'] = not report['failures']
json.dump(report, open(os.path.join(SHOTS, 'test-report.json'), 'w'), ensure_ascii=False, indent=1)
print('\nRESULT:', 'GREEN ✅' if report['ok'] else f'{len(report["failures"])} FAILURES ❌', f'(ignored offline font requests: {report["ignored"]})')
sys.exit(0 if report['ok'] else 1)
