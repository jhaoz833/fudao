# 生成首页"关于浮岛"动态短片：public/videos/fudao-intro.mp4 + 封面图
# 纯本地程序化渲染（星海 + 浮岛 + 字幕），与站点暗色星空视觉一致。
# 用法：python scripts/make-intro-video.py
# 依赖：Pillow、numpy、imageio-ffmpeg（自带 ffmpeg 二进制，无需单独安装）
import math
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

try:
    import numpy as np
    import imageio_ffmpeg
except ImportError:
    sys.exit("缺少依赖，请先安装：pip install Pillow numpy imageio-ffmpeg")

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "videos"
OUT_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_PATH = OUT_DIR / "fudao-intro.mp4"
POSTER_PATH = OUT_DIR / "fudao-intro-poster.jpg"

W, H = 1280, 720
FPS = 30
DUR = 13.6
N_FRAMES = int(DUR * FPS)

CX = W // 2
ISLAND_TOP_REST = 452  # 浮岛顶面静止时的纵坐标
ISLAND_HALF_W = 268
ISLAND_DEPTH = 205
BOB_PERIOD = 6.8  # 浮动周期，整除片长以便循环顺滑

# 站点同款色板
INK = (233, 236, 255)      # star
MOON = (154, 163, 199)     # moon
AURORA = (142, 162, 255)   # aurora
NEBULA = (179, 157, 255)   # nebula
GOLD = (245, 217, 160)     # gold

# ---------------------------------------------------------------- 工具
def rand(i: int) -> float:
    x = math.sin(i * 127.1 + 311.7) * 43758.5453
    return x - math.floor(x)

def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))

def smooth(x: float) -> float:
    x = clamp01(x)
    return x * x * (3 - 2 * x)

def ease_out_cubic(x: float) -> float:
    x = clamp01(x)
    return 1 - (1 - x) ** 3

def ease_in_out(x: float) -> float:
    x = clamp01(x)
    return x * x * (3 - 2 * x)

def seg_alpha(t: float, t0: float, t1: float, fade: float = 0.5) -> float:
    """字幕/元素在 [t0,t1] 区间内的淡入淡出系数"""
    if t < t0 or t > t1:
        return 0.0
    return smooth((t - t0) / fade) * smooth((t1 - t) / fade)

def load_font(candidates, size):
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    print("警告：未找到中文字体，回退到默认字体")
    return ImageFont.load_default()

FONT_BOLD = load_font(
    [r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\simhei.ttf",
     "/System/Library/Fonts/PingFang.ttc",
     "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"], 160)
FONT_SUB = load_font(
    [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\msyhl.ttc",
     "/System/Library/Fonts/PingFang.ttc",
     "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"], 25)
FONT_CAPTION = load_font(
    [r"C:\Windows\Fonts\msyh.ttc", r"C:\Windows\Fonts\msyhl.ttc",
     "/System/Library/Fonts/PingFang.ttc",
     "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"], 37)
FONT_END = load_font(
    [r"C:\Windows\Fonts\msyhbd.ttc", r"C:\Windows\Fonts\simhei.ttf",
     "/System/Library/Fonts/PingFang.ttc",
     "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"], 62)

def tracked_w(font, text, tracking):
    if not text:
        return 0
    return sum(font.getlength(ch) for ch in text) + tracking * (len(text) - 1)

def draw_tracked(draw, cx, y, text, font, fill, tracking=0):
    """水平居中、逐字符绘制（实现字距）"""
    total = tracked_w(font, text, tracking)
    x = cx - total / 2
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += font.getlength(ch) + tracking

def sparkle_path(x, y, s):
    """四角星（两个细菱形叠加）"""
    return [(x, y - s), (x + s * 0.22, y - s * 0.22), (x + s, y),
            (x + s * 0.22, y + s * 0.22), (x, y + s), (x - s * 0.22, y + s * 0.22),
            (x - s, y), (x - s * 0.22, y - s * 0.22)]

def draw_sparkle(draw, x, y, s, color, alpha):
    draw.polygon(sparkle_path(x, y, s), fill=color + (int(alpha),))

