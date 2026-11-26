import io
from urllib.parse import urljoin

import qrcode
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from core.models import SiteSettings


def get_public_base_url() -> str:
    site = SiteSettings.load()
    return (site.public_site_url or settings.PUBLIC_SITE_URL or "http://localhost:5173").rstrip("/")


def table_menu_url(table_number: int) -> str:
    return f"{get_public_base_url()}/menu?table={table_number}"


def generate_qr_png_bytes(url: str, box_size: int = 10, border: int = 4) -> bytes:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
        box_size=box_size,
        border=border,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_table_card_png(table_number: int, label: str = "") -> bytes:
    """Branded printable card image for a single table."""
    site = SiteSettings.load()
    url = table_menu_url(table_number)
    qr_bytes = generate_qr_png_bytes(url, box_size=12, border=4)
    qr_img = Image.open(io.BytesIO(qr_bytes))

    width, height = 1080, 1520
    # Warm charcoal + amber brand palette
    bg = (28, 22, 18)
    amber = (212, 160, 74)
    cream = (250, 244, 234)

    card = Image.new("RGB", (width, height), bg)
    draw = ImageDraw.Draw(card)

    # Top amber accent bar
    draw.rectangle([0, 0, width, 18], fill=amber)
    draw.rectangle([0, height - 18, width, height], fill=amber)

    try:
        title_font = ImageFont.truetype("arial.ttf", 64)
        sub_font = ImageFont.truetype("arial.ttf", 36)
        small_font = ImageFont.truetype("arial.ttf", 28)
        table_font = ImageFont.truetype("arialbd.ttf", 48)
    except OSError:
        title_font = ImageFont.load_default()
        sub_font = title_font
        small_font = title_font
        table_font = title_font

    name = site.restaurant_name or "بلدي بلدي"
    # Center helpers
    def center_text(text, y, font, fill=cream):
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((width - tw) / 2, y), text, font=font, fill=fill)

    center_text(name, 80, title_font, amber)
    center_text("Baladi Baladi", 160, sub_font, cream)
    center_text("امسح الكود واستمتع بتصفح منيو بلدي بلدي", 240, small_font, cream)
    center_text("SCAN TO VIEW OUR MENU", 300, small_font, amber)

    # QR with quiet zone panel
    qr_size = 560
    qr_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.NEAREST)
    panel = 640
    panel_x = (width - panel) // 2
    panel_y = 380
    draw.rounded_rectangle(
        [panel_x, panel_y, panel_x + panel, panel_y + panel],
        radius=24,
        fill=cream,
    )
    qx = panel_x + (panel - qr_size) // 2
    qy = panel_y + (panel - qr_size) // 2
    card.paste(qr_resized, (qx, qy))

    table_text = label or f"طاولة رقم {table_number}"
    center_text(table_text, 1080, table_font, amber)
    center_text(f"Table {table_number}", 1150, sub_font, cream)
    center_text("فطور • برجر • وجبات", 1280, small_font, (180, 170, 155))

    out = io.BytesIO()
    card.save(out, format="PNG", optimize=True)
    return out.getvalue()


def generate_tables_pdf(tables) -> bytes:
    """A4 PDF with multiple branded table cards (2 per page)."""
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    page_w, page_h = A4

    card_w = 90 * mm
    card_h = 120 * mm
    margin_x = (page_w - card_w) / 2
    positions = [
        (margin_x, page_h - 20 * mm - card_h),
        (margin_x, 20 * mm),
    ]

    for idx, table in enumerate(tables):
        slot = idx % 2
        if idx > 0 and slot == 0:
            c.showPage()

        png = generate_table_card_png(table.number, table.label or "")
        img = ImageReader(io.BytesIO(png))
        x, y = positions[slot]
        c.drawImage(img, x, y, width=card_w, height=card_h, preserveAspectRatio=True, mask="auto")

        # Cut guide
        c.setStrokeColorRGB(0.7, 0.7, 0.7)
        c.setDash(3, 3)
        c.rect(x, y, card_w, card_h)

    c.save()
    return buf.getvalue()
