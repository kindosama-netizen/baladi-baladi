"""Unified restaurant menu QR generation with Arabic-capable branded printables."""
from __future__ import annotations

import io
import re
from functools import lru_cache
from pathlib import Path

import arabic_reshaper
import qrcode
from bidi.algorithm import get_display
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from core.models import SiteSettings

FONTS_DIR = Path(__file__).resolve().parent.parent / "assets" / "fonts"
FONT_REGULAR = FONTS_DIR / "NotoNaskhArabic-Regular.ttf"
FONT_BOLD = FONTS_DIR / "NotoNaskhArabic-Bold.ttf"

ARABIC_RE = re.compile(r"[\u0600-\u06FF]")

# Brand palette
BG = (22, 17, 14)
AMBER = (212, 160, 74)
CREAM = (250, 244, 234)
SOFT = (180, 170, 155)
INK = (28, 22, 18)


def clean_print_text(text: str) -> str:
    """Replace glyphs that Arabic print fonts often lack."""
    if not text:
        return ""
    return (
        str(text)
        .replace("•", "،")
        .replace("·", "،")
        .replace("—", "،")
        .replace("–", "،")
        .replace("|", "،")
        .replace("…", "...")
        .replace("／", "/")
    )


def shape_ar(text: str) -> str:
    """Reshape + bidi so Arabic renders connected and RTL in Pillow."""
    text = clean_print_text(text)
    if not text:
        return ""
    if not ARABIC_RE.search(text):
        return text
    # Normalize ASCII separators to Arabic comma (present in Noto Naskh).
    text = re.sub(r"\s*[-/]\s*", "، ", text)
    return get_display(arabic_reshaper.reshape(text))


LATIN_FONT_CANDIDATES = (
    str(FONTS_DIR / "Roboto-Bold.ttf"),
    str(FONTS_DIR / "Roboto-Regular.ttf"),
    str(FONTS_DIR / "Arial-Bold.ttf"),
    str(FONTS_DIR / "Arial.ttf"),
    "C:/Windows/Fonts/arialbd.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "arialbd.ttf",
    "arial.ttf",
)


def _truetype(path: str, size: int) -> ImageFont.FreeTypeFont:
    """
    Use BASIC layout so Linux builds with libraqm/HarfBuzz do not
    re-shape already reshaped Arabic presentation forms.
    """
    try:
        return ImageFont.truetype(path, size, layout_engine=ImageFont.Layout.BASIC)
    except TypeError:
        return ImageFont.truetype(path, size)


@lru_cache(maxsize=16)
def load_font(bold: bool, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Arabic-capable Noto font (Arabic glyphs only in many builds)."""
    path = FONT_BOLD if bold else FONT_REGULAR
    if path.exists():
        return _truetype(str(path), size)
    return load_latin_font(bold, size)


@lru_cache(maxsize=16)
def load_latin_font(bold: bool, size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Latin digits / English — Noto Naskh often lacks Latin glyphs."""
    for fallback in LATIN_FONT_CANDIDATES:
        try:
            return _truetype(fallback, size)
        except OSError:
            continue
    return ImageFont.load_default()


def get_public_base_url() -> str:
    site = SiteSettings.load()
    return (site.public_site_url or settings.PUBLIC_SITE_URL or "http://localhost:5173").rstrip("/")


def menu_url() -> str:
    """Single unified menu URL for all tables."""
    return f"{get_public_base_url()}/menu"


def table_menu_url(table_number: int | None = None) -> str:
    """Backwards-compatible helper — always returns the unified menu URL."""
    return menu_url()


def generate_qr_png_bytes(url: str | None = None, box_size: int = 16, border: int = 2) -> bytes:
    """High-contrast QR suitable for print scanning."""
    target = url or menu_url()
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=box_size,
        border=border,
    )
    qr.add_data(target)
    qr.make(fit=True)
    img = qr.make_image(fill_color=INK, back_color="white").convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def _center_text(draw: ImageDraw.ImageDraw, text: str, y: int, font, fill, width: int, arabic: bool = True):
    rendered = shape_ar(text) if arabic else clean_print_text(text)
    bbox = draw.textbbox((0, 0), rendered, font=font)
    tw = bbox[2] - bbox[0]
    draw.text(((width - tw) / 2, y), rendered, font=font, fill=fill)


