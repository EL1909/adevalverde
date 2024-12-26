from django import forms
from .models import Product, Category

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['name', 'price', 'image', 'other_site_link','category', 'providers', 'description']
        labels = {
            'name': 'Nombre del Producto',
            'price': 'Precio',
            'image': 'Imagen del Producto',
            'other_site_link': 'Enlace de Otras tiendas',
            'category': 'Categoria',
            'providers': 'Proveedor',
            'description': 'Descripción',
        }
        widgets = {
            'description': forms.Textarea(attrs={'rows': 2, 'cols': 40}),
        }


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name']
