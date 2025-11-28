from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LoginView
from django.contrib.auth.forms import AuthenticationForm
from django.db import IntegrityError
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views import View
from .forms import SignupForm
from store.models import Order, OrderItem


# Create your views here.
def HomeIndex(request):
    """ A View to return the index page"""
    return render(request, 'home-content.html')


def Bio(request):
    """ A View to return the Bio page"""
    return render(request, 'bio.html')


def Privacy(request):
    """ A View to return the Privacy page"""
    return render(request, 'privacy.html')


def TyC(request):
    """ A View to return the Privacy page"""
    return render(request, 'tyc.html')


def merge_guest_cart_to_user(request, user):
    """
    Transfer/merge a guest's cart to an authenticated user's cart.
    Called after signup or login.
    """
    ACTIVE_CART_STATUS = 'pending'
    guest_order_id = request.session.get('order_id')
    
    if not guest_order_id:
        return  # No guest cart to merge
    
    try:
        # Find the anonymous order (no user and pending)
        guest_order = Order.objects.get(
            id=guest_order_id, 
            user__isnull=True,
            paymentStatus=ACTIVE_CART_STATUS
        )
        
        # Check if the user already has an active cart
        user_order = Order.objects.filter(
            user=user, 
            paymentStatus=ACTIVE_CART_STATUS
        ).first()

        if user_order:
            # Merge: Move items from guest cart to user cart
            for guest_item in guest_order.items.all():
                existing_item, created = OrderItem.objects.get_or_create(
                    order=user_order,
                    product=guest_item.product,
                    defaults={'quantity': guest_item.quantity, 'price': guest_item.price}
                )
                if not created:
                    # Product already exists, add quantities
                    existing_item.quantity += guest_item.quantity
                    existing_item.save()

            # Delete the guest order after moving items
            guest_order.delete()
            
            # Recalculate total for user order
            user_order.totalAmount = sum(
                item.quantity * item.price for item in user_order.items.all()
            )
            user_order.save()
        else:
            # Simple case: No conflict. Assign the order to the user
            guest_order.user = user
            guest_order.save()

        # Clean up session
        del request.session['order_id']
        request.session.modified = True

    except Order.DoesNotExist:
        # Invalid session ID or order already completed. Ignore.
        pass


class LoginView(LoginView):
    template_name = 'users/login.html'
    form_class = AuthenticationForm

    def get(self, request):
        # If user is already authenticated, redirect to profile
        if request.user.is_authenticated:
            return redirect('home')
        return render(request, self.template_name)

    def post(self, request):
        form = self.form_class(request.POST, request.FILES)
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # Transfer guest cart to logged-in user
            merge_guest_cart_to_user(request, user)
            
            login(request, user)
            return JsonResponse({'success': True})
        else:
            errors = form.errors
            return JsonResponse({'errors':errors}, status=400)     


class SignupView(View):
    template_name = 'users/signup.html'
    form_class = SignupForm

    def get(self, request, *args, **kwargs):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})
        
    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST, request.FILES)
        if form.is_valid():
            try:
                user = form.save()
                
                # Transfer guest cart to new user
                merge_guest_cart_to_user(request, user)
                
                login(request, user)
                return JsonResponse({'success': True, 'redirect_url':'/'})
            except IntegrityError:
                return JsonResponse({'errors': {'non_field_errors': ['Ese usuario ya existe.']}}, status=400)
        else:
            errors = form.errors.as_json()
            return JsonResponse({'errors': errors}, status=400)
        

def direct_logout_view(request):
    logout(request)
    return redirect('home')

