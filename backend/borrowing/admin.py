from django.contrib import admin
from .models import BorrowRequest
from users.models import User


# Register your models here.
class BorrowRequestAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "book",
        "requested_days",
        "status",
        "approved_days",
        "approved_by",
        "requested_at",
        "returned_at",
    )

    list_filter = ("status", "requested_at")
    search_fields = ("user__username", "book__title")
    readonly_fields = (
        "requested_at",
        "approved_at",
        "returned_at",
    )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "approved_by":
            kwargs["queryset"] = User.objects.filter(is_staff=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


admin.site.register(BorrowRequest, BorrowRequestAdmin)
