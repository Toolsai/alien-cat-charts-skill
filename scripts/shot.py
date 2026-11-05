#!/usr/bin/env python3
"""Quick screenshot: python3 scripts/shot.py out/index.html 1280 shot.png [full]   (prints console errors)"""
import sys, os
from playwright.sync_api import sync_playwright
f, w, o = sys.argv[1], int(sys.argv[2]), sys.argv[3]
with sync_playwright() as p:
    b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); pg = b.new_page(viewport={'width': w, 'height': 800 if w > 600 else 844})
    errs = []
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None); pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto('file://' + os.path.abspath(f)); pg.wait_for_function('window.__kitReady===true', timeout=15000); pg.wait_for_timeout(600)
    pg.screenshot(path=o, full_page=len(sys.argv) > 4); print('errors:', errs); b.close()
