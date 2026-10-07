from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from users.models import User
from books.models import Books


# Create your models here.
class BorrowRequest(models.Model):
    REQUEST_STATUS = [
        ("P", "Pending"),
        ("A", "Approved"),
        ("R", "Rejected"),
        ("C", "Cancelled"),
    ]
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="borrow_requests"
    )
    book = models.ForeignKey(
        Books, on_delete=models.PROTECT, related_name="borrow_requests"
    )
    requested_days = models.IntegerField(
        default=15,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(30),
        ],
    )
    status = models.CharField(max_length=1, choices=REQUEST_STATUS, default="P")
    approved_days = models.IntegerField(null=True, blank=True)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="approved_borrow_requests",
    )

    def __str__(self):
        return f"{self.user.username} - {self.book.title}"

    
# class BorrowingHistory(models.Model):
#     id = models.BigAutoField(primary_key=True)
#     user = models.ForeignKey(
#         User, on_delete=models.CASCADE, related_name="borrow-history"
#     )
#     book = models.ForeignKey(
#         Books, on_delete=models.CASCADE, related_name="borrow-history"
#     )
    # borrowed_days
