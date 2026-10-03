from django.urls import path
from .views import BooksAPIView, AuthorAPIView

urlpatterns = [
    # GET all books and POST books
    path("", BooksAPIView.as_view(), name="books"),
    # GET, PUT, DELETE book
    path("<int:id>/", BooksAPIView.as_view(), name="book-details"),
    # GET all authors and POST authors
    path("authors/", AuthorAPIView.as_view(), name="authors"),
    # GET, PUT, DELETE authors
    path("<int:id>/", AuthorAPIView.as_view(), name="author-details"),
]
