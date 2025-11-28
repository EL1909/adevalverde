import os
import json
import qrcode
import requests
import uuid
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.sites.models import Site
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from django.db import transaction
from django.db.models import Q, Count, Sum
from django.db.models.functions import Lower
from django.http import JsonResponse, HttpResponse, Http404, FileResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.urls import reverse, reverse_lazy
from django.utils import timezone
from django.utils.text import slugify
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.http import require_GET, require_POST
from json.decoder import JSONDecodeError
from io import BytesIO
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.pagesizes import letter
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
        successOrders = orders.filter(paymentStatus__in=['completed'])
        closedOrders = orders.filter(paymentStatus__in=['failed'])

        # Prepare context for the template
        context = {
            'orders': orders,
            'products': products,
            'categories': categories,
            'providers': providers,
            'form': form,
            'openOrders': openOrders,
            'successOrders': successOrders,
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
                    paymentStatus=ACTIVE_CART_STATUS,
                    user__isnull=True
                ).first()
        
        return order

    # View the cart
    def get(self, request):
        order = self._get_active_order(request)
        
        if order:
            order_items = order.items.all() 
            total_price = order.totalAmount
            order_id = order.id
            has_physical = order.hasPhysical
        else:
            order_items = []
            total_price = 0.00
            order_id = None
            has_physical = False

        context = {
            'order_items': order_items,
            'total_price': total_price,
            'order_id': order_id,
            'has_physical': has_physical,
        }
        
        return render(request, 'store/shopping_cart.html', context)
    
    # Add an item to the cart
    def add_item(self, request, product_id):
        product = get_object_or_404(Product, id=product_id)
        quantity = 1
        ACTIVE_CART_STATUS = 'pending'

        # 1. Get Order if exists, otherwise create one
        order = self._get_active_order(request)
        if not order:
            # Set user if authenticated, otherwise None for guest checkout
            user = request.user if request.user.is_authenticated else None
            order = Order.objects.create(user=user, paymentStatus=ACTIVE_CART_STATUS, totalAmount=0.00)
            request.session['order_id'] = order.id
            request.session.modified = True
        
        order_item, created = OrderItem.objects.get_or_create(
            order=order,
            product=product,
            defaults={'quantity': quantity, 'price': product.price}
        )
        if not created:
            order_item.quantity += quantity,
            order_item.save()

        # 2. Update the total amount of the Order
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


# Define esta constante si no está definida globalmente
ACTIVE_CART_STATUS = 'pending' 

