from rest_framework.permissions import BasePermission


class UserViewByAdminOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method in ["GET"]:
            return user.is_staff
        return False

class UserViewOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        if request.method == "GET":
            return True
