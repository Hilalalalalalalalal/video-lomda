"""Animated "rising / falling bars" video: characters on red pillars over a
math-notebook (graph paper) background. Bars swap between high and low in time with the
music (assets/music.mp3 from MUSIC_START), and pump on every beat.

Requires: numpy, pillow, librosa, ffmpeg.

Usage:
  python3 make_video.py            ->  bars.mp4          (1920x1080, 3 characters)
  python3 make_video.py vertical   ->  bars_vertical.mp4 (1080x1920 story, 4 characters)
"""
import itertools
import os
import random
import subprocess
import sys

import math

import librosa
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
DURATION = 30.0                # seconds of video
MUSIC = os.path.join(HERE, "assets", "music.mp3")
MUSIC_START = 23.0             # seconds into the song where the video starts
FADE_OUT = 1.5                 # seconds of audio fade at the end
PUMP = 16                      # px the bars jump on a strong beat

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
        figure_h=390,                     # on-screen height from head top to pillar top
        slots_x=[420, 960, 1500],         # horizontal centre of each bar
        levels_y=[600, 755, 910],         # pillar-top y, highest first
        title_xy=(960, 115), title_size=150,
    ),
    "vertical": dict(
        size=(1080, 1920), out="bars_vertical.mp4", chars=["p1", "p2", "p3", "p4"],
        figure_h=380,
        slots_x=[190, 425, 660, 895],
        levels_y=[830, 1040, 1250, 1460],
        title_xy=(540, 330), title_size=210,
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


TITLE = "אז מה יהיה?"
TITLE_FONT = os.path.join(HERE, "assets", "fonts", "AmaticSC-Bold.ttf")
TITLE_TILT = 3                 # degrees, for a hand-written feel
WRITE_T = (0.2, 1.3)           # seconds: title is written on, right to left
MARK_T = (1.5, 2.6)            # seconds: highlighter sweeps over it, right to left
MARKER_OUT = 0.5               # seconds for the marker to lift away


def title_layers(center, size):
    """Full-frame RGBA layers for the hand-written title and its highlighter band."""
    font = ImageFont.truetype(TITLE_FONT, size)
    probe = ImageDraw.Draw(Image.new("L", (1, 1)))
    l, t, r, b = probe.textbbox((0, 0), TITLE, font=font, anchor="mm", direction="rtl")
    pad = size
    cw, ch = r - l + 2 * pad, b - t + 2 * pad
    text = Image.new("RGBA", (cw, ch))
    ImageDraw.Draw(text).text((cw / 2, ch / 2), TITLE, font=font, fill=(28, 38, 78, 255),
                              anchor="mm", direction="rtl")
    # highlighter band: a slightly wobbly stroke with streaky density, a bit wider than the text
    band = Image.new("L", (cw, ch))
    rng = np.random.default_rng(11)
    x0, x1 = cw / 2 + l - size * 0.25, cw / 2 + r + size * 0.25
    y0, y1 = ch / 2 - (b - t) * 0.3, ch / 2 + (b - t) * 0.5
    xs = np.linspace(x0, x1, 40)
    top = [(x, y0 + rng.normal(0, size * 0.03)) for x in xs]
    bot = [(x, y1 + rng.normal(0, size * 0.03)) for x in xs[::-1]]
    ImageDraw.Draw(band).polygon(top + bot, fill=255)
    band = band.filter(ImageFilter.GaussianBlur(size * 0.02))
    streaks = 0.82 + 0.18 * rng.random((ch, 1)) ** 2
    band_a = (np.asarray(band) * streaks * 0.62).astype(np.uint8)
    hl = Image.fromarray(np.dstack([np.full((ch, cw), 255), np.full((ch, cw), 222),
                                    np.full((ch, cw), 40), band_a]).astype(np.uint8), "RGBA")
    out = []
    for layer in (hl, text):
        layer = layer.rotate(TITLE_TILT, resample=Image.BICUBIC, expand=False)
        full = Image.new("RGBA", (W, H))
        full.alpha_composite(layer, (round(center[0] - cw / 2), round(center[1] - ch / 2)))
        out.append(full)
    span = (round(center[0] - (x1 - x0) / 2), round(center[0] + (x1 - x0) / 2))
    return out[0], out[1], span


def marker_sprite(size):
    """A chisel-tip highlighter pen, tip at the bottom-left corner of the returned image."""
    L, Wd = size * 2.2, size * 0.42
    img = Image.new("RGBA", (int(L + Wd * 2), int(Wd * 3)))
    d = ImageDraw.Draw(img)
    cy = img.height / 2
    tip, neck, body_end = Wd * 0.2, Wd * 0.75, L
    d.polygon([(tip, cy - Wd * 0.18), (neck, cy - Wd * 0.4), (neck, cy + Wd * 0.4), (tip, cy + Wd * 0.3)],
              fill=(255, 214, 0, 255))                                       # felt tip
    d.rectangle([neck, cy - Wd * 0.5, neck + Wd * 0.5, cy + Wd * 0.5], fill=(60, 60, 66, 255))
    d.rounded_rectangle([neck + Wd * 0.5, cy - Wd / 2, body_end, cy + Wd / 2], radius=Wd * 0.25,
                        fill=(255, 226, 40, 255), outline=(200, 160, 0, 255), width=3)
    d.rounded_rectangle([body_end - Wd * 0.9, cy - Wd * 0.56, body_end + Wd * 0.15, cy + Wd * 0.56],
                        radius=Wd * 0.2, fill=(45, 45, 52, 255))            # cap end
    d.line([(neck + Wd * 0.8, cy - Wd * 0.25), (body_end - Wd * 1.2, cy - Wd * 0.25)],
           fill=(255, 245, 170, 255), width=max(2, int(Wd * 0.1)))          # shine
    angle = 35                    # body points up and to the right
    rot = img.rotate(angle, resample=Image.BICUBIC, expand=True)
    # locate the tip after rotation
    a = math.radians(angle)
    px, py = tip - img.width / 2, cy - img.height / 2
    tx = px * math.cos(a) + py * math.sin(a) + rot.width / 2
    ty = -px * math.sin(a) + py * math.cos(a) + rot.height / 2
    return rot, (tx, ty)


def progress(t, span):
    return min(max((t - span[0]) / (span[1] - span[0]), 0.0), 1.0)


def ease(t):
    # ease-in-out with a small overshoot (easeInOutBack)
    c = 1.2 * 1.525
    if t < 0.5:
        return (2 * t) ** 2 * ((c + 1) * 2 * t - c) / 2
    return ((2 * t - 2) ** 2 * ((c + 1) * (2 * t - 2) + c) + 2) / 2


def analyse_music():
    """Beat times (seconds from video start), their strength 0..1, and whether each beat is
    in a loud part of the song."""
    y, sr = librosa.load(MUSIC, sr=22050, offset=MUSIC_START, duration=DURATION)
    _, frames = librosa.beat.beat_track(y=y, sr=sr)
    beats = librosa.frames_to_time(frames, sr=sr)
    onset = librosa.onset.onset_strength(y=y, sr=sr)
    strength = onset[frames] / onset[frames].max()
    rms = librosa.feature.rms(y=y)[0]
    rms = np.convolve(rms, np.ones(86) / 86, mode="same")     # ~2 s window
    loud = rms[np.minimum(frames, len(rms) - 1)] > 0.8 * np.median(rms)
    return beats, strength, loud


def schedule(n, beats, loud):
    """Ranking changes that land on the beat: every 2 beats in loud parts, every 4 in quiet
    ones. Returns [(land_time, move_seconds, ranking)], starting with the initial ranking."""
    rng = random.Random(7)
    perms = list(itertools.permutations(range(n)))
    period = float(np.median(np.diff(beats)))
    changes = [(0.0, 0.0, tuple(range(n)))]
    i = 2                                      # leave the first beats for the title
    while i < len(beats) and beats[i] < DURATION - 1.5:
        p = rng.choice(perms)
        if sum(a != b for a, b in zip(p, changes[-1][2])) >= min(3, n):
            changes.append((beats[i], 0.85 * period, p))
            i += 2 if loud[i] else 4
    return changes


def bar_levels(t, changes):
    """Fractional level index of every bar at time t."""
    k = max(j for j, c in enumerate(changes) if c[0] - c[1] <= t)
    land, move, cur = changes[k]
    prev = changes[k - 1][2] if k else cur
    p = ease(min((t - (land - move)) / move, 1.0)) if move else 1.0
    return [a + (b - a) * p for a, b in zip(prev, cur)]


def pump(t, beats, strength):
    """Upward kick right on each beat that decays quickly."""
    past = beats <= t
    if not past.any():
        return 0.0
    j = np.flatnonzero(past)[-1]
    return PUMP * strength[j] * math.exp(-(t - beats[j]) / 0.12)


def render(fmt):
    global W, H
    cfg = FORMATS[fmt]
    W, H = cfg["size"]
    SLOTS_X, LEVELS_Y = cfg["slots_x"], cfg["levels_y"]
    sprites = load_sprites(cfg["chars"], cfg["figure_h"])
    bg = notebook_background()
    hl, text, (hx0, hx1) = title_layers(cfg["title_xy"], cfg["title_size"])
    tb = text.getbbox()
    marker, (mtx, mty) = marker_sprite(cfg["title_size"])
    tilt = math.tan(math.radians(TITLE_TILT))
    beats, strength, loud = analyse_music()
    changes = schedule(len(sprites), beats, loud)
    total = DURATION
    n_frames = int(total * FPS)
    out = os.path.join(HERE, cfg["out"])
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-ss", str(MUSIC_START), "-t", str(DURATION), "-i", MUSIC,
         "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
         "-pix_fmt", "yuv420p", "-af", f"afade=t=out:st={DURATION - FADE_OUT}:d={FADE_OUT}",
         "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out],
        stdin=subprocess.PIPE)
    for f in range(n_frames):
        t = f / FPS
        levels = bar_levels(t, changes)
        kick = pump(t, beats, strength)
        frame = bg.copy()
        # title: written on right-to-left, then highlighted right-to-left with a moving marker
        pm = progress(t, MARK_T)
        if pm > 0:
            xr = round(hx1 - (hx1 - hx0) * pm)
            part = hl.crop((xr, 0, W, H))
            frame.paste(part, (xr, 0), part)
        pw = progress(t, WRITE_T)
        if pw > 0:
            xr = round(tb[2] - (tb[2] - tb[0]) * pw)
            part = text.crop((xr, 0, W, H))
            frame.paste(part, (xr, 0), part)
        lift = progress(t, (MARK_T[1], MARK_T[1] + MARKER_OUT))
        if pm > 0 and lift < 1:
            tip_x = hx1 - (hx1 - hx0) * pm
            tip_y = cfg["title_xy"][1] + (tip_x - cfg["title_xy"][0]) * tilt + cfg["title_size"] * 0.12
            tip_y += 4 * math.sin(t * 40)                       # a little scrubbing wobble
            mx, my = round(tip_x - mtx + lift * 200), round(tip_y - mty - lift * 260)
            m = marker if lift == 0 else marker.copy()
            if lift:
                m.putalpha(m.getchannel("A").point(lambda v: int(v * (1 - lift))))
            frame.paste(m, (mx, my), m)
        for i, (img, top, strip) in enumerate(sprites):
            # levels are evenly spaced; extrapolate so the ease overshoot isn't clipped
            pillar_y = LEVELS_Y[0] + levels[i] * (LEVELS_Y[1] - LEVELS_Y[0]) - kick
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
