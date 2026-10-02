from django.urls import path
from .views import BooksAPIView

urlpatterns = [
    path("books/", BooksAPIView.as_view(), name="books"),
]
