"""
Root URL configuration for the Library Management System backend.

API routes are versioned under /api/v1/.
Authentication routes use /auth/.
API documentation is served at /api/docs/ (Swagger) and /api/redoc/ (ReDoc).

Development note: Media files (uploaded book images) are served directly by
Django when DEBUG=True. In production, serve them via nginx or S3.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

urlpatterns = [
    # Django admin panel
    path("admin/", admin.site.urls),

    # Books: catalogue management (CRUD), author management
    path("api/v1/books/", include("books.urls")),

    # Borrowing: borrow request lifecycle, return workflow, history
    path("api/v1/borrowing/", include("borrowing.urls")),

    # Authentication: register, login, logout, user profile
    path("auth/", include("users.urls")),

    # --- API Documentation (Requirement 7: Testing and API Documentation) ---
    # /api/schema/         — raw OpenAPI 3.0 JSON schema
    # /api/docs/           — Swagger UI (interactive browser)
    # /api/redoc/          — ReDoc UI (clean read-only reference)
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]

# Serve user-uploaded media files in development (DEBUG=True only).
# ImageField (book covers) requires MEDIA_ROOT and this URL handler.
# In production, delegate this to a proper static file server (nginx/S3).
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
