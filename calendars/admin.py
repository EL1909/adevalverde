from django.contrib import admin
from .models import Appointment, AdminCalendarSettings


class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        'product',
        'order_item',
        'customer',
        'admin_user',
        'start_time',
        'end_time',
        'google_event_id',
        'status',
        'created_at'
    )
    ordering = ('id',)


class AdminCalendarSettingsAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'google_calendar_id',
        'buffer_time',
    )
    ordering = ('id',)


admin.site.register(Appointment, AppointmentAdmin)
admin.site.register(AdminCalendarSettings, AdminCalendarSettingsAdmin)