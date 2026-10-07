from django.contrib import admin
from .models import User
from django.contrib.auth.admin import UserAdmin as UA


# Register your models here.
class UserAdmin(UA):
    list_display = ("id","username","is_staff","is_superuser")
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (("Personal info"), {"fields": ("first_name", "last_name", "email", "phone")}),
        (
            ("Permissions"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (("Important dates"), {"fields": ("last_login", "date_joined")}),
    )


admin.site.register(User, UserAdmin)
