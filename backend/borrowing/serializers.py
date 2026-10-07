from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import BorrowRequest
from users.models import User
from books.models import Books
from users.serializers import UserSerializer
from books.serializers import BooksSerializer


class BorrowRequestSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)
    book = BooksSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=Books.objects.all(), source="book", write_only=True
    )
    approved_by = UserSerializer(read_only=True)
    class Meta:
        model = BorrowRequest
        fields = [
            "id",
            "user",
            "book",
            "book_id",
            "requested_days",
            "status",
            "approved_days",
            "requested_at",
            "approved_at",
            "approved_by",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "requested_at",
            "approved_at",
            "approved_by",
        ]

    def validate(self, attrs):
        book = attrs["book"]
        if book.available_quantity <= 0:
            raise serializers.ValidationError("This book is currently unavailable.")
        return attrs
