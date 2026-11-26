from rest_framework import serializers

from .models import Category, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name_ar", read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "category",
            "category_name",
            "name_ar",
            "description_ar",
            "price",
            "image",
            "is_popular",
            "is_recommended",
            "is_available",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source="items.count", read_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name_ar",
            "description_ar",
            "image",
            "sort_order",
            "is_active",
            "items",
            "items_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "items", "items_count"]


class CategoryListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name_ar",
            "description_ar",
            "image",
            "sort_order",
            "is_active",
            "items_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]

    def get_items_count(self, obj):
        return obj.items.count()
