from __future__ import annotations

from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC_DESKTOP = ROOT / "previews/auth-jpg/desktop/AUTH-01-dang-nhap-desktop-1920x1080.jpg"
OUT_ROOT = ROOT / "previews"

# Hoa Nam UI tokens
NAVY = "#063A5A"
NAVY_DARK = "#032B46"
OCEAN = "#006D91"
CYAN = "#15B8C8"
INK = "#123A57"
MUTED = "#60798B"
SURFACE = "#F5FAFC"
WHITE = "#FFFFFF"
PALE = "#EAF6FA"
PALE_STRONG = "#DDF2F6"
LINE = "#D4E6ED"
SUCCESS = "#1D9462"
SUCCESS_BG = "#E2F5EB"
DANGER = "#C74448"
DANGER_BG = "#FFF0F0"
AMBER = "#A66A13"
AMBER_BG = "#FFF5DD"
SHADOW = (2, 45, 72, 34)

FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


def rgb(hex_color: str) -> tuple[int, int, int]:
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgba(hex_color: str, alpha: int) -> tuple[int, int, int, int]:
    return (*rgb(hex_color), alpha)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def rounded(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int,
            fill: str | tuple, outline: str | tuple | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int,
         fill: str = INK, bold: bool = False, anchor: str | None = None) -> None:
    draw.text(xy, value, font=font(size, bold), fill=fill, anchor=anchor)


def wrap_lines(draw: ImageDraw.ImageDraw, value: str, size: int, max_width: int,
               bold: bool = False) -> list[str]:
    f = font(size, bold)
    lines: list[str] = []
    current = ""
    for word in value.split():
        candidate = f"{current} {word}".strip()
        if not current or draw.textbbox((0, 0), candidate, font=f)[2] <= max_width:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int,
            max_width: int, fill: str = MUTED, bold: bool = False, spacing: int = 8) -> int:
    lines = wrap_lines(draw, value, size, max_width, bold)
    draw.multiline_text(xy, "\n".join(lines), font=font(size, bold), fill=fill, spacing=spacing)
    return len(lines) * size + max(0, len(lines) - 1) * spacing


def make_warehouse_background() -> Image.Image:
    # Reuse the established warehouse visual, but crop away the old text/UI and
    # apply an intentional monochrome treatment so new vector typography stays crisp.
    source = Image.open(SRC_DESKTOP).convert("RGB")
    clean = source.crop((0, 0, 960, 1080))
    clean = clean.resize((1440, 1620), Image.Resampling.LANCZOS)
    clean = clean.crop((0, 0, 1440, 1080))
    clean = clean.filter(ImageFilter.GaussianBlur(0.65))
    pixels = ImageOps.colorize(ImageOps.grayscale(clean), black="#053452", white="#2F96B3")
    overlay = Image.new("RGBA", pixels.size, rgba("#003B63", 118))
    pixels = Image.alpha_composite(pixels.convert("RGBA"), overlay)
    # Soft vignette, keeping the center aisle available for the copy.
    vignette = Image.new("L", pixels.size, 0)
    vd = ImageDraw.Draw(vignette)
    vd.ellipse((-260, -100, pixels.width + 260, pixels.height + 150), fill=210)
    vignette = vignette.filter(ImageFilter.GaussianBlur(180))
    dark = Image.new("RGBA", pixels.size, rgba("#021D31", 82))
    pixels = Image.composite(pixels, Image.alpha_composite(pixels, dark), vignette)
    return pixels.convert("RGB")


WAREHOUSE = make_warehouse_background()


