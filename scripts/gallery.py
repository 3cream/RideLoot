"""Prepare the four showroom photos for the prize gallery."""
from PIL import Image, ImageFilter

A = 'site/assets/'
SRC = {
    'm3-studio-34':    ('/mnt/user-data/uploads/878c2b58-image.png', (2, 0, 0, 0)),      # crop: left, top, right, bottom
    'm3-studio-front': ('/mnt/user-data/uploads/79e4fd0c-image.png', (0, 0, 0, 0)),
    'm3-studio-34b':   ('/mnt/user-data/uploads/bdac4531-image.png', (6, 0, 14, 34)),    # screenshot frame and rounded corners
    'm3-studio-side':  ('/mnt/user-data/uploads/99612727-image.png', (0, 0, 0, 0)),
}
for name, (path, (l, t, r, b)) in SRC.items():
    im = Image.open(path).convert('RGB')
    im = im.crop((l, t, im.width - r, im.height - b))
    if name == 'm3-studio-side':
        # another car in the background carries a number plate: soften it
        box = (940, 950, 1004, 990)
        im.paste(im.crop(box).filter(ImageFilter.GaussianBlur(5)), box[:2])
    big = im.resize((round(im.width * 1.5), round(im.height * 1.5)), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.4, percent=50, threshold=2))
    big.save(A + name + '.webp', 'WEBP', quality=80, method=6)
    print(name, im.size, '->', big.size)
    prev = im.copy(); prev.thumbnail((360, 480)); prev.save('tmp/_g_' + name + '.jpg', quality=82)
