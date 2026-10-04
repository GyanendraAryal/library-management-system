from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from .models import User


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = [
            "phone",
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

# Register Serializer
class RegisterSerializer(ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ["username","password","first_name","last_name","email"]

    def create(self,validated_data):
        return User.objects.create(**validated_data)
