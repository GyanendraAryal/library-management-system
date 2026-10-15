# Permissions for the books application.
# BookWriteByAdminOnly:
#   - GET  — any authenticated user
#   - POST, PUT, PATCH, DELETE — staff/admin only


from rest_framework.permissions import BasePermission

class BookWriteByAdminOnly(BasePermission):

    def has_permission(self, request, view):
        user = request.user

        # Unauthenticated requests are denied
        if not user.is_authenticated:
            return False

        # All authenticated members can view the book catalogue
        if request.method == "GET":
            return True
        # Only admin/staff are allowed to perform
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            return user.is_staff

        return False
