"""Build site/index.html: inline the part files named in src/index.src.html, then fill in generated geometry."""
import math
import pathlib
import random
import re
import sys

src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
root = src.parent
html = src.read_text(encoding="utf-8")
html = re.sub(
    r"\{\{INCLUDE ([\w./-]+)\}\}",
    lambda m: (root / m.group(1)).read_text(encoding="utf-8").rstrip("\n"),
    html,
)

# --- foil pack silhouette: serrated top and bottom, a V notch on each side, and one irregular tear line between them
random.seed(5)
NT = 26        # teeth on the serrated edges
M = 18         # segments in the tear line
TEAR_Y = 11.4  # where the top seal tears off, as a % of pack height
NOTCH_X = 1.9
NOTCH_H = 1.25


def pt(p):
    return f"{p[0]:.2f}% {p[1]:.2f}%"


top = [(k * 100 / (2 * NT), 1.25 if k % 2 == 0 else 0.0) for k in range(2 * NT + 1)]            # left to right
bottom = [(100 - k * 100 / (2 * NT), 98.75 if k % 2 == 0 else 100.0) for k in range(2 * NT + 1)]  # right to left
tear = []
for i in range(M + 1):
    y = TEAR_Y + (0.85 if i % 2 else -0.85) + random.uniform(-0.45, 0.45)
    tear.append((i * 100 / M, y))
tear[0] = (NOTCH_X, TEAR_Y)
tear[-1] = (100 - NOTCH_X, TEAR_Y)

front = tear + [(100, TEAR_Y + NOTCH_H)] + bottom + [(0, TEAR_Y + NOTCH_H)]
strip = top + [(100, TEAR_Y - NOTCH_H)] + [(x, y + 0.45) for x, y in reversed(tear)] + [(0, TEAR_Y - NOTCH_H)]
outline = (
    top
    + [(100, TEAR_Y - NOTCH_H), (100 - NOTCH_X, TEAR_Y), (100, TEAR_Y + NOTCH_H)]
    + bottom
    + [(0, TEAR_Y + NOTCH_H), (NOTCH_X, TEAR_Y), (0, TEAR_Y - NOTCH_H)]
)
back = top + [(100, TEAR_Y + 6), (0, TEAR_Y + 6)]
# drawn in a 100 x 140 box, the same shape as the pack, so the stroke keeps an even width
tear_path = "M" + " L".join(f"{x:.2f} {y * 1.4:.2f}" for x, y in tear)

# --- icon geometry
spokes = []
for i in range(6):
    t = math.radians(i * 60 + 30)
    spokes.append(
        f"M{24 + 6 * math.cos(t):.1f} {24 + 6 * math.sin(t):.1f}L{24 + 17 * math.cos(t):.1f} {24 + 17 * math.sin(t):.1f}"
    )
star = []
for i in range(10):
    t = math.radians(-90 + i * 36)
    r = 19 if i % 2 == 0 else 8.5
    star.append(f"{24 + r * math.cos(t):.1f},{24 + r * math.sin(t):.1f}")

# --- the round, saw-edged FREE sticker
burst = []
SPIKES = 24
for i in range(SPIKES * 2):
    t = math.radians(-90 + i * 180 / SPIKES)
    r = 50 if i % 2 == 0 else 45.4
    burst.append((50 + r * math.cos(t), 50 + r * math.sin(t)))

fills = {
    "{{FRONT_POLY}}": ", ".join(map(pt, front)),
    "{{STRIP_POLY}}": ", ".join(map(pt, strip)),
    "{{OUTLINE_POLY}}": ", ".join(map(pt, outline)),
    "{{BACK_POLY}}": ", ".join(map(pt, back)),
    "{{TEAR_PATH}}": tear_path,
    "{{BURST_POLY}}": ", ".join(map(pt, burst)),
    "{{WHEEL_SPOKES}}": "".join(spokes),
    "{{STAR_POINTS}}": " ".join(star),
}
for k, v in fills.items():
    if k not in html:
        raise SystemExit(f"token {k} not found in source")
    html = html.replace(k, v)
left = re.findall(r"\{\{[A-Z_ ./a-z0-9-]+\}\}", html)
if left:
    raise SystemExit(f"unfilled token left in output: {left[:3]}")
out.write_text(html, encoding="utf-8")
print("built", out, len(html), "bytes")
