import os, sys
os.environ.setdefault('U2NET_HOME', '/home/claude/rideloot/tmp/models')
from PIL import Image
from rembg import remove, new_session

src, model = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
crop = im.crop((230, 1070, 1530, 2110))
crop.save('/home/claude/rideloot/tmp/car_crop.jpg', quality=92)
sess = new_session(model)
out = remove(crop, session=sess, alpha_matting=False, post_process_mask=True)
out.save('/home/claude/rideloot/tmp/car_cut.png')
print('cutout', out.size, out.mode)
bg = Image.new('RGBA', out.size, (8, 12, 15, 255)); bg.alpha_composite(out)
bg.convert('RGB').save('/home/claude/rideloot/tmp/car_cut_preview.jpg', quality=88)
