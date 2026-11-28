import ast
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG = json.loads((Path(__file__).parent / "images.json").read_text(encoding="utf-8"))
text = (ROOT / "backend/core/management/commands/seed_demo_menu.py").read_text(encoding="utf-8")
ITEMS = ast.literal_eval(re.search(r"ITEMS = (\{.*?\n\})", text, re.S).group(1))
ADS = ast.literal_eval(re.search(r"ADS = (\[.*?\])", text, re.S).group(1))

CATS = [
    ("فطور", "فطور بلدي يشبعك من أول لقمة", 1, "breakfast_spread"),
    ("مقبلات", "مقبلات ساخنة تفتتح الشهية", 2, "fries"),
    ("برجر", "برجر بلدي بطعم ما يتنساش", 3, "burger1"),
    ("وجبات رئيسية", "وجبات كاملة دسمة ومشبعة", 4, "chicken_plate"),
    ("مشاوي", "مشاوي على الفحم بطعم أصيل", 5, "mixed_grill"),
    ("سندويشات", "سندويشات سريعة ولذيذة", 6, "shawarma"),
    ("حلويات", "حلويات تنهي وجبتك بحلاوة", 7, "dessert1"),
    ("مشروبات", "مشروبات ساخنة وباردة ومنعشة", 8, "juice"),
]


def esc(s: str) -> str:
    return str(s).replace("'", "''")


lines = [
    "-- Demo seed for Baladi",
    "truncate table public.menu_items restart identity cascade;",
    "truncate table public.categories restart identity cascade;",
    "truncate table public.advertisements restart identity cascade;",
    (
        "update public.site_settings set "
        "restaurant_name='بلدي - برجر وفطور', restaurant_name_en='Baladi', "
        f"hero_image_url='{IMG['hero']}', about_image_url='{IMG['about']}', "
        "maps_link='https://maps.app.goo.gl/KvMyLqQM7YbGLzeQ8', "
        "maps_embed_url='https://www.google.com/maps?q=32.5234797,35.901023&hl=ar&z=18&output=embed' "
        "where id=1;"
    ),
]

for name, desc, order, ikey in CATS:
    lines.append(
        "insert into public.categories (name_ar, description_ar, sort_order, is_active, image_url) "
        f"values ('{esc(name)}', '{esc(desc)}', {order}, true, '{IMG[ikey]}');"
    )

for cat_name, items in ITEMS.items():
    for i, (n, d, price, ikey, pop, rec) in enumerate(items, 1):
        lines.append(
            "insert into public.menu_items (category_id, name_ar, description_ar, price, image_url, "
            "is_popular, is_recommended, is_available, sort_order) "
            f"select id, '{esc(n)}', '{esc(d)}', {price}, '{IMG[ikey]}', {str(pop).lower()}, "
            f"{str(rec).lower()}, true, {i} from public.categories where name_ar='{esc(cat_name)}';"
        )

for i, (title, desc, placement, promo, disc, ikey) in enumerate(ADS, 1):
    promo_sql = "null" if promo is None else f"'{promo}'"
    lines.append(
        "insert into public.advertisements (title_ar, description_ar, image_url, promo_price, "
        "discount_percent, placement, is_active, sort_order, start_at, end_at) values ("
        f"'{esc(title)}', '{esc(desc)}', '{IMG[ikey]}', {promo_sql}, {disc}, '{placement}', true, {i}, "
        "now() - interval '1 day', now() + interval '60 days');"
    )

out = Path(__file__).parent / "seed.sql"
out.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote {out} ({len(lines)} statements)")
