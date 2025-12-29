from django.contrib import admin
from .models import Product, Category, Order, Downloadable


class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'category',
        'price',
        'is_active',
        'image',
    )
    list_editable = ('is_active',)
    ordering = ('id',)


class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        'name',
    )


class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'totalAmount',
    )


class DownloadableAdmin(admin.ModelAdmin):
    list_display = (
        'order_item',
        'token',
        'qr_image',
        'downloaded_at',
        'created_at'
    )


admin.site.register(Product, ProductAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(Order, OrderAdmin)
admin.site.register(Downloadable, DownloadableAdmin)