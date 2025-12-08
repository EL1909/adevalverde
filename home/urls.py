from django.urls import path
from . import views


urlpatterns = [
    path('', views.HomeIndex, name='home'),
    path('bio/', views.Bio, name='bio'),
    path('privacy/', views.Privacy, name='privacy'),
    path('tyc/', views.TyC, name='tyc'),
    # Add more URLs as needed
]