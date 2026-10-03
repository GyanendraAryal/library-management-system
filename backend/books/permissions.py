from rest_framework.permissions import BasePermission


class BookWriteByAdminOnly(BasePermission):
    def has_permission(self, request, view):
        user = request.user
        # User must be logged in
        if not user.is_authenticated:
            return False
        # Members and admin both can view
        if request.method == "GET":
            return True
        # Only admin and staffs are allowed to create,update and delete
        if request.method in ["POST", "PUT", "DELETE"]:
            return user.is_staff
        return False
