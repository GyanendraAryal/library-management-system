from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from .models import Books, Author, Genre
from users.serializers import UserSerializer
from users.models import User


class AuthorSerializer(ModelSerializer):
    class Meta:
        model = Author
        fields = "__all__"


class GenreSerializer(ModelSerializer):
    class Meta:
        model = Genre
        fields = "__all__"


class BooksSerializer(ModelSerializer):
    author = AuthorSerializer(read_only=True)
    user = UserSerializer(read_only=True)
    genre = GenreSerializer(read_only=True)

    author_id = serializers.PrimaryKeyRelatedField(
        queryset=Author.objects.all(), source="author", write_only=True
    )
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source="user", write_only=True
    )
    genre_id = serializers.PrimaryKeyRelatedField(
        queryset=Genre.objects.all(), source="genre", write_only=True
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
            "user_id",
            "author_id",
            "created_at",
            "updated_at",
        ]

        read_only_fields = ["id"]
