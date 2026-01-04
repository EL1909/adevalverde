from django.urls import path
from . import views

app_name = 'calendars'

urlpatterns = [
    path('check_availability/<int:product_id>/', views.check_availability, name='check_availability'),
    path('reserve/', views.reserve_appointment, name='reserve_appointment'),
    path('admin-calendar/', views.admin_calendar_view, name='admin_calendar'),
    path('api/appointments/', views.appointments_json, name='appointments_json'),
]
