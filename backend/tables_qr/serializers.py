from rest_framework import serializers

from .models import RestaurantTable


class RestaurantTableSerializer(serializers.ModelSerializer):
    menu_url = serializers.SerializerMethodField()

    class Meta:
        model = RestaurantTable
        fields = [
            "id",
            "number",
            "label",
            "is_active",
            "menu_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at", "menu_url"]

    def get_menu_url(self, obj):
        request = self.context.get("request")
        from django.conf import settings
        from core.models import SiteSettings

        site = SiteSettings.load()
        base = (site.public_site_url or settings.PUBLIC_SITE_URL or "").rstrip("/")
        if not base and request:
            base = f"{request.scheme}://{request.get_host()}"
        return obj.menu_url(base or "http://localhost:5173")
