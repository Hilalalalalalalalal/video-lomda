"""Animated "rising / falling bars" video: characters on red pillars over a
math-notebook (graph paper) background. Bars keep swapping between high and low.

Usage:
  python3 make_video.py            ->  bars.mp4          (1920x1080, 3 characters)
  python3 make_video.py vertical   ->  bars_vertical.mp4 (1080x1920 story, 4 characters)
"""
import itertools
import os
import random
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
HOLD, MOVE = 1.0, 1.1          # seconds a ranking is held / seconds of transition
STEPS = 12                     # ranking changes before the video returns to its start

# file, row to cut the pillar at (below the shoes), region to blank out (phone UI icon)
CHARACTERS = {
    "p1": ("p1.jpg", 1715, (1100, 1500)),
    "p2": ("p2.jpg", 1700, (1090, 1480)),
    "p3": ("p3.jpg", 1800, None),
    "p4": ("p4.jpg", 2080, None),
}
FORMATS = {
    "horizontal": dict(
        size=(1920, 1080), out="bars.mp4", chars=["p1", "p2", "p3"],
        figure_h=430,                     # on-screen height from head top to pillar top
        slots_x=[420, 960, 1500],         # horizontal centre of each bar
        levels_y=[470, 660, 850],         # pillar-top y, highest first
    ),
    "vertical": dict(
        size=(1080, 1920), out="bars_vertical.mp4", chars=["p1", "p2", "p3", "p4"],
        figure_h=380,
        slots_x=[190, 425, 660, 895],
        levels_y=[760, 980, 1200, 1420],
    ),
}
W, H = FORMATS["horizontal"]["size"]


def key_out_green(path, cut_row, blank):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    excess = g - np.maximum(r, b)
    alpha = np.clip(1.0 - (excess - 25.0) / 35.0, 0, 1)
    # despill: pull green down on semi-transparent / greenish edge pixels
    spill = excess > 0
    a[..., 1] = np.where(spill, np.maximum(r, b), g)
    if blank:
        alpha[blank[1]:, blank[0]:] = 0
    alpha[cut_row:] = 0
    alpha[:6], alpha[:, :6], alpha[:, -6:] = 0, 0, 0   # screenshot borders
    rgba = np.dstack([a, alpha * 255]).clip(0, 255).astype(np.uint8)
    img = Image.fromarray(rgba, "RGBA")
    # soften the matte a touch
    al = img.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))
    img.putalpha(al.point(lambda v: v if v > 12 else 0))
    return img.crop(img.getbbox())


def pillar_top_row(img):
    a = np.asarray(img).astype(int)
    red = (a[..., 0] > 110) & (a[..., 1] < 90) & (a[..., 2] < 90) & (a[..., 3] > 200)
    rows = red.sum(1)
    return int(np.argmax(rows > 0.6 * rows.max()))


def load_sprites(names, figure_h):
    sprites = []
    for name in names:
        fname, cut, blank = CHARACTERS[name]
        img = key_out_green(os.path.join(HERE, "assets", fname), cut, blank)
        top = pillar_top_row(img)
        scale = figure_h / top
        img = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
        top = round(top * scale)
        # one-pixel strip of pillar used to extend the bar down to the floor
        strip = img.crop((0, img.height - 2, img.width, img.height - 1))
        sprites.append((img, top, strip))
    return sprites


def notebook_background():
    bg = Image.new("RGB", (W, H), (250, 249, 243))
    rng = np.random.default_rng(3)
    noise = rng.normal(0, 2.2, (H, W, 1))
    bg = Image.fromarray(np.clip(np.asarray(bg) + noise, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(bg)
    cell = 36
    for i, x in enumerate(range(0, W, cell)):
        d.line([(x, 0), (x, H)], fill=(160, 195, 228) if i % 5 == 0 else (196, 218, 238), width=1)
    for i, y in enumerate(range(0, H, cell)):
        d.line([(0, y), (W, y)], fill=(160, 195, 228) if i % 5 == 0 else (196, 218, 238), width=1)
    # red margin line on the right (Hebrew notebook)
    margin = 150 if W > H else 70
    d.line([(W - margin, 0), (W - margin, H)], fill=(222, 92, 92), width=3)
    # binding holes on the left
    for y in range(60, H, 90):
        d.ellipse([22, y - 13, 48, y + 13], fill=(215, 213, 205))
        d.ellipse([25, y - 10, 45, y + 10], fill=(70, 70, 70))
    # soft vignette
    yy, xx = np.mgrid[0:H, 0:W]
    v = 1 - 0.18 * (((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2) / 2
    return Image.fromarray(np.clip(np.asarray(bg) * v[..., None], 0, 255).astype(np.uint8))


def ease(t):
    # ease-in-out with a small overshoot (easeInOutBack)
    c = 1.2 * 1.525
    if t < 0.5:
        return (2 * t) ** 2 * ((c + 1) * 2 * t - c) / 2
    return ((2 * t - 2) ** 2 * ((c + 1) * (2 * t - 2) + c) + 2) / 2


def schedule(n):
    # random rankings where at least two bars move each step; ends back on the first one
    # so the video loops cleanly
    rng = random.Random(7)
    perms = list(itertools.permutations(range(n)))
    seq = [tuple(range(n))]
    while len(seq) < STEPS:
        p = rng.choice(perms)
        if sum(a != b for a, b in zip(p, seq[-1])) >= min(3, n) and (len(seq) < STEPS - 1 or p != seq[0]):
            seq.append(p)
    return seq + [seq[0]]


def render(fmt):
    global W, H
    cfg = FORMATS[fmt]
    W, H = cfg["size"]
    SLOTS_X, LEVELS_Y = cfg["slots_x"], cfg["levels_y"]
    sprites = load_sprites(cfg["chars"], cfg["figure_h"])
    bg = notebook_background()
    seq = schedule(len(sprites))
    step = HOLD + MOVE
    total = (len(seq) - 1) * step + HOLD
    n_frames = int(total * FPS)
    out = os.path.join(HERE, cfg["out"])
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow",
         "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
        stdin=subprocess.PIPE)
    for f in range(n_frames):
        t = f / FPS
        k = min(int(t // step), len(seq) - 2)
        local = t - k * step
        p = 0.0 if local < HOLD else ease(min((local - HOLD) / MOVE, 1.0))
        frame = bg.copy()
        for i, (img, top, strip) in enumerate(sprites):
            y0 = LEVELS_Y[seq[k][i]]
            y1 = LEVELS_Y[seq[k + 1][i]]
            pillar_y = y0 + (y1 - y0) * p
            x = round(SLOTS_X[i] - img.width / 2)
            y = round(pillar_y - top)
            ext_top = y + img.height - 1
            if ext_top < H:
                ext = strip.resize((img.width, H - ext_top))
                frame.paste(ext, (x, ext_top), ext)
            frame.paste(img, (x, y), img)
        ff.stdin.write(frame.tobytes())
    ff.stdin.close()
    ff.wait()
    print("wrote", out, f"{total:.1f}s")


if __name__ == "__main__":
    render(sys.argv[1] if len(sys.argv) > 1 else "horizontal")
