from rest_framework import serializers

from .models import Advertisement


class AdvertisementSerializer(serializers.ModelSerializer):
    is_currently_visible = serializers.BooleanField(read_only=True)

    class Meta:
        model = Advertisement
        fields = [
            "id",
            "title_ar",
            "description_ar",
            "image",
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
        read_only_fields = ["created_at", "updated_at", "is_currently_visible"]
