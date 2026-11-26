"""
Seed complete demo menu + ads with downloaded food images.
Safe to re-run: clears previous demo items tagged by DEMO_NOTE, recreates catalog.
"""
from __future__ import annotations

import io
import urllib.request
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from ads.models import Advertisement
from core.models import SiteSettings
from menu.models import Category, MenuItem
from tables_qr.models import RestaurantTable

USER_AGENT = "BaladiBaladiDemoSeeder/1.0"

# Verified working Unsplash food photos (checked 200 OK)
def _u(photo_id: str, w: int = 900) -> str:
    return f"https://images.unsplash.com/photo-{photo_id}?auto=format&fit=crop&w={w}&q=80"


IMG = {
    "breakfast_spread": _u("1533089860892-a7c6f0a88666"),
    "eggs": _u("1525351484163-7529414344d8"),
    "hummus": _u("1546069901-ba9599a7e63c"),
    "foul": _u("1626082927389-6cd097cdc6ec"),
    "labneh": _u("1482049016688-2d3e1b311543"),
    "manakish": _u("1504674900247-0877df9cc836"),
    "pancake": _u("1567620905732-2d1ec7ab7445"),
    "shakshuka": _u("1555939594-58d7cb561ad1"),
    "fries": _u("1573080496219-bb080dd4f877"),
    "wings": _u("1527477396000-e27163b481c2"),
    "onion_rings": _u("1432139555190-58524dae6a55"),
    "nachos": _u("1513456852971-30c0b8199d4d"),
    "salad": _u("1512621776951-a57141f2eefd"),
    "soup": _u("1546069901-ba9599a7e63c"),
    "falafel": _u("1565299624946-b28f40a0ae38"),
    "burger1": _u("1568901346375-23c9450c58cd"),
    "burger2": _u("1550547660-d9450f859349"),
    "burger3": _u("1572802419224-296b0aeee0d9"),
    "burger4": _u("1553979459-d2229ba7433b"),
    "burger5": _u("1594212699903-ec8a3eca50f5"),
    "chicken_burger": _u("1513104890138-7c749659a591"),
    "smash": _u("1571091718767-18b5b1457add"),
    "meal1": _u("1504754524776-8f4f37790ca0"),
    "steak": _u("1432139555190-58524dae6a55"),
    "chicken_plate": _u("1599487488170-d11ec9c172f0"),
    "pasta": _u("1563379926898-05f4575a45d8"),
    "rice": _u("1504674900247-0877df9cc836"),
    "fish": _u("1414235077428-338989a2e8c0"),
    "mixed_grill": _u("1529042410759-befb1204b468"),
    "kebab": _u("1603360946369-dc9bb6258143"),
    "shish": _u("1599487488170-d11ec9c172f0"),
    "kofta": _u("1529042410759-befb1204b468"),
    "lamb": _u("1555939594-58d7cb561ad1"),
    "grill_veg": _u("1512621776951-a57141f2eefd"),
    "shawarma": _u("1529006557810-274b9b2fc783"),
    "sandwich": _u("1553909489-cd47e0907980"),
    "club": _u("1553909489-cd47e0907980"),
    "wrap": _u("1529006557810-274b9b2fc783"),
    "hotdog": _u("1561758033-d89a9ad46330"),
    "dessert1": _u("1571877227200-a0d98ea607e9"),
    "dessert2": _u("1551024506-0bccd828d307"),
    "kunafa": _u("1578985545062-69928b1d9587"),
    "cake": _u("1578985545062-69928b1d9587"),
    "ice_cream": _u("1551024506-0bccd828d307"),
    "brownie": _u("1606313564200-e75d5e30476c"),
    "coffee": _u("1495474472287-4d71bcdd2085"),
    "juice": _u("1622597467836-f3285f2131b8"),
    "lemonade": _u("1505252585461-04db1eb84625"),
    "smoothie": _u("1505252585461-04db1eb84625"),
    "tea": _u("1495474472287-4d71bcdd2085"),
    "cola": _u("1572490122747-3968b75cc699"),
    "milkshake": _u("1572490122747-3968b75cc699"),
    "hero": _u("1550547660-d9450f859349", 1600),
    "about": _u("1559339352-11d035aa65de", 1200),
    "ad1": _u("1571091718767-18b5b1457add", 1200),
    "ad2": _u("1561758033-d89a9ad46330", 1200),
    "ad3": _u("1594212699903-ec8a3eca50f5", 1200),
    "ad4": _u("1495474472287-4d71bcdd2085", 1200),
}

