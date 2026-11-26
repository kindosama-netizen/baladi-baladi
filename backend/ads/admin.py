from django.contrib import admin

from .models import Advertisement


@admin.register(Advertisement)
class AdvertisementAdmin(admin.ModelAdmin):
    list_display = ("title_ar", "placement", "is_active", "start_at", "end_at", "sort_order")
    list_filter = ("placement", "is_active")