def generate_menu_card_png() -> bytes:
    """
    Branded printable table tent / stand card.
    Canvas ~ A6 at 300 DPI (105x148 mm -> 1240x1748 px) for crisp print.
    """
    site = SiteSettings.load()
    url = menu_url()
    qr_img = Image.open(io.BytesIO(generate_qr_png_bytes(url, box_size=18, border=2)))

    width, height = 1240, 1748
    card = Image.new("RGB", (width, height), BG)
    draw = ImageDraw.Draw(card)

    draw.rectangle([0, 0, width, 22], fill=AMBER)
    draw.rectangle([0, height - 22, width, height], fill=AMBER)
    draw.rectangle([0, 22, 10, height - 22], fill=AMBER)
    draw.rectangle([width - 10, 22, width, height - 22], fill=AMBER)

    name_ar = (site.restaurant_name or "بلدي").split(" - ")[0].strip() or "بلدي"
    name_en = (site.restaurant_name_en or "Baladi").split(" - ")[0].strip() or "Baladi"
    tagline = site.tagline or "طعم بلدي .. بمذاق ما بتنساه"

    title_font = load_font(True, 96)
    sub_font = load_font(True, 40)
    body_font = load_font(False, 34)
    tiny_font = load_font(False, 30)
    en_font = load_latin_font(True, 38)
    en_small = load_latin_font(False, 30)
    phone_font = load_latin_font(True, 40)

    _center_text(draw, name_ar, 68, title_font, AMBER, width, arabic=True)
    _center_text(draw, name_en, 180, en_font, CREAM, width, arabic=False)
    _center_text(draw, tagline, 245, body_font, SOFT, width, arabic=True)
    _center_text(draw, "امسح الرمز لفتح المنيو الرقمي", 310, sub_font, CREAM, width, arabic=True)
    _center_text(draw, "SCAN FOR OUR DIGITAL MENU", 375, en_small, AMBER, width, arabic=False)

    qr_size = 680
    qr_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
    panel = 760
    panel_x = (width - panel) // 2
    panel_y = 440
    draw.rounded_rectangle(
        [panel_x - 4, panel_y - 4, panel_x + panel + 4, panel_y + panel + 4],
        radius=36,
        outline=AMBER,
        width=4,
    )
    draw.rounded_rectangle(
        [panel_x, panel_y, panel_x + panel, panel_y + panel],
        radius=32,
        fill=CREAM,
    )
    qx = panel_x + (panel - qr_size) // 2
    qy = panel_y + (panel - qr_size) // 2
    card.paste(qr_resized, (qx, qy))

    _center_text(draw, "فطور، برجر، مشاوي، وجبات", 1285, body_font, AMBER, width, arabic=True)
    _center_text(draw, "بدون تطبيق، افتح الرابط وتصفح فورا", 1360, tiny_font, SOFT, width, arabic=True)

    phone = site.phone or ""
    address = (site.address or "إربد، شارع البتراء").split(",")[0].strip()
    address = address.replace("/", "،").replace("-", "،")
    if phone:
        _center_text(draw, phone, 1450, phone_font, CREAM, width, arabic=False)
    _center_text(draw, address, 1520, tiny_font, SOFT, width, arabic=True)
    _center_text(draw, "بلدي، طعم ما بتنساه", 1605, body_font, AMBER, width, arabic=True)

    out = io.BytesIO()
    card.save(out, format="PNG", optimize=True, dpi=(300, 300))
    return out.getvalue()


def generate_table_card_png(table_number: int = 0, label: str = "") -> bytes:
    return generate_menu_card_png()


def generate_menu_pdf(copies: int = 4) -> bytes:
    """A4 PDF with print-ready A6 cards and cut guides."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    page_w, page_h = A4

    card_w = 105 * mm
    card_h = 148 * mm
    gap = 8 * mm

    positions = [
        ((page_w - 2 * card_w - gap) / 2, page_h - 15 * mm - card_h),
        ((page_w - 2 * card_w - gap) / 2 + card_w + gap, page_h - 15 * mm - card_h),
        ((page_w - 2 * card_w - gap) / 2, 15 * mm),
        ((page_w - 2 * card_w - gap) / 2 + card_w + gap, 15 * mm),
    ]

    png = generate_menu_card_png()
    img = ImageReader(io.BytesIO(png))

    for idx in range(max(1, copies)):
        slot = idx % 4
        if idx > 0 and slot == 0:
            c.showPage()
        x, y = positions[slot]
        c.drawImage(img, x, y, width=card_w, height=card_h, preserveAspectRatio=True, mask="auto")
        c.setStrokeColorRGB(0.65, 0.65, 0.65)
        c.setDash(2, 2)
        c.setLineWidth(0.4)
        c.rect(x, y, card_w, card_h)

    c.save()
    return buf.getvalue()


def generate_tables_pdf(tables=None) -> bytes:
    return generate_menu_pdf(copies=4)