def brand_mark(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1.0, dark: bool = False) -> None:
    size = int(66 * scale)
    # Use opaque colours because these renders are exported to RGB; drawing
    # semi-transparent RGBA directly would be flattened as white and create
    # the same washed-out artefact seen in the previous gallery.
    bg = "#1B6D87" if dark else PALE
    stroke = WHITE if dark else OCEAN
    rounded(draw, (x, y, x + size, y + size), int(17 * scale), bg, "#6CC4D0" if dark else LINE, max(1, int(2 * scale)))
    inset = int(16 * scale)
    # Scanner frame
    w = max(2, int(4 * scale))
    draw.line((x + inset, y + inset + 13 * scale, x + inset, y + inset, x + inset + 13 * scale, y + inset), fill=stroke, width=w, joint="curve")
    draw.line((x + size - inset - 13 * scale, y + inset, x + size - inset, y + inset, x + size - inset, y + inset + 13 * scale), fill=stroke, width=w, joint="curve")
    draw.line((x + inset, y + size - inset - 13 * scale, x + inset, y + size - inset, x + inset + 13 * scale, y + size - inset), fill=stroke, width=w, joint="curve")
    draw.line((x + size - inset - 13 * scale, y + size - inset, x + size - inset, y + size - inset, x + size - inset, y + size - inset - 13 * scale), fill=stroke, width=w, joint="curve")
    # Bold H/box glyph
    gx, gy = x + int(23 * scale), y + int(22 * scale)
    draw.rounded_rectangle((gx, gy, gx + int(20 * scale), gy + int(19 * scale)), radius=int(3 * scale), outline=stroke, width=w)
    draw.line((gx + 3 * scale, gy + 9 * scale, gx + 17 * scale, gy + 9 * scale), fill=stroke, width=w)


def draw_left_rail(img: Image.Image, desktop: bool, session: bool) -> None:
    draw = ImageDraw.Draw(img)
    if desktop:
        width, height = img.size
        rail_w = 720
        # A clean, vector-like rail keeps the new typography crisp at 1:1.
        # The previous source image carried baked-in text which created ghost
        # copies when reused as a background, so the redesign uses a restrained
        # warehouse-inspired grid instead.
        for x in range(rail_w):
            t = x / max(1, rail_w - 1)
            c = tuple(round(rgb("#063A5A")[i] * (1 - t) + rgb("#0E6681")[i] * t) for i in range(3))
            draw.line((x, 0, x, height), fill=c)
        for y in range(160, height, 108):
            draw.line((38, y, rail_w - 38, y), fill="#0A4A69", width=1)
        for y in range(0, height, 150):
            draw.line((36, y, rail_w - 36, y + 280), fill="#0A4A69", width=1)
        draw.line((rail_w - 1, 0, rail_w - 1, height), fill="#D4E6ED", width=2)
        # right-edge gradient to make the content boundary calm
        gradient = Image.new("RGBA", (230, height), (0, 0, 0, 0))
        gd = ImageDraw.Draw(gradient)
        for i in range(230):
            gd.line((i, 0, i, height), fill=rgba("#063A5A", int(175 * (i / 229) ** 1.7)))
        img.paste(gradient, (rail_w - 230, 0), gradient)
        brand_mark(draw, 72, 62, 1.0, dark=True)
        text(draw, (154, 75), "HOA NAM WMS", 25, WHITE, True)
        text(draw, (154, 111), "Web System · Kho vận", 16, "#D1EFF4")
        # thin system marker
        draw.line((74, 170, 190, 170), fill=CYAN, width=4)
        text(draw, (74, 202), "HỆ THỐNG QUẢN LÝ KHO", 15, "#BEEBF1", True)
        if session:
            text(draw, (74, 760), "Mỗi ca làm việc", 45, WHITE, True)
            wrapped(draw, (74, 820), "bắt đầu bằng một xác nhận rõ ràng.", 27, 520, "#E2F4F7", spacing=10)
            badge(draw, 74, 930, "Bảo mật phiên · Theo dõi quyền truy cập", dark=True)
        else:
            text(draw, (74, 760), "Kho vận rõ ràng.", 47, WHITE, True)
            text(draw, (74, 818), "Vận hành nhịp nhàng.", 47, WHITE, True)
            wrapped(draw, (74, 890), "Đăng nhập để tiếp tục công việc của bạn tại Hoa Nam.", 24, 525, "#E2F4F7", spacing=9)
            badge(draw, 74, 968, "Nhập · Xuất · Tồn", dark=True)
    else:
        width, height = img.size
        top_h = 560
        for y in range(top_h):
            t = y / max(1, top_h - 1)
            c = tuple(round(rgb("#063A5A")[i] * (1 - t) + rgb("#0E6681")[i] * t) for i in range(3))
            draw.line((0, y, width, y), fill=c)
        for x in range(80, width, 128):
            draw.line((x, 0, x - 140, top_h), fill="#0A4A69", width=1)
        for y in range(210, top_h, 96):
            draw.line((50, y, width - 50, y), fill="#0A4A69", width=1)
        gradient = Image.new("RGBA", (width, top_h), (0, 0, 0, 0))
        gd = ImageDraw.Draw(gradient)
        for y in range(top_h):
            gd.line((0, y, width, y), fill=rgba("#063A5A", int(120 * (1 - y / top_h))))
        img.paste(gradient, (0, 0), gradient)
        brand_mark(draw, 82, 62, 1.1, dark=True)
        text(draw, (174, 76), "HOA NAM WMS", 30, WHITE, True)
        text(draw, (174, 119), "Web System · Kho vận", 19, "#D1EFF4")
        draw.line((84, 198, 220, 198), fill=CYAN, width=5)
        if session:
            text(draw, (84, 244), "Xác nhận phiên", 46, WHITE, True)
            wrapped(draw, (84, 318), "Xác nhận đúng tài khoản trước khi bắt đầu ca.", 26, 790, "#E2F4F7", spacing=9)
        else:
            text(draw, (84, 244), "Đăng nhập an toàn.", 46, WHITE, True)
            wrapped(draw, (84, 318), "Tập trung vào công việc. Hoa Nam lo phần còn lại.", 26, 790, "#E2F4F7", spacing=9)
        badge(draw, 84, 458, "Nhập · Xuất · Tồn  /  24×7", dark=True)


