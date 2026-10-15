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
from drf_spectacular.utils import extend_schema

logger = logging.getLogger(__name__)


@extend_schema(tags=["Borrowing — Admin"])
class AdminOnlyBorrowingAPIView(APIView):
    permission_classes = [BorrowRequestAdminOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["user__username", "book", "status", "approved_by"]

    def get(self, request):
        borrowings = BorrowRequest.objects.all().order_by("id")

        # Apply filters from query params (?status=P, ?user=3, etc.)
        for backend in self.filter_backends:
            borrowings = backend().filter_queryset(request, borrowings, view=self)

        # Paginate the filtered queryset
        paginator = BorrowingPagination()
        page = paginator.paginate_queryset(borrowings, request, view=self)
        if page is not None:
            serializer = BorrowRequestSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        # Fallback if pagination is disabled
        serializer = BorrowRequestSerializer(borrowings, many=True)
        return Response(
            {"total": borrowings.count(), "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"message": "Request ID is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        borrowing = get_object_or_404(BorrowRequest, id=id)

        # Only pending requests can be approved
        if borrowing.status != "P":
            return Response(
                {"message": "This request has already been processed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Fast-fail if the book is already out of stock (pre-transaction check)
        if borrowing.book.available_quantity <= 0:
            return Response(
                {"message": "This book is no longer available."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BorrowRequestSerializer(
            borrowing, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        approved_days = serializer.validated_data.get("approved_days")

        try:
            with transaction.atomic():
                # Lock the book row to prevent concurrent approval of the last copy
                book = Books.objects.select_for_update().get(id=borrowing.book.id)
                if book.available_quantity <= 0:
                    return Response(
                        {"message": "This book just ran out of stock."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                # Decrement available inventory
                book.available_quantity -= 1
                book.save()

                # Record the approval details
                borrowing.status = "A"
                borrowing.approved_at = timezone.now()
                borrowing.approved_days = approved_days
                borrowing.approved_by = request.user
                borrowing.save()

                return Response(
                    {"message": "Borrow request approved successfully."},
                    status=status.HTTP_200_OK,
                )
        except Exception as e:
            logger.error(
                f"Error processing borrow approval for request {id}: {e}"
            )
            return Response(
                {"message": "An error occurred while processing the request."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


@extend_schema(tags=["Borrowing — Member"])
class UserBorrowingRequestAPIView(APIView):
    permission_classes = [UserBorrowRequestOnly]

    def get(self, request):
        # Members only see their own requests — filtered by request.user
        borrowings = BorrowRequest.objects.filter(user=request.user).order_by(
            "-requested_at"
        )
        serializer = BorrowRequestSerializer(borrowings, many=True)
        return Response(
            {"total": borrowings.count(), "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = BorrowRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user, status="P")
        return Response(
            {"message": "Borrow request submitted successfully.", "data": serializer.data},
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"message": "Request ID is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        borrow_request = get_object_or_404(BorrowRequest, id=id, user=request.user)

        # Only allow cancelling/updating pending requests
        if borrow_request.status != "P":
            return Response(
                {"message": "You can only modify pending requests."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = BorrowRequestSerializer(
            borrow_request, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(
            {"message": "Request updated successfully."}, status=status.HTTP_200_OK
        )


@extend_schema(tags=["Borrowing — History"])
class AdminBorrowingHistoryAPIView(APIView):
    permission_classes = [AdminOnlyBorrowingHistory]

    def get(self, request):
        # History includes both fully returned books and rejected requests
        history = BorrowRequest.objects.filter(
            status__in=["RT", "R"]
        ).order_by("-requested_at")

        paginator = BorrowingPagination()
        page = paginator.paginate_queryset(history, request, view=self)
        if page is not None:
            serializer = BorrowRequestSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = BorrowRequestSerializer(history, many=True)
        return Response(
            {"total": history.count(), "data": serializer.data},
            status=status.HTTP_200_OK,
        )


@extend_schema(tags=["Borrowing — Returns"])
class UserReturnRequestAPIView(APIView):
    permission_classes = [UserOnlyReturnRequest]

    def get(self, request):
        user = request.user
        # Members see their own pending return submissions
        return_requests = BorrowRequest.objects.filter(user=user, status="SR")
        serializer = BorrowRequestSerializer(return_requests, many=True)
        return Response(
            {"count": return_requests.count(), "data": serializer.data},
            status=status.HTTP_200_OK,
        )

    def post(self, request, id=None):
        #Member submits a return request for a book they currently hold.
        if not id:
            return Response(
                {"message": "Borrow request ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ownership check — member can only return their own books
        borrow_request = get_object_or_404(BorrowRequest, id=id, user=request.user)
        if borrow_request.status != "A":
            return Response(
                {"message": "You can only return books you currently hold (status: Approved)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        borrow_request.status = "SR"
        borrow_request.save()
        serializer = BorrowRequestSerializer(borrow_request)
        return Response(
            {
                "message": "Return request submitted successfully. Awaiting admin confirmation.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request, id=None):
        if not id:
            return Response(
                {"message": "Request ID is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        if request.user.is_staff or request.user.is_superuser:
            # Admin hard-delete
            borrow_request = get_object_or_404(BorrowRequest, id=id)
            borrow_request.delete()
            return Response(
                {"message": "Borrow record deleted successfully."},
                status=status.HTTP_200_OK,
            )

        # Member cancel — can only cancel their own submitted returns
        borrow_request = get_object_or_404(BorrowRequest, id=id, user=request.user)
        if borrow_request.status != "SR":
            return Response(
                {
                    "message": "You can only cancel return requests that are pending admin review."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Revert to Approved — the member still has the book
        borrow_request.status = "A"
        borrow_request.save()
        serializer = BorrowRequestSerializer(borrow_request)
        return Response(
            {
                "message": "Return request cancelled. You still hold the book.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request, id=None):
        if not id:
            return Response(
                {"message": "Request ID is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        borrow_request = get_object_or_404(BorrowRequest, id=id)

        # Only submitted-for-return requests can be confirmed
        if borrow_request.status != "SR":
            return Response(
                {"message": "This request is not pending return confirmation."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                # Lock the book row before incrementing to prevent double-increment
                book = Books.objects.select_for_update().get(id=borrow_request.book.id)
                book.available_quantity += 1
                book.save()
                borrow_request.status = "RT"  # RT = Returned (not R = Rejected)
                borrow_request.returned_at = timezone.now()
                borrow_request.save()

                serializer = BorrowRequestSerializer(borrow_request)
                return Response(
                    {
                        "message": "Book return confirmed. Inventory updated.",
                        "data": serializer.data,
                    },
                    status=status.HTTP_200_OK,
                )
        except Exception as e:
            logger.exception(f"Database failure during return confirmation for ID {id}: {e}")
            return Response(
                {"message": "An error occurred while processing the return."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
