from django.contrib import admin
from .models import Product, Category, Order

# Register your models here.


class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'price',
        'image',
    )
    ordering = ('id',)


class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        'name',
    )


class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'totalAmount',
    )


admin.site.register(Product, ProductAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Order, OrderAdmin)