def badge(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, dark: bool = False, color: str = OCEAN) -> None:
    f = font(15, True)
    width = draw.textbbox((0, 0), label, font=f)[2] + 34
    fill = "#145C76" if dark else PALE
    outline = "#4F9AAF" if dark else LINE
    txt = WHITE if dark else OCEAN
    rounded(draw, (x, y, x + width, y + 40), 20, fill, outline, 1)
    draw.ellipse((x + 14, y + 15, x + 22, y + 23), fill=CYAN if dark else color)
    text(draw, (x + 31, y + 20), label, 15, txt, True, "lm")


def panel_shadow(img: Image.Image, box: tuple[int, int, int, int], radius: int = 26) -> None:
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    x1, y1, x2, y2 = box
    sd.rounded_rectangle((x1 + 7, y1 + 13, x2 + 7, y2 + 13), radius=radius, fill=SHADOW)
    shadow = shadow.filter(ImageFilter.GaussianBlur(22))
    img.alpha_composite(shadow)


def panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int = 26) -> None:
    rounded(draw, box, radius, WHITE, LINE, 2)


def icon_user(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str = OCEAN, scale: int = 1) -> None:
    w = max(2, 3 * scale)
    draw.ellipse((cx - 10 * scale, cy - 16 * scale, cx + 10 * scale, cy + 4 * scale), outline=color, width=w)
    draw.arc((cx - 20 * scale, cy - 1 * scale, cx + 20 * scale, cy + 28 * scale), 180, 360, fill=color, width=w)


def icon_lock(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str = OCEAN, scale: int = 1) -> None:
    w = max(2, 3 * scale)
    draw.rounded_rectangle((cx - 15 * scale, cy - 2 * scale, cx + 15 * scale, cy + 22 * scale), radius=4 * scale, outline=color, width=w)
    draw.arc((cx - 11 * scale, cy - 19 * scale, cx + 11 * scale, cy + 7 * scale), 180, 360, fill=color, width=w)
    draw.ellipse((cx - 3 * scale, cy + 7 * scale, cx + 3 * scale, cy + 13 * scale), fill=color)


def icon_eye(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str = OCEAN, scale: int = 1) -> None:
    w = max(2, 2 * scale)
    draw.ellipse((cx - 19 * scale, cy - 12 * scale, cx + 19 * scale, cy + 12 * scale), outline=color, width=w)
    draw.ellipse((cx - 5 * scale, cy - 5 * scale, cx + 5 * scale, cy + 5 * scale), outline=color, width=w)


