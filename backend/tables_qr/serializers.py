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
        from .qr_utils import menu_url

        return menu_url()
