"""Cut the car out of the garage photo, keeping the cutout the same size as the photo so the two line up exactly."""
import os
os.environ['U2NET_HOME'] = '/home/claude/rideloot/tmp/models/models/isnet-general-use'
import numpy as np
from PIL import Image
from rembg import remove, new_session

SRC = '/mnt/user-data/uploads/d8b157b0-image.png'
im = Image.open(SRC).convert('RGB')
sess = new_session('isnet-general-use')
# work on the band around the car so it fills more of the model's input
box = (60, 470, 1066, 1110)
crop = im.crop(box)
cut = remove(crop, session=sess, alpha_matting=False, post_process_mask=True)
alpha = Image.new('L', im.size, 0)
alpha.paste(cut.getchannel('A'), box[:2])
alpha.save('tmp/m3_alpha_raw.png')
rgba = im.convert('RGBA'); rgba.putalpha(alpha)
rgba.save('tmp/m3_cut_full.png')
print('alpha bbox', alpha.getbbox())
bg = Image.new('RGBA', im.size, (8, 12, 15, 255)); bg.alpha_composite(rgba)
bg.convert('RGB').crop((120, 520, 1010, 1060)).save('tmp/_m3_cut_preview.jpg', quality=90)
