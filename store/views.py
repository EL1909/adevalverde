from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q, Count
from django.db.models.functions import Lower
from django.http import JsonResponse, HttpResponseRedirect
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from .models import Product, Category, Provider, Order, OrderItem
from .forms import ProductForm, CategoryForm
import json



## Categories Views

class CategoryView(View):
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        # User Permission
        if not request.user.is_superuser:
            messages.error(request, "Only store owners can manage categories.")
            return redirect('home')

        # Check action parameter
        action = kwargs.get('action', None)
        if action == 'remove_cat':
            return self.remove_category(request, *args, **kwargs)
        elif action == 'edit_cat':
            return self.edit_category(request, *args, **kwargs)
        
        # If no valid action, call the default method (get)
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        # Fetch categories with their product count
        categories = Category.objects.annotate(product_count=Count('product'))
        return render(request, 'store/inventory_mgm.html', {'categories': categories})

    def post(self, request, category_id=None):
        if category_id:
            category = get_object_or_404(Category, pk=category_id)
            form = CategoryForm(request.POST, instance=category)
        else:
            form = CategoryForm(request.POST)
            
            # Check if the category already exists before creating a new one
            category_name = request.POST.get('category_name')
            if Category.objects.filter(Q(name__iexact=category_name)).exists():
                messages.error(request, f"'La categoria {category_name}' ya existe.")
                return redirect('store:invmgm')

        if form.is_valid():
            form.save()
            messages.success(request, "Categoria Actualizada." if category_id else "Categoria Creada.")
            return redirect('store:invmgm')
        else:
            context = {'form': form, 'category_id': category_id}
            return render(request, 'store/inventory_mgm.html', context)
        
    # Remove category
    def remove_category(self, request, *args, **kwargs):
        category_id = kwargs.get('category_id')
        category = get_object_or_404(Category, pk=category_id)
        category.delete()
        messages.success(request, "Categoria eliminada.")
        return redirect('store:invmgm')

    # Edit category
    def edit_category(self, request, *args, **kwargs):
        category_id = kwargs.get('category_id')
        category = get_object_or_404(Category.objects.annotate(product_count=Count('product')), pk=category_id)
        if request.method == 'POST':
            form = CategoryForm(request.POST, instance=category)
            if form.is_valid():
                form.save()
                messages.success(request, "Categoria Actualizada.")
                return redirect('store:invmgm')
        else:
            form = CategoryForm(instance=category)
        
        context = {
            'categories': Category.objects.annotate(product_count=Count('product')),
            'category': category,
            'form': form
        }
        return render(request, 'store/inventory_mgm.html', context)


## Product views

class InventoryManagementView(View):
    template_name = 'store/inventory_mgm.html'

    @method_decorator(login_required)
    def dispatch(self, *args, **kwargs):
        # Check if the user is a superuser
        if not self.request.user.is_superuser:
            messages.error(self.request, "Only store owners can manage inventory.")
            return redirect('home')  # Redirect to home or another appropriate page
        return super().dispatch(*args, **kwargs)

    def get(self, request):
        # Fetch all products, orders and categories
        orders = Order.objects.all().order_by('-id')  # Order by most recent first
        products = Product.objects.all().order_by('-id')  # Order by most recent first
        categories = Category.objects.all()
        providers = Provider.objects.all()
        form = ProductForm()
        catform =CategoryForm

        # Prepare context for the template
        context = {
            'orders': orders,
            'products': products,
            'categories': categories,
            'providers': providers,
            'form': form,
            'catform':catform
        }

        # Render the inventory management template
        return render(request, self.template_name, context)


