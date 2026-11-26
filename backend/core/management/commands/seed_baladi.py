from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from core.models import SiteSettings
from menu.models import Category


class Command(BaseCommand):
    help = "Seed Baladi verified brand settings and empty menu categories"

    def add_arguments(self, parser):
        parser.add_argument("--admin-user", default="admin")
        parser.add_argument("--admin-password", default="")
        parser.add_argument("--admin-email", default="admin@baladibaladi.jo")

    def handle(self, *args, **options):
        settings = SiteSettings.load()
        settings.restaurant_name = "بلدي - برجر وفطور"
        settings.restaurant_name_en = "Baladi"
        settings.tagline = "طعم بلدي .. بمذاق ما بتنساه"
        settings.description = "أشهى أصناف البرجر والفطور، محضّرة بحب لتعيش تجربة طعم مميز"
        settings.hero_headline = "طعم بلدي بمذاق ما بتنساه"
        settings.hero_subtext = "برجر وفطور محضّر بحب في قلب إربد — شارع البتراء"
        settings.phone = "0775051801"
        settings.address = "إربد / شارع البتراء, Irbid, Jordan"
        settings.maps_link = "https://maps.app.goo.gl/KvMyLqQM7YbGLzeQ8"
        settings.maps_embed_url = "https://www.google.com/maps?q=32.5234797,35.901023&hl=ar&z=18&output=embed"
        settings.facebook_url = "https://www.facebook.com/profile.php?id=61596672111492"
        settings.instagram_url = "https://www.instagram.com/baladibaldi_jo"
        if not settings.working_hours:
            settings.working_hours = {
                "السبت - الخميس": "يُحدَّث من لوحة التحكم",
                "الجمعة": "يُحدَّث من لوحة التحكم",
            }
        settings.save()
        self.stdout.write(self.style.SUCCESS("Site settings seeded from verified social data"))

        categories = [
            ("فطور", "أصناف الفطور البلدي", 1),
            ("برجر", "برجر بلدي مميز", 2),
            ("وجبات", "وجبات كاملة", 3),
            ("مشروبات", "مشروبات ساخنة وباردة", 4),
        ]
        for name, desc, order in categories:
            obj, created = Category.objects.get_or_create(
                name_ar=name,
                defaults={"description_ar": desc, "sort_order": order, "is_active": True},
            )
            if created:
                self.stdout.write(f"  + category: {name}")
            else:
                self.stdout.write(f"  = category exists: {name}")

        password = options["admin_password"]
        if password:
            User = get_user_model()
            user, created = User.objects.get_or_create(
                username=options["admin_user"],
                defaults={"email": options["admin_email"], "is_staff": True, "is_superuser": True},
            )
            user.set_password(password)
            user.is_staff = True
            user.is_superuser = True
            user.save()
            action = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{action} admin user: {user.username}"))
        else:
            self.stdout.write("Skipped admin user (pass --admin-password to create)")
