#!/usr/bin/env python3
"""Magenta key-out: assets/raw/<name>.jpg (character on flat #FF00FF-ish bg) -> assets/sprites/<name>.png (transparent, cropped, <=520px).
Usage (from the kit root):  python3 scripts/keyout.py cat_wave alien_green ...      (no args = every raw/*.jpg)
Needs: pillow numpy scipy"""
import numpy as np, sys, os, glob
from PIL import Image
from scipy import ndimage as ndi
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GLASS = {'space_dog'}   # characters with a bubble helmet
names = sys.argv[1:] or [os.path.basename(p)[:-4] for p in sorted(glob.glob(os.path.join(ROOT, 'assets', 'raw', '*.jpg')))]
for n in names:
    src = os.path.join(ROOT, 'assets', 'raw', n + '.jpg')
    if not os.path.exists(src): print('skip', n); continue
    a = np.asarray(Image.open(src).convert('RGB')).astype(float)
    bg = np.median(np.concatenate([a[:8].reshape(-1,3), a[-8:].reshape(-1,3), a[:,:8].reshape(-1,3), a[:,-8:].reshape(-1,3)]), axis=0)
    d = np.linalg.norm(a - bg, axis=2)
    lab, _ = ndi.label(d < 70)
    edge = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:,0], lab[:,-1]]))) - {0}
    bgm = np.isin(lab, list(edge)) | (d < 35)
    alpha = np.where(bgm, 0.0, 1.0)
    near = ndi.binary_dilation(bgm, iterations=2) & ~bgm
    tint = (a[...,0] > 180) & (a[...,1] < 90) & (a[...,2] > 90)
    alpha[near & tint] = 0
    if n in GLASS:  # glass dome / helmet filled with the key colour -> make it see-through
        mag = (a[...,0] > a[...,1] + 90) & (a[...,2] > a[...,1] + 50) & (d < 130) & (alpha > 0)
        alpha[mag] = 0.2
    alpha = ndi.gaussian_filter(alpha, 0.7)
    img = Image.fromarray(np.dstack([a, alpha * 255]).astype(np.uint8), 'RGBA')
    bb = img.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    img = img.crop(bb); img.thumbnail((520, 520), Image.LANCZOS)
    img.save(os.path.join(ROOT, 'assets', 'sprites', n + '.png'), optimize=True); print(n, img.size)
