from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token


# Create your views here.
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
            token,_ = Token.objects.get_or_create(user=user)
            return Response(
                {
                    "message": "Login successful",
                    "username": user.username,
                    "token": token.key,
                },
                status=200,
            )
        return Response({"error": "Invalid Credentials,Login failed"}, status=401)
