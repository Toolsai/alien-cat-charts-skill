#!/usr/bin/env python3
"""Alien Journey site builder.
   journey.json  +  kit (assets/ templates/)   ->   out/index.html + out/<section-id>.html + out/assets/*
Usage:
  python3 scripts/build_site.py [--journey src/journey.json] [--out out] [--zip out.zip] [--strict]
Every page gets static <a> navigation (上一頁 / 目錄 / 下一頁) wired from the section order, so it works with no JS.
Needs: pillow (PNG -> WebP).  Output is plain static files: open out/index.html directly, or `python3 -m http.server`."""
import argparse, html, io, json, os, re, shutil, sys, zipfile
from PIL import Image

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(KIT, *a)
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600&family=Noto+Sans+TC:wght@400;500;700;900&display=swap" rel="stylesheet">')
TYPES = {  # chartType -> (zh label, en label, min items, max items, list key)
    'flowchart': ('流程圖', 'Flowchart', 3, 14, 'nodes'), 'timeline': ('時間軸', 'Timeline', 3, 8, 'events'),
    'comic': ('漫畫故事', 'Comic', 3, 6, 'panels'), 'cycle': ('循環圖', 'Cycle', 3, 8, 'stages'),
    'quiz': ('小測驗', 'Quiz', 2, 6, 'questions'), 'compare': ('對比卡', 'Compare', 2, 6, 'rows'),
    'hotspots': ('熱點地圖', 'Hotspots', 3, 6, 'spots'), 'checklist': ('任務清單', 'Checklist', 3, 8, 'items'),
    'flashcards': ('翻翻卡', 'Flashcards', 3, 10, 'cards')}
BACKGROUNDS = ['starfield', 'cosmos', 'nebula', 'blackhole', 'asteroids', 'moonbase']
SPRITES = ['cat_wave', 'cat_point', 'cat_cheer', 'cat_think', 'cat_head', 'alien_green', 'blob_buddy', 'tentacle_buddy', 'space_dog', 'robot_buddy', 'ufo', 'ufo_pink']
esc = lambda s: html.escape(str(s), quote=True)

def validate(j):
    errs, warns = [], []
    for k in ('id', 'title', 'sections'):
        if not j.get(k): errs.append(f'journey.{k} is required')
    ids = set()
    for i, s in enumerate(j.get('sections', [])):
        w = f'section[{i}] ({s.get("id", "?")})'
        sid = s.get('id', '')
        if not re.fullmatch(r'[a-z0-9][a-z0-9-]*', sid or ''): errs.append(f'{w}: id must be lowercase letters/digits/dashes')
        if sid == 'index': errs.append(f'{w}: id "index" is reserved')
        if sid in ids: errs.append(f'{w}: duplicate id')
        ids.add(sid)
        for k in ('title', 'summary', 'chartType', 'data'):
            if not s.get(k): errs.append(f'{w}: "{k}" is required')
        t = s.get('chartType')
        if t not in TYPES: errs.append(f'{w}: unknown chartType "{t}" (use: {", ".join(TYPES)})'); continue
        if s.get('background') and s['background'] not in BACKGROUNDS: errs.append(f'{w}: unknown background "{s["background"]}" (use: {", ".join(BACKGROUNDS)})')
        if s.get('mascot') and s['mascot'] not in SPRITES: errs.append(f'{w}: unknown mascot "{s["mascot"]}"')
        if len(s.get('title', '')) > 28: warns.append(f'{w}: title is long ({len(s["title"])} chars; aim <= 22)')
        if len(s.get('summary', '')) > 140: warns.append(f'{w}: summary is long ({len(s["summary"])} chars; aim <= 110)')
        if len(s.get('points', [])) > 4: warns.append(f'{w}: more than 4 points')
        d, (zh, en, lo, hi, key) = s.get('data') or {}, TYPES[t]
        items = d.get(key)
        if not isinstance(items, list): errs.append(f'{w}: data.{key} must be a list'); continue
        if not lo <= len(items) <= hi: errs.append(f'{w}: {t} needs {lo}-{hi} {key}, got {len(items)}')
        if t == 'flowchart':
            nodes = {n.get('id'): n for n in items}
            if d.get('start') not in nodes: errs.append(f'{w}: data.start must be a node id')
            for n in items:
                for ref in ('next', 'yes', 'no'):
                    if n.get(ref) and n[ref] not in nodes: errs.append(f'{w}: node {n.get("id")}.{ref} -> unknown id {n[ref]}')
                if n.get('type') == 'decision' and not (n.get('yes') and n.get('no')): errs.append(f'{w}: decision {n.get("id")} needs yes and no')
                if n.get('type') in ('step', 'start') and not n.get('next'): errs.append(f'{w}: node {n.get("id")} needs next')
                if len(n.get('text', '')) > 40: warns.append(f'{w}: node {n.get("id")} text > 40 chars')
        if t == 'quiz':
            for q in items:
                if not (isinstance(q.get('options'), list) and 2 <= len(q['options']) <= 4): errs.append(f'{w}: each question needs 2-4 options')
                elif not isinstance(q.get('answer'), int) or not 0 <= q['answer'] < len(q['options']): errs.append(f'{w}: answer must be an option index')
        if t == 'compare':
            for k in ('left', 'right'):
                if not (d.get(k) or {}).get('title'): errs.append(f'{w}: data.{k}.title required')
        if t == 'hotspots':
            for sp in items:
                if not all(isinstance(sp.get(c), (int, float)) and 0 <= sp[c] <= 100 for c in ('x', 'y')): errs.append(f'{w}: each spot needs x,y in 0-100')
    return errs, warns

