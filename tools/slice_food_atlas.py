"""Slice the generated 6x6 food atlas into compact transparent WebP sprites."""

from pathlib import Path
import sys

from PIL import Image


FOOD_IDS = [
    "apple", "bun", "pepper", "yogurt", "popcorn", "gummy",
    "burger", "pudding", "soda", "steak", "hotdog", "iceCream",
    "cheese", "donut", "spicyBurger", "jellyShield", "magnetCandy", "powerPizza",
    "giantMochi", "phoenixPepper", "rainbowCake", "giantPizza", "dragonRamen", "diamondJelly",
    "cosmicSoda", "goldenFeast", "starFruit", "moonMochi", "kingPudding", "blackHoleCandy",
    "prismApple", "prismBerry", "prismPear", "voidFruit", "rainbowHeart",
]


def main() -> None:
    source = Path(sys.argv[1])
    output_dir = Path(sys.argv[2])
    output_dir.mkdir(parents=True, exist_ok=True)
    atlas = Image.open(source).convert("RGBA")
    cell_w = atlas.width // 6
    cell_h = atlas.height // 6

    for index, food_id in enumerate(FOOD_IDS):
        row, column = divmod(index, 6)
        sprite = atlas.crop((column * cell_w, row * cell_h, (column + 1) * cell_w, (row + 1) * cell_h))
        sprite.thumbnail((160, 160), Image.Resampling.LANCZOS)
        sprite.save(output_dir / f"{food_id}.webp", "WEBP", quality=88, method=6)


if __name__ == "__main__":
    main()
