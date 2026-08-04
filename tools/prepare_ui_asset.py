"""Trim transparent padding and export a compact WebP UI asset."""

from pathlib import Path
import sys

from PIL import Image


source = Image.open(sys.argv[1]).convert("RGBA")
bbox = source.getchannel("A").getbbox()
if bbox:
    source = source.crop(bbox)
source.thumbnail((int(sys.argv[3]), int(sys.argv[4])), Image.Resampling.LANCZOS)
source.save(Path(sys.argv[2]), "WEBP", quality=90, method=6)
