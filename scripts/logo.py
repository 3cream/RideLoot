import sys
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA')
a = im.split()[3]
# bbox of anything meaningfully opaque
bbox = a.point(lambda v: 255 if v > 12 else 0).getbbox()
print('bbox', bbox, 'of', im.size)
pad = 24
x0, y0, x1, y1 = bbox
x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
x1, y1 = min(im.size[0], x1 + pad), min(im.size[1], y1 + pad)
t = im.crop((x0, y0, x1, y1))
print('trimmed', t.size)
for w, name, q in [(1400, 'logo.webp', 88), (560, 'logo-sm.webp', 86)]:
    h = round(t.size[1] * w / t.size[0])
    r = t.resize((w, h), Image.LANCZOS)
    r.save(f'{out}/{name}', 'WEBP', quality=q, method=6)
    print(name, r.size)
# preview on dark for inspection
bg = Image.new('RGBA', t.size, (10, 13, 16, 255))
bg.alpha_composite(t)
bg.convert('RGB').resize((1200, round(t.size[1]*1200/t.size[0])), Image.LANCZOS).save('tmp/logo_on_dark.jpg', quality=85)
# candidate wordmark crop (lower band)
W, H = t.size
wm = t.crop((0, int(H*0.60), W, H))
bg2 = Image.new('RGBA', wm.size, (10, 13, 16, 255)); bg2.alpha_composite(wm)
bg2.convert('RGB').resize((1200, round(wm.size[1]*1200/wm.size[0])), Image.LANCZOS).save('tmp/wordmark_crop.jpg', quality=85)
