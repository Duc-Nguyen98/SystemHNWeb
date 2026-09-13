from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageChops

from sync_gallery_assets import mismatches


ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


def validate_html(html_path: Path) -> None:
    """Validate one gallery entry point and the assets relative to it."""
    base = html_path.parent
    html = html_path.read_text(encoding="utf-8")
    images = re.findall(r"<img\b[^>]*>", html)
    if len(images) != 44:
        fail(f"{html_path}: expected 44 gallery images, found {len(images)}")
    if any("srcset=" not in tag or "sizes=" not in tag for tag in images):
        fail(f"{html_path}: every gallery image must provide srcset and sizes")

    refs = set(re.findall(r'\b(?:src|href)="([^"]+)"', html))
    for srcset in re.findall(r'\bsrcset="([^"]+)"', html):
        refs.update(item.strip().split()[0] for item in srcset.split(","))
    for ref in refs:
        if ref.startswith(("previews/", "handoff-")) and not (base / ref).exists():
            fail(f"{html_path}: missing asset: {ref}")

    for tag in images:
        src = re.search(r'src="([^"]+)"', tag).group(1)
        width = int(re.search(r'width="(\d+)"', tag).group(1))
        height = int(re.search(r'height="(\d+)"', tag).group(1))
        source = base / src
        with Image.open(source) as image:
            if image.size != (width, height):
                fail(f"{html_path}: intrinsic dimensions mismatch: {src} is {image.size}, attrs are {(width, height)}")
        candidates = [
            (item.strip().split()[0], int(item.strip().split()[1][:-1]))
            for item in re.search(r'srcset="([^"]+)"', tag).group(1).split(",")
        ]
        thumb_width = min(candidate_width for _, candidate_width in candidates)
        if thumb_width < 1400:
            fail(f"{html_path}: thumbnail below 2x guardrail: {src} ({thumb_width}w)")


def validate_dimensions(asset_root: Path) -> None:
    for directory, expected_count in [
        (asset_root / "previews/auth-jpg", 26),
        (asset_root / "previews/overview-jpg", 18),
    ]:
        files = list(directory.rglob("*.jpg"))
        if len(files) != expected_count:
            fail(f"{directory} expected {expected_count} JPGs, found {len(files)}")
        for file in files:
            with Image.open(file) as image:
                expected = (
                    (1920, 1080)
                    if "desktop" in file.parts
                    else (1440, 2048)
                    if directory.name == "auth-jpg"
                    else (1600, 2560)
                )
                if image.size != expected:
                    fail(f"wrong canvas size: {file} is {image.size}, expected {expected}")


def validate_shared_auth_hero(asset_root: Path) -> None:
    """The approved blue warehouse treatment must be shared by AUTH-01/02."""
    desktop_a = asset_root / "previews/auth-jpg/desktop/AUTH-01-dang-nhap-desktop-1920x1080.jpg"
    desktop_b = asset_root / "previews/auth-jpg/desktop/AUTH-02-xac-nhan-phien-desktop-1920x1080.jpg"
    tablet_a = asset_root / "previews/auth-jpg/tablet/AUTH-01-dang-nhap-tablet-1440x2048.jpg"
    tablet_b = asset_root / "previews/auth-jpg/tablet/AUTH-02-xac-nhan-phien-tablet-1440x2048.jpg"
    with Image.open(desktop_a) as first, Image.open(desktop_b) as second:
        first_crop = first.convert("RGB").crop((0, 0, 960, 1080))
        second_crop = second.convert("RGB").crop((0, 0, 960, 1080))
        if ImageChops.difference(first_crop, second_crop).getbbox():
            fail(f"{asset_root}: AUTH-02 desktop hero differs from the AUTH-01 blue baseline")
    with Image.open(tablet_a) as first, Image.open(tablet_b) as second:
        # The card begins below this boundary; compare only the unobscured hero.
        first_crop = first.convert("RGB").crop((0, 0, 1440, 620))
        second_crop = second.convert("RGB").crop((0, 0, 1440, 620))
        if ImageChops.difference(first_crop, second_crop).getbbox():
            fail(f"{asset_root}: AUTH-02 tablet hero differs from the AUTH-01 blue baseline")


for html_path in (ROOT / "index.html", ROOT / "docs/index.html"):
    validate_html(html_path)
    validate_dimensions(html_path.parent)
    validate_shared_auth_hero(html_path.parent)

drift = mismatches()
if drift:
    for item in drift:
        print(f"FAIL: {item}")
    raise SystemExit(1)

print("PASS: root and docs galleries each contain 44 valid screens; AUTH hero is shared; mirrored assets are identical.")
