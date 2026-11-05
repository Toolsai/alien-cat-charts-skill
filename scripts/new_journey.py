#!/usr/bin/env python3
"""Helper for agents turning a source into journey.json.
  python3 scripts/new_journey.py init  [--out src/journey.json]     write a starter journey.json (3 sections, TODO text)
  python3 scripts/new_journey.py snippet <chartType>               print a ready-to-edit section for that chart type
  python3 scripts/new_journey.py types                             list chart types, item limits and when to use them
  python3 scripts/new_journey.py check [src/journey.json]          validate (errors + length warnings) without building
"""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_site as B
KIT = B.KIT
WHEN = {'flowchart': 'process / steps with branches (if-then, decisions)', 'timeline': 'chronology, history, schedule, versions', 'comic': 'story, metaphor, example conversation, scenario',
        'cycle': 'closed loop that repeats (life cycle, feedback loop, routine)', 'quiz': 'check understanding; key facts as questions', 'compare': 'A vs B, before/after, pros/cons, two options',
        'hotspots': 'places / parts of a whole / glossary of "locations" (explore by clicking)', 'checklist': 'to-dos, requirements, best practices, steps the learner should do',
        'flashcards': 'terms and definitions, vocabulary, one-fact-per-card'}
def main():
    a = sys.argv[1:] or ['types']; cmd = a[0]
    if cmd == 'types':
        for t, (zh, en, lo, hi, key) in B.TYPES.items(): print(f'{t:11s} {zh}/{en:10s} {lo}-{hi} {key:9s} {WHEN[t]}')
    elif cmd == 'snippet':
        t = a[1]; print(open(os.path.join(KIT, 'templates', 'chart-snippets', t + '.json'), encoding='utf-8').read())
    elif cmd == 'init':
        out = a[a.index('--out') + 1] if '--out' in a else os.path.join(KIT, 'src', 'journey.json')
        os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
        open(out, 'w', encoding='utf-8').write(open(os.path.join(KIT, 'templates', 'journey.skeleton.json'), encoding='utf-8').read()); print('wrote', out)
    elif cmd == 'check':
        f = a[1] if len(a) > 1 else os.path.join(KIT, 'src', 'journey.json')
        errs, warns = B.validate(json.load(open(f, encoding='utf-8')))
        for w in warns: print('WARN ', w)
        for e in errs: print('ERROR', e)
        print('OK' if not errs else f'{len(errs)} error(s)'); sys.exit(1 if errs else 0)
    else: print(__doc__)
main()