# ---------------------------------------------------------------- 背景（预渲染）
def build_base() -> Image.Image:
    yy = np.linspace(0, 1, H, dtype=np.float32)[:, None]
    top = np.array([4, 5, 13], dtype=np.float32)
    bottom = np.array([11, 14, 36], dtype=np.float32)
    img = top[None, None, :] * (1 - yy[:, :, None]) + bottom[None, None, :] * yy[:, :, None]

    xs = np.arange(W, dtype=np.float32)[None, :]
    ys = np.arange(H, dtype=np.float32)[:, None]

    def blob(cxr, cyr, radius, color, amp):
        dd = np.hypot(xs - cxr * W, ys - cyr * H)
        weight = (amp * np.exp(-(dd / radius) ** 2))[:, :, None]
        img[:] += np.array(color, dtype=np.float32)[None, None, :] * weight

    blob(0.78, 0.16, 420, NEBULA, 0.16)
    blob(0.10, 0.58, 470, (96, 130, 255), 0.13)
    blob(0.74, 0.92, 380, GOLD, 0.07)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")

BASE = build_base()

# ---------------------------------------------------------------- 星空（确定性参数）
N_DIM, N_BRIGHT = 170, 12
STARS = []
for i in range(N_DIM):
    STARS.append({
        "x": rand(i * 3 + 1), "y": rand(i * 3 + 2) * 0.92,
        "r": 0.5 + rand(i * 3 + 3) * 1.3,
        "base": 0.18 + rand(i * 7 + 5) * 0.5,
        "phase": rand(i * 11 + 7) * math.tau,
        "speed": 0.4 + rand(i * 13 + 9) * 1.2,
        "c": INK if rand(i * 17 + 3) < 0.7 else (GOLD if rand(i * 23 + 1) < 0.5 else AURORA),
        "vx": (rand(i * 19 + 2) - 0.5) * 0.006,
        "vy": 0.0015 + rand(i * 23 + 4) * 0.003,
    })
BRIGHT_STARS = []
for i in range(N_BRIGHT):
    j = 900 + i
    BRIGHT_STARS.append({
        "x": 0.06 + rand(j + 1) * 0.88, "y": 0.05 + rand(j + 2) * 0.5,
        "s": 7 + rand(j + 3) * 6,
        "phase": rand(j + 4) * math.tau,
        "speed": 0.6 + rand(j + 5) * 1.0,
        "c": (GOLD if i % 3 == 0 else (AURORA if i % 3 == 1 else INK)),
    })

# 亮星辉光贴图（预渲染）
def glow_sprite(color, size=64, inner=7):
    s = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(s)
    cx = size // 2
    for rr, a in ((size / 2, 26), (size / 3.2, 60), (inner, 160)):
        d.ellipse((cx - rr, cx - rr, cx + rr, cx + rr), fill=color + (a,))
    return s.filter(ImageFilter.GaussianBlur(size / 10))

GLOW_SPRITES = {c: glow_sprite(c) for c in (INK, GOLD, AURORA)}

# ---------------------------------------------------------------- 浮岛（预渲染）
ISLE_SCALE = 2  # 2 倍绘制再缩小，保证边缘顺滑

def _quad(p0, p1, p2, n=24):
    return [((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0],
             (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1])
            for t in (k / n for k in range(n + 1))]

