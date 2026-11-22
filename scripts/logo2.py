"""Prepare the new RideLoot logo (blue / white / black sticker with the M3) for the page."""
import cv2
import numpy as np
from PIL import Image

SRC = '/mnt/user-data/uploads/8d1d6497-image.png'
im = Image.open(SRC).convert('RGBA')
a = np.array(im)
alpha = a[..., 3].astype(np.float32)

# the left tip of the underline ends in a soft dark smear with no white edge: trim the part that hangs below the stroke
ys, xs = np.mgrid[0:a.shape[0], 0:a.shape[1]]
luma = a[..., :3].astype(np.float32).mean(axis=2)
box = (xs >= 380) & (xs <= 560) & (ys >= 2170) & (ys <= 2310)
below = ys > 2196 + (xs - 400) * (62 / 140)
kill = box & below & (luma < 120)
alpha[kill] = 0
soft = cv2.GaussianBlur(alpha, (0, 0), 1.6)
near = cv2.dilate(kill.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
alpha[near] = np.minimum(alpha[near], soft[near])
# drop faint stray pixels far from the artwork
alpha[alpha < 8] = 0
a[..., 3] = alpha.astype(np.uint8)

im = Image.fromarray(a, 'RGBA')
box = im.getbbox(); pad = 12
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
im = im.crop(box)
print('cropped', im.size, 'aspect', round(im.width / im.height, 4))
big = im.copy(); big.thumbnail((1100, 1100), Image.LANCZOS)
big.save('site/assets/logo.webp', 'WEBP', quality=88, method=6)
sm = im.copy(); sm.thumbnail((420, 420), Image.LANCZOS)
sm.save('site/assets/logo-sm.webp', 'WEBP', quality=86, method=6)
print('logo', big.size, 'small', sm.size)
for bgc, name in [((6, 10, 16), 'dark'), ((120, 130, 140), 'mid')]:
    bg = Image.new('RGBA', big.size, bgc + (255,)); bg.alpha_composite(big)
    bg.convert('RGB').save(f'tmp/_logo2_{name}.jpg', quality=88)
bg = Image.new('RGBA', im.size, (120, 130, 140, 255)); bg.alpha_composite(im)
bg.crop((240 - box[0] + 97, 1960 - box[1] + 199 - 199 + 0, 900, 2140)).convert('RGB').save('tmp/_logo2_tip.jpg', quality=90)