def all_products(request):
    """ A View to show all products, including sorting and search queries """
    products = Product.objects.all()
    query = None
    categories = None
    sort = None
    direction = None

    if request.GET:
        if 'sort' in request.GET:
            sortkey = request.GET['sort']
            sort = sortkey
            if sortkey == 'name':
                sortkey = 'lower_name'
                products = products.annotate(lower_name=Lower('name'))
            if sortkey == 'category':
                sortkey = 'category_name'
            if 'direction' in request.GET:
                direction = request.GET['direction']
                if direction == "desc":
                    sortkey = f'-{sortkey}'
            products = products.order_by(sortkey)

        if 'category' in request.GET:
            categories = request.GET['category'].split(',')
            products = products.filter(category__name__in=categories)
            categories = Category.objects.filter(name__in=categories)

        if 'q' in request.GET:
            query = request.GET['q']
            if not query:
                messages.error(request, "You did not enter any search criteria!")
                return redirect(reverse('products'))

            queries = Q(name__icontains=query) | Q(description__icontains=query)
            products = products.filter(queries)

    current_sorting = f'{sort}_{direction}'

    context = {
        'products': products,
        'search_term': query,
        'current_categories': categories,
        'current_sorting': current_sorting,
        'MEDIA_URL': settings.MEDIA_URL,
    }

    return render(request, 'store/products.html', context)


def product_detail(request, product_id):
    """ A View to show individual product details """
    product = get_object_or_404(Product, pk=product_id)
    context = {
        'product': product,
    }

    return render(request, 'store/product_detail.html', context)


@login_required
def add_product(request):
    """ A View to create a new product """
    if not request.user.is_superuser:
        return redirect('home')

    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save(commit=False)
            product.created_by = request.user
            product.save()
            messages.success(request, 'Successfully created product!')
            return redirect('store:product_detail', product_id=product.id)
    else:
        form = ProductForm()
    
    context = {'form': form}
    return render(request, 'store/inventory_mgm.html', context)


@login_required
def edit_product(request, product_id):
    """ Edit a product in the store """
    if not request.user.is_superuser:
        messages.error(request, 'Sorry, only store owners can do that.')
        return redirect(reverse('home'))

    product = get_object_or_404(Product, pk=product_id)
    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            form.save()
            messages.success(request, 'Successfully updated product!')
            return redirect(reverse('store:product_detail', args=[product.id]))
        else:
            messages.error(request,
                           ('Failed to update product. '
                            'Please ensure the form is valid.'))
    else:
        form = ProductForm(instance=product)
        messages.info(request, f'You are editing {product.name}')

    template = 'store/edit_product.html'
    context = {
        'form': form,
        'product': product,
    }

    return render(request, template, context)


@login_required
def delete_product(request, product_id):
    """ Delete a product from the store """
    if not request.user.is_superuser:
        messages.error(request, 'Sorry, only store owners can do that.')
        return redirect(reverse('home'))

    product = get_object_or_404(Product, pk=product_id)
    product.delete()
    messages.success(request, 'Product deleted!')
    return redirect(reverse('store:products'))


## Cart Views

