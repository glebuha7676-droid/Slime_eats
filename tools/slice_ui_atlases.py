"""Slice, trim and optically re-center generated UI atlases."""

from pathlib import Path
import sys

from PIL import Image


ICON_NAMES = [
    "slime", "coin", "quest", "stomach", "conveyor",
    "stat-mass", "stat-power", "stat-defense", "stat-bounce", "buff",
    "launch", "reroll", "admin-reset", "finish", "feed",
    "upgrade", "lock", "gift", "info", "special",
]

BUTTON_NAMES = ["primary", "success", "utility", "admin", "danger", "navigation"]


def cell_box(width: int, height: int, columns: int, rows: int, index: int) -> tuple[int, int, int, int]:
    row, column = divmod(index, columns)
    return (
        round(column * width / columns),
        round(row * height / rows),
        round((column + 1) * width / columns),
        round((row + 1) * height / rows),
    )


def trimmed(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    return image.crop(bbox) if bbox else image


def centered_icon(image: Image.Image, size: int = 96, content_size: int = 84) -> Image.Image:
    content = trimmed(image)
    content.thumbnail((content_size, content_size), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    canvas.alpha_composite(content, ((size - content.width) // 2, (size - content.height) // 2))
    return canvas


def main() -> None:
    icon_atlas = Image.open(sys.argv[1]).convert("RGBA")
    button_atlas = Image.open(sys.argv[2]).convert("RGBA")
    output_dir = Path(sys.argv[3])
    output_dir.mkdir(parents=True, exist_ok=True)

    for index, name in enumerate(ICON_NAMES):
        cell = icon_atlas.crop(cell_box(icon_atlas.width, icon_atlas.height, 5, 4, index))
        centered_icon(cell).save(output_dir / f"{name}.webp", "WEBP", quality=90, method=6)

    for index, name in enumerate(BUTTON_NAMES):
        cell = button_atlas.crop(cell_box(button_atlas.width, button_atlas.height, 3, 2, index))
        plate = trimmed(cell)
        plate.thumbnail((420, 180), Image.Resampling.LANCZOS)
        plate.save(output_dir / f"button-{name}.webp", "WEBP", quality=90, method=6)


if __name__ == "__main__":
    main()
