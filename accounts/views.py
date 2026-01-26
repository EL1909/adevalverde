from store.views import crystallize_order


def merge_guest_cart_to_user(request, user):
    """
    Transfer/merge a guest's cart to an authenticated user's cart.
    Called after signup or login via signals.
    """
    cart = request.session.get('cart')
    
    if not cart:
        return
    
    # crystallize_order naturally handles associating with request.user
    # and cleaning up old session state.
    crystallize_order(request)
