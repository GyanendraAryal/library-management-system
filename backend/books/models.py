from django.db import models
from django.conf import settings

# Reference the custom user model defined in AUTH_USER_MODEL (users.User)
User = settings.AUTH_USER_MODEL


class Author(models.Model):
    id = models.BigAutoField(primary_key=True)
    author_name = models.CharField(max_length=100)
    authors_biography = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.author_name


class Genre(models.Model):
    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=50, unique=True, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title


class Books(models.Model):
    class Meta:
        verbose_name = "Book"
        verbose_name_plural = "Books"

    id = models.BigAutoField(primary_key=True)
    title = models.CharField(max_length=200, unique=True)
    description = models.TextField()
    isbn_number = models.CharField(max_length=50, unique=True, blank=False)
    book_image = models.ImageField(upload_to="books_image/", null=True, blank=True)

    # Staff member who added the book — preserved as NULL if the user is deleted
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="added_books",
    )

    # Deleting an author who has books should be blocked, not cascade-deleted
    author = models.ForeignKey(Author, on_delete=models.PROTECT)

    # Deleting a genre makes books uncategorised, not deleted
    genre = models.ForeignKey(
        Genre,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    # Total physical copies owned by the library
    quantity = models.PositiveIntegerField(default=10)

    # Copies currently available for borrowing (quantity - currently borrowed)
    # This is managed programmatically by the borrow/return workflow;
    # it should never exceed quantity.
    available_quantity = models.PositiveIntegerField(default=10)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
