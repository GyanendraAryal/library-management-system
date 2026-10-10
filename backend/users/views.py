from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework import status
from .serializers import RegisterSerializer, UserSerializer
from .models import User
from .permissions import UserViewByAdminOnly, UserViewOnly
from rest_framework.permissions import AllowAny


# Register User and get token
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "token": token.key,
                    "message": "User created sucessfully.",
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
            {
                "error": serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class LoginAPIView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        if username == "" or password == "":
            return Response(
                {"error": "Login failed, All fields are required!!"}, status=400
            )
        user = authenticate(username=username, password=password)
        if user:
            # get_or_create:- creates token if not already created and return token if already exists and returns tuple with token object and a flag so have to use this [token,_].
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "Login successful",
                    "username": user.username,
                    "token": token.key,
                    "user":user
                },
                status=200,
            )
        return Response({"error": "Invalid Credentials,Login failed"}, status=401)


class UserListAPIView(APIView):
    permission_classes = [UserViewByAdminOnly]

    def get(self, request):
        users = User.objects.all()
        serializer = UserSerializer(users, many=True)
        return Response({"data": serializer.data})


class MyProdileListAPIView(APIView):
    permission_classes = [UserViewOnly]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)
