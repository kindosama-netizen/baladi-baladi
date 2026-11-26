from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAdminUser

from .models import Category, MenuItem
from .serializers import CategoryListSerializer, CategorySerializer, MenuItemSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action == "list" and self.request.query_params.get("include_items") != "1":
            return CategoryListSerializer
        return CategorySerializer

    def get_queryset(self):
        qs = Category.objects.all()
        if not self.request.user.is_staff:
            qs = qs.filter(is_active=True)
            qs = qs.prefetch_related(
                Prefetch("items", queryset=MenuItem.objects.filter(category__is_active=True))
            )
        else:
            qs = qs.prefetch_related("items")
        return qs


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = MenuItem.objects.select_related("category").all()
        if not self.request.user.is_staff:
            qs = qs.filter(category__is_active=True)
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category_id=category)
        available = self.request.query_params.get("available")
        if available == "1":
            qs = qs.filter(is_available=True)
        popular = self.request.query_params.get("popular")
        if popular == "1":
            qs = qs.filter(is_popular=True)
        return qs
