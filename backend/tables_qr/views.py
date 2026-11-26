from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import RestaurantTable
from .qr_utils import (
    generate_menu_card_png,
    generate_menu_pdf,
    generate_qr_png_bytes,
    menu_url,
)
from .serializers import RestaurantTableSerializer


class RestaurantTableViewSet(viewsets.ModelViewSet):
    queryset = RestaurantTable.objects.all()
    serializer_class = RestaurantTableSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @action(detail=False, methods=["get"])
    def menu_url(self, request):
        return Response({"menu_url": menu_url()})

    @action(detail=False, methods=["get"])
    def menu_qr(self, request):
        """High-resolution unified QR pointing to /menu."""
        png = generate_qr_png_bytes(menu_url(), box_size=18, border=2)
        response = HttpResponse(png, content_type="image/png")
        response["Content-Disposition"] = 'attachment; filename="baladi-menu-qr.png"'
        return response

    @action(detail=False, methods=["get"])
    def menu_card(self, request):
        """Branded printable card (A6 @ 300 DPI)."""
        png = generate_menu_card_png()
        response = HttpResponse(png, content_type="image/png")
        response["Content-Disposition"] = 'attachment; filename="baladi-menu-qr-card.png"'
        return response

    @action(detail=False, methods=["get"])
    def menu_pdf(self, request):
        """A4 PDF with 4 cut-ready unified QR cards."""
        pdf_bytes = generate_menu_pdf(copies=4)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="baladi-menu-qr-cards.pdf"'
        return response

    # ---- legacy aliases (same unified assets) ----
    @action(detail=True, methods=["get"])
    def qr(self, request, pk=None):
        png = generate_qr_png_bytes(menu_url(), box_size=18, border=2)
        response = HttpResponse(png, content_type="image/png")
        response["Content-Disposition"] = 'attachment; filename="baladi-menu-qr.png"'
        return response

    @action(detail=True, methods=["get"])
    def card(self, request, pk=None):
        png = generate_menu_card_png()
        response = HttpResponse(png, content_type="image/png")
        response["Content-Disposition"] = 'attachment; filename="baladi-menu-qr-card.png"'
        return response

    @action(detail=False, methods=["get"])
    def pdf(self, request):
        pdf_bytes = generate_menu_pdf(copies=4)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="baladi-menu-qr-cards.pdf"'
        return response

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        count = int(request.data.get("count", 0))
        if count < 1 or count > 100:
            return Response({"detail": "count must be 1-100"}, status=status.HTTP_400_BAD_REQUEST)
        created = []
        for n in range(1, count + 1):
            obj, was_created = RestaurantTable.objects.get_or_create(
                number=n,
                defaults={"label": f"طاولة {n}", "is_active": True},
            )
            if was_created:
                created.append(obj)
        return Response(
            {
                "created": RestaurantTableSerializer(
                    created, many=True, context={"request": request}
                ).data,
                "total": RestaurantTable.objects.count(),
            },
            status=status.HTTP_201_CREATED,
        )
