from rest_framework import serializers

from .models import SiteSettings


def _resolve(file_field, url_field, request):
    if file_field:
        url = file_field.url
        if request:
            return request.build_absolute_uri(url)
        return url
    return url_field or None


class SiteSettingsSerializer(serializers.ModelSerializer):
    logo = serializers.SerializerMethodField()
    hero_image = serializers.SerializerMethodField()
    about_image = serializers.SerializerMethodField()

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
            "logo_url",
            "hero_image",
            "hero_image_url",
            "about_image",
            "about_image_url",
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
        read_only_fields = ["id", "updated_at", "logo", "hero_image", "about_image"]

    def get_logo(self, obj):
        return _resolve(obj.logo, obj.logo_url, self.context.get("request"))

    def get_hero_image(self, obj):
        return _resolve(obj.hero_image, obj.hero_image_url, self.context.get("request"))

    def get_about_image(self, obj):
        return _resolve(obj.about_image, obj.about_image_url, self.context.get("request"))

    def update(self, instance, validated_data):
        request = self.context.get("request")
        obj = super().update(instance, validated_data)
        if request:
            for name in ("logo", "hero_image", "about_image"):
                f = request.FILES.get(name)
                if f:
                    setattr(obj, name, f)
            obj.save()
        return obj
