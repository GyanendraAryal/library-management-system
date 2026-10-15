from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from users.models import User
from books.models import Books


class BorrowRequest(models.Model):
    REQUEST_STATUS = [
        ("P",  "Pending"),
        ("A",  "Approved"),
        ("SR", "Submitted For Return"),
        ("R",  "Rejected"),
        ("C",  "Cancelled"),
        ("RT", "Returned"),
    ]

    id = models.BigAutoField(primary_key=True)

    # The member who submitted the borrow request
    user = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="borrow_requests",
    )

    # The book being requested
    book = models.ForeignKey(
        Books,
        on_delete=models.PROTECT,
        related_name="borrow_requests",
    )

    # How many days the member wants to borrow the book (1–30 days)
    requested_days = models.IntegerField(
        default=15,
        validators=[
            MinValueValidator(1),
            MaxValueValidator(30),
        ],
    )

    # Current state in the borrowing lifecycle
    status = models.CharField(
        max_length=2,
        choices=REQUEST_STATUS,
        default="P",
    )

    # Number of days the admin actually approved (may differ from requested_days)
    approved_days = models.IntegerField(null=True, blank=True)

    # Timestamps for each stage of the lifecycle
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    returned_at = models.DateTimeField(null=True, blank=True)

    # Which staff member approved this request (NULL if not yet approved)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_borrow_requests",
    )

    def __str__(self):
        return f"{self.user.username} — {self.book.title} [{self.get_status_display()}]"
