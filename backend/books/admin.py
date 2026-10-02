from django.contrib import admin
from .models import Author, Books, Genre

# Register your models here.
admin.site.register(Author)
admin.site.register(Books)
admin.site.register(Genre)
