---
name: alien-journey
description: Use when a user pastes a URL, article or document and wants an interactive space-themed learning website that walks through the key points in order with animated charts (flowchart, timeline, comic, cycle, quiz, compare, hotspots, checklist), cute alien characters, and optional ambient UFO sound.
---

# Alien Journey 👽🛸 — turn any source into a playful multi-page learning site

Paste a URL / article / document / notes → you (the agent) extract the key points **in order** → write one `journey.json` → `build_site.py` produces a static, self-contained website:
a **journey map** (index) + **one page per section**, each with a fitting animated chart, cartoon alien characters, a changing space background
(starfield · deep cosmos · nebula · black hole · asteroid belt · moon base), optional ambient UFO sound, and **上一頁 / 目錄 / 下一頁** navigation on every page.
The reader reads the left-hand key points while playing with the chart on the right. Works on desktop (1280) and phone (390). Traditional Chinese (incl. Cantonese) and English both work; text auto-fits and never overflows.

Everything this skill needs lives in this folder. **Do not rely on chat history or memory** — follow this file from the top. Original work, MIT licence (see `LICENSE`); no third-party chart code.

## When to use / not use
Use: "make this article/doc/video-notes/data summary into an interactive visual explainer / learning site / study journey", "cute alien charts", "walk me through this document with diagrams".
Don't use: dashboards with many numeric series (use a normal chart library), anything needing >12 steps in one flowchart, or serious/legal documents where a playful tone would be wrong (ask first).

## Install (one command — copy the folder)
The skill is just a folder; all paths below are relative to it.
```bash
# Cursor (project):        cp -r alien-journey .cursor/skills/alien-journey
# Claude Code:             cp -r alien-journey ~/.claude/skills/alien-journey
# Codex (project only):    git clone https://github.com/Toolsai/alien-cat-charts-skill.git .agents/skills/alien-journey
# Anti-Gravity:            cp -r alien-journey .agent/skills/alien-journey
# Grok Bot:                folder lives at /home/box/skill-assets/alien-journey  (register it as a skill, or just read this file)
# Run inside the skill folder; keep dependencies isolated:
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt            # build
pip install -r requirements-test.txt       # optional browser tests
playwright install chromium               # optional browser tests
# Optional asset regeneration only: pip install numpy scipy
```
Work on a **copy** if the skill folder is shared/read-only: `cp -r alien-journey ./aj-work && cd aj-work`. Everything also accepts `--journey` / `--out` paths anywhere.

## Folder map
```
SKILL.md               this file                         LICENSE   MIT (original work)
src/journey.json       the ONE source of truth for a site (ships with the water-cycle demo)
assets/css/journey.css assets/js/{core,bg,audio}.js assets/js/charts/*.js     kit CSS/JS (text-fit, nav, backgrounds, 9 charts, sound)
assets/sprites/*.png   12 transparent characters (cat_wave cat_point cat_cheer cat_think cat_head alien_green blob_buddy tentacle_buddy space_dog robot_buddy ufo ufo_pink)
assets/audio/ambient.wav   8 s seamless UFO-hum + star-twinkle loop (172 KB)        assets/raw/*.jpg   original art on magenta (for re-keying)
templates/             page.html, journey.skeleton.json, chart-snippets/<type>.json (ready-to-edit section per chart)
scripts/               build_site.py  new_journey.py  make_audio.py  keyout.py  shot.py
examples/              water-cycle.journey.json (+SOURCE.md)  all-charts.journey.json (every chart type)
test.py                Playwright audit (both widths) + contact sheet
```