def to_webp(src):
    b = io.BytesIO(); Image.open(src).convert('RGBA').save(b, 'WEBP', quality=86, method=4); return b.getvalue()

def pager(secs, i):
    n = len(secs)
    if i == 0: prev = ('index.html', '上一頁', '回到目錄 · Map')
    else: prev = (secs[i - 1]['id'] + '.html', '上一頁', secs[i - 1]['title'])
    if i == n - 1: nxt = ('index.html#done', '完成 🎉', '回到目錄 · Finish')
    else: nxt = (secs[i + 1]['id'] + '.html', '下一頁', secs[i + 1]['title'])
    a = lambda cls, idd, h, b, sm, arrow_l='', arrow_r='': f'<a class="pg {cls}" id="{idd}" href="{esc(h)}"><b>{arrow_l}{esc(b)}{arrow_r}</b><small>{esc(sm)}</small></a>'
    return ('  <nav class="pager" aria-label="頁面導航 / page navigation">\n    '
            + a('prev', 'nav-prev', prev[0], prev[1], prev[2], '◀ ') + '\n    '
            + '<a class="pg home" id="nav-home" href="index.html"><b>🏠 目錄</b><small>Map</small></a>\n    '
            + a('next', 'nav-next', nxt[0], nxt[1], nxt[2], '', ' ▶') + '\n  </nav>')

