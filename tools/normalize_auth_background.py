"""Normalize AUTH-02 assets to the approved warehouse-only hero treatment.

The session card remains screen-specific; only the hero art treatment is shared
with AUTH-01. Outputs are original-size JPGs plus 2x gallery thumbnails.
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]


def normalize(device: str, dim: str, state_name: str) -> None:
    base = ROOT / f"previews/auth-jpg/{device}/AUTH-01-dang-nhap-{device}-{dim}.jpg"
    state_dir = ROOT / f"previews/auth-jpg/{device}"
    if state_name != "default":
        state_dir /= "states"
    state_path = state_dir / f"AUTH-02-xac-nhan-phien{('-' + state_name) if state_name != 'default' else ''}-{device}-{dim}.jpg"
    if not state_path.exists():
        raise FileNotFoundError(state_path)

    green = Image.open(base).convert("RGB")
    session = Image.open(state_path).convert("RGB")
    if device == "desktop":
        # Desktop split: retain the right pane containing the session card.
        green.paste(session.crop((960, 0, 1920, 1080)), (960, 0))
        thumb_size = (1440, 810)
    else:
        # Tablet card overlaps the hero; paste only its rounded card bounds.
        mask = Image.new("L", green.size, 0)
        ImageDraw.Draw(mask).rounded_rectangle((112, 720, 1328, 1666), radius=24, fill=255)
        green.paste(session, (0, 0), mask)
        thumb_size = (1400, 1991)

    green.save(state_path, quality=95, subsampling=0, optimize=True)
    thumb = green.resize(thumb_size, Image.Resampling.LANCZOS)
    thumb_dir = ROOT / f"previews/auth-thumbs/{device}"
    thumb_dir.mkdir(parents=True, exist_ok=True)
    thumb.save(thumb_dir / state_path.name.replace(".jpg", ".webp"), "WEBP", quality=92, method=6)


if __name__ == "__main__":
    for device, dim in (("desktop", "1920x1080"), ("tablet", "1440x2048")):
        for state in ("default", "starting", "expired"):
            normalize(device, dim, state)
    print("Normalized AUTH-02 hero treatment for Desktop and Tablet.")