@require_GET
def add_to_cart_via_link(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    quantity = 1
    
    order = None

    # --- 1. Obtener/Crear la orden (Carrito) ---
    if request.user.is_authenticated:
        # Usuario Autenticado: Buscar/Crear por usuario
        order, created = Order.objects.get_or_create(
            user=request.user,
            paymentStatus=ACTIVE_CART_STATUS,
            defaults={'totalAmount': 0.00}
        )
    else:
        # Usuario Anónimo: Buscar por order_id en sesión
        order_id = request.session.get('order_id')
        if order_id:
            order = Order.objects.filter(
                id=order_id,
                user__isnull=True, # Solo carritos de invitado
                paymentStatus=ACTIVE_CART_STATUS
            ).first()

        if not order:
            # Si no se encuentra la orden (no hay sesión o expiró), crear una nueva
            order = Order.objects.create(
                user=None, # user=None ahora permitido por el cambio de modelo previo
                paymentStatus=ACTIVE_CART_STATUS,
                totalAmount=0.00
            )
            request.session['order_id'] = order.id
            request.session.modified = True

    # --- 2. Obtener/Crear el OrderItem y actualizar cantidad ---
    order_item, created = OrderItem.objects.get_or_create(
        order=order,
        product=product,
        defaults={'quantity': quantity, 'price': product.price}
    )
    if not created:
        order_item.quantity += quantity
        order_item.save()

    # --- 3. Actualizar el total de la Orden (FIX: Usando sum simple) ---
    # Se usa la suma en Python, que es más segura que la compleja agregación fallida.
    order.totalAmount = sum(item.quantity * item.price for item in order.items.all())
    order.save()

    # --- 4. Redirigir al usuario ---
    return redirect('store:cart_view')


## Order Management Views


def execute_fulfillment_logic(order):
    """
    Lógica de cumplimiento: Reducir inventario, generar descargables, etc.
    Esta función se ejecuta SOLAMENTE si el pago está COMPLETED/PAID.
    """
    
    # # Lógica de Reducción de Inventario (Ejemplo)
    # for item in order.items.all():
    #     product = item.product
    #     # Asegúrate de que tienes un campo 'stock' o similar en tu modelo Product
    #     # if product.stock >= item.quantity:
    #     #     product.stock -= item.quantity
    #     #     product.save()
    #     # else:
    #     #     raise Exception(f"Insufficient stock for product {product.name}")
    #     pass # Simulación: El stock se ha reducido

    # Lógica de Generación de Descargables
    current_site = Site.objects.get_current() # Asumiendo que se puede obtener sin request
    site_domain = current_site.domain
    base_url = f"https://{site_domain}"

    # Generar los enlaces de descarga para los ítems descargables
    for item in order.items.filter(product__is_downloadable=True):
        if not hasattr(item, 'downloadable'): # Evitar regenerar
            token = uuid.uuid4()
            verify_path = reverse('store:verify_download', args=[token])
            verification_url_full = f"{base_url}{verify_path}"
            
            # Generación de QR (esto puede ser costoso, solo si es necesario)
            qr = qrcode.make(verification_url_full)
            qr_buffer = BytesIO()
            qr.save(qr_buffer, 'PNG')
            qr_file = ContentFile(qr_buffer.getvalue(), name=f"order_{order.id}_qr_{token}.png")

            Downloadable.objects.create(
                order_item=item,
                token=token,
                verification_url=verification_url_full,
                qr_image=qr_file,
            )
            
    # El cumplimiento ha sido ejecutado
    # order.fulfillment_status = 'COMPLETED' # REMOVED
    # order.save()
    
    return True


class ManageOrder(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
        except JSONDecodeError:
            return JsonResponse({'error': 'Invalid or empty JSON body received.'}, status=400)
        
        order_id = data.get('order_id')
        cart_items = data.get('cart_items')
        execute_fulfillment = data.get('execute_fulfillment', False)
        manual_status_update = data.get('manual_status_update', False)
        new_status = data.get('payment_status')

        if not order_id:
            return JsonResponse({'error': 'Missing required order_id.'}, status=400)

        try:
            order = get_object_or_404(Order, pk=order_id)
            with transaction.atomic():
                if manual_status_update:
                    # --- PROPÓSITO 3: Actualización Manual de Estado (Admin) ---
                    if not new_status:
                        return JsonResponse({'error': 'Missing payment_status for manual update.'}, status=400)
                    
                    # Validate status is one of the allowed choices
                    valid_statuses = ['pending', 'completed', 'failed']
                    if new_status not in valid_statuses:
                        return JsonResponse({'error': f'Invalid status. Must be one of: {valid_statuses}'}, status=400)
                    
                    old_status = order.paymentStatus
                    
                    # Update order status and payment method
                    order.paymentStatus = new_status
                    order.payment_method = 'MANUAL'
                    order.save()
                    
                    # Handle status-specific logic
                    if new_status == 'completed' and old_status != 'completed':
                        # Execute fulfillment only if transitioning TO completed (not if already completed)
                        success = execute_fulfillment_logic(order)
                        if not success:
                            return JsonResponse({'error': 'Status updated but fulfillment failed.'}, status=500)
                        message = f'Order status updated to {new_status} and fulfillment executed.'
                    else:
                        message = f'Order status updated to {new_status}.'
                    
                    return JsonResponse({
                        'message': message, 
                        'order_id': order.id,
                        'status': order.paymentStatus,
                        'payment_method': order.payment_method
                    })
                    
                elif execute_fulfillment:
                    # --- PROPÓSITO 2: Ejecutar Fulfillment (Post-Pago) ---
                    # Esta lógica es llamada internamente por capture_paypal_orderView.
                    
                    if order.paymentStatus != 'completed':
                        # Si el estado de pago no está completo, no se puede cumplir
                        return JsonResponse({'error': 'Cannot execute fulfillment: Order payment not completed.'}, status=403)
                    
                    # if order.fulfillment_status == 'COMPLETED':
                    #     # Evitar ejecución duplicada de fulfillment
                    #     return JsonResponse({'message': 'Fulfillment already executed.'}, status=200)

                    # Ejecutar la lógica de cumplimiento
                    success = execute_fulfillment_logic(order)
                    
                    return JsonResponse({
                        'message': 'Fulfillment executed successfully.', 
                        'order_id': order.id,
                        'order_id': order.id,
                        # 'fulfillment_status': order.fulfillment_status,
                    })
                    
                else:
                    # --- PROPÓSITO 1: Crear/Actualizar Carrito (Pre-Pago) ---
                    
                    if not cart_items:
                        return JsonResponse({'error': 'Missing required cart_items for Order Update.'}, status=400)
                    
                    has_physical_products = False
                    
                    # 1. Actualizar OrderItems y calcular hasPhysical
                    Order.items.all().delete() # Eliminar ítems existentes para la reconstrucción
                    total_price = 0
                    for item_data in cart_items:
                        product_id = item_data.get('product_id')
                        quantity = item_data.get('quantity')
                        product = Product.objects.get(pk=product_id)
                        
                        OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=quantity,
                            price=product.price * quantity # O el cálculo que aplique
                        )
                        
                        total_price += product.price * quantity
                        if not product.is_downloadable: # Si no es descargable, es físico
                            has_physical_products = True
                            
                    # 2. Actualizar campos de la Order
                    order.total = total_price
                    order.save()
                    
                    return JsonResponse({
                        'message': 'Order/Cart updated successfully.', 
                        'order_id': order.id,
                        'hasPhysical': order.hasPhysical,
                        'total': order.total,
                    })

        except Order.DoesNotExist:
                return JsonResponse({'error': f'Order with ID {order_id} not found.'}, status=404)
        except Exception as e:
            print(f"Internal Server Error in ManageOrderView: {e}")
            return JsonResponse({'error': f'Internal Server Error: {str(e)}'}, status=500)
   

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

        # Get QR image\ 
        qr_image = downloadable.qr_image
        if not qr_image:
            raise Http404("QR missing.")
        
        qr_image_buffer = BytesIO(qr_image.read())
        try:
            reportlab_qr_image = ImageReader(qr_image_buffer)
        except Exception as e:
            # Manejar errores si ReportLab no puede leer el PNG del buffer.
            print(f"Error al leer imagen QR con ReportLab: {e}")
            raise Http404("No se pudo procesar la imagen QR.")

        # Create overlay with QR
        overlay_buffer = BytesIO()
        c = canvas.Canvas(overlay_buffer, pagesize=letter)
        c.drawImage(reportlab_qr_image, 50, 50, width=80, height=80)
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

        # Mark as downloaded (update timestamp but allow re-download)
        downloadable.downloaded_at = timezone.now()
        downloadable.save()

        # Use slugify to ensure safe filename
        safe_filename = slugify(item.product.name)
        # Use FileResponse for better file handling
        response = FileResponse(output, as_attachment=True, filename=f"{safe_filename}_with_proof.pdf")
        return response
    

class VerifyDownloadView(View):
    """
    Vista que se ejecuta cuando se escanea el código QR en el PDF.
    Verifica el token de descarga y muestra el estado de la orden al usuario.
    Si la descarga es válida, proporciona el enlace a la vista DownloadFile.
    """
    def get(self, request, token):
        try:
            # 1. Buscar el objeto Downloadable por el token único
            downloadable = get_object_or_404(Downloadable, token=token)
        except Http404:
            # Token inválido o no encontrado
            raise Http404("Código de verificación inválido o no encontrado.")

        order = downloadable.order_item.order
        
        # 2. Determinar el estado de la descarga
        is_completed = order.paymentStatus == 'completed'
        is_used = downloadable.downloaded_at is not None
        
        # 3. Generar la URL de descarga (Permitir múltiples descargas para evitar bloqueos por errores)
        download_url = None
        if is_completed: 
            # Crea la URL a la vista DownloadFile, pasando el mismo token
            download_url = reverse('store:download_product', args=[token])
        
        # 4. Preparar el contexto para el template
        context = {
            'downloadable': downloadable,
            'order': order,
            'product_name': downloadable.order_item.product.name,
            'is_completed': is_completed, # Pago completado?
            'is_used': is_used,           # Ya fue descargado?
            'download_url': download_url, # URL de descarga (si es válida)
        }

        # 5. Renderizar el template
        # (Debes crear el template 'store/verify_download.html')
        return render(request, 'store/verify_download.html', context)


@login_required # <--- ESENCIAL: Solo usuarios registrados pueden repetir órdenes.
@require_POST
def repeat_order(request, order_id):
    
    # 1. Validar que la orden pertenece al usuario
    try:
        original_order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        # Se asume que la vista JS espera un JsonResponse
        return JsonResponse({'success': False, 'error': 'Order not found or access denied.'}, status=404)

    with transaction.atomic():
        # 2. Obtener o crear el carrito activo (activo_cart) para el usuario
        active_cart, created = Order.objects.get_or_create(
            user=request.user,
            paymentStatus=ACTIVE_CART_STATUS,
            defaults={'totalAmount': 0.00}
        )

        # 3. Eliminar ítems antiguos (sobrescribir el carrito)
        active_cart.items.all().delete()
        
        # 4. Copiar ítems de la orden original
        for order_item in original_order.items.all():
            OrderItem.objects.create(
                order=active_cart,
                product=order_item.product,
                quantity=order_item.quantity,
                # Usar el precio unitario del producto actual (si no quieres usar el precio histórico)
                price=order_item.product.price 
            )
        
        # 5. Recalcular el total y guardar
        active_cart.totalAmount = sum(item.quantity * item.price for item in active_cart.items.all())
        active_cart.save()
        
        return JsonResponse({'success': True, 'order_id': active_cart.id})


@login_required
def user_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'store/orders_history.html', {
        'orders': orders
    })


