"""
Views for the users application.

Endpoints:
  POST /auth/register/         - Create a new member account (public)
  POST /auth/login/            - Authenticate and receive a token
  POST /auth/logout/           - Invalidate the current token (authenticated)
  GET  /auth/users/            - List all users (admin only)
  GET  /auth/users/profile/    - View the authenticated user's own profile
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework import status
from .serializers import RegisterSerializer, UserSerializer
from .models import User
from .permissions import UserViewByAdminOnly, UserViewOnly
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema
from rest_framework.parsers import MultiPartParser, FormParser


class RegisterAPIView(APIView):
    """
    Public endpoint for creating a new library member account.

    On success, returns a token so the user is immediately logged in without
    requiring a separate login call.
    """

    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, responses=RegisterSerializer)
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Issue a token immediately so the user is auto-authenticated
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "token": token.key,
                    "message": "User created successfully.",
                    "data": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                    },
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"error": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginAPIView(APIView):
    """
    Authenticates a user by username and password and returns a token.

    The token must be included in subsequent requests as:
        Authorization: Token <token_key>
    """

    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        # Fix: use `not username` to catch both None (missing field) and ""
        # (empty string). The original `== ""` check missed the None case,
        # causing authenticate() to receive None and return unexpected results.
        if not username or not password:
            return Response(
                {"error": "Login failed. Both username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(username=username, password=password)
        if user:
            # get_or_create returns (token, created_flag); we only need the token
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "Login successful.",
                    "username": user.username,
                    "token": token.key,
                    # Fix: serialize the user object — Django model instances are not
                    # JSON-serializable and caused a 500 error on every successful login.
                    "user": UserSerializer(user).data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": "Invalid credentials. Login failed."},
            status=status.HTTP_401_UNAUTHORIZED,
        )


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
            return Response(
                {"message": "Logged out successfully. Token deleted."},
                status=status.HTTP_200_OK,
            )
        except Exception:
            return Response(
                {"message": "Something went wrong or token does not exist."},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UserListAPIView(APIView):
    permission_classes = [UserViewByAdminOnly]

    def get(self, request):
        users = User.objects.all()
        count = users.count()
        serializer = UserSerializer(users, many=True)
        return Response(
            {
                "count": count,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class MyProfileListAPIView(APIView):
    permission_classes = [UserViewOnly]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        # request.user is set by TokenAuthentication middleware
        serializer = UserSerializer(request.user)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserSerializer(
            instance=request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Profile updated successfully.", "data": serializer.data},
            status=status.HTTP_200_OK,
        )
