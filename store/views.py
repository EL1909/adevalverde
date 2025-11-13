from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import transaction
from django.db.models import Q, Count, Sum
from django.db.models.functions import Lower
from django.http import JsonResponse, HttpResponse, Http404
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.http import require_GET
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os
import json
import qrcode
import uuid
from .models import Product, Category, Provider, Order, OrderItem, Downloadable
from .forms import ProductForm, CategoryForm


## Categories Views

class CategoryView(View):
    @method_decorator(login_required)
    def dispatch(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            messages.error(request, "No tienes permiso para modificar Categorias.")
            return redirect('home')
        
        action = kwargs.get('action', None)
        if action == 'remove_cat':
            return self.remove_category(request, *args, **kwargs)
        elif action == 'edit_cat':
            if request.method == 'POST':
                # Handle POST for edit_category
                return self.edit_category(request, *args, **kwargs)
            # For GET, redirect to avoid rendering
            return redirect('store:invmgm')
        elif request.path.endswith('/add/'):
            if request.method == 'POST':
                return self.post(request)
            return redirect('store:invmgm')
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        categories = Category.objects.annotate(product_count=Count('products'))
        return render(request, 'store/inventory_mgm.html', {
            'categories': categories,
            'catform': CategoryForm() # Pass a fresh form for the 'Add' section
        })

    def post(self, request, category_id=None):
        if category_id:
            category = get_object_or_404(Category, pk=category_id)
            form = CategoryForm(request.POST, instance=category)
            success_message = "Categoria Actualizada."
        else:
            form = CategoryForm(request.POST)
            success_message = "Categoria Creada."
            category_name = request.POST.get('name')
            if Category.objects.filter(Q(name__iexact=category_name)).exists():
                messages.error(request, f"La categoria '{category_name}' ya existe.")
                return redirect('store:invmgm')

        if form.is_valid():
            form.save()
            messages.success(request, success_message)
            return redirect('store:invmgm')
        else:
            categories = Category.objects.annotate(product_count=Count('products'))
            return render(request, 'store/inventory_mgm.html', {
                'categories': categories,
                'catform': form, 
                'category': form.instance if category_id else None # Pass existing instance if editing failed
            })

    def remove_category(self, request, *args, **kwargs):
        category_id = kwargs.get('category_id')
        category = get_object_or_404(Category, pk=category_id)
        category.delete()
        messages.success(request, "Categoria eliminada.")
        return redirect('store:invmgm')

    def edit_category(self, request, *args, **kwargs):
        category_id = kwargs.get('category_id')
        category = get_object_or_404(Category, pk=category_id)
        
        if request.method == 'POST':
            form = CategoryForm(request.POST, instance=category)
            if form.is_valid():
                form.save()
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': True})
                messages.success(request, "Categoria Actualizada.")
                return redirect('store:invmgm')
            else:
                if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                    return JsonResponse({'success': False, 'errors': form.errors}, status=400)
                context = {
                    'categories': Category.objects.annotate(product_count=Count('product')),
                    'category': category,
                    'form': form
                }
                return render(request, 'store/inventory_mgm.html', context)
        # For GET, redirect to inventory management to avoid rendering
        return redirect('store:invmgm')


def category_detail_api(request, category_id):
    """ Return individual category as JSON """
    category = get_object_or_404(Category, pk=category_id)

    # Structure the data as dictionary
    data = {
        'id': category.id,
        'name': category.name or 'N/A',
        'description': category.description or 'N/A',
    }

    return JsonResponse(data, status=200)


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
        products = Product.objects.all()
        categories = Category.objects.all()
        providers = Provider.objects.all()
        form = ProductForm()
        catform = CategoryForm()

        # Separate orders
        openOrders = orders.filter(paymentStatus='pending')
        closedOrders = orders.filter(paymentStatus='completed')

        # Prepare context for the template
        context = {
            'orders': orders,
            'products': products,
            'categories': categories,
            'providers': providers,
            'form': form,
            'openOrders': openOrders,
            'closedOrders': closedOrders,
            'catform': catform,
        }

        # Render the inventory management template
        return render(request, self.template_name, context)


def product_detail_api(request, product_id):
    """ Return individual product as JSON """
    product = get_object_or_404(Product, pk=product_id)

    # Structure the data as dictionary
    data = {
        'id': product.id,
        'name': product.name or 'N/A',
        'description': product.description or 'N/A',
        "price": float(product.price),
        "created_by": product.created_by.username if product.created_by else 'N/A',
        "category_name": product.category.name if product.category else 'N/A',
        "providers": [p.name for p in product.providers.all()],
        "external_link": product.other_site_link or '', 
        "image": product.image.url if product.image else '',
    }

    return JsonResponse(data, status=200)


def all_products(request):
    """ A View to show all products, grouped by category, respecting search queries. """
    products = Product.objects.all()
    query = None
    # --- 1. SEARCH FILTERING (Simplified) ---
    if 'q' in request.GET:
        query = request.GET['q']
        if not query:
            # Handle empty search query
            messages.error(request, "Please enter search criteria.")
            return redirect(reverse('products'))
        # Filter products based on search term
        queries = Q(name__icontains=query) | Q(description__icontains=query)
        products = products.filter(queries)
    # --- 2. PREPARE FOR GROUPING ---
    # Order the products by category name first, so they are grouped sequentially in the loop
    products = products.order_by('category__name', 'name')
    
    # --- 3. GROUP PRODUCTS BY CATEGORY IN PYTHON ---
    categories_with_products_dict = {}
    
    for product in products:
        category = product.category
        
        # Only process products that actually belong to a category
        if category:
            # If the category is new to the dictionary, initialize its product list
            if category not in categories_with_products_dict:
                categories_with_products_dict[category] = []
            categories_with_products_dict[category].append(product)
    # --- 4. CONTEXT PREPARATION ---
    context = {
        # The key data structure for the template: iterable list of (Category object, [products]) tuples
        'categories_with_products': categories_with_products_dict.items(), 
        
        # Keeping search term if needed for display in the template's search box
        'search_term': query,
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
    if not request.user.is_superuser:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES)
        if form.is_valid():
            product = form.save(commit=False)
            product.created_by = request.user
            product.save()
            form.save_m2m()
            messages.success(request, '¡Producto creado exitosamente y añadido al inventario!')
            return redirect('store:products')
        else:
            return render(request, 'add_product.html', {'form': form})
    else:
        form = ProductForm()
    return render(request, 'add_product.html', {'form': form})


@login_required
def edit_product(request, product_id):
    """ Edit a product in the store """
    if not request.user.is_superuser:
        messages.error(request, 'No tienes acceso para editar productos.')
        return redirect(reverse('home'))

    product = get_object_or_404(Product, pk=product_id)
    # Initialize form with instance for GET, or with POST data for submission
    form = ProductForm(
        request.POST, 
        request.FILES, 
        instance=product
    ) if request.method == 'POST' else ProductForm(instance=product)
      

    if request.method == 'POST':
        form = ProductForm(request.POST, request.FILES, instance=product)
        if form.is_valid():
            form.save()
            messages.success(request, f'Producto "{product.name}" actualizado.')
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
    return redirect(reverse('store:invmgm'))


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
    
    # Helper method to get the active order (cart)
    def _get_active_order(self, request):
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
                # Use .filter().first() to avoid MultipleObjectsReturned, as handled below
                order = Order.objects.filter(
                    id=order_id, 
                    paymentStatus=ACTIVE_CART_STATUS
                ).first()
        
        return order

    # View the cart
    def get(self, request):
        order = self._get_active_order(request)
        
        if order:
            order_items = order.items.all() 
            total_price = order.totalAmount
            order_id = order.id
            has_physical_products = any(
            not item.product.is_downloadable for item in order_items
        )
        else:
            order_items = []
            total_price = 0.00
            order_id = None
            has_physical_products = False
        
        return render(request, 'store/shopping_cart.html', {
            'order_items': order_items,
            'total_price': total_price,
            'order_id': order_id,
            'has_physical_products': has_physical_products,
        })
    
    # Add an item to the cart
    def add_item(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        quantity = 1
        # Define the status that indicates an active cart (not yet purchased)
        ACTIVE_CART_STATUS = 'pending'

        # 1. Get or create the active Order (Cart) based on paymentStatus
        if request.user.is_authenticated:
            # Find or create a 'pending' order (cart) for the logged-in user
            order, created = Order.objects.get_or_create(
                user=request.user,
                paymentStatus=ACTIVE_CART_STATUS, # Use the existing field as the filter
                defaults={'totalAmount': 0.00}
            )
        else:
            # For guest users, use a session-based order
            order_id = request.session.get('order_id')
            if order_id:
                try:
                    # Retrieve the existing, 'pending' order for the guest session
                    order = Order.objects.get(id=order_id, paymentStatus=ACTIVE_CART_STATUS) 
                except Order.DoesNotExist:
                    # Order expired or deleted, create a new one
                    order = Order.objects.create(paymentStatus=ACTIVE_CART_STATUS, totalAmount=0.00)
                    request.session['order_id'] = order.id
            else:
                # No order in session, create a new one
                order = Order.objects.create(user=None, paymentStatus=ACTIVE_CART_STATUS, totalAmount=0.00)
                request.session['order_id'] = order.id
                
        # 2. Get or create the OrderItem and update quantity
        # This logic remains the same as it's dependent on the Order object found above
        order_item, created = OrderItem.objects.get_or_create(
            order=order,
            product=product,
            defaults={'quantity': quantity, 'price': product.price}
        )
        if not created:
            order_item.quantity += quantity
            order_item.save()

        # 3. Update the total amount of the Order
        order.totalAmount = sum(item.quantity * item.price for item in order.items.all())
        order.save()

        # 4. Handle AJAX response
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            cart_count = sum(item.quantity for item in order.items.all())
            return JsonResponse({
                'cart_count': cart_count,
                'message': f"{product.name} added to cart!",
                'order_id': order.id,
            })

        return redirect('store:cart_view')

    # Remove an item from the cart
    def remove_item(self, request, product_id):
        order = self._get_active_order(request)
        product = get_object_or_404(Product, id=product_id)
        
        if order:
            try:
                order_item = OrderItem.objects.get(order=order, product=product)
                order_item.delete()
                messages.success(request, f"{product.name} removed from cart.")
                
                # Recalculate total and count
                order.totalAmount = sum(item.quantity * item.price for item in order.items.all())
                order.save()
                
            except OrderItem.DoesNotExist:
                messages.error(request, f"Product {product.name} not found in cart.")
            
            except Exception as e:
                messages.error(request, f"An error occurred: {e}")

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            # Get updated total and count
            current_total = order.totalAmount if order else 0.00
            current_count = sum(item.quantity for item in order.items.all()) if order else 0

            return JsonResponse({
                'success': True, 
                'total_price': current_total, 
                'cart_count': current_count
            })

        return redirect('store:products')

    # Update an item’s quantity in the cart
    def update_item(self, request, product_id):
        order = self._get_active_order(request)
        product = get_object_or_404(Product, id=product_id)
        
        try:
            quantity = int(request.POST.get('quantity', 1))
            
            if order:
                order_item = OrderItem.objects.get(order=order, product=product)
                
                if quantity > 0:
                    order_item.quantity = quantity
                    order_item.save()
                else:
                    # Delete item if quantity is zero or less
                    order_item.delete()

                # Recalculate order total
                order.totalAmount = sum(item.quantity * item.price for item in order.items.all())
                order.save()
                
            else:
                messages.error(request, "No active cart found to update.")

        except OrderItem.DoesNotExist:
            messages.error(request, f"{product.name} not found in cart.")
        except ValueError:
            messages.error(request, "Invalid quantity provided.")
            
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            current_total = order.totalAmount if order else 0.00
            current_count = sum(item.quantity for item in order.items.all()) if order else 0

            return JsonResponse({
                'success': True, 
                'total_price': current_total, 
                'cart_count': current_count
            })
            
        return redirect('store:cart_view')

    # Clear cart, order_id, and user-related session data
    def clear(self, request):
        # *** CHANGE: Delete all OrderItems from the active cart ***
        order = self._get_active_order(request)
        if order:
            order.items.all().delete()
            order.totalAmount = 0.00
            order.save()

        # Clear session data
        session_keys_to_clear = ['order_id', 'name', 'email', 'address', 'city', 'zipcode']
        for key in session_keys_to_clear:
            if key in request.session:
                del request.session[key]
        
        request.session.modified = True
        messages.info(request, "El carrito esta vacio.")
        return redirect('store:cart_view')

 # Assuming you have a Cart class/session handler


from django.shortcuts import redirect, get_object_or_404
from django.views.decorators.http import require_GET
from django.db.models import Sum
from .models import Product, Order, OrderItem # Ensure you import all necessary models
from django.http import JsonResponse

# Define the status used for an active shopping cart
ACTIVE_CART_STATUS = 'pending' 

@require_GET
def add_to_cart_via_link(request, product_id):
    """
    Handles a GET request from an external Gamma link, adds the product to the cart,
    and redirects the user to the cart view. This replicates the non-AJAX part of your add_item logic.
    """
    product = get_object_or_404(Product, id=product_id)
    quantity = 1

    # --- 1. Get or create the active Order (Cart) based on paymentStatus ---
    if request.user.is_authenticated:
        # Find or create a 'pending' order (cart) for the logged-in user
        order, created = Order.objects.get_or_create(
            user=request.user,
            paymentStatus=ACTIVE_CART_STATUS,
            defaults={'totalAmount': 0.00}
        )
    else:
        # For guest users, use a session-based order
        order_id = request.session.get('order_id')
        if order_id:
            try:
                # Retrieve the existing, 'pending' order for the guest session
                order = Order.objects.get(id=order_id, paymentStatus=ACTIVE_CART_STATUS) 
            except Order.DoesNotExist:
                # Order expired or deleted, create a new one
                order = Order.objects.create(paymentStatus=ACTIVE_CART_STATUS, totalAmount=0.00)
                request.session['order_id'] = order.id
        else:
            # No order in session, create a new one
            order = Order.objects.create(user=None, paymentStatus=ACTIVE_CART_STATUS, totalAmount=0.00)
            request.session['order_id'] = order.id
            
    # --- 2. Get or create the OrderItem and update quantity ---
    order_item, created = OrderItem.objects.get_or_create(
        order=order,
        product=product,
        defaults={'quantity': quantity, 'price': product.price}
    )
    if not created:
        order_item.quantity += quantity
        order_item.save()

    # --- 3. Update the total amount of the Order ---
    # Optimized calculation for total amount
    total_amount_result = OrderItem.objects.filter(order=order).aggregate(
        total=Sum('price', output_field=models.DecimalField()) * Sum('quantity', output_field=models.IntegerField())
    )
    # Using your original sum logic is safer if the above is too complex:
    order.totalAmount = sum(item.quantity * item.price for item in order.items.all())
    order.save()

    # --- 4. Redirect the user ---
    # Since this is triggered by an external link (not AJAX), we only perform the redirect.
    return redirect('store:cart_view')


## Order Management Views

class ManageOrder(View):
    def post(self, request):
        data = json.loads(request.body)
        order_id = data.get('order_id')
        payment_status = data.get('payment_status')
        shipping_data = data.get('shipping_data', {})

        # Validate payment_status
        if payment_status not in ['pending', 'completed', 'failed']:
            return JsonResponse({'error': 'Invalid payment status'}, status=400)
        try:
            with transaction.atomic():
                order = Order.objects.get(id=order_id)
                if order.paymentStatus != payment_status:
                    order.paymentStatus = payment_status
                    order.set_shipping_data(shipping_data)
                    order.save()

                if payment_status == 'completed' and order.paymentStatus == 'completed':
                    for item in order.items.filter(product__is_downloadable=True):
                        if hasattr(item, 'downloadable'):
                            continue

                        token = uuid.uuid4()
                        verify_url = request.build_absolute_uri(f'/verify/{token}/')
                        qr = qrcode.make(verify_url)
                        qr_buffer = BytesIO()
                        qr.save(qr_buffer, 'PNG')
                        qr_file = ContentFile(qr_buffer.getvalue(), name=f"qr_{token}.png")

                        Downloadable.objects.create(
                            order_item=item,
                            token=token,
                            qr_image=qr_file
                        )

            return JsonResponse({
                            'message': 'Order processed successfully.', 
                            'order_id': order.id,
                            'status': order.paymentStatus
                        })

        except ValidationError as e:
            return JsonResponse({'error': str(e)}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)


class GetOrderItems(View):
    def get(self, request, order_id):
        try:
            order = Order.objects.get(id=order_id)
            items = OrderItem.objects.filter(order=order).values(
                'product__name', 'quantity', 'price'
            )
            return JsonResponse({'items': list(items)}, status=200)
        except Order.DoesNotExist:
            return JsonResponse({'error': 'Order not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
        

class DownloadFile(View):

    def get(self, request, token):
        downloadable = get_object_or_404(Downloadable, token=token)
        item = downloadable.order_item
        order = item.order

        if order.paymentStatus != 'completed' or downloadable.downloaded_at:
            raise Http404("Download not available.")

        product_file = item.product.download_file
        if not product_file or not product_file.name.lower().endswith('.pdf'):
            raise Http404("File not PDF.")

        # === Embed QR on-the-fly ===
        reader = PdfReader(product_file)
        writer = PdfWriter()

        # Get QR image
        qr_image = downloadable.qr_image
        if not qr_image:
            raise Http404("QR missing.")

        # Create overlay with QR
        overlay_buffer = BytesIO()
        c = canvas.Canvas(overlay_buffer, pagesize=letter)
        c.drawImage(qr_image.path, 50, 50, width=80, height=80)
        c.save()
        overlay_buffer.seek(0)
        overlay = PdfReader(overlay_buffer)

        # Merge QR on first page only
        for i, page in enumerate(reader.pages):
            if i == 0:
                page.merge_page(overlay.pages[0])
            writer.add_page(page)

        # Stream result
        output = BytesIO()
        writer.write(output)
        output.seek(0)

        # Mark as downloaded
        downloadable.downloaded_at = timezone.now()
        downloadable.save()

        response = HttpResponse(output, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{item.product.name}_with_proof.pdf"'
        return response
    

@login_required
def user_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'store/orders_history.html', {
        'orders': orders
    })