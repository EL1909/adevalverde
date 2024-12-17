from django.urls import path
from . import views

urlpatterns = [
    path('', views.HomeIndex, name='home'),
    path('login/', views.LoginView.as_view(), name='account_login'),
    path('signup/', views.SignupView.as_view(), name='account_signup'),
    path('direct-logout/', views.direct_logout_view, name='direct_logout'),
    # Add more URLs as needed
]