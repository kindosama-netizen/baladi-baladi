from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import Advertisement
from .serializers import AdvertisementSerializer


class AdvertisementViewSet(viewsets.ModelViewSet):
    serializer_class = AdvertisementSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Advertisement.objects.all()
        placement = self.request.query_params.get("placement")
        if placement:
            qs = qs.filter(placement=placement)

        # Public: only currently visible
        if not self.request.user.is_staff:
            now = timezone.now()
            qs = qs.filter(is_active=True)
            qs = qs.exclude(start_at__gt=now)
            qs = qs.exclude(end_at__lt=now)
        else:
            preview = self.request.query_params.get("preview")
            if preview == "1":
                return qs
            active_only = self.request.query_params.get("active")
            if active_only == "1":
                now = timezone.now()
                qs = qs.filter(is_active=True)
                qs = qs.exclude(start_at__gt=now)
                qs = qs.exclude(end_at__lt=now)
        return qs