def icon_arrow(draw: ImageDraw.ImageDraw, x: int, y: int, color: str = WHITE, scale: int = 1) -> None:
    w = max(2, 3 * scale)
    draw.line((x, y, x + 25 * scale, y), fill=color, width=w)
    draw.line((x + 14 * scale, y - 10 * scale, x + 25 * scale, y), fill=color, width=w)
    draw.line((x + 14 * scale, y + 10 * scale, x + 25 * scale, y), fill=color, width=w)


def icon_play(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str = WHITE, scale: int = 1) -> None:
    draw.ellipse((cx - 22 * scale, cy - 22 * scale, cx + 22 * scale, cy + 22 * scale), outline=color, width=max(2, 2 * scale))
    draw.polygon([(cx - 5 * scale, cy - 10 * scale), (cx + 11 * scale, cy), (cx - 5 * scale, cy + 10 * scale)], fill=color)


def icon_info(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str = OCEAN, scale: int = 1) -> None:
    draw.ellipse((cx - 15 * scale, cy - 15 * scale, cx + 15 * scale, cy + 15 * scale), outline=color, width=max(2, 2 * scale))
    text(draw, (cx, cy + 1 * scale), "i", 21 * scale, color, True, "mm")


def icon_check(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str = SUCCESS, scale: int = 1) -> None:
    draw.ellipse((cx - 15 * scale, cy - 15 * scale, cx + 15 * scale, cy + 15 * scale), fill=rgba(SUCCESS, 28), outline=color, width=max(2, 2 * scale))
    draw.line((cx - 7 * scale, cy, cx - 1 * scale, cy + 6 * scale, cx + 9 * scale, cy - 7 * scale), fill=color, width=max(2, 2 * scale), joint="curve")


def icon_warning(draw: ImageDraw.ImageDraw, cx: int, cy: int, color: str = AMBER, scale: int = 1) -> None:
    draw.polygon([(cx, cy - 18 * scale), (cx + 18 * scale, cy + 16 * scale), (cx - 18 * scale, cy + 16 * scale)], outline=color, fill=None)
    text(draw, (cx, cy + 4 * scale), "!", 19 * scale, color, True, "mm")


def input_field(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, label: str, placeholder: str,
                kind: str, value: str = "", error: str | None = None, focus: bool = False,
                scale: int = 1) -> int:
    text(draw, (x, y), label, 17 * scale, INK, True)
    top = y + 33 * scale
    h = 66 * scale
    fill = DANGER_BG if error else WHITE
    outline = DANGER if error else OCEAN if focus else LINE
    rounded(draw, (x, top, x + w, top + h), 13 * scale, fill, outline, 2 * scale)
    if kind == "user":
        icon_user(draw, x + 32 * scale, top + 32 * scale, OCEAN if focus else MUTED, scale)
    else:
        icon_lock(draw, x + 32 * scale, top + 32 * scale, OCEAN if focus else MUTED, scale)
    content = value or placeholder
    text(draw, (x + 68 * scale, top + 33 * scale), content, 18 * scale, INK if value else MUTED, False, "lm")
    if kind == "lock":
        icon_eye(draw, x + w - 32 * scale, top + 33 * scale, MUTED, scale)
    if error:
        text(draw, (x, top + h + 23 * scale), error, 14 * scale, DANGER)
        return 116 * scale
    return 92 * scale


