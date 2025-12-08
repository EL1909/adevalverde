from allauth.account.signals import user_logged_in, user_signed_up
from django.dispatch import receiver
from .views import merge_guest_cart_to_user


@receiver(user_logged_in)
def handle_user_logged_in(sender, request, user, **kwargs):
    """
    Merge guest cart when user logs in.
    """
    merge_guest_cart_to_user(request, user)


@receiver(user_signed_up)
def handle_user_signed_up(sender, request, user, **kwargs):
    """
    Merge guest cart when user signs up.
    """
    merge_guest_cart_to_user(request, user)
