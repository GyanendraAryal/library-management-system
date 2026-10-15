from django.urls import path
from .views import BooksAPIView, AuthorAPIView

urlpatterns = [
    # Book list (GET all, POST create)
    path("", BooksAPIView.as_view(), name="books"),
    # Book detail (GET one, PUT update, DELETE remove)
    path("<int:id>/", BooksAPIView.as_view(), name="book-details"),

    # Author list (GET all, POST create)
    path("authors/", AuthorAPIView.as_view(), name="authors"),
    path("authors/<int:id>/", AuthorAPIView.as_view(), name="author-details"),
]