def build_island():
    """返回 (island RGBA, glow RGBA)，坐标以顶面中心为原点"""
    s = ISLE_SCALE
    hw, depth = ISLAND_HALF_W * s, ISLAND_DEPTH * s
    pad = 130 * s
    w, h = hw * 2 + pad * 2, depth + pad * 2 + 60 * s
    ox, oy = w // 2, pad  # 顶面中心

    isle = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(isle)

    # 岛底：泪滴状岩体
    top_l, top_r = (ox - hw, oy + 14 * s), (ox + hw, oy + 14 * s)
    tip = (ox, oy + depth)
    left = _quad(top_l, (ox - hw * 0.94, oy + depth * 0.52), tip)
    right = _quad(top_r, (ox + hw * 0.94, oy + depth * 0.52), tip)
    d.polygon(left + right[::-1], fill=(27, 22, 56, 255))

    # 岩面棱面
    rng_pts = []
    for k in range(9):
        u = rand(300 + k * 5)
        v = rand(300 + k * 5 + 1)
        rng_pts.append((ox + (u - 0.5) * hw * 1.5, oy + 40 * s + v * (depth - 70 * s)))
    for k, (px, py) in enumerate(rng_pts):
        c = (38, 30, 76, 110) if k % 2 == 0 else (16, 12, 38, 130)
        d.polygon([(px, py), (px + (28 + rand(k) * 30) * s, py + (16 + rand(k + 9) * 22) * s),
                   (px - (12 + rand(k + 3) * 26) * s, py + (30 + rand(k + 5) * 20) * s)], fill=c)

    # 岩底发光边缘
    d.line(right + [tip], fill=AURORA + (70,), width=3 * s)
    d.line(left + [tip], fill=AURORA + (40,), width=2 * s)

    # 垂下的根须 + 光点（小灯笼）
    for k, rx0 in enumerate((-150, -30, 110)):
        x0 = ox + rx0 * s
        y0 = oy + (60 + rand(k + 40) * 30) * s
        pts = _quad((x0, y0), (x0 + (rx0 * 0.12) * s, y0 + 55 * s),
                    (x0 + (rx0 * 0.2 - 12) * s, y0 + (86 + rand(k + 7) * 26) * s), n=14)
        d.line(pts, fill=(70, 82, 140, 200), width=2 * s)
        ex, ey = pts[-1]
        c = GOLD if k % 2 == 0 else AURORA
        d.ellipse((ex - 4 * s, ey - 4 * s, ex + 4 * s, ey + 4 * s), fill=c + (235,))

    # 顶面草甸
    ry = 62 * s
    d.ellipse((ox - hw, oy - ry, ox + hw, oy + ry), fill=(33, 45, 88, 255))
    d.ellipse((ox - hw * 0.8, oy - ry * 0.78, ox + hw * 0.8, oy + ry * 0.8),
              fill=(41, 56, 108, 255))
    # 顶缘受光
    d.arc((ox - hw, oy - ry, ox + hw, oy + ry), start=180, end=360,
          fill=(120, 140, 220, 210), width=3 * s)

    # 草丛
    for k in range(13):
        gx = ox + (rand(500 + k) - 0.5) * hw * 1.5
        gy = oy + (rand(500 + k + 1) - 0.5) * ry * 0.9
        d.arc((gx - 9 * s, gy - 16 * s, gx + 9 * s, gy + 6 * s), start=200, end=340,
              fill=(66, 92, 148, 230), width=2 * s)

    # 小屋
    hx, hy = ox + 46 * s, oy - 6 * s
    d.polygon([(hx - 30 * s, hy - 8 * s), (hx, hy - 34 * s), (hx + 30 * s, hy - 8 * s)],
              fill=(24, 32, 66, 255))
    d.rectangle((hx - 22 * s, hy - 8 * s, hx + 22 * s, hy + 18 * s), fill=(15, 20, 44, 255))
    d.rectangle((hx - 8 * s, hy + 0 * s, hx + 2 * s, hy + 12 * s), fill=(15, 20, 44, 255))

    # 三棵小树
    for k, (tx0, hgt) in enumerate(((-160, 74), (-84, 52), (128, 62))):
        tx0 *= s
        tx0 += ox
        ty = oy - 4 * s
        for li in range(3):
            lw = (26 - li * 7) * s
            ly = ty - hgt * s * (0.34 * li)
            lh = hgt * s * 0.42
            d.polygon([(tx0 - lw, ly), (tx0 + lw, ly), (tx0, ly - lh)],
                      fill=(44, 62, 118, 255) if li % 2 == 0 else (52, 74, 138, 255))
        if k == 1:  # 树顶小星
            draw_sparkle(d, tx0, ty - hgt * s * 1.12 - 6 * s, 9 * s, GOLD, 255)

    glow = isle.copy()
    # 辉光层：只保留发光元素
    gd = ImageDraw.Draw(glow)
    gd.rectangle((0, 0, w, h), fill=(0, 0, 0, 0))
    gd.ellipse((hx - 9 * s, hy + 0 * s, hx + 3 * s, hy + 13 * s), fill=GOLD + (255,))  # 屋窗
    gd.ellipse((ox + (-84) * s - 10 * s, oy - 4 * s - 52 * s * 1.12 - 16 * s,
                ox + (-84) * s + 10 * s, oy - 4 * s - 52 * s * 1.12 + 4 * s),
               fill=GOLD + (255,))  # 树顶星
    for k, rx0 in enumerate((-150, -30, 110)):  # 灯笼光点
        ex = ox + (rx0 * 0.2 - 12) * s
        ey = oy + (60 + rand(k + 40) * 30) * s + (86 + rand(k + 7) * 26) * s
        gd.ellipse((ex - 6 * s, ey - 6 * s, ex + 6 * s, ey + 6 * s),
                   fill=(GOLD if k % 2 == 0 else AURORA) + (220,))
    glow = glow.filter(ImageFilter.GaussianBlur(9 * s))

    # 岛体自身轻微整体辉光
    halo = isle.split()[3].filter(ImageFilter.GaussianBlur(16 * s))
    tint = Image.new("RGBA", (w, h), AURORA + (0,))
    tint.putalpha(halo.point(lambda v: v * 28 // 255))
    glow = Image.alpha_composite(glow, tint)

    island = Image.alpha_composite(glow, isle)  # 辉光垫底，实体在上
    return island.resize((w // s, h // s), Image.LANCZOS)

ISLAND = build_island()
ISLE_ANCHOR = (ISLAND.width // 2, 130)  # 顶面中心在贴图内的位置

# 岛底光晕（单独贴图，垫在岛下方）
def build_underglow():
    s = ISLE_SCALE
    w, h = (ISLAND_HALF_W * 2 + 220) * s, 180 * s
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse((30 * s, 50 * s, w - 30 * s, h - 10 * s), fill=AURORA + (80,))
    d.ellipse((90 * s, 70 * s, w - 90 * s, h - 24 * s), fill=AURORA + (70,))
    return img.filter(ImageFilter.GaussianBlur(18 * s)).resize((w // s, h // s), Image.LANCZOS)

UNDERGLOW = build_underglow()

# 环绕的小浮岩
def build_rock(size):
    s = 2
    w = h = size * s
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.polygon([(4 * s, size * 0.42 * s), (w / 2, size * 0.18 * s), (w - 4 * s, size * 0.42 * s),
               (w / 2, size * 0.92 * s)], fill=(30, 24, 62, 255))
    d.line([(4 * s, size * 0.42 * s), (w / 2, size * 0.18 * s), (w - 4 * s, size * 0.42 * s)],
           fill=(120, 140, 220, 200), width=2 * s)
    d.ellipse((w / 2 - 3 * s, size * 0.26 * s, w / 2 + 3 * s, size * 0.26 * s + 6 * s),
              fill=(52, 74, 138, 255))
    glow = img.filter(ImageFilter.GaussianBlur(5 * s))
    return Image.alpha_composite(glow, img).resize((size, size), Image.LANCZOS)

ROCKS = [
    {"img": build_rock(46), "ax": 350, "ay": 92, "speed": 0.42, "phase": 0.0, "front": False,
     "bob": 9.0},
    {"img": build_rock(30), "ax": 300, "ay": 74, "speed": 0.31, "phase": 2.4, "front": True,
     "bob": 12.0},
    {"img": build_rock(22), "ax": 385, "ay": 110, "speed": 0.25, "phase": 4.4, "front": True,
     "bob": 7.0},
]

# 从岛上飘起的微光
MOTES = []
for i in range(16):
    MOTES.append({
        "x0": (rand(700 + i * 3) - 0.5) * ISLAND_HALF_W * 1.7,
        "period": 5.5 + rand(700 + i * 3 + 1) * 6.0,
        "phase": rand(700 + i * 3 + 2),
        "rise": 130 + rand(700 + i * 3 + 3) * 130,
        "drift": (rand(700 + i * 3 + 4) - 0.5) * 60,
        "size": 1.2 + rand(700 + i * 3 + 5) * 1.8,
        "c": GOLD if i % 3 == 0 else (AURORA if i % 3 == 1 else INK),
    })

# 环岛虚线轨道（慢速旋转）
ORBIT_DOTS = 42
ORBIT_RX, ORBIT_RY = 372, 104

# 流星：固定时刻表 (start_t, start_x, start_y, speed)
METEORS = [
    {"t0": 8.15, "x0": 0.82 * W, "y0": 0.10 * H, "v": (430, 240), "life": 0.85},
    {"t0": 9.35, "x0": 0.30 * W, "y0": 0.06 * H, "v": (-380, 210), "life": 0.8},
    {"t0": 11.4, "x0": 0.70 * W, "y0": 0.08 * H, "v": (-420, 230), "life": 0.8},
]

# ---------------------------------------------------------------- 文本层
def text_layer(text, font, color, tracking=0, pad=60):
    w = int(tracked_w(font, text, tracking)) + pad * 2
    h = int(font.size * 1.6) + pad * 2
    img = Image.new("RGBA", (max(w, 2), max(h, 2)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_tracked(d, w // 2, pad, text, font, color + (255,), tracking)
    return img

def paste_glow_text(base, layer, cx, cy, alpha):
    if alpha <= 0.01:
        return
    glow = layer.filter(ImageFilter.GaussianBlur(10))
    a = glow.split()[3].point(lambda v: v * alpha)
    tinted = Image.new("RGBA", glow.size, layer.getpixel((layer.width // 2, layer.height // 2))[:3] + (0,))
    tinted.putalpha(a)
    base.paste(tinted, (int(cx - glow.width / 2), int(cy - glow.height / 2)), a)
    body = layer.copy()
    body.putalpha(layer.split()[3].point(lambda v: v * alpha))
    base.paste(body, (int(cx - body.width / 2), int(cy - body.height / 2)), body.split()[3])

TITLE = text_layer("浮岛", FONT_BOLD, INK, tracking=44)
SUBTITLE = text_layer("FLOATING ISLAND", FONT_SUB, MOON, tracking=14)
CAPTIONS = [
    {"layer": text_layer("一座漂浮在星海里的小岛", FONT_CAPTION, (207, 214, 242), tracking=6),
     "t0": 1.7, "t1": 4.5},
    {"layer": text_layer("收藏图片、文字，和说不完的心情", FONT_CAPTION, (207, 214, 242), tracking=6),
     "t0": 4.8, "t1": 7.5},
    {"layer": text_layer("朋友们的足迹，也轻轻落在岛上", FONT_CAPTION, (207, 214, 242), tracking=6),
     "t0": 7.8, "t1": 10.5},
]
ENDING = text_layer("欢迎登陆浮岛", FONT_END, GOLD, tracking=16)
WELCOME_SUB = text_layer("✦ 挑一座小岛，慢慢逛 ✦", FONT_CAPTION, MOON, tracking=4)

# ---------------------------------------------------------------- 逐帧渲染
def render(t: float) -> Image.Image:
    img = BASE.copy()
    d = ImageDraw.Draw(img, "RGBA")

    # 星空漂移 + 闪烁
    for s in STARS:
        x = (s["x"] + s["vx"] * t) % 1.04 - 0.02
        y = (s["y"] + s["vy"] * t) % 0.96
        tw = clamp01(s["base"] + 0.38 * math.sin(s["phase"] + t * s["speed"] * math.tau * 0.28))
        d.ellipse((x * W - s["r"], y * H - s["r"], x * W + s["r"], y * H + s["r"]),
                  fill=s["c"] + (int(tw * 255),))
    for s in BRIGHT_STARS:
        tw = 0.45 + 0.55 * math.sin(s["phase"] + t * s["speed"] * math.tau * 0.3)
        px, py = s["x"] * W, s["y"] * H
        spr = GLOW_SPRITES[s["c"]]
        a = spr.split()[3].point(lambda v: int(v * clamp01(tw)))
        img.paste(spr, (int(px - spr.width / 2), int(py - spr.height / 2)), a)
        draw_sparkle(d, px, py, s["s"] * (0.8 + 0.25 * tw), s["c"], 210 * clamp01(tw))

    # 流星
    for m in METEORS:
        u = (t - m["t0"]) / m["life"]
        if 0 <= u <= 1:
            fade = math.sin(u * math.pi)
            hx = m["x0"] + m["v"][0] * (t - m["t0"])
            hy = m["y0"] + m["v"][1] * (t - m["t0"])
            for k in range(8):
                f = fade * (1 - k / 8)
                x1 = hx - m["v"][0] * 0.022 * k
                y1 = hy - m["v"][1] * 0.022 * k
                x2 = hx - m["v"][0] * 0.022 * (k + 1)
                y2 = hy - m["v"][1] * 0.022 * (k + 1)
                d.line((x1, y1, x2, y2), fill=INK + (int(200 * f),), width=2)
            d.ellipse((hx - 2, hy - 2, hx + 2, hy + 2), fill=INK + (int(230 * fade),))

    # 浮岛位置：入场 + 缓慢浮动
    rise = ease_out_cubic((t - 0.95) / 1.7) if t >= 0.95 else 0.0
    bob = math.sin(t * math.tau / BOB_PERIOD) * 7
    ix = CX
    iy = (H + 300) * (1 - rise) + ISLAND_TOP_REST * rise + bob

    # 环岛轨道虚点
    orb_cx, orb_cy = ix, iy - 30
    ang0 = t * 0.16
    for k in range(ORBIT_DOTS):
        a = ang0 + k * math.tau / ORBIT_DOTS
        sx = math.sin(a)
        sy = math.cos(a)
        px = orb_cx + ORBIT_RX * sx
        py = orb_cy + ORBIT_RY * sy
        depth = (sy + 1) / 2  # 0 远 1 近
        al = int(26 + 42 * depth)
        r = 1.2 + depth
        if sy > 0:  # 前半段画在岛上面
            continue
        d.ellipse((px - r, py - r, px + r, py + r), fill=AURORA + (al,))
    front_orbit = []
    for k in range(ORBIT_DOTS):
        a = ang0 + k * math.tau / ORBIT_DOTS
        sx, sy = math.sin(a), math.cos(a)
        front_orbit.append((orb_cx + ORBIT_RX * sx, orb_cy + ORBIT_RY * sy, (sy + 1) / 2))

    # 后排小浮岩
    def draw_rocks(front_only):
        for r in ROCKS:
            if r["front"] != front_only:
                continue
            a = r["phase"] + t * r["speed"] * math.tau
            rx = ix + r["ax"] * math.sin(a)
            ry = iy - 46 + r["ay"] * math.cos(a) + math.sin(t * math.tau / 5.2 + r["phase"]) * r["bob"]
            im = r["img"]
            img.paste(im, (int(rx - im.width / 2), int(ry - im.height / 2)), im)

    draw_rocks(False)

    # 岛底光晕 → 岛体 → 顶面轨道前半 → 前排浮岩
    ug = UNDERGLOW
    img.paste(ug, (int(ix - ug.width / 2), int(iy + ISLAND_DEPTH - 30)), ug)
    rot = math.sin(t * math.tau / (BOB_PERIOD * 2)) * 1.1
    isle = ISLAND.rotate(rot, resample=Image.BICUBIC, expand=False) if abs(rot) > 0.05 else ISLAND
    img.paste(isle, (int(ix - ISLE_ANCHOR[0]), int(iy - ISLE_ANCHOR[1])), isle)

    for px, py, depth in front_orbit:
        if depth > 0.5:
            al = int(26 + 42 * depth)
            r = 1.2 + depth
            d.ellipse((px - r, py - r, px + r, py + r), fill=AURORA + (al,))
    draw_rocks(True)

    # 从岛上飘起的微光
    for m in MOTES:
        ph = (m["phase"] + t / m["period"]) % 1.0
        a = math.sin(ph * math.pi)
        px = ix + m["x0"] + m["drift"] * ph
        py = iy - 10 - m["rise"] * ph
        d.ellipse((px - m["size"] * 2.2, py - m["size"] * 2.2, px + m["size"] * 2.2,
                   py + m["size"] * 2.2), fill=m["c"] + (int(26 * a),))
        d.ellipse((px - m["size"], py - m["size"], px + m["size"], py + m["size"]),
                  fill=m["c"] + (int(200 * a),))

    # 标题（0.4s–4.4s）
    ta = seg_alpha(t, 0.35, 4.5, fade=0.7)
    if ta > 0:
        ty_ = 128
        paste_glow_text(img, TITLE, CX, ty_, ta)
        paste_glow_text(img, SUBTITLE, CX, ty_ + 196, ta * 0.9)
        dd = ImageDraw.Draw(img, "RGBA")
        for sx_, sy_, ss, cc in ((CX - 178, ty_ + 66, 13, GOLD), (CX + 172, ty_ + 120, 9, AURORA),
                                 (CX - 250, ty_ + 170, 7, INK), (CX + 236, ty_ + 40, 8, GOLD)):
            draw_sparkle(dd, sx_, sy_, ss, cc, 200 * ta * (0.6 + 0.4 * math.sin(t * 2.4 + sx_)))

    # 底部字幕
    for cap in CAPTIONS:
        a = seg_alpha(t, cap["t0"], cap["t1"])
        if a > 0:
            paste_glow_text(img, cap["layer"], CX, H - 96, a * 0.92)

    # 结尾标语 + 星光迸发
    ea = seg_alpha(t, 10.8, 13.1, fade=0.6)
    if ea > 0:
        pulse = 0.85 + 0.15 * math.sin(t * 3.2)
        paste_glow_text(img, ENDING, CX, 236, ea * pulse)
        paste_glow_text(img, WELCOME_SUB, CX, 336, ea * 0.85)
        dd = ImageDraw.Draw(img, "RGBA")
        for k in range(10):
            ang = k * math.tau / 10 + 0.5
            dist = 190 + 26 * math.sin(k * 3.1)
            bx = CX + math.cos(ang) * dist
            by = 280 + math.sin(ang) * dist * 0.62
            draw_sparkle(dd, bx, by, 6 + (k % 3) * 3,
                         (GOLD, AURORA, INK)[k % 3], 190 * ea * (0.55 + 0.45 * math.sin(t * 3 + k)))

    # 首尾黑场（循环衔接）
    fade_in = 1 - smooth(t / 0.8)
    fade_out = smooth((t - (DUR - 0.6)) / 0.6)
    black = max(fade_in, fade_out)
    if black > 0.001:
        d.rectangle((0, 0, W, H), fill=(2, 3, 8, int(255 * black)))

    return img

# ---------------------------------------------------------------- 编码输出
def main():
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24",
        "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-c:v", "libx264", "-preset", "medium", "-crf", "26",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an", str(VIDEO_PATH),
    ]
    print(f"渲染 {N_FRAMES} 帧 → {VIDEO_PATH.name}")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE,
                            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    poster_t, best = 2.35, None
    for i in range(N_FRAMES):
        frame = render(i / FPS)
        if best is None or abs(i / FPS - poster_t) < abs(best[0] - poster_t):
            best = (i / FPS, frame)
        proc.stdin.write(frame.tobytes())
    proc.stdin.close()
    err = proc.stderr.read().decode("utf-8", "ignore")
    proc.wait()
    if proc.returncode != 0:
        sys.exit(f"ffmpeg 编码失败：\n{err[-1200:]}")

    best[1].save(POSTER_PATH, quality=84)
    size_mb = VIDEO_PATH.stat().st_size / 1024 / 1024
    print(f"完成：{VIDEO_PATH.name} {size_mb:.2f} MB，{POSTER_PATH.name}")

if __name__ == "__main__":
    main()
