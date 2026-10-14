import logging
from django.db import transaction
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from .models import BorrowRequest
from .permissions import (
    BorrowRequestAdminOnly,
    UserBorrowRequestOnly,
    UserOnlyReturnRequest,
    AdminOnlyBorrowingHistory,
)
from books.models import Books
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import BorrowRequestSerializer
from django.utils import timezone
from .pagination import BorrowingPagination

logger = logging.getLogger(__name__)


# Create your views here.
class AdminOnlyBorrowingAPIView(APIView):
    permission_classes = [BorrowRequestAdminOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user", "book", "status", "approved_by"]

    def get(self, request):
        borrowings = BorrowRequest.objects.all().order_by("id")
        # filtering
        for backend in self.filter_backends:
            borrowings = backend().filter_queryset(request,borrowings,view=self)
        # using pagination class directly-easy syntax
        paginator = BorrowingPagination()
        page = paginator.paginate_queryset(borrowings, request, view=self)
        if page is not None:
            serializer = BorrowRequestSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
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
                if book.available_quantity <= 0:
                    return Response(
                        {"message": "This book ran out of stock"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
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
            logger.error(f"Error processing borrow approval for request {id} {str(e)}")
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
            {"message": "Borrow request created successfully", "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"message": "Id is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        borrow_request = get_object_or_404(BorrowRequest, id=id)
        serializer = BorrowRequestSerializer(
            borrow_request, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Request updated successfully"}, status=status.HTTP_200_OK
        )


class AdminBorrowingHistoryAPIView(APIView):
    permission_classes = [AdminOnlyBorrowingHistory]

    def get(self, request):
        history = BorrowRequest.objects.filter(status="R")
        serializer = BorrowRequestSerializer(history, many=True)
        return Response(
            {"data": serializer.data},
            status=status.HTTP_200_OK,
        )


# Return request
class UserReturnRequestAPIView(APIView):
    permission_classes = [UserOnlyReturnRequest]

    def get(self, request):
        user = request.user
        return_request = BorrowRequest.objects.filter(user=user, status="SR")
        serializer = BorrowRequestSerializer(return_request, many=True)
        count = return_request.count()
        return Response(
            {"count": count, "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request, id=None):
        if not id:
            return Response(
                {"message": "Id is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        borrow_request = get_object_or_404(BorrowRequest, id=id)
        if borrow_request.count() <= 0:
            return Response(
                {"message": "No request found"}, status=status.HTTP_204_NO_CONTENT
            )
        if borrow_request.status != "A":
            return Response(
                {
                    "message": "You can only request a return for book you currently hold"
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        borrow_request.status = "SR"
        borrow_request.save()
        serializer = BorrowRequestSerializer(borrow_request)
        return Response(
            {
                "message": "Return request submitted successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, id=None):
        if not id:
            return Response(
                {"message": "Id is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        user = request.user
        if user.is_staff or user.is_superuser:
            borrow_request = get_object_or_404(BorrowRequest, id=id)
            borrow_request.delete()
            return Response(
                {"message": "Return request deleted successfully"},
                status=status.HTTP_200_OK,
            )
        borrow_request = get_object_or_404(BorrowRequest, id=id, user=request.user)
        if borrow_request.status != "SR":
            return Response(
                {
                    "message": "You can only cancel return requests that are currently pending admin review."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        borrow_request.status = "A"
        borrow_request.save()
        serializer = BorrowRequestSerializer(borrow_request)
        return Response(
            {
                "message": "Return request canceled successfully",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"message": "Id is required"}, status=status.HTTP_400_BAD_REQUEST
            )
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"message": "You do not have permission to perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        borrow_request = get_object_or_404(BorrowRequest, id=id)
        if borrow_request.count() <= 0:
            return Response(
                {"message": "No request found"}, status=status.HTTP_204_NO_CONTENT
            )
        if borrow_request.status != "SR":
            return Response(
                {
                    "message": "This book is not currently pending a return validation review."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            with transaction.atomic():
                book = Books.objects.select_for_update().get(id=borrow_request.book.id)
                book.available_quantity += 1
                book.save()
                borrow_request.status = "R"
                borrow_request.save()
                serializer = BorrowRequestSerializer(borrow_request)
                return Response(
                    {
                        "message": "Return request accepted successfully",
                        "data": serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
        except Exception as e:
            logger.exception(
                f"Database failure during return execution on ID {id}: {e}"
            )
            return Response(
                {"message": "Error processing the backend return request"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
