"""
User model for the Library Management System.

Extends Django's AbstractUser to add a phone number field while keeping
all built-in auth functionality (password hashing, permissions, sessions).

Role separation:
  - Regular users (is_staff=False): library members who can browse books
    and submit borrow/return requests.
  - Staff users (is_staff=True): librarians/admins who can manage books,
    approve borrow requests, and access admin-only endpoints.
"""

from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    image = models.ImageField(upload_to="images/", blank=True, null=True)
    phone = models.CharField(
        max_length=15,
        unique=True,
        blank=True,
        null=True,
        help_text="Optional contact phone number. Must be unique across all users.",
    )

    # username is the primary identifier for authentication
    USERNAME_FIELD = "username"

    # Fields prompted when running `createsuperuser` (beyond username/password)
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.username