def order_detail_api(request, order_id):
    try:
        order = get_object_or_404(Order, pk=order_id)

        items_queryset = OrderItem.objects.filter(order=order).values(
            'quantity', 
            'price', 
            'product__name'
        )
        
        items_list = []
        for item in items_queryset:
            items_list.append({
                'quantity': item['quantity'],
                'price': float(item['price']),
                'product_name': item['product__name']
            })

        # Use the Order model's hasPhysical property
        has_physical_products = order.hasPhysical

        data = {
            'id': order.id,
            'user': order.user.username if order.user else 'Invitado',
            'paymentStatus': order.paymentStatus,
            "totalAmount": float(order.totalAmount),
            "created_at": order.created_at.strftime("%Y-%m-%d %H:%M:%S"), 
            "updated_at": order.updated_at.strftime("%Y-%m-%d %H:%M:%S") if order.updated_at else 'Sin cambios',
            "shipping_data": order.shipping_data or 'Sin datos de envio',
            "has_physical_products": has_physical_products, 
            "items": items_list 
        }

        return JsonResponse(data, status=200)

    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found.'}, status=404)
    except Exception as e:
        # Manejo general de errores
        return JsonResponse({'error': str(e)}, status=500)


def payment_success(request):
    order_id = request.GET.get('order_id')
    context = {}
    
    if order_id:
        try:
            # Intentar obtener la orden. 
            # Nota: Para mayor seguridad en producción, podrías requerir un token firmado o verificar la sesión.
            # Aquí confiamos en el ID por simplicidad según el requerimiento, pero idealmente se validaría ownership.
            # Si el usuario es anónimo, permitimos ver si tiene el ID.
            order = Order.objects.get(pk=order_id)
            
            # Solo mostrar si el pago está completado
            if order.paymentStatus == 'completed':
                # Obtener los descargables asociados
                # Accedemos a través de Order -> OrderItem -> Downloadable
                downloadables = Downloadable.objects.filter(order_item__order=order)
                
                context['order'] = order
                context['downloadables'] = downloadables
                
        except (Order.DoesNotExist, ValueError):
            pass # Si no existe o error, simplemente no mostramos nada extra

    return render(request, 'store/payment_success.html', context)


