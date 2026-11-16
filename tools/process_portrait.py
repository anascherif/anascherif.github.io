"""Builds the two hero portrait layers from tools/portrait-src.png.

  assets/portrait.webp          cut-out photo (transparent background)
  assets/portrait-machine.webp  same silhouette rendered as an edge map,
                                revealed under the cursor in the hero

Run:  python tools/process_portrait.py
Needs: pip install rembg pillow numpy opencv-python
"""
import sys
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import new_session, remove

ROOT = Path(__file__).resolve().parent.parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "tools" / "portrait-src.png"
OUT = ROOT / "assets"
SCALE = 2  # upscale so the portrait stays crisp at hero size

src = Image.open(SRC).convert("RGB")
session = new_session("isnet-general-use")
cut = remove(src, session=session, alpha_matting=True,
             alpha_matting_foreground_threshold=240,
             alpha_matting_background_threshold=15,
             alpha_matting_erode_size=6)
cut = cut.resize((src.width * SCALE, src.height * SCALE), Image.LANCZOS)
rgba = np.array(cut)
alpha = rgba[..., 3]
# tighten the matte a touch so no grey studio fringe survives
alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=1)
alpha = cv2.GaussianBlur(alpha, (0, 0), 1.2)
rgba[..., 3] = alpha
Image.fromarray(rgba).save(OUT / "portrait.webp", quality=92, method=6)

# ---- machine view: luminous contour lines on a night-blue body ----
gray = cv2.cvtColor(rgba[..., :3], cv2.COLOR_RGB2GRAY)
gray = cv2.bilateralFilter(gray, 9, 60, 9)
fine = cv2.Canny(gray, 18, 48)
bold = cv2.Canny(cv2.GaussianBlur(gray, (0, 0), 3), 10, 30)
edges = np.maximum(fine.astype(np.float32) * 0.75, bold.astype(np.float32))
edges = cv2.GaussianBlur(edges, (0, 0), 0.9) / 255.0
glow = cv2.GaussianBlur(edges, (0, 0), 6) * 1.6
# silhouette outline
outline = cv2.morphologyEx((alpha > 128).astype(np.uint8) * 255, cv2.MORPH_GRADIENT,
                           np.ones((5, 5), np.uint8)).astype(np.float32) / 255.0
outline = cv2.GaussianBlur(outline, (0, 0), 1.0)
line = np.clip(edges * 1.5 + outline, 0, 1)

h, w = gray.shape
night = np.array([12, 15, 46], np.float32)       # --night
ultra = np.array([58, 72, 255], np.float32)      # brighter --ultra for glow
ice = np.array([226, 232, 255], np.float32)
lum = (gray.astype(np.float32) / 255.0)[..., None]
body = night + (ultra - night) * (lum ** 1.6) * 0.42
# scanline texture
rows = (np.arange(h) % 6 < 1).astype(np.float32)[:, None, None]
body = body * (1 - 0.35 * rows)
img = body + (ultra - body) * np.clip(glow, 0, 1)[..., None]
img = img + (ice - img) * line[..., None]
out = np.dstack([np.clip(img, 0, 255).astype(np.uint8), alpha])
Image.fromarray(out).save(OUT / "portrait-machine.webp", quality=90, method=6)

# face box for the detection label (percent of image)
casc = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
faces = casc.detectMultiScale(gray, 1.1, 6, minSize=(w // 5, h // 5))
for (x, y, fw, fh) in faces:
    print(f"face box %: left={x / w * 100:.1f} top={y / h * 100:.1f} "
          f"width={fw / w * 100:.1f} height={fh / h * 100:.1f}")
ys, xs = np.where(alpha > 128)
print(f"silhouette %: left={xs.min() / w * 100:.1f} right={xs.max() / w * 100:.1f} "
      f"top={ys.min() / h * 100:.1f} bottom={ys.max() / h * 100:.1f}")
print("ok", out.shape)
