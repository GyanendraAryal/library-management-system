from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Books
from rest_framework.permissions import IsAuthenticated
from .serializers import BooksSerializer


# Create your views here.
class BooksAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        books = Books.objects.all()
        serializer = BooksSerializer(books, many=True)
        if not books:
            return Response({"message": "No books were found"})
        return Response({"message": "sucessfull", "books": serializer.data})
