from .models import Order, Category 
from django.db.models import Sum


def category_menu(request):
    categories = Category.objects.all()
    return {'categories': categories}


def cart_items(request):
    cart_count = 0
    ACTIVE_CART_STATUS = 'pending'
    order = None

    if request.user.is_authenticated:
        # For logged-in users, prioritize the database (synced on every add)
        order = Order.objects.filter(
            user=request.user, 
            paymentStatus=ACTIVE_CART_STATUS
        ).first()
        if order:
            cart_count = order.items.aggregate(total_quantity=Sum('quantity'))['total_quantity'] or 0
    else:
        # For guests, prioritize the session cart
        cart_session = request.session.get('cart', {})
        if cart_session:
            cart_count = sum(item.get('quantity', 1) for item in cart_session.values())
            # active_order remains None for guest sessions until checkout/crystallization

    return {
        'cart_count': cart_count,
        'active_order': order
    }