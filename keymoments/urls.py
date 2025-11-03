from django.contrib import admin
from django.urls import path
from . import views

urlpatterns = [
    path('keymoments/', views.key_moments_list, name='keymoments'),
    path('create_key_moment/', views.create_key_moment, name='create_key_moment'),
    path('edit/<int:moment_id>/', views.edit_key_moment, name='edit_key_moment'),
    path('delete/<int:moment_id>/', views.delete_key_moment, name='delete_key_moment'),
]
