from django.db import models


class Category(models.Model):
    name_ar = models.CharField(max_length=120)
    description_ar = models.TextField(blank=True)
    image = models.ImageField(upload_to="categories/", blank=True, null=True)
    image_url = models.URLField(blank=True, help_text="رابط صورة خارجي (للعرض التجريبي)")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "تصنيف"
        verbose_name_plural = "التصنيفات"

    def __str__(self):
        return self.name_ar

    def resolve_image(self, request=None):
        if self.image:
            url = self.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return self.image_url or None


class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name="items")
    name_ar = models.CharField(max_length=200)
    description_ar = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    image = models.ImageField(upload_to="menu/", blank=True, null=True)
    image_url = models.URLField(blank=True, help_text="رابط صورة خارجي (للعرض التجريبي)")
    is_popular = models.BooleanField(default=False)
    is_recommended = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "id"]
        verbose_name = "صنف"
        verbose_name_plural = "أصناف المنيو"

    def __str__(self):
        return self.name_ar

    def resolve_image(self, request=None):
        if self.image:
            url = self.image.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return self.image_url or None
