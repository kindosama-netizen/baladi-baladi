from django.db import models


class RestaurantTable(models.Model):
    number = models.PositiveIntegerField(unique=True)
    label = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["number"]
        verbose_name = "طاولة"
        verbose_name_plural = "الطاولات"

    def __str__(self):
        return self.label or f"طاولة {self.number}"

    def menu_url(self, base_url: str) -> str:
        # Unified restaurant menu QR — same URL for every table.
        return f"{base_url.rstrip('/')}/menu"
