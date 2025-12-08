from django.urls import path
from allauth.account.views import LoginView, SignupView, LogoutView

urlpatterns = [
    path('login/', LoginView.as_view(template_name='account/login.html'), name='account_login'),
    path('signup/', SignupView.as_view(template_name='account/signup.html'), name='account_signup'),
    path('logout/', LogoutView.as_view(), name='account_logout'),
]
