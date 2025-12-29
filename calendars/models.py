from django.db import models
from django.contrib.auth import get_user_model
from store.models import Product

User = get_user_model()

class AdminCalendarSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='calendar_settings')
    google_calendar_id = models.CharField(max_length=255, help_text="The ID of the Google Calendar shared with the service account")
    buffer_time = models.IntegerField(default=0, help_text="Buffer time in minutes between appointments")

    def __str__(self):
        return f"Calendar Settings for {self.user.username}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='appointments')
    order_item = models.OneToOneField('store.OrderItem', on_delete=models.CASCADE, related_name='appointment_record', null=True, blank=True)
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments_as_customer', null=True, blank=True)
    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appointments_as_admin')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    google_event_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.product.name} - {self.start_time}"
