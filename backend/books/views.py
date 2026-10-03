from .permissions import BookWriteByAdminOnly
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Books, Author
from rest_framework.permissions import IsAuthenticated
from .serializers import BooksSerializer, AuthorSerializer
from rest_framework import status


# Books APIViews
class BooksAPIView(APIView):
    permission_classes = [BookWriteByAdminOnly]
    def get(self, request, id=None):
        # For single book
        if id:
            try:
                book = Books.objects.get(id=id)
                serializer = BooksSerializer(book)
                return Response({"data": serializer.data}, status=status.HTTP_200_OK)
            except Books.DoesNotExist:
                return Response(
                    {"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND
                )
        # For all books
        else:
            books = Books.objects.all()
            serializer = BooksSerializer(books, many=True)
            return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = BooksSerializer(
            data=request.data,
        )
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Book created successfully"}, status=status.HTTP_200_OK
            )
        return Response(
            {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request, id):
        try:
            book = Books.objects.get(id=id)
        except Books.DoesNotExist:
            return Response(
                {"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = BooksSerializer(book, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Book updated successfully"}, status=status.HTTP_200_OK
            )
        return Response(
            {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id):
        try:
            book = Books.objects.get(id=id)
        except Books.DoesNotExist:
            return Response(
                {"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND
            )
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Authors APIView
class AuthorAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, id=None):
        if id:
            try:
                author = Author.objects.get(id=id)
                serializer = AuthorSerializer(author)
                return Response({"data": serializer.data}, status=status.HTTP_200_OK)
            except Author.DoesNotExist:
                return Response(
                    {"error": "Author doesn't exists"}, status=status.HTTP_404_NOT_FOUND
                )
        else:
            authors = Author.objects.all()
            serializer = AuthorSerializer(authors, many=True)
            return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AuthorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Author created successfully", "data": serializer.data}
            )
        return Response(status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, id=None):
        if id:
            try:
                author = Author.objects.get(id=id)
                serializer = AuthorSerializer(author, data=request.data)
                if serializer.is_valid(raise_exception=True):
                    serializer.save()
                    return Response(
                        {
                            "message": "Author updated successfully",
                            "data": serializer.data,
                        },
                        status=status.HTTP_200_OK,
                    )
            except Author.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        else:
            return Response(
                {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, id=None):
        if id:
            try:
                author = Author.objects.get(id=id)
                author.delete()
                return Response(
                    {"message": "Author deleted successfully"},
                    status=status.HTTP_204_NO_CONTENT,
                )
            except Author.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
        else:
            return Response(status=status.HTTP_400_BAD_REQUEST)
