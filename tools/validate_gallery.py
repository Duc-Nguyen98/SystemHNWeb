"""Compatibility entry point; the shared validator covers all 84 boards."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
raise SystemExit(subprocess.call(["node", "tools/validate-gallery.mjs"], cwd=root))
