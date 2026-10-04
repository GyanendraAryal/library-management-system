from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework import status
from .serializers import RegisterSerializer, UserSerializer
from .models import User
from .permissions import UserViewByAdminOnly, UserViewOnly


# Create your views here.
# Register User
class RegisterAPIView(APIView):
    def post(self, request):
        # username = request.data.get("username")
        # password = request.data.get("password")
        # first_name = request.data.get("first_name")
        # last_name = request.data.get("last_name")
        # email = request.data.get("email")
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(
                {"message": "User created sucessfully.", "data": serializer.data},
                status=status.HTTP_200_OK,
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
        if username == "" and password == "":
            return Response(
                {"error": "Login failed, All fields are required!!"}, status=400
            )
        print(username, password)
        user = authenticate(username=username, password=password)
        if user:
            # get_or_create:- creates token if not already created and return token if already exists and returns tuple with token object and a flag so have to use this [token,_].
            token, _ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "Login successful",
                    "username": user.username,
                    "token": token.key,
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
