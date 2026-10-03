from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL
# Create your models here.


class Author(models.Model):
    id = models.BigAutoField(primary_key=True)
    author_name = models.CharField(max_length=50)
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
    title = models.CharField(max_length=50, unique=True)
    description = models.TextField()
    isbn_number = models.CharField(max_length=50, unique=True, blank=False)
    book_image = models.ImageField(upload_to="books_image/", null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.PROTECT)
    author = models.ForeignKey(Author, on_delete=models.PROTECT)
    genre = models.ForeignKey(Genre, on_delete=models.PROTECT,null=True,blank=True)
    quantity = models.IntegerField(default=10)
    available_quantity = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