CUR = ' aria-current="page"'
def dots(secs, cur):
    return ''.join(f'<a class="dot{" current" if s["id"] == cur else ""}" data-id="{esc(s["id"])}" href="{esc(s["id"])}.html" title="{i + 1}. {esc(s["title"])}" aria-label="{i + 1}. {esc(s["title"])}"{CUR if s["id"] == cur else ""}></a>' for i, s in enumerate(secs))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--journey', default=P('src', 'journey.json')); ap.add_argument('--out', default=P('out'))
    ap.add_argument('--zip'); ap.add_argument('--strict', action='store_true', help='treat warnings as errors')
    a = ap.parse_args()
    j = json.load(open(a.journey, encoding='utf-8'))
    errs, warns = validate(j)
    for w in warns: print('WARN ', w)
    for e in errs: print('ERROR', e)
    if errs or (a.strict and warns): sys.exit(1)
    secs = j['sections']
    out = os.path.abspath(a.out)
    if os.path.isdir(out): shutil.rmtree(out)
    os.makedirs(os.path.join(out, 'assets', 'sprites')); os.makedirs(os.path.join(out, 'assets', 'audio'))
    # Keep licence notices with the downloadable site and ZIP.
    shutil.copy(P('LICENSE'), os.path.join(out, 'LICENSE'))
    # shared assets
    shutil.copy(P('assets', 'css', 'journey.css'), os.path.join(out, 'assets', 'journey.css'))
    order = ['core.js', 'bg.js'] + sorted('charts/' + f for f in os.listdir(P('assets', 'js', 'charts')) if f.endswith('.js')) + ['audio.js']
    open(os.path.join(out, 'assets', 'journey.js'), 'w', encoding='utf-8').write('\n'.join(f'/* ===== {f} ===== */\n' + open(P('assets', 'js', f), encoding='utf-8').read() for f in order))
    for n in SPRITES:
        open(os.path.join(out, 'assets', 'sprites', n + '.webp'), 'wb').write(to_webp(P('assets', 'sprites', n + '.png')))
    audio = P('assets', 'audio', 'ambient.wav')
    if os.path.exists(audio): shutil.copy(audio, os.path.join(out, 'assets', 'audio', 'ambient.wav'))
    # journey data for the browser (ordered; nav info included)
    jd = dict(j); jd['assets'] = 'assets/'; jd['sections'] = [dict(s, index=i) for i, s in enumerate(secs)]
    jd_json = json.dumps(jd, ensure_ascii=False).replace('</', '<\\/')
    tpl = open(P('templates', 'page.html'), encoding='utf-8').read()
    def render(page_id, body_class, doc_title, main, pg, desc):
        h = tpl
        for k, v in dict(lang=j.get('lang', 'zh-Hant'), doc_title=esc(doc_title), desc=esc(desc), fonts=FONTS, body_class=body_class, page_id=page_id,
                         journey_title=esc(j['title']), dots=dots(secs, page_id), main=main, pager=pg, journey_json=jd_json, page_id_json=json.dumps(page_id)).items():
            h = h.replace('{{' + k + '}}', v)
        return h
    # index
    cast = j.get('cast') or ['cat_wave', 'alien_green', 'space_dog']
    src = j.get('source') or {}
    srcline = ''
    if src: srcline = f'<p class="src">📖 來源 Source：' + (f'<a href="{esc(src["url"])}" target="_blank" rel="noopener">{esc(src.get("title", src["url"]))}</a>' if src.get('url') else esc(src.get('title', ''))) + (f' · {esc(src["license"])}' if src.get('license') else '') + '</p>'
    stops = []
    for i, s in enumerate(secs):
        zh, en = TYPES[s['chartType']][:2]
        sp = (s.get('mascot') if s.get('mascot') in SPRITES else None) or ['cat_wave', 'alien_green', 'blob_buddy', 'space_dog', 'tentacle_buddy', 'robot_buddy', 'cat_point', 'cat_cheer', 'cat_think'][i % 9]
        stops.append(f'<li class="stop" data-id="{esc(s["id"])}"><a href="{esc(s["id"])}.html" id="stop-{esc(s["id"])}"><span class="badge">{i + 1}</span><span class="bgtag">{esc(s.get("background", "starfield"))}</span>'
                     f'<h3>{esc(s.get("icon", ""))} {esc(s["title"])}</h3><span class="type">{zh} · {en}</span><p>{esc(s["summary"])}</p><img class="sp" src="assets/sprites/{sp}.webp" alt=""></a></li>')
    imain = f'''  <section class="hero"><div><h1>{esc(j['title'])}</h1><p>{esc(j.get('subtitle', ''))}</p>{srcline}
    <div class="cta"><a class="chipbtn" id="start-btn" href="{esc(secs[0]['id'])}.html">🚀 開始旅程 · Start</a><span class="src">共 {len(secs)} 站 · ← → 鍵可以翻頁 · 右上角可開啟宇宙聲效</span></div></div>
    <div class="cast">{''.join(f'<img src="assets/sprites/{c}.webp" alt="">' for c in cast[:3])}</div></section>
  <div class="donebanner" id="done-banner"><img src="assets/sprites/cat_cheer.webp" alt=""><span>🎉 旅程完成！可以再逛一次，或者揀任何一站重溫。</span></div>
  <main class="mapwrap"><ol class="map">{''.join(stops)}</ol></main>'''
    imain = imain.replace('<main class="mapwrap">', '<div class="mapwrap">').replace('</ol></main>', '</ol></div>')
    last, first = secs[-1], secs[0]
    index_pager = ('  <nav class="pager" aria-label="頁面導航 / page navigation">\n    '
        f'<a class="pg prev" id="nav-prev" href="{esc(last["id"])}.html"><b>◀ 上一頁</b><small>{esc(last["title"])}</small></a>\n    '
        '<a class="pg home" id="nav-home" href="index.html"><b>🏠 目錄</b><small>Map</small></a>\n    '
        f'<a class="pg next" id="nav-next" href="{esc(first["id"])}.html"><b>開始旅程 ▶</b><small>{esc(first["title"])}</small></a>\n  </nav>')
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(render('index', 'page-index', j['title'], imain, index_pager, j.get('subtitle', '')))
    # sections
    for i, s in enumerate(secs):
        zh, en = TYPES[s['chartType']][:2]
        pts = ''.join(f'<li>{esc(p)}</li>' for p in s.get('points', []))
        sp = (s.get('mascot') if s.get('mascot') in SPRITES else None) or ['cat_wave', 'alien_green', 'blob_buddy', 'space_dog', 'tentacle_buddy', 'robot_buddy', 'cat_point', 'cat_cheer', 'cat_think'][i % 9]
        ref = f'<p class="src">📖 {esc(s["sourceRef"])}</p>' if s.get('sourceRef') else ''
        main = f'''  <main class="layout">
    <aside class="intro"><img class="mascot" src="assets/sprites/{sp}.webp" alt="">
      <span class="kicker">第 {i + 1} / {len(secs)} 站 · {zh}</span>
      <h1>{esc(s.get('icon', ''))} {esc(s['title'])}</h1>
      <p class="summary">{esc(s['summary'])}</p>
      {('<ul>' + pts + '</ul>') if pts else ''}{ref}
    </aside>
    <section class="panel" id="chart" aria-label="{esc(s['title'])} — {en}"></section>
  </main>'''
        open(os.path.join(out, s['id'] + '.html'), 'w', encoding='utf-8').write(render(s['id'], 'page-section type-' + s['chartType'], f'{s["title"]} · {j["title"]}', main, pager(secs, i), s['summary']))
    print(f'built {len(secs) + 1} pages -> {out}')
    if a.zip:
        z = os.path.abspath(a.zip)
        with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(out):
                for f in files:
                    full = os.path.join(root, f); zf.write(full, os.path.join(os.path.basename(out) if False else 'alien-journey-site', os.path.relpath(full, out)))
        print('zip ->', z, os.path.getsize(z) // 1024, 'KB')
if __name__ == '__main__':
    main()
