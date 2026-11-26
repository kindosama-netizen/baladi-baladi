from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponse
from django.views import View


class SpaView(View):
    """Serve the Vite-built index.html for client-side routes."""

    def get(self, request, *args, **kwargs):
        index = Path(settings.FRONTEND_DIST) / "index.html"
        if not index.exists():
            raise Http404("Frontend build not found. Run npm run build in frontend/.")
        return FileResponse(index.open("rb"), content_type="text/html")
