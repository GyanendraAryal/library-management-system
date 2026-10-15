"""
Serializers for the users application.

- PublicUserSerializer: Minimal representation used for nesting inside books/borrowing
  responses. Only exposes safe, non-sensitive fields.
- UserSerializer: Full profile serializer for admin list and profile endpoints.
- RegisterSerializer: Write-only serializer for new user registration.
"""

from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from .models import User


class PublicUserSerializer(ModelSerializer):
    """
    Safe, minimal user representation for embedding inside other resources
    (e.g. book creator, borrow request owner).

    Intentionally excludes is_staff, is_active, email, and date_joined to
    prevent sensitive data from leaking into public-facing API responses.
    """

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        read_only_fields = ["id", "username", "first_name", "last_name"]


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "phone",
            "image",
            "username",
            "first_name",
            "last_name",
            "email",
            "is_staff",
            "is_active",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "date_joined",
            "is_staff",
        ]


class RegisterSerializer(ModelSerializer):
    # write_only ensures the raw password is never echoed back in a response
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["username", "password", "first_name", "last_name", "email"]

    def create(self, validated_data):
        #Use create_user so the password is hashed, not stored as plain text.
        return User.objects.create_user(**validated_data)
