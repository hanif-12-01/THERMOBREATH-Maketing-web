"""Compress the Blender renders and prepare the share card."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
images = root / "public/images"
for name, filename in [("front", "poster"), ("side", "side"), ("rear", "rear")]:
    with Image.open(root / f"docs/qa/render-{name}.png") as source:
        source.resize((1000, 1000), Image.Resampling.LANCZOS).save(
            images / f"product/thermobreath-{filename}.webp", quality=88, method=6
        )

card = Image.new("RGB", (1200, 630), "#e5f3fe")
draw = ImageDraw.Draw(card)
for x in range(card.width):
    factor = x / card.width
    draw.line((x, 0, x, 630), fill=tuple(round(a * (1 - factor) + b * factor) for a, b in
              zip((247, 252, 255), (197, 227, 250))))
fonts = Path("C:/Windows/Fonts")
draw.text((63, 73), "Aethera.", font=ImageFont.truetype(str(fonts / "segoeuib.ttf"), 37), fill="#113e7a")
draw.multiline_text((63, 190), "Membaca napas.\nMembuka kemungkinan.", font=ImageFont.truetype(str(fonts / "segoeuib.ttf"), 44), fill="#09274f", spacing=5)
draw.text((65, 363), "THERMOBREATH  /  KONSEP PERANGKAT", font=ImageFont.truetype(str(fonts / "segoeuib.ttf"), 20), fill="#2464ad")
with Image.open(images / "product/thermobreath-poster.webp") as poster:
    device = poster.resize((540, 540), Image.Resampling.LANCZOS)
    card.paste(device, (610, 40), device)
card.save(images / "social.webp", quality=89)
