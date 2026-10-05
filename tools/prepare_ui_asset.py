"""Trim transparent padding and export a compact WebP UI asset."""

from pathlib import Path
import sys

from PIL import Image


source = Image.open(sys.argv[1]).convert("RGBA")
alpha_threshold = int(sys.argv[5]) if len(sys.argv) > 5 else 0
bbox = source.getchannel("A").point(
    lambda alpha: 255 if alpha > alpha_threshold else 0
).getbbox()
if bbox:
    source = source.crop(bbox)
source.thumbnail((int(sys.argv[3]), int(sys.argv[4])), Image.Resampling.LANCZOS)
source.save(Path(sys.argv[2]), "WEBP", quality=90, method=6)
