from django.contrib import admin

from .models import Category, MenuItem


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_ar", "sort_order", "is_active")
    list_editable = ("sort_order", "is_active")


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ("name_ar", "category", "price", "is_available", "is_popular", "sort_order")
    list_filter = ("category", "is_available", "is_popular", "is_recommended")
    list_editable = ("price", "is_available", "sort_order")
