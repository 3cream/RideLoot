"""Prepare the car photos for the page.

m3.webp / m3-m.webp          the garage photo (desktop / phone sizes)
m3-car.webp / m3-car-m.webp  the car alone, cut from that photo at the same size, so it lies exactly on top of it
car.webp / car-sm.webp       the same cutout cropped tight, for the prize card
m3-front.webp                the first photo (front view), cut out, for the gallery
"""
import cv2
import numpy as np
from PIL import Image, ImageFilter

A = 'site/assets/'
photo = Image.open('/mnt/user-data/uploads/d8b157b0-image.png').convert('RGB')
alpha = np.array(Image.open('tmp/m3_alpha_raw.png').convert('L'))
H, W = alpha.shape

# --- tidy the matte: two wall signs above the roof and a painted floor line behind the rear wheel came along
ys, xs = np.mgrid[0:H, 0:W]
alpha[(xs >= 556) & (xs < 760) & (ys < 600)] = 0
alpha[(xs >= 760) & (xs < 804) & (ys < 600 + (xs - 760) * 0.075)] = 0
alpha[(xs >= 922) & (ys >= 792)] = 0
# keep the one big shape, pull the edge in a hair and soften it
n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 128).astype(np.uint8), 8)
keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
alpha[lab != keep] = 0
alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=1)
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.7)
matte = Image.fromarray(alpha, 'L')
print('matte bbox', matte.getbbox())


def up(im, k, sharpen=True):
    out = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    return out.filter(ImageFilter.UnsharpMask(radius=1.4, percent=55, threshold=2)) if sharpen else out


K = 1.5
big = up(photo, K)
big.save(A + 'm3.webp', 'WEBP', quality=80, method=6)
photo.save(A + 'm3-m.webp', 'WEBP', quality=80, method=6)

car = photo.convert('RGBA'); car.putalpha(matte)
car_big = big.convert('RGBA'); car_big.putalpha(up(matte, K, sharpen=False))
car_big.save(A + 'm3-car.webp', 'WEBP', quality=84, method=6)
car.save(A + 'm3-car-m.webp', 'WEBP', quality=84, method=6)

box = car_big.getbbox(); pad = 8
box = (box[0] - pad, box[1] - pad, box[2] + pad, box[3] + pad)
tight = car_big.crop(box)
tight.save(A + 'car.webp', 'WEBP', quality=86, method=6)
sm = tight.copy(); sm.thumbnail((640, 640), Image.LANCZOS)
sm.save(A + 'car-sm.webp', 'WEBP', quality=84, method=6)
print('photo', big.size, 'tight', tight.size, 'small', sm.size, 'car box in big', box)

# the first photo: already cut and cleaned by scripts/car.py (kept as tmp/_front_clean.png)
front = Image.open('tmp/_front_clean.png')
front.save(A + 'm3-front.webp', 'WEBP', quality=86, method=6)
print('front', front.size)

prev = Image.new('RGBA', tight.size, (8, 12, 15, 255)); prev.alpha_composite(tight)
prev.convert('RGB').save('tmp/_car2_tight.jpg', quality=90)
