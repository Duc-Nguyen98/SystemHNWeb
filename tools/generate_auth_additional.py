from __future__ import annotations

from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
DESKTOP_BASE = ROOT / "previews/auth-png/desktop/AUTH-01-dang-nhap-desktop-1920x1080.png"
TABLET_BASE = ROOT / "previews/auth-png/tablet/AUTH-01-dang-nhap-tablet-1440x2048.png"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

NAVY = (0, 78, 116)
INK = (23, 50, 77)
MUTED = (96, 120, 139)
LINE = (215, 230, 238)
PALE = (234, 245, 248)
SURFACE = (245, 250, 252)
BLUE = (22, 131, 168)
RED = (194, 65, 58)
AMBER = (185, 120, 9)
GREEN = (22, 134, 91)


STATES = [
    {
        "id": "AUTH-03",
        "slug": "xac-thuc-otp",
        "label": "OTP / Verify",
        "title": "Xác thực phiên làm việc",
        "subtitle": "Nhập mã 6 số đã gửi đến số điện thoại kết thúc bằng 6789.",
        "kind": "otp",
    },
    {
        "id": "AUTH-04",
        "slug": "quen-mat-khau",
        "label": "Quên mật khẩu",
        "title": "Quên mật khẩu",
        "subtitle": "Nhập tên đăng nhập để nhận hướng dẫn đặt lại mật khẩu.",
        "kind": "forgot",
    },
    {
        "id": "AUTH-05",
        "slug": "dat-lai-mat-khau",
        "label": "Đặt lại mật khẩu",
        "title": "Đặt lại mật khẩu",
        "subtitle": "Tạo mật khẩu mới an toàn cho tài khoản của bạn.",
        "kind": "reset",
    },
    {
        "id": "AUTH-ERR-403",
        "slug": "khong-co-quyen",
        "label": "403 · Không có quyền",
        "title": "Không có quyền truy cập",
        "subtitle": "Tài khoản của bạn chưa được cấp quyền mở trang này.",
        "kind": "403",
    },
    {
        "id": "AUTH-ERR-404",
        "slug": "khong-tim-thay",
        "label": "404 · Không tìm thấy",
        "title": "Không tìm thấy trang",
        "subtitle": "Đường dẫn này không tồn tại hoặc đã được thay đổi.",
        "kind": "404",
    },
    {
        "id": "AUTH-ERR-500",
        "slug": "loi-he-thong",
        "label": "500 · Lỗi hệ thống",
        "title": "Hệ thống đang gặp sự cố",
        "subtitle": "Không thể tải dữ liệu lúc này. Vui lòng thử lại sau.",
        "kind": "500",
    },
    {
        "id": "AUTH-OPS",
        "slug": "maintenance-bao-tri",
        "label": "Maintenance",
        "title": "Hệ thống đang bảo trì",
        "subtitle": "Hoa Nam WMS sẽ sớm hoạt động trở lại.",
        "kind": "maintenance",
    },
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT_BOLD if bold else FONT_REG, size)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int,
         fill=INK, bold: bool = False, anchor: str | None = None) -> None:
    draw.text(xy, value, font=font(size, bold), fill=fill, anchor=anchor)


def wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, size: int,
            max_width: int, fill=MUTED, bold: bool = False, spacing: int = 8) -> int:
    f = font(size, bold)
    words = value.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=f)[2] <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    draw.multiline_text(xy, "\n".join(lines), font=f, fill=fill, spacing=spacing)
    return len(lines) * (size + spacing)


