from django.db import models


class SiteSettings(models.Model):
    restaurant_name = models.CharField(max_length=200, default="بلدي بلدي - برجر وفطور")
    restaurant_name_en = models.CharField(max_length=200, default="Baladi Baladi", blank=True)
    tagline = models.CharField(max_length=300, default="طعم بلدي .. بمذاق ما بتنساه", blank=True)
    description = models.TextField(
        default="أشهى أصناف البرجر والفطور، محضّرة بحب لتعيش تجربة طعم مميز",
        blank=True,
    )
    hero_headline = models.CharField(max_length=300, default="طعم بلدي بمذاق ما بتنساه", blank=True)
    hero_subtext = models.CharField(
        max_length=400,
        default="برجر وفطور محضّر بحب في قلب إربد",
        blank=True,
    )
    logo = models.ImageField(upload_to="brand/", blank=True, null=True)
    hero_image = models.ImageField(upload_to="brand/", blank=True, null=True)
    about_image = models.ImageField(upload_to="brand/", blank=True, null=True)
    phone = models.CharField(max_length=40, default="0775051801", blank=True)
    address = models.CharField(max_length=300, default="اربد / شارع البتراء, Irbid, Jordan", blank=True)
    maps_embed_url = models.URLField(blank=True)
    maps_link = models.URLField(blank=True)
    facebook_url = models.URLField(
        default="https://www.facebook.com/profile.php?id=61596672111492",
        blank=True,
    )
    instagram_url = models.URLField(
        default="https://www.instagram.com/baladibaldi_jo",
        blank=True,
    )
    working_hours = models.JSONField(
        default=dict,
        blank=True,
        help_text='مثال: {"السبت - الخميس": "10:00 ص - 12:00 ص", "الجمعة": "2:00 م - 12:00 ص"}',
    )
    public_site_url = models.URLField(blank=True, help_text="رابط الموقع للـ QR Codes")
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "إعدادات الموقع"
        verbose_name_plural = "إعدادات الموقع"

    def __str__(self):
        return self.restaurant_name

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
