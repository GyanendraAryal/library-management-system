from django_filters import rest_framework as filters
from books.models import Books

class BookFilter(filters.FilterSet):
    title = filters.CharFilter(field_name="title", lookup_expr="icontains")
    # Double-underscore traversal reaches through the FK to the author's name
    author = filters.CharFilter(
        field_name="author__author_name", lookup_expr="icontains"
    )
    # Same pattern for genre title
    genre = filters.CharFilter(field_name="genre__title", lookup_expr="icontains")

    class Meta:
        model = Books
        fields = ["title", "author", "genre"]
