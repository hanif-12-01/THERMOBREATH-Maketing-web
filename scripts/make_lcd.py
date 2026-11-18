"""Draw the original, nonclinical LCD artwork packed into the Blender concept."""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
image = Image.new("RGB", (720, 1050), "#08192d")
draw = ImageDraw.Draw(image)
fonts = Path("C:/Windows/Fonts")


def text(x, y, value, size, fill, bold=False):
    font = ImageFont.truetype(str(fonts / ("segoeuib.ttf" if bold else "segoeui.ttf")), size)
    draw.text((x, y), value, fill=fill, font=font)


draw.rounded_rectangle((19, 19, 701, 1031), radius=73, fill="#103354",
                       outline="#438ac4", width=4)
draw.rounded_rectangle((27, 27, 693, 1023), radius=65, fill="#102a45")
text(60, 63, "R&D", 38, "#e1f3ff", True)
draw.arc((530, 71, 604, 123), 208, 332, fill="#b5dbf6", width=6)
draw.arc((546, 86, 588, 116), 210, 330, fill="#b5dbf6", width=6)
draw.ellipse((564, 98, 571, 105), fill="#b5dbf6")
draw.rounded_rectangle((621, 74, 660, 100), 4, outline="#b5dbf6", width=3)
draw.rectangle((627, 81, 651, 93), fill="#b5dbf6")
text(61, 132, "THERMOBREATH", 62, "#60d9fa", True)

left = [(340, 269), (322, 249), (298, 248), (277, 265), (254, 297),
        (233, 340), (220, 386), (217, 420), (226, 444), (244, 454),
        (281, 453), (308, 443), (327, 425), (334, 398), (334, 333)]
right = [(720 - x, y) for x, y in left]
draw.line(left, fill="#e6f7ff", width=10, joint="curve")
draw.line(right, fill="#e6f7ff", width=10, joint="curve")
draw.line([(360, 236), (360, 319), (324, 367)], fill="#e6f7ff", width=9, joint="curve")
draw.line([(360, 319), (396, 367)], fill="#e6f7ff", width=9, joint="curve")

draw.rounded_rectangle((61, 493, 659, 582), radius=18, fill="#12668d")
text(222, 506, "SIMULASI", 44, "#f2fbff", True)
text(64, 625, "Respons sensor", 41, "#e1f3ff", True)
draw.line([(67, 756), (158, 756), (193, 728), (229, 788), (280, 689),
           (335, 806), (380, 721), (422, 754), (468, 737), (529, 756), (649, 756)],
          fill="#60d9fa", width=7, joint="curve")
draw.line((63, 842, 655, 842), fill="#4e8caf", width=2)
text(64, 875, "Data contoh nonklinis", 33, "#e1f3ff", True)
text(64, 931, "Bukan hasil diagnosis medis", 30, "#b5dbf6")
image.save(root / "docs/qa/lcd-texture.png")
