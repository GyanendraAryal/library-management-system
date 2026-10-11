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
            return user
        return False


class UserOnlyBorrowingHistory(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method == "GET":
            return obj.user == request.user
        return False


class AdminOnlyBorrowingHistory(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method == "GET":
            return user.is_staff
        return False


# User return request
class UserOnlyReturnRequest(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method == "PATCH":
            return user.is_staff
        if request.method in ["POST", "DELETE"]:
            return True
        return False
