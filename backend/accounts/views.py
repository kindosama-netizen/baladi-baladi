from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

User = get_user_model()


class AdminTokenObtainPairView(TokenObtainPairView):
    """Login endpoint — only staff/superusers may obtain tokens for admin SPA."""

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code != 200:
            return response
        username = request.data.get("username")
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        if not user.is_staff:
            return Response(
                {"detail": "هذا الحساب غير مصرح له بالدخول للوحة التحكم"},
                status=status.HTTP_403_FORBIDDEN,
            )
        data = response.data
        data["username"] = user.username
        data["is_superuser"] = user.is_superuser
        return Response(data)


class MeView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        return Response(
            {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email,
                "is_superuser": request.user.is_superuser,
            }
        )
