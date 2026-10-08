from django.urls import path
from .views import AdminOnlyBorrowingAPIView, UserBorrowingRequestAPIView

urlpatterns = [
    path("", AdminOnlyBorrowingAPIView.as_view(), name="borrowing"),
    path(
        "<int:id>/",
        AdminOnlyBorrowingAPIView.as_view(),
        name="admin_borrowing_detail",
    ),
    path("user/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),
    path("history/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),
    # path("history/<int:id>/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),
]