def payment_cancel(request):
    return render(request, 'store/payment_cancel.html')

## Paypal Process Views

def get_paypal_access_token():
    """
    Obtiene un token de acceso de PayPal necesario para las llamadas API.
    """
    auth_url = f'{settings.PAYPAL_BASE_URL}/v1/oauth2/token'

    # La autenticación es con Client ID y Secret Key (Basic Auth)
    response = requests.post(
        auth_url,
        headers={
            'Accept': 'application/json',
            'Accept-Language': 'en_US'
        },
        auth=(settings.PAYPAL_CLIENT_ID, settings.PAYPAL_SECRET),
        data={'grant_type': 'client_credentials'}
    )

    if response.status_code == 200:
        return response.json().get('access_token')
    else:
        raise Exception("Error al obtener el token de acceso de PayPal")
        return None


def capture_paypal_payment_api(paypal_order_id):
    """
    Captura el pago de una orden de PayPal.
    """
    access_token = get_paypal_access_token()
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
    }
    
    url = f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders/{paypal_order_id}/capture"
    response = requests.post(url, headers=headers)
    
    if response.status_code in [200, 201]:
        data = response.json()
        
        # Extraer información relevante
        status = data.get('status')
        purchase_units = data.get('purchase_units', [{}])[0]
        shipping = purchase_units.get('shipping', {})
        
        # Formatear datos de envío si existen
        shipping_data = {}
        if shipping:
             address = shipping.get('address', {})
             name = shipping.get('name', {})
             shipping_data = {
                 'name': name.get('full_name'),
                 'address': f"{address.get('address_line_1', '')} {address.get('address_line_2', '')}".strip(),
                 'city': address.get('admin_area_2'),
                 'state': address.get('admin_area_1'),
                 'zipcode': address.get('postal_code'),
                 'country': address.get('country_code')
             }
        
        # Extraer datos del pagador (Payer) - Útil para productos digitales sin envío
        payer = data.get('payer', {})
        payer_info = {}
        if payer:
            payer_name = payer.get('name', {})
            payer_info = {
                'name': f"{payer_name.get('given_name', '')} {payer_name.get('surname', '')}".strip(),
                'email': payer.get('email_address'),
                'payer_id': payer.get('payer_id')
            }

        return {
            'status': status,
            'shipping_data': shipping_data,
            'payer_info': payer_info
        }
    else:
        # Loguear error
        print(f"Error capturing PayPal payment: {response.text}")
        # Devolver estado fallido pero no romper la ejecución completa si es posible manejarlo
        return {'status': 'FAILED', 'shipping_data': {}}


