"""
Compress large TIF/PSD/EPS assets for web + GitHub deployment.

- Converts each file to an optimized JPEG (max 2000px long edge, quality 85).
- Moves the original into assets-source/ (local backup, gitignored).
- Skips conversion when an existing JPEG is already under 5 MB.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

import imageio.v3 as iio
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS_ROOT = ROOT / "public" / "assets"
SOURCE_ROOT = ROOT / "assets-source"
MAX_LONG_EDGE = 2000
JPEG_QUALITY = 85
SKIP_IF_JPEG_UNDER_MB = 5
EXTENSIONS = {".tif", ".tiff", ".psd", ".eps"}


def load_image(path: Path) -> Image.Image:
    try:
        img = Image.open(path)
        img.load()
        return img
    except Exception:
        arr = iio.imread(path)
        if arr.ndim == 2:
            return Image.fromarray(arr.astype("uint8"), "L")
        if arr.ndim == 3:
            channels = arr.shape[2]
            if channels >= 3:
                rgb = arr[:, :, :3].astype("uint8")
                return Image.fromarray(rgb, "RGB")
        raise


def resize_for_web(img: Image.Image) -> Image.Image:
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    elif img.mode == "L":
        img = img.convert("RGB")

    width, height = img.size
    long_edge = max(width, height)
    if long_edge <= MAX_LONG_EDGE:
        return img

    scale = MAX_LONG_EDGE / long_edge
    new_size = (max(1, int(width * scale)), max(1, int(height * scale)))
    return img.resize(new_size, Image.Resampling.LANCZOS)


def existing_jpeg_ok(path: Path) -> Path | None:
    for candidate in (path.with_suffix(".jpg"), path.with_suffix(".jpeg")):
        if candidate.exists() and candidate.stat().st_size <= SKIP_IF_JPEG_UNDER_MB * 1024 * 1024:
            return candidate
    return None


def archive_original(path: Path) -> Path:
    rel = path.relative_to(ROOT)
    dest = SOURCE_ROOT / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return dest
    shutil.move(str(path), str(dest))
    return dest


def compress_file(path: Path) -> str:
    rel = path.relative_to(ROOT)
    size_mb = path.stat().st_size / (1024 * 1024)

    existing = existing_jpeg_ok(path)
    if existing is not None:
        archive_original(path)
        return f"SKIP (jpeg exists) {rel} ({size_mb:.1f} MB) -> {existing.relative_to(ROOT)}"

    img = load_image(path)
    img = resize_for_web(img)
    out = path.with_suffix(".jpg")
    img.save(out, "JPEG", quality=JPEG_QUALITY, optimize=True)
    out_mb = out.stat().st_size / (1024 * 1024)
    archive_original(path)
    return f"OK {rel} ({size_mb:.1f} MB) -> {out.relative_to(ROOT)} ({out_mb:.2f} MB)"


def main() -> int:
    if not ASSETS_ROOT.exists():
        print(f"Assets folder not found: {ASSETS_ROOT}")
        return 1

    targets = sorted(
        p
        for p in ASSETS_ROOT.rglob("*")
        if p.is_file() and p.suffix.lower() in EXTENSIONS
    )

    if not targets:
        print("No TIF/PSD/EPS files found under public/assets.")
        return 0

    print(f"Processing {len(targets)} file(s)...")
    errors: list[str] = []

    for path in targets:
        try:
            print(compress_file(path))
        except Exception as exc:  # noqa: BLE001
            errors.append(f"FAIL {path.relative_to(ROOT)}: {exc}")
            print(errors[-1])

    print(f"\nDone. Archived originals under {SOURCE_ROOT.relative_to(ROOT)}/")
    if errors:
        print(f"{len(errors)} error(s).")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
