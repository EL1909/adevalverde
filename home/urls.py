from django.urls import path
from . import views


urlpatterns = [
    path('', views.HomeIndex, name='home'),
    path('bio/', views.Bio, name='bio'),
    path('privacy/', views.Privacy, name='privacy'),
    path('escuela/', views.EscuelaSilencio, name='escuela'),
    path('tyc/', views.TyC, name='tyc'),
    path('test-coherencia/', views.test_coherencia, name='test_coherencia'),
    # Add more URLs as needed
]