class capture_paypal_order(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            order_id = data.get('order_id')
            paypal_order_id = data.get('paypal_order_id')
        except JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
            
        if not all([order_id, paypal_order_id]):
             return JsonResponse({'error': 'Missing required identifiers (order_id or paypal_order_id).'}, status=400)
             
        try:
            order = get_object_or_404(Order, pk=order_id)
            
            with transaction.atomic():
                # 1. Capturar el pago en PayPal
                paypal_capture_response = capture_paypal_payment_api(paypal_order_id)
                payment_status_raw = paypal_capture_response.get('status', 'FAILED')
                shipping_data = paypal_capture_response.get('shipping_data', {})
                payer_info = paypal_capture_response.get('payer_info', {})
                
                # Normalizar estado para coincidir con las opciones del modelo (lowercase)
                if payment_status_raw == 'COMPLETED' or payment_status_raw == 'PAID':
                    payment_status = 'completed'
                else:
                    payment_status = payment_status_raw.lower()

                # 2. Guardar el estado del pago y los datos de envío
                order.paymentStatus = payment_status
                order.payment_method = 'PAYPAL'
                order.payment_id = paypal_order_id # Podrías usar el ID de transacción real si PayPal lo devuelve
                
                if shipping_data:
                    order.set_shipping_data(shipping_data) 
                elif payer_info:
                    # Si no hay datos de envío (ej. digital), guardar datos del pagador
                    # Usamos la misma estructura JSON para consistencia, aunque falte dirección
                    order.set_shipping_data(payer_info)
                
                order.save()
                
                redirect_url = reverse('store:user_orders')

                if payment_status == 'completed':
                    # El pago fue exitoso.
                    # La lógica de cumplimiento (Fulfillment) ahora se delega a ManageOrderView
                    # que será llamada por el frontend inmediatamente después.
                    
                    # --- MODIFICACIÓN: Redirección diferenciada para invitados ---
                    if request.user.is_authenticated:
                        redirect_url = reverse('store:user_orders')
                    else:
                        # Para invitados, redirigir a la página de éxito pública con el ID de la orden
                        redirect_url = f"{reverse('store:payment_success')}?order_id={order.id}"
                    
                else:
                    # El pago falló o está pendiente
                    # Podrías redireccionar a una página de error o reintento
                    redirect_url = reverse('store:user_orders') 
                    
            # 4. Devolver la respuesta de redirección al cliente
            return JsonResponse({
                'message': f'Payment {payment_status}. Ready for fulfillment.', 
                'order_id': order.id,
                'status': order.paymentStatus,
                'redirect_url': redirect_url
            })
            
        except Order.DoesNotExist:
             return JsonResponse({'error': f'Order with ID {order_id} not found.'}, status=404)
        except Exception as e:
            # Captura errores de la API de PayPal o de la lógica de cumplimiento
            print(f"Internal Server Error in capture_paypal_orderView: {e}")
            return JsonResponse({'error': f'Internal Server Error: {str(e)}'}, status=500)


def create_paypal_order_api(order, shipping_preference, return_url_dynamic, cancel_url_dynamic):
    """
    Crea una orden en la API de PayPal y devuelve el ID de la orden.
    """
    access_token = get_paypal_access_token()
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
    }
    
    # Construir el payload para PayPal
    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": str(order.id),
                "amount": {
                    "currency_code": "USD", # Ajusta la moneda según tu necesidad
                    "value": str(order.totalAmount)
                },
                "description": f"Order #{order.id} from Adela Valverde Store"
            }
        ],
        "application_context": {
            "shipping_preference": shipping_preference,
            "user_action": "PAY_NOW",
            "brand_name": "Adela Valverde",
            # URLs de retorno (aunque el flujo es SPA, PayPal las requiere)
            "return_url": return_url_dynamic,  
            "cancel_url": cancel_url_dynamic,
        }
    }
    
    url = f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders"
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 201:
        return response.json()['id']
    else:
        # Loguear el error para depuración
        print(f"Error creating PayPal order: {response.text}")
        raise Exception(f"Error creating PayPal order: {response.text}")


