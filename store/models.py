from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils.crypto import get_random_string
import uuid
import os, json


PAYMENT_STATUS_CHOICES = [
    ('pending', 'Pendiente'),
    ('completed', 'Completado'),
    ('failed', 'Fallido'),
]


PAYMENT_METHODS = [
        ('PAYPAL', 'PayPal'),
        ('BANK_TRANSFER', 'Transferencia Bancaria'),
        ('MANUAL', 'Aprobación Manual/Crédito'),
    ]


class Category(models.Model):
    name = models.CharField(max_length=256)
    description = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Categories'

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
        return f'store/products/{slugify(name)}-{get_random_string(length=8)}{ext}'
    
    def get_download_file(self, filename):
        name, ext = os.path.splitext(filename)
        return f'store/download_file/{slugify(name)}-{get_random_string(length=8)}{ext}'
    
    name = models.CharField(max_length=256)
    description = models.TextField()
    price = models.DecimalField(max_digits=6, decimal_places=2)
    created_by = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey('Category', null=True, blank=True, on_delete=models.SET_NULL, related_name='products')
    providers = models.ManyToManyField('Provider', related_name='articles', blank=True)
    other_site_link = models.URLField(blank=True, null=True)
    image = models.ImageField(upload_to=get_image_path, null=True, blank=True)
    is_downloadable = models.BooleanField(default=False)
    download_file = models.FileField(
        upload_to='store/products/to_download/{name}',
        null=True, blank=True,  # ← allow empty
        help_text="Obligatorio solo si el producto es descargable"
    )

    def clean(self):
        if self.is_downloadable and not self.download_file:
            raise ValidationError("El archivo de descarga es obligatorio para productos descargables.")
    
    def __str__(self):
        return self.name

    
class Order(models.Model):
    user = models.ForeignKey(
        get_user_model(), 
        on_delete=models.CASCADE, 
        related_name='orders',
        null=True,
        blank=True
    )
    paymentStatus = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(
        max_length=50,
        choices=PAYMENT_METHODS,
        default='PAYPAL', # Puedes cambiar el default según tu método principal
        help_text="Método de pago utilizado para la orden."
    )
    payment_id = models.CharField(
            max_length=100, 
            unique=True, 
            null=True, 
            blank=True,
            help_text="ID único de la transacción generado por el proveedor de pago (ej. PayPal ID)."
        )
    totalAmount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shipping_data = models.TextField(default='{}')

    @property
    def hasPhysical(self):
        # Returns True if any item in the order is NOT downloadable
        return self.items.filter(product__is_downloadable=False).exists()

    class Meta:
        ordering = ['-created_at']

    def status_badge(self):
        return  {
            'pending': 'warning',
            'completed': 'success',
            'failed': 'danger',
        }.get(self.paymentStatus, 'secondary')

    @property
    
    def get_shipping_data(self):
        return json.loads(self.shipping_data)

    def set_shipping_data(self, data):
        self.shipping_data = json.dumps(data)

    def __str__(self):
        if self.user:
            username = self.user.username
        else:
            try:
                data = json.loads(self.shipping_data)
                username = data.get('name', 'Invitado')
            except:
                username = 'Invitado'
        return f"Pedido {self.id} - {username}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('Product', on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} of {self.product.name} for Order {self.order.id}"
    

class Downloadable(models.Model):
    order_item = models.OneToOneField('store.OrderItem', on_delete=models.CASCADE, related_name='downloadable')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    verification_url = models.CharField(max_length=500, null=True, blank=True)
    qr_image = models.ImageField(upload_to='store/qr_codes/', null=True, blank=True)
    downloaded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Download for {self.order_item.product.name} ({self.token})"