class Cart(View):
    # Get action from URL parameters
    def dispatch(self, request, *args, **kwargs):
        action = kwargs.get('action', None)
        if action not in ['add', 'remove', 'update', 'clear', None]:
            return JsonResponse({'error': 'Invalid action'}, status=400)
        if action == 'add':
            return self.add_item(request, kwargs['product_id'])
        elif action == 'remove':
            return self.remove_item(request, kwargs['product_id'])
        elif action == 'update':
            return self.update_item(request, kwargs['product_id'])
        elif action == 'clear':
            return self.clear(request)
        # If no valid action, call the default method (get)
        return super().dispatch(request, *args, **kwargs)

    # View the cart
    def get(self, request):
        cart = request.session.get('cart', {})
        total_price = sum(float(item['price']) * item['quantity'] for item in cart.values())
        order_id = request.session.get('order_id', None)  # Retrieve the order_id from session
        return render(request, 'store/shopping_cart.html', {
            'cart': cart,
            'total_price': total_price,
            'order_id': order_id  # Pass order_id to the template
        })

    # Add an item to the cart
    def add_item(self, request, product_id):
        # Get or create cart from session
        cart = request.session.get('cart', {})
        # Get the product
        product = get_object_or_404(Product, id=product_id)
        
        order_id = request.session.get('order_id', None)
        # Debugging: Log all session data
        print("Session Data:", dict(request.session))
        # Remove stale order_id if is not and Order object
        if order_id and not Order.objects.filter(id=order_id).exists():
            del request.session['order_id']
            request.session.modified = True
        # Create order when a new item is added
        if 'order_id' not in request.session:
            try:
                user = request.user if request.user.is_authenticated else get_user_model().objects.get_or_create(username="guest", email="guest@example.com")[0]
                order = Order.objects.create(
                    user=user,
                    paymentStatus='pending',
                    totalAmount=product.price,
                )
                request.session['order_id'] = order.id
                request.session.modified = True
                print(f"Order created with ID: {order}")
                print(f"Order ID in session: {request.session['order_id']}")
            except Exception as e:
                print(f"Error creating order: {e}")
                return JsonResponse({'error': 'Failed to create order'}, status=500)


        # Check if the product is already in the cart
        if str(product_id) in cart:
            cart[str(product_id)]['quantity'] += 1
        else:
            cart[str(product_id)] = {
                'name': product.name,
                'price': str(product.price),
                'quantity': 1,
                'image': product.image.url if product.image else '',
                'description': product.description,
            }
        # Update session with new cart data
        request.session['cart'] = cart
    
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            cart_count = sum(item['quantity'] for item in cart.values())
            return JsonResponse({
                'cart_count': cart_count,
                'message': "Product added to cart!",
                'order_id': request.session.get('order_id'),
                'session_data':dict(request.session)
            })
        return redirect('store:cart_view')

    # Remove an item from the cart
    def remove_item(self, request, product_id):
        cart = request.session.get('cart', {})

        if str(product_id) in cart:
            del cart[str(product_id)]
            request.session['cart'] = cart
            messages.success(request, f"Product {product_id} removed from cart.")

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            total_price = sum(float(item['price']) * item['quantity'] for item in cart.values())
            return JsonResponse({'success': True, 'total_price': total_price, 'cart_count': len(cart)})

        return redirect('store:products')

    # Update an item’s quantity in the cart
    def update_item(self, request, product_id):
        cart = request.session.get('cart', {})
        try:
            quantity = int(request.POST.get('quantity', 1))
            if quantity > 0:
                cart[str(product_id)]['quantity'] = quantity
            else:
                del cart[str(product_id)]
            request.session['cart'] = cart
        except (KeyError, ValueError):
            messages.error(request, "Invalid quantity provided.")
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            total_price = sum(float(item['price']) * item['quantity'] for item in cart.values())
            return JsonResponse({'success': True, 'total_price': total_price, 'cart_count': len(cart)})
        return redirect('store:cart_view')

    # Clear cart, order_id, and user-related session data
    def clear(self, request):
        session_keys_to_clear = ['cart', 'order_id', 'name', 'email', 'address', 'city', 'zipcode']
        for key in session_keys_to_clear:
            if key in request.session:
                del request.session[key]
        
        request.session.modified = True  # Mark session as modified
        messages.info(request, "Cart and session data cleared.")
        return redirect('store:cart_view')


class ManageOrder(View):
    def post(self, request):
        data = json.loads(request.body)
        order_id = data.get('order_id')
        payment_status = data.get('payment_status')
        shipping_data = data.get('shipping_data', {})

        try:
            order = Order.objects.get(id=order_id)
            # Update Payment Status
            order.paymentStatus = payment_status
            order.updated_at = timezone.now()
            # Update the shipping data
            if isinstance(order.shipping_data, str):  # If using TextField
                order.set_shipping_data(shipping_data)
            else:  # If using JSONField
                order.shipping_data = shipping_data
            order.save()

            # Create OrderItems
            cart = request.session.get('cart', {})
            for product_id, details in cart.items():
                try:
                    product = Product.objects.get(id=product_id)
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=details['quantity'],
                        price=float(details['price'])
                    )
                except Product.DoesNotExist:
                    print(f"Product {product_id} not found.")

            # Clear the cart from session after creating order items
            session_keys_to_clear = ['cart', 'order_id', 'name', 'email', 'address', 'city', 'zipcode']
            for key in session_keys_to_clear:
                if key in request.session:
                    del request.session[key]
            
                request.session.modified = True  # Mark session as modified
                messages.info(request, "Cart and session data cleared.")

            return JsonResponse({
                'message': 'Order status updated successfully.',
                'order_id': order.id
            })
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error':str(e)}, status=500)


