from django.db import models
from django.utils import timezone


class Advertisement(models.Model):
    class Placement(models.TextChoices):
        HERO = "hero", "بانر رئيسي"
        BANNER = "banner", "إعلان مميز"
        OFFERS = "offers", "عروض خاصة"

    title_ar = models.CharField(max_length=200)
    description_ar = models.TextField(blank=True)
    image = models.ImageField(upload_to="ads/", blank=True, null=True)
    image_url = models.URLField(blank=True)
    promo_price = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    discount_percent = models.PositiveIntegerField(null=True, blank=True)
    cta_text = models.CharField(max_length=100, blank=True, default="اطلب الآن")
    cta_link = models.CharField(max_length=300, blank=True, default="/menu")
    placement = models.CharField(max_length=20, choices=Placement.choices, default=Placement.BANNER)
    start_at = models.DateTimeField(null=True, blank=True)
    end_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "-created_at"]
        verbose_name = "إعلان"
        verbose_name_plural = "الإعلانات"

    def __str__(self):
        return self.title_ar

    def resolve_image(self, request=None):
        if self.image:
            url = self.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return self.image_url or None

    @property
    def is_currently_visible(self):
        if not self.is_active:
            return False
        now = timezone.now()
        if self.start_at and now < self.start_at:
            return False
        if self.end_at and now > self.end_at:
            return False
        return True
