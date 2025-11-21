from .models import Order, Category 
from django.db.models import Sum


def category_menu(request):
    categories = Category.objects.all()
    return {'categories': categories}


def cart_items(request):
    cart_count = 0
    
    # 1. Identify the active cart's ID
    ACTIVE_CART_STATUS = 'pending' 
    order = None

    if request.user.is_authenticated:
        # Get the pending order for the logged-in user
        order = Order.objects.filter(
            user=request.user, 
            paymentStatus=ACTIVE_CART_STATUS
        ).first()
    else:
        # Get the order ID from the session for guest users
        order_id = request.session.get('order_id')
        if order_id:
            order = Order.objects.filter(
                id=order_id, 
                paymentStatus=ACTIVE_CART_STATUS
            ).first()

    # 2. Calculate the total quantity if an order is found
    if order:
        # Use aggregation to sum all quantities efficiently
        cart_count = order.items.aggregate(
            total_quantity=Sum('quantity')
        )['total_quantity'] or 0
        
    # Return the count and the Order object (useful for cart links/checks)
    return {
        'cart_count': cart_count,
        'active_order': order
    }