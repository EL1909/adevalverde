from django import forms
from .models import Product

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'description', 'price', 'image', 'other_site_link','category', 'providers']
        labels = {
            'name': 'Nombre del Producto',
            'description': 'Descripción',
            'price': 'Precio',
            'image': 'Imagen del Producto',
            'other_site_link': 'Enlace de Otras tiendas',
            'category': 'Categoria',
            'providers': 'Proveedor'
        }
