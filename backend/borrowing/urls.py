from django.urls import path
from .views import (
    AdminOnlyBorrowingAPIView,
    UserBorrowingRequestAPIView,
    UserReturnRequestAPIView,
)

urlpatterns = [
    path("", AdminOnlyBorrowingAPIView.as_view(), name="borrowing"),
    path(
        "<int:id>/",
        AdminOnlyBorrowingAPIView.as_view(),
        name="admin_borrowing_detail",
    ),
    path("user/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),
    path("history/", UserBorrowingRequestAPIView.as_view(), name="user_borrowing"),
    # returning request
    path("return/", UserReturnRequestAPIView.as_view(), name="return_book"),
    # for post/patch/delete
    path("return/<int:id>/", UserReturnRequestAPIView.as_view(), name="return_book"),
]
