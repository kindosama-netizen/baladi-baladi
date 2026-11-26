from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from accounts.views import AdminTokenObtainPairView, MeView
from ads.views import AdvertisementViewSet
from core.spa import SpaView
from core.views import DashboardStatsView, SiteSettingsAdminView, SiteSettingsPublicView
from menu.views import CategoryViewSet, MenuItemViewSet
from tables_qr.views import RestaurantTableViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"menu-items", MenuItemViewSet, basename="menu-item")
router.register(r"advertisements", AdvertisementViewSet, basename="advertisement")
router.register(r"tables", RestaurantTableViewSet, basename="table")

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("api/auth/login/", AdminTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", MeView.as_view(), name="me"),
    path("api/settings/", SiteSettingsPublicView.as_view(), name="settings-public"),
    path("api/admin/settings/", SiteSettingsAdminView.as_view(), name="settings-admin"),
    path("api/admin/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve SPA for non-API routes when frontend dist exists
if (settings.FRONTEND_DIST / "index.html").exists():
    urlpatterns += [
        re_path(
            r"^(?!api/|django-admin/|static/|media/).*$",
            SpaView.as_view(),
            name="spa",
        ),
    ]
