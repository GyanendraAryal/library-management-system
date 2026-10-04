from django.urls import path
from .views import LoginAPIView, RegisterAPIView, UserListAPIView, MyProdileListAPIView

urlpatterns = [
    path("login/", LoginAPIView.as_view(), name="login"),
    path("users/", UserListAPIView.as_view(), name="users"),
    path("users/profile/", MyProdileListAPIView.as_view(), name="user_profile"),
    path("register/", RegisterAPIView.as_view(), name="register"),
]

