from rest_framework import serializers

from .models import Advertisement


class AdvertisementSerializer(serializers.ModelSerializer):
    is_currently_visible = serializers.BooleanField(read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Advertisement
        fields = [
            "id",
            "title_ar",
            "description_ar",
            "image",
            "image_url",
            "promo_price",
            "discount_percent",
            "cta_text",
            "cta_link",
            "placement",
            "start_at",
            "end_at",
            "is_active",
            "sort_order",
            "is_currently_visible",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "is_currently_visible", "image"]

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
