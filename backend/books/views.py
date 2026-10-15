from .permissions import BookWriteByAdminOnly
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Books, Author
from rest_framework.permissions import IsAuthenticated
from .serializers import BooksSerializer, AuthorSerializer
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from .filters import BookFilter
from rest_framework.filters import SearchFilter
from .pagination import BookPagination
from drf_spectacular.utils import extend_schema


@extend_schema(tags=["Books"])
class BooksAPIView(APIView):
    permission_classes = [BookWriteByAdminOnly]
    # These attributes are required for DjangoFilterBackend and SearchFilter
    # to work when called manually on an APIView (they check view attributes).
    filterset_class = BookFilter
    search_fields = ["title", "author__author_name", "genre__title"]

    def get(self, request, id=None):
        # --- Single book detail ---
        if id:
            try:
                book = Books.objects.get(id=id)
                serializer = BooksSerializer(book)
                return Response({"data": serializer.data}, status=status.HTTP_200_OK)
            except Books.DoesNotExist:
                return Response(
                    {"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND
                )

        # Book list with filtering, search, and pagination
        books = Books.objects.all().order_by("id")

        # Step 1: Apply django-filters (title, author, genre query params)
        filter_backend = DjangoFilterBackend()
        books = filter_backend.filter_queryset(request, books, self)

        # Step 2: Apply full-text search (?search=...)
        search_backend = SearchFilter()
        books = search_backend.filter_queryset(request, books, self)

        # Step 3: Paginate the fully-filtered queryset
        paginator = BookPagination()
        page = paginator.paginate_queryset(books, request, view=self)
        if page is not None:
            serializer = BooksSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        # Fallback if pagination is disabled
        serializer = BooksSerializer(books, many=True)
        return Response(
            {"total": books.count(), "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = BooksSerializer(data=request.data)
        if serializer.is_valid():
            # Automatically assign the book to the currently logged-in staff member.
            serializer.save(user=request.user)
            return Response(
                {"message": "Book created successfully", "data": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request, id=None):
        if not id:
            return Response(
                {"error": "Book ID is required for update"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            book = Books.objects.get(id=id)
        except Books.DoesNotExist:
            return Response(
                {"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # partial=True allows updating only the provided fields (PATCH semantics)
        serializer = BooksSerializer(book, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Book updated successfully", "data": serializer.data},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id=None):
        if not id:
            return Response(
                {"error": "Book ID is required for deletion"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            book = Books.objects.get(id=id)
        except Books.DoesNotExist:
            return Response(
                {"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND
            )
        book.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@extend_schema(tags=["Authors"])
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
                    {"error": "Author not found"}, status=status.HTTP_404_NOT_FOUND
                )
        authors = Author.objects.all()
        serializer = AuthorSerializer(authors, many=True)
        return Response({"data": serializer.data}, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = AuthorSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Author created successfully", "data": serializer.data},
                # Fix: was returning HTTP 200 — resource creation must be 201
                status=status.HTTP_201_CREATED,
            )
        return Response(
            {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request, id=None):
        if not id:
            return Response(
                {"error": "Author ID is required for update"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            author = Author.objects.get(id=id)
        except Author.DoesNotExist:
            return Response(
                {"error": "Author not found"}, status=status.HTTP_404_NOT_FOUND
            )

        serializer = AuthorSerializer(author, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message": "Author updated successfully",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            {"error": serializer.errors}, status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, id=None):
        if not id:
            return Response(
                {"error": "Author ID is required for deletion"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            author = Author.objects.get(id=id)
            author.delete()
            return Response(
                {"message": "Author deleted successfully"},
                status=status.HTTP_204_NO_CONTENT,
            )
        except Author.DoesNotExist:
            return Response(
                {"error": "Author not found"}, status=status.HTTP_404_NOT_FOUND
            )
