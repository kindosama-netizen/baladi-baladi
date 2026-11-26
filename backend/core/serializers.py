from rest_framework import serializers

from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "id",
            "restaurant_name",
            "restaurant_name_en",
            "tagline",
            "description",
            "hero_headline",
            "hero_subtext",
            "logo",
            "hero_image",
            "about_image",
            "phone",
            "address",
            "maps_embed_url",
            "maps_link",
            "facebook_url",
            "instagram_url",
            "working_hours",
            "public_site_url",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_at"]
