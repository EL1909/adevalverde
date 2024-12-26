from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Q, Count
from django.db.models.functions import Lower
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
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
        # Fetch all products and categories
        products = Product.objects.all().order_by('-id')  # Order by most recent first
        categories = Category.objects.all()
        providers = Provider.objects.all()
        form = ProductForm()
        catform =CategoryForm

        # Prepare context for the template
        context = {
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
            return redirect('product_detail', product_id=product.id)
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
            return redirect(reverse('store/product_detail', args=[product.id]))
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
    return redirect(reverse('products'))


## Cart Views

class Cart(View):
    # Get action from URL parameters
    def dispatch(self, request, *args, **kwargs):
        action = kwargs.get('action', None)
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
        return render(request, 'store/shopping_cart.html', {'cart': cart, 'total_price': total_price})

    # Add an item to the cart
    def add_item(self, request, product_id):
        cart = request.session.get('cart', {})
        product = get_object_or_404(Product, id=product_id)

        if str(product_id) in cart:
            cart[str(product_id)]['quantity'] += 1
        else:
            cart[str(product_id)] = {
                'name': product.name,
                'price': str(product.price),  # Ensure serializable data
                'quantity': 1,
                'image': product.image.url if product.image else '',
                'description': product.description,
            }
        request.session['cart'] = cart

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            cart_count = sum(item['quantity'] for item in cart.values())
            return JsonResponse({'cart_count': cart_count, 'message': "Product added to cart!"})
        return redirect('cart_view')

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

        return redirect('cart_view')

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

        return redirect('cart_view')

    # Clear the cart
    def clear(self, request):
        request.session['cart'] = {}
        messages.info(request, "Cart cleared.")
        return redirect('cart_view')


class CreateOrder(View):
    @method_decorator(csrf_exempt)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        data = json.loads(request.body)
        # Determine user, if guest, create a temporary user or use session
        if request.user.is_authenticated:
            user = request.user
        else:
            # For guests, you create a temporary user
            user, created = get_user_model().objects.get_or_create(username="guest", email="guest@example.com")
        
        # Retrieve cart from the session
        cart = request.session.get('cart', {})

        # Calculate the total amount from the cart
        totalAmount = sum(
            float(item['price']) * item['quantity'] 
            for item in cart.values()
        )

        # Create order
        order = Order.objects.create(
            user=user,
            paymentStatus=data.get('paymentStatus', 'pending'),
            totalAmount= totalAmount
        )
        
        # Create OrderItems for each product in the cart
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
                # Handle case where product might not exist anymore
                pass
        # Clear the cart after order creation if desired
        request.session['cart'] = {}

        return JsonResponse({
            'order_id': order.id,
            'message': 'Order created successfully.',
            'user': data.get('user',''),
            'totalAmount': totalAmount
        })


class UpdateOrder(View):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            order = Order.objects.get(id=data.get('order_id'))
            order.paymentStatus = data.get('paymentStatus')
            order.totalAmount = data.get('totalAmount')  # Assuming you want to update this too

            # Update user information if needed
            if data.get('user'):
                user_data = data['user']
                if not request.user.is_authenticated:  # For guest users
                    # Here you might want to handle guest user data, e.g., store in session or create temporary user
                    # For simplicity, we'll just use the data provided
                    pass  # Placeholder for guest user handling

            order.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Order payment status updated successfully.',
                'order_id': order.id,
                'payment_status': order.payment_status
            })
        except json.JSONDecodeError:
            return JsonResponse({'status': 'error', 'message': 'Invalid JSON data.'}, status=400)
        except (KeyError, ObjectDoesNotExist):
            return JsonResponse({'status': 'error', 'message': 'Order not found or invalid data.'}, status=404)
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


