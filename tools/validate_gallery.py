from __future__ import annotations

import re
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "index.html"


def fail(message: str) -> None:
    raise SystemExit(f"FAIL: {message}")


html = HTML.read_text(encoding="utf-8")
images = re.findall(r"<img\b[^>]*>", html)
if len(images) != 44:
    fail(f"expected 44 gallery images, found {len(images)}")
if any("srcset=" not in tag or "sizes=" not in tag for tag in images):
    fail("every gallery image must provide srcset and sizes")

refs = set(re.findall(r'\b(?:src|href)="([^"]+)"', html))
for srcset in re.findall(r'\bsrcset="([^"]+)"', html):
    refs.update(item.strip().split()[0] for item in srcset.split(","))
for ref in refs:
    if ref.startswith(("previews/", "handoff-")) and not (ROOT / ref).exists():
        fail(f"missing asset: {ref}")

for tag in images:
    src = re.search(r'src="([^"]+)"', tag).group(1)
    width = int(re.search(r'width="(\d+)"', tag).group(1))
    height = int(re.search(r'height="(\d+)"', tag).group(1))
    with Image.open(ROOT / src) as image:
        if image.size != (width, height):
            fail(f"intrinsic dimensions mismatch: {src} is {image.size}, attrs are {(width, height)}")
    candidates = [
        (item.strip().split()[0], int(item.strip().split()[1][:-1]))
        for item in re.search(r'srcset="([^"]+)"', tag).group(1).split(",")
    ]
    thumb_width = min(width for _, width in candidates)
    if thumb_width < 1400:
        fail(f"thumbnail below 2x guardrail: {src} ({thumb_width}w)")

for directory, expected_count in [
    (ROOT / "previews/auth-jpg", 26),
    (ROOT / "previews/overview-jpg", 18),
]:
    files = list(directory.rglob("*.jpg"))
    if len(files) != expected_count:
        fail(f"{directory} expected {expected_count} JPGs, found {len(files)}")
    for file in files:
        with Image.open(file) as image:
            expected = (1920, 1080) if "desktop" in file.parts else (1440, 2048) if directory.name == "auth-jpg" else (1600, 2560)
            if image.size != expected:
                fail(f"wrong canvas size: {file} is {image.size}, expected {expected}")

print("PASS: 44 screens, 44 srcsets, all assets present, high-quality JPG canvas sizes valid, thumbnails >= 2x.")
