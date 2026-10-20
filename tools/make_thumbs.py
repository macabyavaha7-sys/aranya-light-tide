import os
from PIL import Image

root = r"E:\DeepSeek HUB\测试任务\aranya-light-tide"
out = os.path.join(root, "screenshots")
os.makedirs(out, exist_ok=True)
pairs = [
    ("shots/01-dawn.png", "01-dawn.jpg", 1500),
    ("shots/03-dusk.png", "02-dusk.jpg", 1500),
    ("shots/06-hall.png", "03-hall.jpg", 1500),
    ("shots/07-terrace.png", "04-terrace.jpg", 1500),
    ("shots/14-mobile-fresh.png", "05-mobile.jpg", 780),
]
for src, dst, w in pairs:
    im = Image.open(os.path.join(root, src)).convert("RGB")
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.save(os.path.join(out, dst), "JPEG", quality=86, optimize=True)
    print(dst, im.size, round(os.path.getsize(os.path.join(out, dst)) / 1024), "KB")
