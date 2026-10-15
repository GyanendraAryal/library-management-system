from rest_framework import serializers
from rest_framework.serializers import ModelSerializer
from .models import BorrowRequest
from books.models import Books
from users.serializers import PublicUserSerializer
from books.serializers import BooksSerializer


class BorrowRequestSerializer(ModelSerializer):
    # Nested read-only representations
    # Use PublicUserSerializer to avoid leaking sensitive user fields
    user = PublicUserSerializer(read_only=True)
    book = BooksSerializer(read_only=True)
    approved_by = PublicUserSerializer(read_only=True)

    # Write-only field for creating a borrow request (client sends book_id)
    book_id = serializers.PrimaryKeyRelatedField(
        queryset=Books.objects.all(), source="book", write_only=True
    )

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
            "returned_at",
            "approved_by",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "requested_at",
            "approved_at",
            "returned_at",
            "approved_by",
        ]

    def validate(self, attrs):
        book = attrs.get("book")
        if book and book.available_quantity <= 0:
            raise serializers.ValidationError(
                {"book_id": "This book is currently unavailable (out of stock)."}
            )
        return attrs
