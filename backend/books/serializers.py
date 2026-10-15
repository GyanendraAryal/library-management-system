from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from .models import Books, Author, Genre
from users.serializers import PublicUserSerializer


class AuthorSerializer(ModelSerializer):
    # Full serializer for Author. Used for author CRUD endpoints.
    class Meta:
        model = Author
        fields = "__all__"


class GenreSerializer(ModelSerializer):
    # Full serializer for Genre. Used for genre display in book responses.
    class Meta:
        model = Genre
        fields = "__all__"


class BooksSerializer(ModelSerializer):
    # Nested read-only representations for GET responses
    author = AuthorSerializer(read_only=True)
    # Use PublicUserSerializer to avoid leaking is_staff, email, etc.
    user = PublicUserSerializer(read_only=True)
    genre = GenreSerializer(read_only=True)

    # Write-only ID fields for POST/PUT requests
    author_id = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(), source="author", write_only=True
    )
    genre_id = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(),
        source="genre",
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Books
        fields = [
            "id",
            "title",
            "description",
            "isbn_number",
            "book_image",
            "genre",
            "genre_id",
            "quantity",
            "available_quantity",
            "user",
            "author",
            "author_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "available_quantity",
            "created_at",
            "updated_at",
        ]
