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


class LoginView(LoginView):
    template_name = 'users/login.html'
    form_class = AuthenticationForm

    def get(self, request):
        # If user is already authenticated, redirect to profile
        if request.user.is_authenticated:
            return redirect('home')
        return render(request, self.template_name)

    def post(self, request):
        # Process the login form data
        form = self.form_class(request.POST, request.FILES)
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            # Return success response
            return JsonResponse({'success': True})
        else:
            # Return error response
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
                #=========================================================
                # 2. LÓGICA DE TRANSFERENCIA DE CARRITO (CRÍTICO)
                # =========================================================
                ACTIVE_CART_STATUS = 'pending'
                order_id_anonimo = request.session.get('order_id')
                
                if order_id_anonimo:
                    try:
                        # Buscar la orden anónima (sin usuario y pendiente)
                        orden_anonima = Order.objects.get(
                            id=order_id_anonimo, 
                            user__isnull=True,  # Debe ser una orden de invitado
                            paymentStatus=ACTIVE_CART_STATUS
                        )
                        
                        # Manejo de Conflictos: Verificar si el nuevo usuario YA tiene un carrito activo
                        orden_autenticada = Order.objects.filter(
                            user=user, 
                            paymentStatus=ACTIVE_CART_STATUS
                        ).first()

                        if orden_autenticada:
                            # Opción de Fusión (Merge): Mover los ítems del carrito anónimo al carrito autenticado
                            for item_anonimo in orden_anonima.items.all():
                                # Intentar encontrar el item en el carrito autenticado
                                item_existente, created = OrderItem.objects.get_or_create(
                                    order=orden_autenticada,
                                    product=item_anonimo.product,
                                    defaults={'quantity': item_anonimo.quantity, 'price': item_anonimo.price}
                                )
                                if not created:
                                    # Si el producto ya existía, sumar cantidades
                                    item_existente.quantity += item_anonimo.quantity
                                    item_existente.save()

                            # Eliminar la orden anónima después de mover los ítems
                            orden_anonima.delete()
                            
                            # Recalcular el total de la orden autenticada
                            orden_autenticada.totalAmount = sum(item.quantity * item.price for item in orden_autenticada.items.all())
                            orden_autenticada.save()
                            
                            # La sesión ya tiene un carrito, no necesitamos hacer nada con order_id
                            
                        else:
                            # Caso simple: No hay conflicto. Simplemente asignar la orden al nuevo usuario
                            orden_anonima.user = user
                            orden_anonima.save()

                        # Finalmente, limpiar el order_id de la sesión, ya sea que se haya fusionado o asignado
                        del request.session['order_id']
                        request.session.modified = True

                    except Order.DoesNotExist:
                        # El ID en la sesión era inválido o la orden ya se completó. Ignorar.
                        pass
                login(request, user)
                return JsonResponse({'success': True, 'redirect_url':'/'})
            except IntegrityError:
                return JsonResponse({'errors': {'non_field_errors': ['Ese usuario ya existe.']}}, status=400)
        else:
            errors = form.errors.as_json()  # Ensure errors are serialized properly
            return JsonResponse({'errors': errors}, status=400)
        

def direct_logout_view(request):
    logout(request)
    return redirect('home')

