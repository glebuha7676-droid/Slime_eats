"""Export upright cave modules that share the same vertical socket."""

import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/concepts/cave-puzzle-v64'
SOCKET_SOURCE = ROOT / 'assets/backgrounds/asteroid-cave-v34'
WIDTH, ART_HEIGHT = 1024, 1536
SOCKET_ROWS = 80
BIOMES = ('jungle', 'techno', 'fire', 'fungal', 'crystal')
PLANES = ('far', 'near')


def mix(start, end, amount):
    return start * (1 - amount) + end * amount


def clean_cutout(art):
    alpha = art[:, :, 3]
    regions, _ = label(alpha >= 128)
    # Preserve the two walls and their antialiasing. Remove disconnected
    # generated matte noise from the open passage, not the wall silhouettes.
    attached = np.unique(regions[:, [0, -1]])
    attached = attached[attached != 0]
    assert attached.size, 'Foreground walls must reach the side edges'
    wall = binary_dilation(np.isin(regions, attached), iterations=3)
    art[:, :, 3] = np.where(wall, np.clip((alpha - 4) * 255 / 248, 0, 255), 0)
    assert not art[:, 440:584, 3].any(), 'Foreground closed the central shaft'
    return art


def join_wall(start, end, amount):
    """Move the solid wall contour while blending its color along the bevel."""
    first = np.flatnonzero(start[:, 3] >= 128)[-1]
    last = np.flatnonzero(end[:, 3] >= 128)[-1]
    edge = mix(first + .5, last + .5, amount)
    x = np.arange(len(start))
    u = np.minimum(x / max(edge - .5, 1), 1)
    a = np.column_stack([np.interp(u * first, x, channel) for channel in start[:, :3].T])
    b = np.column_stack([np.interp(u * last, x, channel) for channel in end[:, :3].T])
    coverage = np.clip(edge + .5 - x, 0, 1) * 255
    return np.column_stack((mix(a, b, amount), coverage))


def join_near(start, end, amount):
    middle = WIDTH // 2
    return np.vstack((
        join_wall(start[:middle], end[:middle], amount),
        join_wall(start[middle:][::-1], end[middle:][::-1], amount)[::-1],
    ))


def band(edge, socket, near):
    join = join_near if near else mix
    rows = [socket]
    for step in range(1, SOCKET_ROWS):
        t = step / SOCKET_ROWS
        rows.append(join(socket, edge, t * t * (3 - 2 * t)))
    return np.array(rows)


def make_tile(master, socket, near):
    mode = 'RGBA' if near else 'RGB'
    with Image.open(master) as raw:
        if near:
            assert 'A' in raw.getbands(), f'Expected a transparent source: {master.name}'
        assert raw.height * 2 == raw.width * 3, f'Expected 2:3 art: {master.name}'
        art = np.array(
            raw.convert(mode).resize((WIDTH, ART_HEIGHT), Image.Resampling.LANCZOS),
            dtype=np.float32,
        )
    if near:
        art = clean_cutout(art)
    top = band(art[0], socket, near)
    bottom = band(art[-1], socket, near)[::-1]
    pixels = np.concatenate((top, art, bottom)).round().astype(np.uint8)
    if near:
        pixels[pixels[:, :, 3] == 0, :3] = 0
    return Image.fromarray(pixels)


def main():
    inputs = json.loads((OUT / 'prompts.json').read_text(encoding='utf-8'))
    records = []
    (OUT / 'masters').mkdir(exist_ok=True)
    (OUT / 'tiles').mkdir(exist_ok=True)
    for plane in PLANES:
        near = plane == 'near'
        with Image.open(SOCKET_SOURCE / f'source-clean-{plane}.webp') as neutral:
            socket = np.array(neutral.convert('RGBA' if near else 'RGB'), dtype=np.float32)[0]
        assert len(socket) == WIDTH
        for biome in BIOMES:
            key = f'{biome}-{plane}'
            master = OUT / 'masters' / f'{key}.png'
            if not master.exists():
                shutil.copyfile(inputs[key]['source'], master)
            tile = make_tile(master, socket, near)
            target = OUT / 'tiles' / f'{key}.webp'
            tile.save(target, lossless=True, exact=True, method=4)
            # Compare decoded output, so lossy compression or alpha conversion
            # cannot silently break exact joins between biomes.
            with Image.open(target) as saved:
                pixels = np.array(saved)
                assert np.array_equal(pixels[0], pixels[-1]), key
                if biome == BIOMES[0]:
                    common = pixels[0].copy()
                assert np.array_equal(pixels[0], common), key
                if near:
                    assert not pixels[:, 440:584, 3].any(), key
            records.append({
                'biome': biome, 'plane': plane, 'file': f'tiles/{target.name}',
                'width': tile.width, 'height': tile.height, 'bytes': target.stat().st_size,
            })
    (OUT / 'tiles.json').write_text(json.dumps({
        'socketRows': SOCKET_ROWS, 'tiles': records,
        'validatedOrderedPairsPerPlane': len(BIOMES) ** 2,
    }, indent=2), encoding='utf-8')
    print(f'Exported {len(records)} layers; verified all {len(BIOMES) ** 2} joins per plane.')


if __name__ == '__main__':
    main()
