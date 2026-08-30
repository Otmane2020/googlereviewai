from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[2]
EXT = ROOT / "chrome-extension"
DIST = ROOT / "dist" / "chrome-extension"
STORE = DIST / "store-assets"
PACKAGE = DIST / "package"

for path in (STORE, PACKAGE / "icons", PACKAGE / "brand"):
    path.mkdir(parents=True, exist_ok=True)

icon_src = Image.open(ROOT / "public" / "icon-192x192.png").convert("RGBA")
logo_src = Image.open(ROOT / "public" / "logo-mark.png").convert("RGBA")

for size in (16, 32, 48, 128):
    icon = icon_src.resize((size, size), Image.Resampling.LANCZOS)
    icon.save(PACKAGE / "icons" / f"icon{size}.png", optimize=True)

logo_src.save(PACKAGE / "brand" / "logo-mark.png", optimize=True)

for filename in ("manifest.json", "popup.html", "popup.css", "popup.js"):
    shutil.copy2(EXT / filename, PACKAGE / filename)

try:
    font_bold = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
    font_regular = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 25)
    font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 20)
except OSError:
    font_bold = font_regular = font_small = ImageFont.load_default()

BLUE = (23, 105, 255)
TEXT = (15, 23, 42)
MUTED = (100, 116, 139)
BORDER = (226, 232, 240)
BG = (248, 250, 252)
WHITE = (255, 255, 255)
GREEN = (52, 168, 83)
YELLOW = (251, 188, 4)


def fit_logo(img, max_w, max_h):
    copy = logo_src.copy()
    copy.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    img.alpha_composite(copy, (0, 0))
    return copy


def rounded(draw, box, radius=22, fill=WHITE, outline=BORDER, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def screenshot():
    img = Image.new("RGBA", (1280, 800), BG + (255,))
    draw = ImageDraw.Draw(img)
    # Header
    mark = logo_src.copy(); mark.thumbnail((70, 70), Image.Resampling.LANCZOS)
    img.alpha_composite(mark, (72, 52))
    draw.text((155, 68), "Business Reviews", font=font_bold, fill=TEXT)
    x = 155 + draw.textlength("Business Reviews", font=font_bold) + 12
    draw.text((x, 68), "AI", font=font_bold, fill=BLUE)
    draw.text((76, 142), "Professional AI-assisted replies, right where you work.", font=font_regular, fill=MUTED)

    # Left review card
    rounded(draw, (72, 210, 600, 690), radius=28)
    draw.text((110, 250), "Customer review", font=font_regular, fill=TEXT)
    draw.text((110, 300), "★★★★★", font=font_regular, fill=YELLOW)
    review = [
        "Great experience. The team was responsive,",
        "professional and very helpful throughout the process.",
        "I would definitely recommend this business."
    ]
    y = 360
    for line in review:
        draw.text((110, y), line, font=font_small, fill=MUTED); y += 40
    draw.rounded_rectangle((110, 545, 560, 620), radius=18, fill=(239, 246, 255), outline=(191, 219, 254), width=2)
    draw.text((150, 568), "Review detected", font=font_regular, fill=BLUE)

    # Arrow/flow
    draw.line((620, 445, 665, 445), fill=BLUE, width=5)
    draw.polygon([(665, 445), (650, 435), (650, 455)], fill=BLUE)

    # Right AI reply panel
    rounded(draw, (690, 210, 1208, 690), radius=28)
    draw.rounded_rectangle((728, 246, 780, 298), radius=15, fill=BLUE)
    draw.text((745, 254), "✦", font=font_regular, fill=WHITE)
    draw.text((800, 254), "AI reply", font=font_regular, fill=TEXT)
    reply = [
        "Thank you for your feedback! We’re delighted to hear",
        "that you had a positive experience with our team.",
        "Your recommendation means a lot to us and we look",
        "forward to welcoming you again soon."
    ]
    y = 350
    for line in reply:
        draw.text((728, y), line, font=font_small, fill=MUTED); y += 40
    draw.rounded_rectangle((728, 555, 938, 620), radius=16, fill=WHITE, outline=BORDER, width=2)
    draw.text((792, 575), "Copy", font=font_small, fill=TEXT)
    draw.rounded_rectangle((956, 555, 1170, 620), radius=16, fill=BLUE)
    draw.text((1002, 575), "Insert reply", font=font_small, fill=WHITE)
    img.convert("RGB").save(STORE / "screenshot-1280x800.png", quality=95)


def promo():
    img = Image.new("RGBA", (440, 280), WHITE + (255,))
    draw = ImageDraw.Draw(img)
    # blue wash
    draw.rounded_rectangle((18, 18, 422, 262), radius=28, fill=(239, 246, 255), outline=(219, 234, 254), width=2)
    mark = logo_src.copy(); mark.thumbnail((58, 58), Image.Resampling.LANCZOS)
    img.alpha_composite(mark, (44, 43))
    draw.text((116, 50), "Business Reviews", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25), fill=TEXT)
    draw.text((330, 50), "AI", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 25), fill=BLUE)
    draw.text((44, 120), "Reply to customer reviews", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24), fill=TEXT)
    draw.text((44, 160), "with an AI-assisted draft in seconds.", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 17), fill=MUTED)
    draw.rounded_rectangle((44, 205, 225, 242), radius=12, fill=BLUE)
    draw.text((75, 214), "Generate AI reply", font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 13), fill=WHITE)
    img.convert("RGB").save(STORE / "promo-small-440x280.png", quality=95)


screenshot()
promo()
icon_src.resize((128, 128), Image.Resampling.LANCZOS).convert("RGB").save(STORE / "store-icon-128.png", quality=95)

zip_path = DIST / "business-reviews-ai-chrome-v1.0.0.zip"
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for file in PACKAGE.rglob("*"):
        if file.is_file():
            zf.write(file, file.relative_to(PACKAGE))

print(zip_path)
