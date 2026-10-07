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
        if id:
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
                borrowing, data=request.data, partial=True
            )
            serializer.is_valid(raise_exception=True)
            approved_days = serializer.validated_data["approved_days"]

            borrowing.status = "A"
            borrowing.approved_days = approved_days
            borrowing.approved_at = timezone.now()
            borrowing.approved_by = request.user

            # Decrease quantity BEFORE saving
            borrowing.book.available_quantity -= 1

            try:
                borrowing.book.save()
                borrowing.save()
                return Response(
                    {"message": "Your request is approved"}, status=status.HTTP_200_OK
                )
            except Exception as e:
                print(f"✗ Save failed: {e}")
                return Response(
                    {"message": f"Error processing request: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {"data": BorrowRequestSerializer(borrowing).data},
                status=status.HTTP_200_OK,
            )
        return Response(
            {"message": "ID is required"},
            status=status.HTTP_400_BAD_REQUEST,
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
            {"message": "Borrow request created successfully"},
            status=status.HTTP_200_OK,
        )


class BorrowingHistoryAPIView(APIView):
    permission_classes = [AdminOnlyBorrowingHistory]

    def get(self, request, id=None):
        if id:
            user = request.user
            books = Books.objects.filter(user=user)
            books = books.filter("returned_date", books.returned_date)
