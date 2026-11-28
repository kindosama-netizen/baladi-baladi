"""Generate firebase/seed.json from Django demo seed + supabase/images.json."""
import ast
import json
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMG = json.loads((ROOT / "supabase/images.json").read_text(encoding="utf-8"))
text = (ROOT / "backend/core/management/commands/seed_demo_menu.py").read_text(encoding="utf-8")
ITEMS = ast.literal_eval(re.search(r"ITEMS = (\{.*?\n\})", text, re.S).group(1))
ADS = ast.literal_eval(re.search(r"ADS = (\[.*?\])", text, re.S).group(1))

CATS = [
    ("فطور", "فطور بلدي يشبعك من أول لقمة", 1, "breakfast_spread", "cat-fotour"),
    ("مقبلات", "مقبلات ساخنة تفتتح الشهية", 2, "fries", "cat-moqbalat"),
    ("برجر", "برجر بلدي بطعم ما يتنساش", 3, "burger1", "cat-burger"),
    ("وجبات رئيسية", "وجبات كاملة دسمة ومشبعة", 4, "chicken_plate", "cat-wajabat"),
    ("مشاوي", "مشاوي على الفحم بطعم أصيل", 5, "mixed_grill", "cat-mashawi"),
    ("سندويشات", "سندويشات سريعة ولذيذة", 6, "shawarma", "cat-sandwich"),
    ("حلويات", "حلويات تنهي وجبتك بحلاوة", 7, "dessert1", "cat-halwiyat"),
    ("مشروبات", "مشروبات ساخنة وباردة ومنعشة", 8, "juice", "cat-mashrubat"),
]


def main() -> None:
    now = datetime.now(timezone.utc)
    ts = now.isoformat().replace("+00:00", "Z")
    start = (now - timedelta(days=1)).isoformat().replace("+00:00", "Z")
    end = (now + timedelta(days=60)).isoformat().replace("+00:00", "Z")

    site_settings = {
        "id": "main",
        "restaurant_name": "بلدي - برجر وفطور",
        "restaurant_name_en": "Baladi",
        "tagline": "طعم بلدي .. بمذاق ما بتنساه",
        "description": "أشهى أصناف البرجر والفطور، محضّرة بحب لتعيش تجربة طعم مميز",
        "hero_headline": "طعم بلدي بمذاق ما بتنساه",
        "hero_subtext": "برجر وفطور ومشاوي محضّرة بحب في قلب إربد — شارع البتراء",
        "logo_url": "",
        "hero_image_url": IMG["hero"],
        "about_image_url": IMG["about"],
        "phone": "0775051801",
        "address": "إربد / شارع البتراء, Irbid, Jordan",
        "maps_embed_url": "https://www.google.com/maps?q=32.5234797,35.901023&hl=ar&z=18&output=embed",
        "maps_link": "https://maps.app.goo.gl/KvMyLqQM7YbGLzeQ8",
        "facebook_url": "https://www.facebook.com/profile.php?id=61596672111492",
        "instagram_url": "https://www.instagram.com/baladibaldi_jo",
        "working_hours": {
            "السبت - الخميس": "10:00 ص – 12:00 ص",
            "الجمعة": "2:00 م – 12:00 ص",
        },
        "public_site_url": "",
        "created_at": ts,
        "updated_at": ts,
    }

    categories = {}
    for name, desc, order, ikey, cid in CATS:
        categories[cid] = {
            "name_ar": name,
            "description_ar": desc,
            "image_url": IMG[ikey],
            "sort_order": order,
            "is_active": True,
            "created_at": ts,
            "updated_at": ts,
        }

    cat_by_name = {c[0]: c[4] for c in CATS}
    menu_items = {}
    for cat_name, items in ITEMS.items():
        cid = cat_by_name[cat_name]
        for i, (n, d, price, ikey, pop, rec) in enumerate(items, 1):
            mid = f"{cid}-item-{i}"
            menu_items[mid] = {
                "category_id": cid,
                "name_ar": n,
                "description_ar": d,
                "price": price,
                "image_url": IMG[ikey],
                "is_popular": pop,
                "is_recommended": rec,
                "is_available": True,
                "sort_order": i,
                "created_at": ts,
                "updated_at": ts,
            }

    advertisements = {}
    for i, (title, desc, placement, promo, disc, ikey) in enumerate(ADS, 1):
        aid = f"ad-{i}"
        advertisements[aid] = {
            "title_ar": title,
            "description_ar": desc,
            "image_url": IMG[ikey],
            "promo_price": promo,
            "discount_percent": disc,
            "cta_text": "استكشف المنيو",
            "cta_link": "/menu",
            "placement": placement,
            "start_at": start,
            "end_at": end,
            "is_active": True,
            "sort_order": i,
            "created_at": ts,
            "updated_at": ts,
        }

    out = {
        "site_settings": {"main": site_settings},
        "categories": categories,
        "menu_items": menu_items,
        "advertisements": advertisements,
    }
    dest = Path(__file__).parent / "seed.json"
    dest.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {dest} ({len(menu_items)} menu items)")


if __name__ == "__main__":
    main()