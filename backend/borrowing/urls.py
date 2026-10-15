from django.urls import path
from .views import (
    AdminOnlyBorrowingAPIView,
    AdminBorrowingHistoryAPIView,
    UserBorrowingRequestAPIView,
    UserReturnRequestAPIView,
)

urlpatterns = [
    # Admin: view all borrow requests
    path("", AdminOnlyBorrowingAPIView.as_view(), name="admin_borrowing"),
    # Admin: approve a specific request (PATCH)
    path(
        "<int:id>/",
        AdminOnlyBorrowingAPIView.as_view(),
        name="admin_borrowing_detail",
    ),
    # History must go to AdminBorrowingHistoryAPIView.
    path("history/", AdminBorrowingHistoryAPIView.as_view(), name="borrowing_history"),

    # Member: view own requests and submit new ones
    path("user/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),
    path(
        "user/<int:id>/",
        UserBorrowingRequestAPIView.as_view(),
        name="user_borrowing_detail",
    ),

    # Return workflow: list and submit returns
    path("return/", UserReturnRequestAPIView.as_view(), name="return_book"),
    path(
        "return/<int:id>/",
        UserReturnRequestAPIView.as_view(),
        name="return_book_detail",
    ),
]