CATEGORIES = [
    ("فطور", "فطور بلدي يشبعك من أول لقمة", 1, "breakfast_spread"),
    ("مقبلات", "مقبلات ساخنة تفتتح الشهية", 2, "fries"),
    ("برجر", "برجر بلدي بطعم ما يتنساش", 3, "burger1"),
    ("وجبات رئيسية", "وجبات كاملة دسمة ومشبعة", 4, "chicken_plate"),
    ("مشاوي", "مشاوي على الفحم بطعم أصيل", 5, "mixed_grill"),
    ("سندويشات", "سندويشات سريعة ولذيذة", 6, "shawarma"),
    ("حلويات", "حلويات تنهي وجبتك بحلاوة", 7, "dessert1"),
    ("مشروبات", "مشروبات ساخنة وباردة ومنعشة", 8, "juice"),
]

ITEMS = {
    "فطور": [
        ("فطور بلدي مشكل", "حمّص، فول، لبنة، زيتون، بيض، وخبز طازج مع زيت الزيتون", "3.50", "breakfast_spread", True, True),
        ("بيض مقلي بلدي", "بيض طازج مقلي مع بندورة وزعتر وعيش ساخن", "1.75", "eggs", True, False),
        ("حمّص بالطحينة", "حمّص كريمي مع طحينة وزيت زيتون وفلفل أحمر", "1.50", "hummus", False, True),
        ("فول مدمس", "فول على الطريقة البلدية مع ثوم وليمون", "1.50", "foul", False, False),
        ("لبنة بالزيت", "لبنة طرية مع زيت زيتون وزعتر وخيار", "1.25", "labneh", False, False),
        ("مناقيش زعتر", "عجينة طازجة مع زعتر وزيت زيتون من الفرن", "1.00", "manakish", True, False),
        ("شكشوكة بلدي", "بيض في صلصة بندورة حارة مع فلفل وبصل", "2.25", "shakshuka", True, True),
        ("بان كيك بالعسل", "بان كيك طري مع عسل وزبدة طازجة", "2.50", "pancake", False, True),
    ],
    "مقبلات": [
        ("بطاطا مقلية مقرمشة", "بطاطا ذهبية مقرمشة مع صلصة خاصة", "1.50", "fries", True, False),
        ("أجنحة دجاج حارة", "أجنحة متبّلة حارة مع صوص رانش", "3.00", "wings", True, True),
        ("حلقات بصل", "حلقات بصل مغطاة بطبقة ذهبية مقرمشة", "1.75", "onion_rings", False, False),
        ("ناتشوز بالجبن", "رقائق ذرة مع جبن ذائب وهالابينو", "2.75", "nachos", False, True),
        ("سلطة خضار طازجة", "خضار موسمية مع دبس رمان وزيت زيتون", "1.50", "salad", False, False),
        ("شوربة اليوم", "شوربة دافئة حسب توفر اليوم", "1.25", "soup", False, False),
        ("فلافل مقرمش", "كرات فلافل ذهبية مع طحينة ومخلل", "1.50", "falafel", True, False),
        ("صحن مقبلات مشكل", "تشكيلة مقبلات للمشاركة تكفي شخصين", "4.50", "nachos", True, True),
    ],
    "برجر": [
        ("برجر بلدي كلاسيك", "لحم طازج، خس، بندورة، بصل، وصلصة البيت", "3.50", "burger1", True, True),
        ("برجر تشيز دبل", "قطعتان لحم مع جبن شيدر ذائب وصلصة خاصة", "4.75", "burger2", True, True),
        ("برجر مشروم", "لحم مع صوص مشروم كريمي وجبن سويسري", "4.25", "burger3", False, True),
        ("برجر سبايسي", "لحم حار مع هالابينو وصلصة تشيلي", "3.90", "burger4", True, False),
        ("برجر دجاج مقرمش", "دجاج مقلي مقرمش مع مايونيز وثوم", "3.25", "chicken_burger", True, False),
        ("سماش برجر", "لحم مضغوط على الشبكة مع جبن وبصل مكرمل", "3.75", "smash", True, True),
        ("برجر بيكون", "لحم مع بيكون مقرمش وجبن شيدر", "4.50", "burger5", False, True),
        ("برجر الأطفال", "حجم صغير مثالي مع بطاطا صغيرة", "2.50", "burger1", False, False),
    ],
    "وجبات رئيسية": [
        ("وجبة برجر مع بطاطا", "برجر كلاسيك + بطاطا + مشروب غازي", "5.00", "meal1", True, True),
        ("ستيك لحم مشوي", "قطعة لحم مشوية مع خضار وبطاطا", "7.50", "steak", True, True),
        ("وجبة دجاج مشوي", "نصف دجاجة مشوية مع رز وسلطة", "5.50", "chicken_plate", True, False),
        ("باستا كريمة دجاج", "باستا بصلصة كريمة وجبن مع قطع دجاج", "4.25", "pasta", False, True),
        ("صحن أرز مع لحم", "أرز مبهر مع قطع لحم طرية وصلصة", "4.75", "rice", False, False),
        ("سمك مشوي", "سمك طازج مشوي مع ليمون وسلطة", "6.50", "fish", False, True),
        ("وجبة عائلية", "تشكيلة برجر ومشاوي تكفي ٤ أشخاص", "18.00", "mixed_grill", True, True),
        ("وجبة نباتية", "خضار مشوية مع حمّص وسلطة وكينوا", "3.75", "salad", False, False),
    ],
    "مشاوي": [
        ("مشكل مشاوي", "كباب، شيش، وكفتة مع خبز وسلطة", "6.50", "mixed_grill", True, True),
        ("كباب لحم", "أسياخ كباب لحم مشوي على الفحم", "4.50", "kebab", True, False),
        ("شيش طاووق", "دجاج متبّل مشوي مع ثوم وليمون", "4.00", "shish", True, True),
        ("كفتة مشوية", "كفتة طرية مع صوص طحينة", "3.75", "kofta", False, False),
        ("ريش غنم", "ريش غنم مشوية متبّلة بطريقة البيت", "7.00", "lamb", True, True),
        ("سجق مشوي", "سجق بلدي على الفحم مع بصل", "3.25", "kebab", False, False),
        ("خضار مشوي مشكل", "باذنجان وكوسا وفلفل مشوي", "2.75", "grill_veg", False, False),
        ("أسياخ دجاج بالجبن", "دجاج محشو جبن مشوي على الفحم", "4.75", "shish", False, True),
    ],
    "سندويشات": [
        ("شاورما دجاج", "شاورما دجاج طازجة مع ثوم ومخلل وبطاطا", "2.25", "shawarma", True, True),
        ("شاورما لحم", "شاورما لحم مع طحينة وبصل", "2.75", "shawarma", True, False),
        ("سندويش فلافل", "فلافل مع طحينية وسلطة ومخلل", "1.50", "falafel", False, False),
        ("كلوب ساندويش", "دجاج، بيض، خس، بندورة في خبز توست", "3.00", "club", False, True),
        ("راب دجاج سبايسي", "راب مقرمش مع دجاج حار وصلصة", "2.50", "wrap", True, False),
        ("هوت دوغ بلدي", "نقانق مشوية مع بصل وصلصات", "1.75", "hotdog", False, False),
        ("سندويش ستيك", "شرائح ستيك مع جبن وبصل مكرمل", "3.50", "sandwich", True, True),
        ("سندويش تونة", "تونة مع مايونيز وخضار طازجة", "2.00", "sandwich", False, False),
    ],
    "حلويات": [
        ("تيراميسو البيت", "طبقات قهوة وكريمة خفيفة", "2.75", "dessert1", True, True),
        ("تشيز كيك", "تشيز كيك كريمي مع صوص توت", "2.50", "dessert2", True, False),
        ("كنافة نابلسية", "كنافة طازجة مع فستق وقطر", "2.25", "kunafa", True, True),
        ("كيكة شوكولاتة", "كعكة شوكولاتة غنية ورطبة", "2.00", "cake", False, True),
        ("آيس كريم مشكل", "٣ كرات آيس كريم بنكهات متنوعة", "1.75", "ice_cream", False, False),
        ("براوني ساخن", "براوني مع آيس كريم فانيلا", "2.50", "brownie", True, True),
        ("مهلبية بالفستق", "مهلبية ناعمة مزينة بالفستق", "1.50", "dessert2", False, False),
        ("وافل بالشوكولاتة", "وافل مقرمش مع شوكولاتة وفواكه", "2.75", "pancake", False, True),
    ],
    "مشروبات": [
        ("قهوة عربية", "قهوة عربية أصيلة مع هيل", "0.75", "coffee", True, False),
        ("عصير برتقال طازج", "معصور طازجاً بدون سكر مضاف", "1.50", "juice", True, True),
        ("ليمونادة نعناع", "ليمونادة منعشة مع أوراق نعناع", "1.25", "lemonade", True, False),
        ("سموذي فواكه", "مزيج فواكه موسمية مثلج", "2.00", "smoothie", False, True),
        ("شاي أخضر", "شاي أخضر ساخن خفيف", "0.75", "tea", False, False),
        ("مشروب غازي", "كولا / سبرايت / فانتا", "0.50", "cola", False, False),
        ("ميلك شيك", "ميلك شيك كريمي بنكهة الشوكولاتة أو الفانيلا", "2.25", "milkshake", True, True),
        ("موكاتشينو", "قهوة مع حليب ورغوة شوكولاتة", "1.75", "coffee", False, True),
    ],
}

