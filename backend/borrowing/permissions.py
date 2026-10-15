from rest_framework.permissions import BasePermission


class BorrowRequestAdminOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method in ["GET", "POST", "PATCH", "DELETE"]:
            return user.is_staff
        return False


class UserBorrowRequestOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method in ["GET", "POST", "PATCH"]:
            return True
        return False


class AdminOnlyBorrowingHistory(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method == "GET":
            return user.is_staff
        return False


class UserOnlyReturnRequest(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        # Admins confirm returns via PATCH
        if request.method == "PATCH":
            return user.is_staff
        # Members can view, submit, and cancel their own return requests
        if request.method in ["GET", "POST", "DELETE"]:
            return True
        return False
