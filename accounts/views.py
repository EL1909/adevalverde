from store.models import Order, OrderItem


def merge_guest_cart_to_user(request, user):
    """
    Transfer/merge a guest's cart to an authenticated user's cart.
    Called after signup or login via signals.
    """
    ACTIVE_CART_STATUS = 'pending'
    guest_order_id = request.session.get('order_id')
    
    if not guest_order_id:
        return
    
    try:
        guest_order = Order.objects.get(
            id=guest_order_id, 
            user__isnull=True,
            paymentStatus=ACTIVE_CART_STATUS
        )
        
        user_order = Order.objects.filter(
            user=user, 
            paymentStatus=ACTIVE_CART_STATUS
        ).first()

        if user_order:
            for guest_item in guest_order.items.all():
                existing_item, created = OrderItem.objects.get_or_create(
                    order=user_order,
                    product=guest_item.product,
                    defaults={'quantity': guest_item.quantity, 'price': guest_item.price}
                )
                if not created:
                    existing_item.quantity += guest_item.quantity
                    existing_item.save()

            guest_order.delete()
            
            user_order.totalAmount = sum(
                item.quantity * item.price for item in user_order.items.all()
            )
            user_order.save()
        else:
            guest_order.user = user
            guest_order.save()

        del request.session['order_id']
        request.session.modified = True

    except Order.DoesNotExist:
        pass
