from django.urls import path
from . import views

app_name = 'calendars'

urlpatterns = [
    path('check_availability/<int:product_id>/', views.check_availability, name='check_availability'),
    path('reserve/', views.reserve_appointment, name='reserve_appointment'),
]