def rounded(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def card(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int]) -> None:
    shadow = Image.new("RGBA", draw._image.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    x1, y1, x2, y2 = box
    sd.rounded_rectangle((x1 + 4, y1 + 12, x2 + 4, y2 + 12), radius=24, fill=(0, 59, 99, 42))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    draw._image.paste(shadow, (0, 0), shadow)
    rounded(draw, box, 24, (255, 255, 255), LINE, 2)


def field(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, label: str, value: str,
          icon: str = "user", error: str | None = None) -> int:
    text(draw, (x, y), label, 24, INK, True)
    top = y + 46
    fill = (248, 252, 253) if not error else (255, 248, 247)
    outline = LINE if not error else (218, 95, 86)
    rounded(draw, (x, top, x + w, top + 72), 14, fill, outline, 2)
    if icon == "user":
        draw.ellipse((x + 24, top + 17, x + 45, top + 38), outline=(108, 145, 167), width=3)
        draw.arc((x + 15, top + 34, x + 54, top + 68), 180, 360, fill=(108, 145, 167), width=3)
    elif icon == "lock":
        draw.rounded_rectangle((x + 22, top + 33, x + 52, top + 60), radius=4, outline=(108, 145, 167), width=3)
        draw.arc((x + 27, top + 12, x + 47, top + 44), 180, 360, fill=(108, 145, 167), width=3)
    text(draw, (x + 76, top + 36), value, 24, MUTED, anchor="lm")
    if error:
        text(draw, (x, top + 86), error, 18, RED)
        return 122
    return 92


def pill(draw: ImageDraw.ImageDraw, x: int, y: int, label: str, color=BLUE) -> None:
    f = font(18, True)
    width = draw.textbbox((0, 0), label, font=f)[2] + 32
    rounded(draw, (x, y, x + width, y + 40), 20, tuple(list(color) + [35]) if len(color) == 4 else PALE, color, 2)
    text(draw, (x + 16, y + 20), label, 18, color, True, "lm")


def action_button(draw: ImageDraw.ImageDraw, x: int, y: int, w: int, label: str,
                  color=NAVY, arrow: bool = True) -> None:
    rounded(draw, (x, y, x + w, y + 72), 14, color, color, 1)
    text(draw, (x + w // 2 - (18 if arrow else 0), y + 36), label, 24, (255, 255, 255), True, "mm")
    if arrow:
        draw.line((x + w - 66, y + 36, x + w - 34, y + 36), fill=(255, 255, 255), width=3)
        draw.line((x + w - 46, y + 24, x + w - 34, y + 36), fill=(255, 255, 255), width=3)
        draw.line((x + w - 46, y + 48, x + w - 34, y + 36), fill=(255, 255, 255), width=3)


def icon_badge(draw: ImageDraw.ImageDraw, cx: int, cy: int, kind: str) -> None:
    color = RED if kind in {"500", "404"} else AMBER if kind == "maintenance" else BLUE
    draw.ellipse((cx - 66, cy - 66, cx + 66, cy + 66), fill=PALE, outline=color, width=4)
    if kind == "404":
        text(draw, (cx, cy + 2), "404", 32, color, True, "mm")
    elif kind == "500":
        text(draw, (cx, cy + 2), "!", 56, color, True, "mm")
    elif kind == "maintenance":
        draw.ellipse((cx - 28, cy - 28, cx + 28, cy + 28), outline=color, width=5)
        draw.line((cx, cy, cx, cy - 18), fill=color, width=5)
        draw.line((cx, cy, cx + 16, cy + 10), fill=color, width=5)
    elif kind == "403":
        draw.polygon([(cx, cy - 38), (cx + 38, cy - 18), (cx + 28, cy + 34), (cx, cy + 52), (cx - 28, cy + 34), (cx - 38, cy - 18)], outline=color, fill=None)
        draw.line((cx - 14, cy + 4, cx + 14, cy + 4), fill=color, width=5)
    else:
        draw.ellipse((cx - 24, cy - 24, cx + 24, cy + 24), outline=color, width=5)
        draw.line((cx, cy - 24, cx, cy + 24), fill=color, width=5)
        draw.line((cx - 24, cy, cx + 24, cy), fill=color, width=5)


def footer(draw: ImageDraw.ImageDraw, width: int, y: int, center: int | None = None) -> None:
    line = (188, 207, 216)
    cx = width // 2 if center is None else center
    draw.line((cx - 370, y, cx - 80, y), fill=line, width=2)
    draw.line((cx + 80, y, cx + 370, y), fill=line, width=2)
    text(draw, (cx, y - 30), "HOA NAM SCANNER", 18, MUTED, True, "mm")
    text(draw, (cx, y + 2), "KẾT NỐI CON NGƯỜI - VẬN HÀNH HIỆU QUẢ", 16, MUTED, False, "mm")


def render_desktop(state: dict) -> Image.Image:
    img = Image.open(DESKTOP_BASE).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw.rectangle((960, 0, 1919, 1079), fill=SURFACE)
    draw.line((960, 0, 960, 1079), fill=LINE, width=2)
    box = (1055, 112, 1825, 968)
    card(draw, box)
    x, y, x2, y2 = box
    pad = 54
    if state["kind"] in {"403", "404", "500", "maintenance"}:
        icon_badge(draw, (x + x2) // 2, y + 128, state["kind"])
        text(draw, ((x + x2) // 2, y + 236), state["title"], 32, INK, True, "ma")
        wrapped(draw, (x + pad, y + 274), state["subtitle"], 21, x2 - x - pad * 2, MUTED, False, 7)
        if state["kind"] == "404":
            pill(draw, x + pad, y + 376, "Đường dẫn không tồn tại", RED)
            button_y = y + 472
        elif state["kind"] == "500":
            pill(draw, x + pad, y + 376, "Mã lỗi máy chủ · 500", RED)
            button_y = y + 472
        elif state["kind"] == "maintenance":
            pill(draw, x + pad, y + 376, "Dự kiến hoàn tất · 02:00", AMBER)
            button_y = y + 472
        else:
            pill(draw, x + pad, y + 376, "Liên hệ quản trị viên để cấp quyền", BLUE)
            button_y = y + 472
        action_button(draw, x + pad, button_y, x2 - x - pad * 2, "Thử lại" if state["kind"] in {"500", "maintenance"} else "Về Tổng quan")
        text(draw, ((x + x2) // 2, button_y + 112), "Quay lại đăng nhập", 20, BLUE, True, "ma")
    elif state["kind"] == "otp":
        text(draw, (x + pad, y + 72), state["title"], 28, INK, True)
        wrapped(draw, (x + pad, y + 124), state["subtitle"], 20, x2 - x - pad * 2, MUTED)
        text(draw, (x + pad, y + 225), "Mã xác thực", 24, INK, True)
        gap = 14
        bw = (x2 - x - pad * 2 - gap * 5) // 6
        for i in range(6):
            bx = x + pad + i * (bw + gap)
            rounded(draw, (bx, y + 272, bx + bw, y + 344), 12, (248, 252, 253), LINE, 2)
            text(draw, ((bx + bx + bw) // 2, y + 308), "" if i > 1 else ("4" if i == 0 else "8"), 30, INK, True, "mm")
        text(draw, (x + pad, y + 388), "Mã có hiệu lực trong 00:45", 19, MUTED)
        action_button(draw, x + pad, y + 444, x2 - x - pad * 2, "Xác nhận mã")
        text(draw, ((x + x2) // 2, y + 552), "Gửi lại mã", 20, BLUE, True, "ma")
        text(draw, ((x + x2) // 2, y + 606), "Quay lại đăng nhập", 20, MUTED, False, "ma")
    elif state["kind"] == "forgot":
        text(draw, (x + pad, y + 92), state["title"], 28, INK, True)
        wrapped(draw, (x + pad, y + 144), state["subtitle"], 20, x2 - x - pad * 2, MUTED)
        field(draw, x + pad, y + 244, x2 - x - pad * 2, "Tên đăng nhập", "Nhập tên đăng nhập", "user")
        action_button(draw, x + pad, y + 408, x2 - x - pad * 2, "Gửi liên kết")
        text(draw, ((x + x2) // 2, y + 532), "Quay lại đăng nhập", 20, BLUE, True, "ma")
        pill(draw, x + pad, y + 620, "Liên kết có hiệu lực trong 30 phút", BLUE)
    elif state["kind"] == "reset":
        text(draw, (x + pad, y + 72), state["title"], 28, INK, True)
        wrapped(draw, (x + pad, y + 124), state["subtitle"], 20, x2 - x - pad * 2, MUTED)
        field(draw, x + pad, y + 220, x2 - x - pad * 2, "Mật khẩu mới", "Nhập mật khẩu mới", "lock")
        field(draw, x + pad, y + 354, x2 - x - pad * 2, "Xác nhận mật khẩu", "Nhập lại mật khẩu", "lock")
        rounded(draw, (x + pad, y + 500, x2 - pad, y + 580), 14, PALE, LINE, 1)
        text(draw, (x + pad + 22, y + 524), "Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa và số.", 18, MUTED)
        action_button(draw, x + pad, y + 632, x2 - x - pad * 2, "Lưu mật khẩu")
    footer(draw, 1920, 1020, 1440)
    return img


def render_tablet(state: dict) -> Image.Image:
    img = Image.open(TABLET_BASE).convert("RGB")
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, 720, 1439, 2047), fill=SURFACE)
    box = (112, 650, 1328, 1870)
    card(draw, box)
    x, y, x2, y2 = box
    pad = 74
    center = (x + x2) // 2
    if state["kind"] in {"403", "404", "500", "maintenance"}:
        icon_badge(draw, center, y + 130, state["kind"])
        text(draw, (center, y + 260), state["title"], 34, INK, True, "ma")
        wrapped(draw, (x + pad, y + 306), state["subtitle"], 23, x2 - x - pad * 2, MUTED, False, 9)
        label = {"403": "Liên hệ quản trị viên để cấp quyền", "404": "Đường dẫn không tồn tại", "500": "Mã lỗi máy chủ · 500", "maintenance": "Dự kiến hoàn tất · 02:00"}[state["kind"]]
        pill(draw, x + pad, y + 430, label, RED if state["kind"] in {"404", "500"} else AMBER if state["kind"] == "maintenance" else BLUE)
        action_button(draw, x + pad, y + 560, x2 - x - pad * 2, "Thử lại" if state["kind"] in {"500", "maintenance"} else "Về Tổng quan")
        text(draw, (center, y + 680), "Quay lại đăng nhập", 22, BLUE, True, "ma")
    elif state["kind"] == "otp":
        text(draw, (x + pad, y + 92), state["title"], 34, INK, True)
        wrapped(draw, (x + pad, y + 150), state["subtitle"], 23, x2 - x - pad * 2, MUTED, False, 9)
        text(draw, (x + pad, y + 286), "Mã xác thực", 25, INK, True)
        gap = 14
        bw = (x2 - x - pad * 2 - gap * 5) // 6
        for i in range(6):
            bx = x + pad + i * (bw + gap)
            rounded(draw, (bx, y + 342, bx + bw, y + 430), 14, (248, 252, 253), LINE, 2)
            text(draw, ((bx + bx + bw) // 2, y + 386), "" if i > 1 else ("4" if i == 0 else "8"), 34, INK, True, "mm")
        text(draw, (x + pad, y + 476), "Mã có hiệu lực trong 00:45", 21, MUTED)
        action_button(draw, x + pad, y + 556, x2 - x - pad * 2, "Xác nhận mã")
        text(draw, (center, y + 678), "Gửi lại mã", 22, BLUE, True, "ma")
        text(draw, (center, y + 728), "Quay lại đăng nhập", 22, MUTED, False, "ma")
    elif state["kind"] == "forgot":
        text(draw, (x + pad, y + 110), state["title"], 34, INK, True)
        wrapped(draw, (x + pad, y + 168), state["subtitle"], 23, x2 - x - pad * 2, MUTED, False, 9)
        field(draw, x + pad, y + 310, x2 - x - pad * 2, "Tên đăng nhập", "Nhập tên đăng nhập", "user")
        action_button(draw, x + pad, y + 488, x2 - x - pad * 2, "Gửi liên kết")
        text(draw, (center, y + 620), "Quay lại đăng nhập", 22, BLUE, True, "ma")
        pill(draw, x + pad, y + 730, "Liên kết có hiệu lực trong 30 phút", BLUE)
    elif state["kind"] == "reset":
        text(draw, (x + pad, y + 92), state["title"], 34, INK, True)
        wrapped(draw, (x + pad, y + 150), state["subtitle"], 23, x2 - x - pad * 2, MUTED, False, 9)
        field(draw, x + pad, y + 286, x2 - x - pad * 2, "Mật khẩu mới", "Nhập mật khẩu mới", "lock")
        field(draw, x + pad, y + 450, x2 - x - pad * 2, "Xác nhận mật khẩu", "Nhập lại mật khẩu", "lock")
        rounded(draw, (x + pad, y + 624, x2 - pad, y + 718), 14, PALE, LINE, 1)
        text(draw, (x + pad + 24, y + 653), "Tối thiểu 8 ký tự, gồm chữ hoa và số.", 21, MUTED)
        action_button(draw, x + pad, y + 780, x2 - x - pad * 2, "Lưu mật khẩu")
    footer(draw, 1440, 1960)
    return img


def save_state(state: dict) -> None:
    desktop_name = f"{state['id']}-{state['slug']}-desktop-1920x1080"
    tablet_name = f"{state['id']}-{state['slug']}-tablet-1440x2048"
    out_dirs = [
        (ROOT / "previews/auth-jpg/desktop", ROOT / "previews/auth-png/desktop", ROOT / "previews/auth-thumbs/desktop", desktop_name, render_desktop(state), (1440, 810)),
        (ROOT / "previews/auth-jpg/tablet", ROOT / "previews/auth-png/tablet", ROOT / "previews/auth-thumbs/tablet", tablet_name, render_tablet(state), (1400, 1991)),
    ]
    for jpg_dir, png_dir, thumb_dir, name, image, thumb_size in out_dirs:
        jpg_dir.mkdir(parents=True, exist_ok=True)
        png_dir.mkdir(parents=True, exist_ok=True)
        thumb_dir.mkdir(parents=True, exist_ok=True)
        image.save(jpg_dir / f"{name}.jpg", quality=95, subsampling=0, optimize=True)
        image.save(png_dir / f"{name}.png", optimize=True)
        thumb = image.resize(thumb_size, Image.Resampling.LANCZOS)
        thumb.save(thumb_dir / f"{name}.webp", "WEBP", quality=92, method=6)


if __name__ == "__main__":
    for state in STATES:
        save_state(state)
    print(f"Generated {len(STATES) * 2} AUTH screens in Desktop and Tablet formats.")