def button(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, label: str, kind: str = "primary",
           loading: bool = False, scale: int = 1) -> int:
    h = 64 * scale
    if kind == "primary":
        fill, outline, txt = OCEAN, OCEAN, WHITE
    elif kind == "secondary":
        fill, outline, txt = WHITE, LINE, INK
    elif kind == "danger":
        fill, outline, txt = DANGER, DANGER, WHITE
    else:
        fill, outline, txt = PALE, LINE, OCEAN
    rounded(draw, (x, y, x + w, y + h), 13 * scale, fill, outline, 2 * scale)
    if loading:
        # Simple deterministic spinner ring for the static state.
        draw.arc((x + 26 * scale, y + 20 * scale, x + 48 * scale, y + 42 * scale), 35, 315, fill=txt, width=3 * scale)
        text(draw, (x + 64 * scale, y + h // 2), label, 18 * scale, txt, True, "lm")
    else:
        text(draw, (x + w // 2 - (18 * scale if kind == "primary" else 0), y + h // 2), label, 18 * scale, txt, True, "mm")
        if kind == "primary":
            draw.ellipse((x + w - 52 * scale, y + 11 * scale, x + w - 11 * scale, y + h - 11 * scale), fill="#2184A1")
            icon_arrow(draw, x + w - 40 * scale, y + h // 2, WHITE, scale)
    return h


def footer(draw: ImageDraw.ImageDraw, y: int, width: int, center: int, scale: int = 1) -> None:
    line = LINE
    gap = 180 * scale
    span = 420 * scale
    draw.line((center - span, y, center - gap, y), fill=line, width=2 * scale)
    draw.line((center + gap, y, center + span, y), fill=line, width=2 * scale)
    text(draw, (center, y - 20 * scale), "HOA NAM WMS", 15 * scale, MUTED, True, "mm")
    text(draw, (center, y + 8 * scale), "VẬN HÀNH RÕ RÀNG · KẾT NỐI HIỆU QUẢ", 13 * scale, MUTED, False, "mm")


def info_note(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, title: str, body: str, scale: int = 1,
              tone: str = "info") -> int:
    if tone == "warning":
        fill, outline, icon_color = AMBER_BG, "#EBCB8A", AMBER
    elif tone == "danger":
        fill, outline, icon_color = DANGER_BG, "#F0B7B7", DANGER
    else:
        fill, outline, icon_color = PALE, LINE, OCEAN
    h = 82 * scale if body else 64 * scale
    rounded(draw, (x, y, x + w, y + h), 14 * scale, fill, outline, 1 * scale)
    if tone == "warning": icon_warning(draw, x + 31 * scale, y + 32 * scale, icon_color, scale)
    elif tone == "danger": icon_warning(draw, x + 31 * scale, y + 32 * scale, icon_color, scale)
    else: icon_info(draw, x + 31 * scale, y + 32 * scale, icon_color, scale)
    text(draw, (x + 62 * scale, y + 26 * scale), title, 15 * scale, INK, True)
    if body:
        text(draw, (x + 62 * scale, y + 53 * scale), body, 14 * scale, MUTED)
    return h


def desktop_auth(kind: str) -> Image.Image:
    img = Image.new("RGBA", (1920, 1080), SURFACE)
    draw_left_rail(img, True, kind in {"session", "starting", "expired"})
    draw = ImageDraw.Draw(img)
    # right surface and subtle top rule
    draw.rectangle((720, 0, 1919, 1079), fill=SURFACE)
    draw.line((720, 0, 720, 1079), fill=LINE, width=2)
    # small top-right context
    text(draw, (1810, 58), "HOA NAM WMS", 13, MUTED, True, "ra")
    text(draw, (1810, 82), "Web System", 12, MUTED, False, "ra")

    if kind in {"login", "loading", "validation"}:
        box = (1032, 168, 1780, 930)
        panel_shadow(img, box)
        panel(draw, box)
        x, y, x2, y2 = box
        pad = 58
        text(draw, (x + pad, y + 68), "Đăng nhập hệ thống", 31, INK, True)
        text(draw, (x + pad, y + 112), "Sử dụng tài khoản được cấp để tiếp tục.", 17, MUTED)
        draw.line((x + pad, y + 146, x2 - pad, y + 146), fill=LINE, width=2)
        input_field(draw, x + pad, y + 176, x2 - x - pad * 2, "Tên đăng nhập", "Nhập tên đăng nhập", "user", "minh.anh" if kind == "validation" else "", focus=kind == "validation")
        err = "Mật khẩu không đúng. Vui lòng kiểm tra lại." if kind == "validation" else None
        input_field(draw, x + pad, y + 292, x2 - x - pad * 2, "Mật khẩu", "Nhập mật khẩu", "lock", "••••••••" if kind == "validation" else "", error=err, focus=kind == "validation")
        row_y = y + (440 if kind == "validation" else 424)
        draw.rounded_rectangle((x + pad, row_y, x + pad + 22, row_y + 22), radius=5, outline=LINE, width=2, fill=PALE)
        if kind == "validation": draw.line((x + pad + 5, row_y + 11, x + pad + 10, row_y + 16, x + pad + 18, row_y + 6), fill=OCEAN, width=2)
        text(draw, (x + pad + 34, row_y + 11), "Ghi nhớ đăng nhập", 15, MUTED, False, "lm")
        text(draw, (x2 - pad, row_y + 11), "Quên mật khẩu?", 15, OCEAN, True, "rm")
        button(draw, x + pad, row_y + 42, x2 - x - pad * 2, "Đang xác thực…" if kind == "loading" else "Đăng nhập", loading=kind == "loading")
        note_y = row_y + 124
        info_note(draw, x + pad, note_y, x2 - x - pad * 2, "Quyền truy cập theo tài khoản", "Mọi hoạt động được ghi nhận trong nhật ký phiên.", scale=1)
        text(draw, (x + pad, y2 - 24), "Hỗ trợ quản trị  ·  Chính sách bảo mật", 13, MUTED)
    else:
        # Extra vertical room keeps the secondary action and device metadata
        # in their own rows instead of colliding at the card edge.
        box = (1014, 116, 1796, 986)
        panel_shadow(img, box)
        panel(draw, box)
        x, y, x2, y2 = box
        pad = 58
        text(draw, (x + pad, y + 64), "Xác nhận phiên làm việc", 31, INK, True)
        text(draw, (x + pad, y + 108), "Kiểm tra thông tin trước khi bắt đầu ca.", 17, MUTED)
        draw.line((x + pad, y + 142, x2 - pad, y + 142), fill=LINE, width=2)
        # profile
        draw.ellipse((x + pad, y + 180, x + pad + 92, y + 272), fill=OCEAN)
        text(draw, (x + pad + 46, y + 226), "MA", 28, WHITE, True, "mm")
        text(draw, (x + pad + 120, y + 204), "Minh Anh", 26, INK, True)
        text(draw, (x + pad + 120, y + 240), "Nhân viên kho", 16, MUTED)
        badge(draw, x2 - pad - 156, y + 208, "Đang hoạt động", color=SUCCESS)
        # context rows
        draw.line((x + pad, y + 310, x2 - pad, y + 310), fill=LINE, width=2)
        rounded(draw, (x + pad, y + 348, x + pad + 58, y + 406), 14, PALE_STRONG, LINE, 1)
        # home glyph
        draw.polygon([(x + pad + 17, y + 380), (x + pad + 29, y + 368), (x + pad + 41, y + 380), (x + pad + 41, y + 394), (x + pad + 17, y + 394)], outline=OCEAN)
        text(draw, (x + pad + 82, y + 364), "Kho Hoa Nam", 19, INK, True)
        text(draw, (x + pad + 82, y + 393), "WMS · Vận hành chuyên nghiệp", 15, MUTED)
        info_note(draw, x + pad, y + 438, x2 - x - pad * 2, "Bạn có thể bắt đầu ca làm việc", "Các thao tác sẽ theo đúng quyền được cấp.", scale=1)
        if kind == "starting":
            button(draw, x + pad, y + 570, x2 - x - pad * 2, "Đang kết nối…", loading=True)
        elif kind == "expired":
            info_note(draw, x + pad, y + 570, x2 - x - pad * 2, "Phiên đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục.", scale=1, tone="warning")
            button(draw, x + pad, y + 686, x2 - x - pad * 2, "Đăng nhập lại", kind="primary")
        else:
            button(draw, x + pad, y + 570, x2 - x - pad * 2, "Bắt đầu ca làm việc", kind="primary")
        if kind != "expired":
            text(draw, ((x + x2) // 2, y + 690), "hoặc", 15, MUTED, False, "mm")
            draw.line((x + pad, y + 690, x + pad + 260, y + 690), fill=LINE, width=2)
            draw.line((x2 - pad - 260, y + 690, x2 - pad, y + 690), fill=LINE, width=2)
            button(draw, x + pad, y + 730, x2 - x - pad * 2, "Đăng xuất", kind="secondary")
        text(draw, (x + pad, y2 - 24), "Thiết bị: Chrome · Khu vực: Hà Nội", 13, MUTED)
    footer(draw, 1034, 1920, 1320)
    return img


def tablet_auth(kind: str) -> Image.Image:
    img = Image.new("RGBA", (1440, 2048), SURFACE)
    draw_left_rail(img, False, kind in {"session", "starting", "expired"})
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 560, 1439, 2047), fill=SURFACE)
    if kind in {"login", "loading", "validation"}:
        box = (84, 646, 1356, 1584)
        panel_shadow(img, box, 30)
        panel(draw, box, 30)
        x, y, x2, y2 = box
        pad = 78
        text(draw, (x + pad, y + 84), "Đăng nhập hệ thống", 38, INK, True)
        text(draw, (x + pad, y + 134), "Sử dụng tài khoản được cấp để tiếp tục.", 21, MUTED)
        draw.line((x + pad, y + 176, x2 - pad, y + 176), fill=LINE, width=2)
        input_field(draw, x + pad, y + 222, x2 - x - pad * 2, "Tên đăng nhập", "Nhập tên đăng nhập", "user", "minh.anh" if kind == "validation" else "", focus=kind == "validation", scale=1)
        err = "Mật khẩu không đúng. Vui lòng kiểm tra lại." if kind == "validation" else None
        input_field(draw, x + pad, y + 366, x2 - x - pad * 2, "Mật khẩu", "Nhập mật khẩu", "lock", "••••••••" if kind == "validation" else "", error=err, focus=kind == "validation", scale=1)
        row_y = y + (522 if kind == "validation" else 506)
        draw.rounded_rectangle((x + pad, row_y, x + pad + 24, row_y + 24), radius=5, outline=LINE, width=2, fill=PALE)
        if kind == "validation": draw.line((x + pad + 5, row_y + 12, x + pad + 11, row_y + 18, x + pad + 20, row_y + 6), fill=OCEAN, width=2)
        text(draw, (x + pad + 38, row_y + 12), "Ghi nhớ đăng nhập", 18, MUTED, False, "lm")
        text(draw, (x2 - pad, row_y + 12), "Quên mật khẩu?", 18, OCEAN, True, "rm")
        button(draw, x + pad, row_y + 52, x2 - x - pad * 2, "Đang xác thực…" if kind == "loading" else "Đăng nhập", loading=kind == "loading", scale=1)
        info_note(draw, x + pad, row_y + 140, x2 - x - pad * 2, "Quyền truy cập theo tài khoản", "Mọi hoạt động được ghi nhận trong nhật ký phiên.", scale=1)
        text(draw, (x + pad, y2 - 28), "Hỗ trợ quản trị  ·  Chính sách bảo mật", 16, MUTED)
    else:
        # Tablet uses a stacked card with enough room for both actions and the
        # device metadata; no overlap or clipped footer is allowed.
        box = (84, 632, 1356, 1604)
        panel_shadow(img, box, 30)
        panel(draw, box, 30)
        x, y, x2, y2 = box
        pad = 78
        text(draw, (x + pad, y + 82), "Xác nhận phiên làm việc", 38, INK, True)
        text(draw, (x + pad, y + 132), "Kiểm tra thông tin trước khi bắt đầu ca.", 21, MUTED)
        draw.line((x + pad, y + 176, x2 - pad, y + 176), fill=LINE, width=2)
        draw.ellipse((x + pad, y + 220, x + pad + 116, y + 336), fill=OCEAN)
        text(draw, (x + pad + 58, y + 278), "MA", 35, WHITE, True, "mm")
        text(draw, (x + pad + 150, y + 248), "Minh Anh", 32, INK, True)
        text(draw, (x + pad + 150, y + 294), "Nhân viên kho", 21, MUTED)
        badge(draw, x2 - pad - 185, y + 260, "Đang hoạt động", color=SUCCESS)
        draw.line((x + pad, y + 378, x2 - pad, y + 378), fill=LINE, width=2)
        rounded(draw, (x + pad, y + 420, x + pad + 68, y + 488), 16, PALE_STRONG, LINE, 1)
        draw.polygon([(x + pad + 20, y + 456), (x + pad + 34, y + 442), (x + pad + 48, y + 456), (x + pad + 48, y + 474), (x + pad + 20, y + 474)], outline=OCEAN)
        text(draw, (x + pad + 98, y + 436), "Kho Hoa Nam", 23, INK, True)
        text(draw, (x + pad + 98, y + 472), "WMS · Vận hành chuyên nghiệp", 19, MUTED)
        info_note(draw, x + pad, y + 532, x2 - x - pad * 2, "Bạn có thể bắt đầu ca làm việc", "Các thao tác sẽ theo đúng quyền được cấp.", scale=1)
        if kind == "starting":
            button(draw, x + pad, y + 670, x2 - x - pad * 2, "Đang kết nối…", loading=True, scale=1)
        elif kind == "expired":
            info_note(draw, x + pad, y + 670, x2 - x - pad * 2, "Phiên đã hết hạn", "Vui lòng đăng nhập lại để tiếp tục.", scale=1, tone="warning")
            button(draw, x + pad, y + 788, x2 - x - pad * 2, "Đăng nhập lại", scale=1)
        else:
            button(draw, x + pad, y + 670, x2 - x - pad * 2, "Bắt đầu ca làm việc", scale=1)
        if kind != "expired":
            text(draw, ((x + x2) // 2, y + 796), "hoặc", 18, MUTED, False, "mm")
            draw.line((x + pad, y + 796, x + pad + 440, y + 796), fill=LINE, width=2)
            draw.line((x2 - pad - 440, y + 796, x2 - pad, y + 796), fill=LINE, width=2)
            button(draw, x + pad, y + 840, x2 - x - pad * 2, "Đăng xuất", kind="secondary")
        text(draw, (x + pad, y2 - 28), "Thiết bị: Chrome · Khu vực: Hà Nội", 16, MUTED)
    footer(draw, 1940, 1440, 720)
    return img


STATES = {
    "AUTH-01-dang-nhap": "login",
    "AUTH-01-dang-nhap-loading": "loading",
    "AUTH-01-dang-nhap-validation-error": "validation",
    "AUTH-02-xac-nhan-phien": "session",
    "AUTH-02-xac-nhan-phien-starting": "starting",
    "AUTH-02-xac-nhan-phien-expired": "expired",
}


def write_state(stem: str, kind: str) -> None:
    desktop = desktop_auth(kind).convert("RGB")
    tablet = tablet_auth(kind).convert("RGB")
    for device, image, size, thumb_size in [
        ("desktop", desktop, "1920x1080", (1440, 810)),
        ("tablet", tablet, "1440x2048", (1400, 1991)),
    ]:
        base = OUT_ROOT / "auth-png" / device
        base.mkdir(parents=True, exist_ok=True)
        png = base / f"{stem}-{device}-{size}.png"
        # Atomic writes prevent a partially written image from ever becoming
        # the published asset if the renderer is interrupted.
        png_tmp = png.with_suffix(".tmp.png")
        image.save(png_tmp, optimize=True)
        png_tmp.replace(png)
        # Keep the existing JPG URLs alive, now backed by the redesigned render.
        jpg_base = OUT_ROOT / "auth-jpg" / device
        if "loading" in stem or "validation-error" in stem or "starting" in stem or "expired" in stem:
            jpg_base = jpg_base / "states"
        jpg_base.mkdir(parents=True, exist_ok=True)
        jpg_path = jpg_base / f"{stem}-{device}-{size}.jpg"
        jpg_tmp = jpg_path.with_suffix(".tmp.jpg")
        image.save(jpg_tmp, quality=98, subsampling=0, optimize=True)
        jpg_tmp.replace(jpg_path)
        thumb = image.resize(thumb_size, Image.Resampling.LANCZOS)
        thumb_base = OUT_ROOT / "auth-thumbs" / device
        thumb_base.mkdir(parents=True, exist_ok=True)
        thumb_path = thumb_base / f"{stem}-{device}-{size}.webp"
        thumb_tmp = thumb_path.with_suffix(".tmp.webp")
        thumb.save(thumb_tmp, "WEBP", quality=96, method=6)
        thumb_tmp.replace(thumb_path)


def main() -> None:
    for stem, kind in STATES.items():
        write_state(stem, kind)
    print(f"Rendered {len(STATES) * 2} redesigned AUTH screens")


if __name__ == "__main__":
    main()
