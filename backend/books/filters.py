from django_filters import rest_framework as filters
from django_filters.rest_framework import DjangoFilterBackend
from books.models import Books


class BookFilter(filters.FilterSet):
    title = filters.CharFilter(field_name="title", lookup_expr="icontans")
    author = filters.CharFilter(
        field_name="author__author_name", lookup_expr="icontains"
    )
    genre = filters.CharFilter(field_name="genre__title", lookup_expr="icontains")

    class Meta:
        models = Books
        fields = ["title", "author", "genre"]