class create_paypal_order(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            order_id = data.get('order_id')
        except JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
            
        try:
            order = get_object_or_404(Order, pk=order_id)
            
            # 1. Leer el valor Order.hasPhysical guardado por ManageOrderView (Propósito 1)
            # Esto determina si PayPal debe solicitar una dirección de envío.
            if order.hasPhysical:
                shipping_preference = 'SET_PROVIDED_ADDRESS' # PayPal solicita la dirección
            else:
                shipping_preference = 'NO_SHIPPING' # PayPal no solicita la dirección

            # 1. Obtener los paths relativos de las URLs de Django
            success_path = reverse('store:payment_success') # Asumiendo que has nombrado tus URLs
            cancel_path = reverse('store:payment_cancel')

            # 2. Construir las URLs absolutas y dinámicas usando el objeto request
            return_url_dynamic = request.build_absolute_uri(success_path)
            cancel_url_dynamic = request.build_absolute_uri(cancel_path)
                
            # 2. Llamar a la API de PayPal
            paypal_order_id = create_paypal_order_api(order, shipping_preference, return_url_dynamic, cancel_url_dynamic)
            
            # 3. Guardar el ID de PayPal
            order.paypal_order_id = paypal_order_id
            order.save()
            
            return JsonResponse({
                'paypal_order_id': paypal_order_id,
                'order_id': order.id,
            })
            
        except Order.DoesNotExist:
            return JsonResponse({'error': f'Order with ID {order_id} not found.'}, status=404)
        except Exception as e:
            return JsonResponse({'error': f'PayPal creation failed: {str(e)}'}, status=500)

