from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageOps


TILE_WIDTH = 512
HALF_TILE_HEIGHT = 768


def cover_crop(image: Image.Image, width: int, height: int) -> Image.Image:
    scale = max(width / image.width, height / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - width) // 2
    top = (resized.height - height) // 2
    return resized.crop((left, top, left + width, top + height))


def build_tile(source: Path, output: Path) -> None:
    with Image.open(source) as opened:
        upper_half = cover_crop(opened.convert("RGB"), TILE_WIDTH, HALF_TILE_HEIGHT)

    tile = Image.new("RGB", (TILE_WIDTH, HALF_TILE_HEIGHT * 2))
    tile.paste(upper_half, (0, 0))
    tile.paste(ImageOps.flip(upper_half), (0, HALF_TILE_HEIGHT))

    first_row = tile.crop((0, 0, TILE_WIDTH, 1))
    last_row = tile.crop((0, tile.height - 1, TILE_WIDTH, tile.height))
    if ImageChops.difference(first_row, last_row).getbbox():
        raise RuntimeError("The generated tile does not have an exact vertical seam")

    output.parent.mkdir(parents=True, exist_ok=True)
    tile.save(output, format="WEBP", lossless=True, method=6)

    with Image.open(output) as verified:
        top = verified.crop((0, 0, verified.width, 1))
        bottom = verified.crop((0, verified.height - 1, verified.width, verified.height))
        if ImageChops.difference(top, bottom).getbbox():
            raise RuntimeError("The saved WebP lost its exact vertical seam")

    print(f"Built {output} ({tile.width}x{tile.height})")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Build a guaranteed vertically seamless world background tile."
    )
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build_tile(args.source, args.output)


if __name__ == "__main__":
    main()
