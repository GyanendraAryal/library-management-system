from django.db import transaction
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from .models import BorrowRequest
from .permissions import (
    BorrowRequestAdminOnly,
    UserBorrowRequestOnly,
    UserOnlyBorrowingHistory,
    AdminOnlyBorrowingHistory,
)
from books.models import Books
from .serializers import BorrowRequestSerializer
from django.utils import timezone


# Create your views here.
class AdminOnlyBorrowingAPIView(APIView):
    permission_classes = [BorrowRequestAdminOnly]

    def get(self, request):
        borrowings = BorrowRequest.objects.all()
        count = borrowings.count()
        serializer = BorrowRequestSerializer(borrowings, many=True)
        return Response(
            {
                "total": count,
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"message": "ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        borrowing = get_object_or_404(BorrowRequest, id=id)
        if borrowing.status != "P":
            return Response(
                {"message": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if borrowing.book.available_quantity <= 0:
            return Response(
                {"message": "This book is no longer available"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = BorrowRequestSerializer(
            borrowing,
            data=request.data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        approved_days = serializer.validated_data["approved_days"]

        # Syncing with database
        try:
            with transaction.atomic():
                book = Books.objects.select_for_update().get(id=borrowing.book.id)
                book.available_quantity -= 1
                book.save()
                borrowing.status = "A"
                borrowing.approved_at = timezone.now()
                borrowing.approved_days = approved_days
                borrowing.approved_by = request.user
                borrowing.save()
                return Response(
                    {"message": "Your request is approved"},
                    status=status.HTTP_200_OK,
                )
        except Exception as e:
            return Response(
                {"message": "Error processing request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class UserBorrowingRequestAPIView(APIView):
    permission_classes = [UserBorrowRequestOnly]

    def get(self, request):
        user = request.user
        borrowings = BorrowRequest.objects.filter(user=user)
        count = borrowings.count()
        serializer = BorrowRequestSerializer(borrowings, many=True)
        return Response(
            {"total": count, "data": serializer.data}, status=status.HTTP_200_OK
        )

    def post(self, request):
        serializer = BorrowRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(
            user=request.user,
            status="P",
        )
        return Response(
            {"message": "Borrow request created successfully","data":serializer.data},
            status=status.HTTP_200_OK,
        )


class BorrowingHistoryAPIView(APIView):
    permission_classes = [AdminOnlyBorrowingHistory]

    def get(self, request, id=None):
        if id:
            user = request.user
            books = Books.objects.filter(user=user)
            books = books.filter("returned_date", books.returned_date)
