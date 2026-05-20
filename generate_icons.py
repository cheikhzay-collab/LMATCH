"""
Generate PWA icons for L'Match from the favicon SVG.
Uses only Python stdlib — no external packages needed.
Run: python generate_icons.py
"""

import os
import struct
import zlib
import math

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "public", "icons")
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# L'Match brand colors (RGBA)
BG_COLOR     = (13, 17, 23, 255)       # #0D1117
VIOLET       = (82, 84, 240, 255)      # #5254F0
VIOLET_LIGHT = (129, 140, 248, 255)    # #818CF8
GLOW         = (82, 84, 240, 60)       # semi-transparent glow

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_color(c1, c2, t):
    return tuple(int(lerp(c1[i], c2[i], t)) for i in range(4))

def clamp(v, lo=0, hi=255):
    return max(lo, min(hi, v))

def alpha_blend(fg, bg):
    """Alpha-composite fg over bg."""
    fa = fg[3] / 255.0
    ba = bg[3] / 255.0
    out_a = fa + ba * (1 - fa)
    if out_a == 0:
        return (0, 0, 0, 0)
    r = int((fg[0]*fa + bg[0]*ba*(1-fa)) / out_a)
    g = int((fg[1]*fa + bg[1]*ba*(1-fa)) / out_a)
    b = int((fg[2]*fa + bg[2]*ba*(1-fa)) / out_a)
    a = int(out_a * 255)
    return (clamp(r), clamp(g), clamp(b), clamp(a))

def make_canvas(w, h, color=(0,0,0,0)):
    return [[list(color) for _ in range(w)] for _ in range(h)]

def fill_rect_rounded(canvas, x0, y0, x1, y1, color, radius):
    h = len(canvas)
    w = len(canvas[0])
    for y in range(max(0,y0), min(h,y1)):
        for x in range(max(0,x0), min(w,x1)):
            # Distance from nearest corner
            cx = max(x0+radius, min(x1-radius, x))
            cy = max(y0+radius, min(y1-radius, y))
            dist = math.sqrt((x-cx)**2 + (y-cy)**2)
            if dist <= radius:
                alpha = clamp(int(255 * (1 - max(0, dist - radius + 1))))
                c = list(color); c[3] = alpha
                canvas[y][x] = list(alpha_blend(tuple(c), tuple(canvas[y][x])))

def fill_rect(canvas, x0, y0, x1, y1, color):
    h = len(canvas)
    w = len(canvas[0])
    for y in range(max(0,y0), min(h,y1)):
        for x in range(max(0,x0), min(w,x1)):
            canvas[y][x] = list(alpha_blend(color, tuple(canvas[y][x])))

def draw_gradient_bg(canvas, size, radius):
    """Dark gradient background."""
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            c1 = (13, 17, 23, 255)
            c2 = (22, 27, 40, 255)
            color = lerp_color(c1, c2, t)
            canvas[y][x] = list(color)
    # Round corners by clearing them
    for y in range(size):
        for x in range(size):
            cx = max(radius, min(size-radius, x))
            cy = max(radius, min(size-radius, y))
            dist = math.sqrt((x-cx)**2 + (y-cy)**2)
            if dist > radius:
                canvas[y][x] = [0, 0, 0, 0]

def draw_bolt(canvas, size):
    """
    Draw the L'Match lightning bolt shape.
    The original SVG viewBox is 48×46, scaled to fit the icon.
    """
    pad = size * 0.15
    scale = (size - pad * 2) / 48.0
    ox = pad
    oy = pad + (size - pad*2 - 46*scale) / 2

    # Bolt polygon points (from SVG path, simplified)
    points = [
        (25.946, 0),
        (39.827, 0),
        (28.267, 15.838),
        (40.376, 15.838),
        (14.101, 44.938),
        (20.053, 25.675),
        (7.624, 25.675),
    ]
    # Scale & offset
    pts = [(int(ox + p[0]*scale), int(oy + p[1]*scale)) for p in points]

    # Rasterize polygon with scanline fill + gradient
    min_y = max(0, min(p[1] for p in pts))
    max_y = min(size-1, max(p[1] for p in pts))

    def segments():
        n = len(pts)
        return [(pts[i], pts[(i+1) % n]) for i in range(n)]

    for y in range(min_y, max_y+1):
        intersections = []
        for (x1,y1),(x2,y2) in segments():
            if y1 == y2:
                continue
            if min(y1,y2) <= y < max(y1,y2):
                t = (y - y1) / (y2 - y1)
                xi = x1 + t*(x2-x1)
                intersections.append(xi)
        intersections.sort()
        for i in range(0, len(intersections)-1, 2):
            xa = int(intersections[i])
            xb = int(intersections[i+1])
            for x in range(max(0,xa), min(size,xb+1)):
                # Gradient: violet_light at top, violet at bottom
                t = (y - min_y) / max(1, max_y - min_y)
                color = lerp_color(VIOLET_LIGHT, VIOLET, t)
                canvas[y][x] = list(alpha_blend(color, tuple(canvas[y][x])))

def canvas_to_png(canvas, size):
    """Convert pixel array to PNG bytes."""
    def png_chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)

    # Build raw pixel data with filter bytes
    raw = b''
    for row in canvas:
        raw += b'\x00'  # filter type: None
        for px in row:
            raw += bytes([clamp(px[0]), clamp(px[1]), clamp(px[2]), clamp(px[3])])

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)  # RGB... wait, use RGBA
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0)  # 6 = RGBA

    idat = zlib.compress(raw, 9)

    return (
        b'\x89PNG\r\n\x1a\n'
        + png_chunk(b'IHDR', ihdr)
        + png_chunk(b'IDAT', idat)
        + png_chunk(b'IEND', b'')
    )

def generate_icon(size):
    radius = max(4, size // 8)
    canvas = make_canvas(size, size)
    draw_gradient_bg(canvas, size, radius)
    draw_bolt(canvas, size)
    return canvas_to_png(canvas, size)

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    for size in SIZES:
        print(f"  Generating icon-{size}.png ...", end=' ', flush=True)
        data = generate_icon(size)
        path = os.path.join(OUTPUT_DIR, f"icon-{size}.png")
        with open(path, 'wb') as f:
            f.write(data)
        print(f"  ({len(data)} bytes) OK")
    print(f"\n[DONE]  All {len(SIZES)} icons saved to {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
