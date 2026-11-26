from django.http import HttpResponse
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from .models import RestaurantTable
from .qr_utils import generate_qr_png_bytes, generate_table_card_png, generate_tables_pdf, table_menu_url
from .serializers import RestaurantTableSerializer


class RestaurantTableViewSet(viewsets.ModelViewSet):
    queryset = RestaurantTable.objects.all()
    serializer_class = RestaurantTableSerializer
    permission_classes = [IsAdminUser]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx["request"] = self.request
        return ctx

    @action(detail=True, methods=["get"])
    def qr(self, request, pk=None):
        table = self.get_object()
        url = table_menu_url(table.number)
        png = generate_qr_png_bytes(url)
        response = HttpResponse(png, content_type="image/png")
        response["Content-Disposition"] = f'attachment; filename="table-{table.number}-qr.png"'
        return response

    @action(detail=True, methods=["get"])
    def card(self, request, pk=None):
        table = self.get_object()
        png = generate_table_card_png(table.number, table.label or "")
        response = HttpResponse(png, content_type="image/png")
        response["Content-Disposition"] = f'attachment; filename="table-{table.number}-card.png"'
        return response

    @action(detail=False, methods=["get"])
    def pdf(self, request):
        tables = RestaurantTable.objects.filter(is_active=True).order_by("number")
        if not tables.exists():
            return Response({"detail": "لا توجد طاولات نشطة"}, status=status.HTTP_404_NOT_FOUND)
        pdf_bytes = generate_tables_pdf(tables)
        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="baladi-baladi-table-qr-cards.pdf"'
        return response

    @action(detail=False, methods=["post"])
    def bulk_create(self, request):
        """Create tables 1..N quickly."""
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
