"""Builds the logo paths, extended portrait cut-out, blurred backdrop, avatar and project images.
Run from the repo root:  python tools/build_assets.py
Needs: pillow, numpy, opencv-python, fonttools. Sources live in tools/raw (not committed)."""
import json, os, sys
import numpy as np, cv2
from PIL import Image, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'tools', 'raw')
OUT = os.path.join(ROOT, 'assets')

def logo():
    from fontTools.ttLib import TTFont
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.boundsPen import BoundsPen
    from fontTools.pens.transformPen import TransformPen
    f = instantiateVariableFont(TTFont(os.path.join(RAW, 'archivo.ttf')), {'wdth': 125, 'wght': 900})
    gs = f.getGlyphSet(); cmap = f.getBestCmap()
    cap = f['OS/2'].sCapHeight
    gaps = [0.035, 0.035, 0.03]
    x = 0; paths = []; top = 0; bot = 0
    for i, ch in enumerate('ANAS'):
        g = gs[cmap[ord(ch)]]
        bp = BoundsPen(gs); g.draw(bp); x0, y0, x1, y1 = bp.bounds
        top = max(top, y1); bot = min(bot, y0)
        paths.append((g, x - x0, x1 - x0))
        x += (x1 - x0) + (gaps[i] * cap if i < 3 else 0)
    W = x; H = top - bot
    out = []
    for g, dx, w in paths:
        sp = SVGPathPen(gs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
        g.draw(TransformPen(sp, (1, 0, 0, -1, dx, top)))
        out.append(sp.getCommands())
    data = {'w': round(W, 1), 'h': round(H, 1), 'paths': out}
    json.dump(data, open(os.path.join(RAW, 'logo.json'), 'w'))
    print('logo', data['w'], data['h'], [len(p) for p in out])

def portrait():
    im = np.array(Image.open(os.path.join(OUT, 'portrait.webp')).convert('RGBA')).astype(np.float32)
    h, w = im.shape[:2]
    a = im[..., 3]
    EXT, DOWN = 96, 820
    W, H = w + 2 * EXT, h + DOWN
    rgb = np.zeros((H, W, 3), np.float32); alpha = np.zeros((H, W), np.float32)
    rgb[:h, EXT:EXT + w] = im[..., :3]; alpha[:h, EXT:EXT + w] = a
    # continue the jacket downwards from the last rows
    base = im[h - 14:h, :, :3].mean(0)
    base = cv2.GaussianBlur(base[None], (0, 0), 9)[0]
    rgb[h:, EXT:EXT + w] = base[None]
    alpha[h:, EXT:EXT + w] = 255
    jacket = np.median(im[h - 60:h, 40:300, :3].reshape(-1, 3), 0)
    def edge(side):
        cols = range(0, 80) if side == 'l' else range(w - 1, w - 81, -1)
        pts = []
        for c in (cols[0], cols[60]):
            col = a[:, c]; ys = np.where(col[700:] > 128)[0]
            pts.append((c, 700 + ys[0]))
        return pts
    mask = np.zeros((H, W), np.uint8)
    for side in ('l', 'r'):
        (c0, y0), (c1, y1) = edge(side)
        sgn = -1 if side == 'l' else 1
        d = np.array([c0 - c1, y0 - y1], np.float32); d /= np.linalg.norm(d)
        p0 = np.array([c0 + EXT, y0], np.float32)
        p3 = np.array([p0[0] + sgn * (EXT - 6), y0 + 420], np.float32)
        p1 = p0 + d * 110; p2 = p3 - np.array([0, 190], np.float32)
        t = np.linspace(0, 1, 80)[:, None]
        curve = (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3
        inner = p0[0] - sgn * 3
        poly = np.vstack([curve, [p3[0], H], [inner, H], [inner, y0]]).astype(np.int32)
        cv2.fillPoly(mask, [poly], 255, lineType=cv2.LINE_AA)
        print('shoulder', side, (c0, y0), (c1, y1))
    m = cv2.GaussianBlur(mask, (0, 0), 1.1).astype(np.float32)
    new = (alpha < 8)[..., None]
    rgb = np.where(new, jacket[None, None], rgb)
    alpha = np.maximum(alpha, m)
    # light fabric grain on the synthetic area so it does not read as flat fill
    rng = np.random.default_rng(7)
    grain = cv2.GaussianBlur(rng.normal(0, 2.2, (H, W)).astype(np.float32), (0, 0), .7)
    synth = np.zeros((H, W), np.float32); synth[h:, :] = 1; synth[:, :EXT] = 1; synth[:, EXT + w:] = 1
    rgb += (grain * synth)[..., None]
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 255)]).astype(np.uint8)
    big = Image.fromarray(out, 'RGBA')
    S = 1800 / H
    fin = big.resize((round(W * S), 1800), Image.LANCZOS)
    fin.save(os.path.join(OUT, 'portrait-full.webp'), quality=88, method=6)
    print('portrait-full', fin.size)
    small = big.resize((round(W * 520 / H), 520), Image.LANCZOS)
    pad = Image.new('RGBA', (small.width + 240, small.height + 120), (0, 0, 0, 0))
    pad.paste(small, (120, 120))
    arr = np.array(pad).astype(np.float32)
    pm = arr[..., :3] * arr[..., 3:] / 255
    pm = cv2.GaussianBlur(pm, (0, 0), 30); al = cv2.GaussianBlur(arr[..., 3], (0, 0), 30)
    rgbb = np.where(al[..., None] > .5, pm / np.maximum(al[..., None], .5) * 255, 0)
    Image.fromarray(np.dstack([np.clip(rgbb, 0, 255), al]).astype(np.uint8), 'RGBA').save(os.path.join(OUT, 'portrait-blur.webp'), quality=70)
    print('blur', pad.size)
    face = Image.open(os.path.join(OUT, 'portrait.webp')).convert('RGBA').crop((380, 60, 1220, 900))
    bg = Image.new('RGBA', face.size, (201, 203, 196, 255)); bg.alpha_composite(face)
    bg.convert('RGB').resize((192, 192), Image.LANCZOS).save(os.path.join(OUT, 'avatar.webp'), quality=86)

def shots():
    os.makedirs(os.path.join(OUT, 'work'), exist_ok=True)
    jobs = {
        'lifeline': ('lifeline-landing.png', None, 1400),
        'lifeline-ops': ('lifeline-overview.png', None, 1400),
        'culprit': ('culprit-banner.png', None, 1400),
        'aerograph': ('aerograph-banner.png', (170, 0, 682, 320), 1024),
        'nettool': ('nettool-menu.png', None, 1100),
    }
    for name, (src, crop, mw) in jobs.items():
        im = Image.open(os.path.join(RAW, src)).convert('RGB')
        if crop: im = im.crop(crop)
        if im.width != mw: im = im.resize((mw, round(im.height * mw / im.width)), Image.LANCZOS)
        im.save(os.path.join(OUT, 'work', name + '.webp'), quality=84, method=6)
        print(name, im.size)

if __name__ == '__main__':
    which = sys.argv[1:] or ['logo', 'portrait', 'shots']
    for w in which: globals()[w]()