## End-to-end recipe (do these in order)
1. **Read the source.** URL → fetch it (WebFetch / curl / browser if blocked); file → read it. Note title, author, licence/permission (keep attribution; don't republish copyrighted text beyond short paraphrase). Language of the learner = language of the site (`"lang": "zh-Hant"` or `"en"`). If the user writes Cantonese, write Traditional Chinese in friendly 口語/書面 mix.
2. **Pick 4–7 sections, in the source's order.** One idea per section. For each: title (≤ 22 chars), `summary` (1–2 sentences, ≤ 110 chars), `points` (2–3 short bullets, ≤ 40 chars each, the facts to remember), `sourceRef` (where in the source). Choose the chart with the table below — **use at least 3 different chart types**, end with a `quiz` (or `checklist`) so learners self-check. Vary `background` between sections (all six are available) and `mascot` (any sprite).
3. **Draft `src/journey.json`.** `python3 scripts/new_journey.py init` writes a starter; `python3 scripts/new_journey.py snippet <chartType>` prints a ready-to-edit section; schemas below. Only use facts that are in the source (numbers must match). Keep chart text short (see Text rules).
4. **Validate.** `python3 scripts/new_journey.py check src/journey.json` (errors must be 0; fix WARN lengths).
5. **(Optional) Generate missing art.** The 12 sprites cover most needs. For a new character: generate on a flat pure-magenta `#FF00FF` background in the same style (thick black outline, flat colours, cel shading; use an existing `assets/raw/*.jpg` as the reference image so the style matches), save as `assets/raw/<name>.jpg`, run `python3 scripts/keyout.py <name>` → `assets/sprites/<name>.png`, then add `<name>` to `SPRITES` in `scripts/build_site.py` and `Kit.CAST` in `assets/js/core.js`. Glass/helmet characters: add the name to `GLASS` in `keyout.py`.
6. **Build.** `python3 scripts/build_site.py --journey src/journey.json --out out --zip out.zip` → `out/index.html` + `out/<id>.html` + `out/assets/`. (Open `out/index.html` directly, or `python3 -m http.server -d out`.)
7. **Test.** `python3 test.py --site out --shots out-shots` must end `GREEN ✅` at 1280 and 390. Then **look at** `out-shots/all.png` (contact sheet) and fix anything ugly (see checklist).
8. **Deliver.** Give the user `out.zip` (unzip → open `index.html`), the contact sheet, the list of sections with chart types, the source attribution, and tell them: "click 🔇 開啟宇宙聲效 (top right) for sound; ← → keys flip pages".

## Chart-type chooser
| Content shape in the source | chartType | Items | Notes |
|---|---|---|---|
| Steps / process / algorithm with if-then | `flowchart` | 3–14 nodes (best ≤ 9) | decisions are yellow "？" cards with 是/否 chips; ≤ 5 ranks → horizontal, more → vertical |
| Dates, history, versions, schedule | `timeline` | 3–8 events | UFO flies along; cards alternate above/below (stack on phone) |
| Story, metaphor, worked example, dialogue | `comic` | 3–6 panels | speech bubble + caption + 1–2 characters per panel |
| Loop that repeats (life cycle, feedback) | `cycle` | 3–8 stages | planets on a ring, UFO orbits, detail card, clockwise/anticlockwise toggle |
| "Do you remember?" / key facts | `quiz` | 2–6 questions, 2–4 options | tap to reveal, explanation, score, end screen |
| A vs B, before/after, pros/cons | `compare` | 2–6 rows | rows blurred until revealed one by one |
| Parts / places / glossary to explore | `hotspots` | 3–6 spots | scene: `planet` `moonbase` `space`; hover tooltips; click for detail; guide character walks |
| To-dos, requirements, best practices | `checklist` | 3–8 items | tick items, rocket flies, confetti at 100% |
| Terms ↔ definitions, vocabulary | `flashcards` | 3–10 cards | tap to flip |
Every section needs `id` (a-z0-9-, unique, not `index`), `title`, `summary`, `chartType`, `data`; optional `icon` (emoji), `points[]`, `sourceRef`, `background`, `mascot`.

## journey.json schema
```jsonc
{ "id":"slug", "title":"…", "subtitle":"…", "lang":"zh-Hant",
  "source":{"title":"…","url":"https://…","license":"…"},          // shown on the index
  "cast":["alien_green","cat_wave","space_dog"],                  // 3 sprites shown on the index hero
  "indexBackground":"starfield",
  "sections":[ { "id":"…","title":"…","icon":"🌍","summary":"…","points":["…"],"sourceRef":"…",
                 "chartType":"flowchart","background":"nebula","mascot":"cat_point","data":{ … } } ] }
```
Backgrounds: `starfield cosmos nebula blackhole asteroids moonbase`. Sprites: `cat_wave cat_point cat_cheer cat_think cat_head alien_green blob_buddy tentacle_buddy space_dog robot_buddy ufo ufo_pink`.

### `data` per chart type (all accept optional `"intro":"first status-line sentence"`)
- **flowchart** `{start:"id", nodes:[{id, type:"start|step|decision|end", text, note?, next | yes,no,yesLabel?,noLabel?}]}` — `step`/`start` need `next`; `decision` needs `yes`+`no`; `end` has none. `text` ≤ 24 chars; `note` = longer sentence shown in the status line. Loops back are allowed (back-edges are drawn around).
- **timeline** `{events:[{when, icon?, title, text}]}` — `when` ≤ 12 chars ("1580", "公元 27–100", "08:00").
- **comic** `{panels:[{title?, scene?(background name), char?, char2?, speaker?:1|2, say, caption?}]}` — `say` ≤ 60 chars, `caption` ≤ 40.
- **cycle** `{center?:{text,char}, stages:[{icon?, title, text}]}` — title ≤ 8 chars, text ≤ 90.
- **quiz** `{questions:[{q, options:["…","…"(2–4)], answer:0-based index, explain?}]}`.
- **compare** `{left:{title,icon?,char?}, right:{…}, rows:[{label,a,b}], verdict?}` — label ≤ 6 chars, a/b ≤ 28.
- **hotspots** `{scene:"planet|moonbase|space", guide?:sprite, spots:[{x,y (0–100 = % of the scene), icon, title, text}]}` — spread spots apart (≥ 15% apart), text ≤ 120 chars.
- **checklist** `{items:[{icon?, text, detail?}], done?:"final message"}`.
- **flashcards** `{cards:[{icon?, front, back}], peek?:sprite}`.

## Navigation rules (already implemented — don't break them)
- Every section page has the sticky bottom pager **`#nav-prev` 上一頁 · `#nav-home` 目錄 · `#nav-next` 下一頁** as real `<a href>` links generated by `build_site.py` from the section order (works without JS). First page's "上一頁" → `index.html`; last page's "下一頁" → `index.html#done` (shows a 🎉 banner).
- The **index also has the three** (上一頁 = last section, 目錄 = itself, 下一頁/開始旅程 = first section), plus the journey map: each stop is a card linking to its page, numbered, with ✓ for visited sections (localStorage).
- Top bar: 🏠 目錄, progress dots (clickable, current highlighted, visited green), 🔇/🔊 sound toggle. Keyboard: ← previous, → next, Home = index.
- Chart control buttons are separate from page navigation and capped at **4 per chart** (`ctx.setButtons` throws above 4).

## Audio rules
- `assets/audio/ambient.wav` is generated by `python3 scripts/make_audio.py` (numpy only; 8 s, 11 kHz mono, seamless loop of soft saucer hum + airy shimmer + pentatonic twinkles; no samples, no copyrighted music; ≈172 KB). Edit the script's constants to change mood.
- Browsers block autoplay → sound starts **off**. The button `#sound-btn` ("🔇 開啟宇宙聲效") starts it, click again to mute. The choice + playback position are remembered; on the next page we try to resume, and if the browser refuses the button pulses ("🔈 點擊繼續") — one tap resumes. State is exposed as `window.__sound` for tests. Never add auto-playing sound without a user gesture.

## Text-fit rules (so nothing ever overflows)
- All text inside fixed-size boxes goes through `Kit.fb(cls, text, {min,max,left,nowrap})` / `Kit.text` → binary-search the largest font that fits, then clamp with "…" (full text in `title`). Re-fit runs after fonts load and on resize. Never put long text in SVG `<text>`; never let text size the box.
- Write short: titles ≤ 22 chars, node text ≤ 24, bubbles ≤ 60, card text ≤ 90–120. Long text still won't overflow, but it shrinks to 10 px or gets "…" — shorten it instead.
- Fonts: Fredoka + Noto Sans TC from Google Fonts (needs network); offline falls back to system CJK fonts (the fit system still holds).
- Page-level (intro card, summaries, points, map cards) is normal flowing text with `overflow-wrap:anywhere`.

## Testing checklist (don't deliver until all true)
`python3 test.py --site out --shots out-shots` (≈3–4 min) asserts, at 1280 **and** 390: 0 console/page errors · #nav-prev/#nav-home/#nav-next present, correct hrefs, visible; clicking Start → Next… walks every page, finish returns to index with banner, Previous walks back · each chart's buttons clicked (play→pause) and chart-specific clicks (options, spots, rows, cards, dots, planets, nodes, chips) · overflow audit after every interaction (no horizontal scroll, text boxes fit, text inside box, cards inside panel) · stress test with ~400 chars + 60-char unbroken word in every box · audio element loads, toggle starts then mutes it, preference survives navigation · screenshots + `all.png`/`all-390.png`.
Then **eyeball** the contact sheet: overlapping cards? characters hiding text? hotspots too close? flowchart arrows crossing? phone width readable? Fix `journey.json` (shorter text, move spots) and rebuild. Run the same test on `examples/all-charts.journey.json` after changing kit code (it covers all 9 chart types).

## Customising the kit
- New chart type: add `assets/js/charts/<name>.js` calling `Journey.register('<name>', ctx => {…; return {layout(narrow,W){…}}})` (see any existing chart; use `ctx.stage`, `ctx.setButtons`, `ctx.say`, `ctx.height`, `Kit.fb`), add CSS to `journey.css`, add the type to `TYPES` in `build_site.py` (+ validation) and to `scripts/new_journey.py` WHEN; add a snippet to `templates/chart-snippets/` and a section to `examples/all-charts.journey.json`.
- New background: add a theme in `assets/js/bg.js` (`THEMES`, `FLOATERS`, CSS `#bg.t-<name>`) and to `BACKGROUNDS` in `build_site.py`.

## Known limits
- Static site, no server needed; `file://` works. Fonts need internet for the exact look. Sound needs one user click per browser session (policy), then it resumes across pages when allowed.
- Flowcharts above ~12 nodes or with many crossing edges get messy; split into two sections. Back-edges are drawn simply around the diagram.
- 9 chart types, 12 characters, 6 backgrounds; style is fixed (American-cartoon space). A new art style = regenerate sprites.
- It summarises: the agent must pick the points — long documents become 4–7 highlights, not a full copy. Always keep attribution; check licence before publishing.
- Hotspot scenes are decorative backdrops (spots aren't tied to drawn objects) — word spot titles so they make sense anywhere.
- Tested on Chromium (Playwright). Firefox/Safari should work (plain DOM/SVG/canvas) but are not in the test suite.

## Cold-start proof
`src/journey.json` + `examples/water-cycle.SOURCE.md` is a 6-section site built from a Wikipedia page with this recipe only (hotspots, flowchart, cycle, compare, timeline, quiz). `examples/all-charts.journey.json` exercises all 9 chart types.
