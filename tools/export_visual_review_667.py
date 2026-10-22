from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

folder = Path('outputs/visual-refinements-667/gameplay')
strip = Image.open(folder / 'animation-strip.png').convert('RGB')
font = ImageFont.truetype('assets/fonts/ui-kit/nunito/Nunito-variable.ttf', 17)
frames = []
for index in range(44):
    frame = Image.new('RGB', (660, 450), (19, 47, 64))
    frame.paste(strip.crop((0, index * 420, 660, (index + 1) * 420)), (0, 30))
    draw = ImageDraw.Draw(frame)
    for column, label in enumerate(['II: шторм', 'III: пресс', 'Красный урон']):
        draw.text((column * 220 + 10, 5), label, font=font, fill='white')
    frames.append(frame.resize((594, 405)).quantize(colors=112))
frames[0].save(folder / 'effects-667.gif', save_all=True,
               append_images=frames[1:], duration=70, loop=0, optimize=True)
print('Current gameplay VFX review exported')
