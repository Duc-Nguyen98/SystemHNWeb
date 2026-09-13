"""Keep the GitHub Pages ``docs`` gallery byte-for-byte in sync.

The repository keeps a source gallery in ``previews/`` and publishes the
same static tree from ``docs/``.  A previous export updated only the source
tree, which made GitHub Pages serve the older, softer AUTH images.  This
small command makes the publishing boundary explicit and gives CI/local
checks a single, repeatable operation.

Usage::

    python tools/sync_gallery_assets.py          # copy source assets to docs
    python tools/sync_gallery_assets.py --check  # fail when the trees differ
"""

from __future__ import annotations

import argparse
import hashlib
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "previews"
PUBLISHED = ROOT / "docs" / "previews"

# Keep this list deliberately narrow: only files consumed by the gallery are
# mirrored.  It includes both AUTH and MAP-01 so the two published trees can
# never drift independently.
GALLERY_DIRS = (
    "auth-jpg",
    "auth-thumbs",
    "overview-jpg",
    "overview-thumbs",
)


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def source_files() -> list[Path]:
    files: list[Path] = []
    for directory in GALLERY_DIRS:
        root = SOURCE / directory
        files.extend(path for path in root.rglob("*") if path.is_file())
    return sorted(files)


def mismatches() -> list[str]:
    errors: list[str] = []
    expected: set[Path] = set()
    for source in source_files():
        relative = source.relative_to(SOURCE)
        expected.add(relative)
        target = PUBLISHED / relative
        if not target.exists():
            errors.append(f"missing: {target.relative_to(ROOT)}")
        elif digest(source) != digest(target):
            errors.append(f"different: {target.relative_to(ROOT)}")

    for directory in GALLERY_DIRS:
        root = PUBLISHED / directory
        if not root.exists():
            continue
        for target in root.rglob("*"):
            if target.is_file() and target.relative_to(PUBLISHED) not in expected:
                errors.append(f"extra: {target.relative_to(ROOT)}")
    return errors


def sync() -> int:
    count = 0
    for source in source_files():
        target = PUBLISHED / source.relative_to(SOURCE)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        count += 1
    print(f"SYNC: copied {count} gallery assets to docs/previews/")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="check without copying")
    args = parser.parse_args()
    errors = mismatches()
    if args.check:
        if errors:
            for error in errors:
                print(f"FAIL: {error}")
            return 1
        print("PASS: source and docs gallery assets are byte-for-byte identical.")
        return 0
    return sync()


if __name__ == "__main__":
    raise SystemExit(main())
