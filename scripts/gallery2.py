"""Prepare the three newer photos for the prize gallery: the concrete garage, the night side profile and the interior."""
from PIL import Image, ImageFilter

A = 'site/assets/'
U = '/mnt/user-data/uploads/'
SRC = {
    #  name               file                    crop (l, t, r, b)   scale
    'm3-garage':   (U + 'afaf531a-image.png', (0, 0, 0, 36), 1.75),   # screenshot strip and rounded corners along the bottom
    'm3-side':     (U + 'a65d3081-image.png', (0, 0, 0, 0),  1.5),
    'm3-interior': (U + 'd069c7ea-image.png', (0, 0, 0, 0),  1.0),
}
for name, (path, (l, t, r, b), k) in SRC.items():
    im = Image.open(path).convert('RGB')
    im = im.crop((l, t, im.width - r, im.height - b))
    big = im if k == 1 else im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
    big.save(A + name + '.webp', 'WEBP', quality=80, method=6)
    print(name, im.size, '->', big.size)
