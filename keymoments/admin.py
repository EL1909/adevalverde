from django.contrib import admin
from .models import KeyMoment

# Register your models here.


class KeyMomentsAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'title',
        'excerpt',
        'description',
        'image',
        'start_date',
        'end_date',
        'location',
        'moment_type',
        'status',
    )


admin.site.register(KeyMoment)