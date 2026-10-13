from django.contrib import admin
from .models import Author, Books, Genre


# Register your models here.
class AuthorAdmin(admin.ModelAdmin):
    list_display = ("id", "author_name")
    ordering = ("id",)


class GenreAdmin(admin.ModelAdmin):
    list_display = ("id", "title")
    ordering = ("id",)


class BooksAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "genre", "available_quantity")


admin.site.register(Author, AuthorAdmin)
admin.site.register(Books, BooksAdmin)
admin.site.register(Genre, GenreAdmin)
