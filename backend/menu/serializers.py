from rest_framework import serializers

from .models import Category, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name_ar", read_only=True)
    image = serializers.SerializerMethodField()

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
            "image_url",
            "is_popular",
            "is_recommended",
            "is_available",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "image"]
        extra_kwargs = {
            "image_url": {"required": False, "allow_blank": True},
        }

    def get_image(self, obj):
        return obj.resolve_image(self.context.get("request"))

    def create(self, validated_data):
        image_file = self.context["request"].FILES.get("image") if self.context.get("request") else None
        obj = super().create(validated_data)
        if image_file:
            obj.image = image_file
            obj.save(update_fields=["image"])
        return obj

    def update(self, instance, validated_data):
        image_file = self.context["request"].FILES.get("image") if self.context.get("request") else None
        obj = super().update(instance, validated_data)
        if image_file:
            obj.image = image_file
            obj.save(update_fields=["image"])
        return obj


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source="items.count", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name_ar",
            "description_ar",
            "image",
            "image_url",
            "sort_order",
            "is_active",
            "items",
            "items_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "items", "items_count", "image"]

    def get_image(self, obj):
        return obj.resolve_image(self.context.get("request"))

    def create(self, validated_data):
        image_file = self.context["request"].FILES.get("image") if self.context.get("request") else None
        obj = super().create(validated_data)
        if image_file:
            obj.image = image_file
            obj.save(update_fields=["image"])
        return obj

    def update(self, instance, validated_data):
        image_file = self.context["request"].FILES.get("image") if self.context.get("request") else None
        obj = super().update(instance, validated_data)
        if image_file:
            obj.image = image_file
            obj.save(update_fields=["image"])
        return obj


class CategoryListSerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            "id",
            "name_ar",
            "description_ar",
            "image",
            "image_url",
            "sort_order",
            "is_active",
            "items_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "image"]

    def get_items_count(self, obj):
        return obj.items.count()

    def get_image(self, obj):
        return obj.resolve_image(self.context.get("request"))