ADS = [
    ("عرض البرجر الثنائي", "برجرين + بطاطا كبيرة بسعر مميّز لفترة محدودة", "banner", "6.50", 20, "ad1"),
    ("فطور الصباح", "خصم على كل أصناف الفطور قبل ١٢ ظهراً", "offers", None, 15, "ad2"),
    ("وجبة العائلة", "وجبة عائلية مشبعة بسعر خاص هذا الأسبوع", "offers", "15.00", 25, "ad3"),
    ("قهوة مجانية", "اشترِ أي وجبة رئيسية واحصل على قهوة مجانية", "banner", None, 10, "ad4"),
]


class Command(BaseCommand):
    help = "Seed full demo menu, images, ads, and tables for presentation"

    def add_arguments(self, parser):
        parser.add_argument("--admin-user", default="admin")
        parser.add_argument("--admin-password", default="")
        parser.add_argument("--public-site-url", default="")
        parser.add_argument("--tables", type=int, default=12)
        parser.add_argument("--skip-images", action="store_true")

    def handle(self, *args, **options):
        self.skip_images = options["skip_images"]
        self._cache: dict[str, bytes] = {}

        self.stdout.write("Seeding site settings…")
        self._seed_settings(options.get("public_site_url") or "")

        self.stdout.write("Clearing previous demo catalog…")
        MenuItem.objects.all().delete()
        Category.objects.all().delete()
        Advertisement.objects.all().delete()

        self.stdout.write("Creating categories & items…")
        for name, desc, order, img_key in CATEGORIES:
            cat = Category.objects.create(
                name_ar=name,
                description_ar=desc,
                sort_order=order,
                is_active=True,
                image_url=IMG.get(img_key, ""),
            )
            self._attach_image(cat, "image", img_key, f"cat-{order}.jpg")
            for idx, (iname, idesc, price, ikey, popular, recommended) in enumerate(ITEMS[name], start=1):
                item = MenuItem.objects.create(
                    category=cat,
                    name_ar=iname,
                    description_ar=idesc,
                    price=Decimal(price),
                    image_url=IMG.get(ikey, ""),
                    is_popular=popular,
                    is_recommended=recommended,
                    is_available=True,
                    sort_order=idx,
                )
                self._attach_image(item, "image", ikey, f"item-{cat.id}-{idx}.jpg")
            self.stdout.write(f"  ✓ {name}: {len(ITEMS[name])} items")

        self.stdout.write("Creating advertisements…")
        for i, (title, desc, placement, promo, disc, ikey) in enumerate(ADS, start=1):
            ad = Advertisement.objects.create(
                title_ar=title,
                description_ar=desc,
                placement=placement,
                promo_price=Decimal(promo) if promo else None,
                discount_percent=disc,
                cta_text="استكشف المنيو",
                cta_link="/menu",
                is_active=True,
                sort_order=i,
                image_url=IMG.get(ikey, ""),
                start_at=timezone.now() - timezone.timedelta(days=1),
                end_at=timezone.now() + timezone.timedelta(days=60),
            )
            self._attach_image(ad, "image", ikey, f"ad-{i}.jpg")

        table_count = options["tables"]
        self.stdout.write(f"Ensuring {table_count} tables…")
        for n in range(1, table_count + 1):
            RestaurantTable.objects.update_or_create(
                number=n,
                defaults={"label": f"طاولة {n}", "is_active": True},
            )

        password = options["admin_password"]
        if password:
            User = get_user_model()
            user, created = User.objects.get_or_create(
                username=options["admin_user"],
                defaults={"email": "admin@baladibaladi.jo", "is_staff": True, "is_superuser": True},
            )
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            self.stdout.write(self.style.SUCCESS(f"{'Created' if created else 'Updated'} admin: {user.username}"))

        self.stdout.write(self.style.SUCCESS("Demo menu seed complete."))

    def _seed_settings(self, public_url: str):
        s = SiteSettings.load()
        s.restaurant_name = "بلدي - برجر وفطور"
        s.restaurant_name_en = "Baladi"
        s.tagline = "طعم بلدي .. بمذاق ما بتنساه"
        s.description = "أشهى أصناف البرجر والفطور، محضّرة بحب لتعيش تجربة طعم مميز"
        s.hero_headline = "طعم بلدي بمذاق ما بتنساه"
        s.hero_subtext = "برجر وفطور ومشاوي محضّرة بحب في قلب إربد — شارع البتراء"
        s.phone = "0775051801"
        s.address = "إربد / شارع البتراء, Irbid, Jordan"
        s.maps_link = "https://maps.app.goo.gl/KvMyLqQM7YbGLzeQ8"
        s.maps_embed_url = "https://www.google.com/maps?q=32.5234797,35.901023&hl=ar&z=18&output=embed"
        s.facebook_url = "https://www.facebook.com/profile.php?id=61596672111492"
        s.instagram_url = "https://www.instagram.com/baladibaldi_jo"
        s.working_hours = {
            "السبت - الخميس": "10:00 ص – 12:00 ص",
            "الجمعة": "2:00 م – 12:00 ص",
        }
        if public_url:
            s.public_site_url = public_url.rstrip("/")
        s.hero_image_url = IMG["hero"]
        s.about_image_url = IMG["about"]
        s.save()
        self._attach_image(s, "hero_image", "hero", "hero.jpg")
        self._attach_image(s, "about_image", "about", "about.jpg")

    def _download(self, key: str) -> bytes | None:
        if key in self._cache:
            return self._cache[key]
        url = IMG.get(key)
        if not url:
            return None
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
            self._cache[key] = data
            return data
        except Exception as exc:  # noqa: BLE001
            self.stdout.write(self.style.WARNING(f"  image fail {key}: {exc}"))
            return None

    def _attach_image(self, obj, field_name: str, key: str, filename: str):
        url = IMG.get(key)
        url_field = f"{field_name}_url"
        if url and hasattr(obj, url_field):
            setattr(obj, url_field, url)
            obj.save(update_fields=[url_field])
        if self.skip_images or not url:
            return
        data = self._download(key)
        if not data:
            return
        getattr(obj, field_name).save(filename, ContentFile(data), save=True)
