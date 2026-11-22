"""Clean the car cutout (soften the mirrored sign reflection on the hood) and export web sizes."""
import cv2
import numpy as np
from PIL import Image

src = Image.open('tmp/car_cut.png').convert('RGBA')
a = np.array(src)
rgb = a[..., :3].copy()

# the reflected lettering sits in this box on the hood; rebuild it from its surroundings
x0, y0, x1, y1 = 596, 372, 748, 428
mask = np.zeros(rgb.shape[:2], np.uint8)
mask[y0:y1, x0:x1] = 255
bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
filled = cv2.inpaint(bgr, mask, 9, cv2.INPAINT_TELEA)
soft = cv2.GaussianBlur(filled, (0, 0), 5)
feather = cv2.GaussianBlur(mask, (0, 0), 6).astype(np.float32)[..., None] / 255.0
out = (soft * feather + bgr * (1 - feather)).astype(np.uint8)
a[..., :3] = cv2.cvtColor(out, cv2.COLOR_BGR2RGB)

# tidy the alpha edge a touch so no bright fringe shows on a dark page
alpha = a[..., 3]
alpha = cv2.erode(alpha, np.ones((3, 3), np.uint8), iterations=1)
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.8)
a[..., 3] = alpha

im = Image.fromarray(a, 'RGBA')
box = im.getbbox()
pad = 6
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
im = im.crop(box)
print('cropped', im.size)
im.save('site/assets/car.webp', 'WEBP', quality=88, method=6)
sm = im.copy(); sm.thumbnail((620, 620), Image.LANCZOS)
sm.save('site/assets/car-sm.webp', 'WEBP', quality=84, method=6)
print('small', sm.size)
bg = Image.new('RGB', im.size, (8, 12, 15)); bg.paste(im, (0, 0), im)
bg.save('tmp/_car_clean.jpg', quality=90)
bg.crop((440, 200, 760, 340)).resize((960, 420)).save('tmp/_hood_clean.jpg', quality=90)
