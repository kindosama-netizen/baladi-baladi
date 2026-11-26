from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from menu.models import Category, MenuItem
from ads.models import Advertisement
from tables_qr.models import RestaurantTable

from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class SiteSettingsPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        settings_obj = SiteSettings.load()
        return Response(SiteSettingsSerializer(settings_obj, context={"request": request}).data)


class SiteSettingsAdminView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get(self, request):
        settings_obj = SiteSettings.load()
        return Response(SiteSettingsSerializer(settings_obj, context={"request": request}).data)

    def patch(self, request):
        settings_obj = SiteSettings.load()
        data = request.data.copy()
        hours = data.get("working_hours")
        if isinstance(hours, str) and hours.strip():
            import json

            try:
                data["working_hours"] = json.loads(hours)
            except json.JSONDecodeError:
                return Response(
                    {"working_hours": "يجب أن تكون بصيغة JSON صحيحة"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        serializer = SiteSettingsSerializer(
            settings_obj, data=data, partial=True, context={"request": request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class DashboardStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        active_ads = sum(1 for ad in Advertisement.objects.all() if ad.is_currently_visible)
        return Response(
            {
                "categories": Category.objects.count(),
                "active_categories": Category.objects.filter(is_active=True).count(),
                "menu_items": MenuItem.objects.count(),
                "available_items": MenuItem.objects.filter(is_available=True).count(),
                "advertisements": Advertisement.objects.count(),
                "active_advertisements": active_ads,
                "tables": RestaurantTable.objects.count(),
                "active_tables": RestaurantTable.objects.filter(is_active=True).count(),
            }
        )
