from django.urls import path
from .views import (
    LoginAPIView,
    RegisterAPIView,
    UserListAPIView,
    MyProfileListAPIView,
    LogoutAPIView,
)

urlpatterns = [
    path("login/", LoginAPIView.as_view(), name="login"),
    # Fix: was incorrectly named "login" — caused URL reverse collisions
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path("users/", UserListAPIView.as_view(), name="users"),
    path("users/profile/", MyProfileListAPIView.as_view(), name="user_profile"),
    path("register/", RegisterAPIView.as_view(), name="register"),
]
