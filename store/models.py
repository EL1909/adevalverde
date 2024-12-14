from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils.crypto import get_random_string
import os

PAYMENT_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
]


class Category(models.Model):
    class Meta:
        verbose_name_plural = 'Categories'

    name = models.CharField(max_length=256)

    def __str__(self):
        return self.name


class Provider(models.Model):
    name = models.CharField(max_length=256)

    def __str__(self):
        return self.name


class Product(models.Model):
    # Custom upload path for images
    def get_image_path(self, filename):
        name, ext = os.path.splitext(filename)
        return f'products/{slugify(name)}-{get_random_string(length=8)}{ext}'
    
    name = models.CharField(max_length=256)
    description = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2)
    created_by = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey('Category', null=True, blank=True, on_delete=models.SET_NULL)
    providers = models.ManyToManyField('Provider', related_name='products', blank=True)
    other_site_link = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to=get_image_path, null=True, blank=True)
    
    def __str__(self):
        return self.name

    
class Order(models.Model):
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='orders')
    paymentStatus = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    totalAmount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Order {self.id} - {self.user.username}"
    
    def get_total_price(self):
        # Calculate the total price by summing up all item prices * quantity
        return sum(item.quantity * item.price for item in self.items.all())
    
    def save(self, *args, **kwargs):
        self.totalAmount = self.get_total_price()
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} of {self.product.name} for Order {self.order.id}"