from django import forms
from .models import Product, Category


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = (
            'name', 
            'price', 
            'category',
            'description',
            'other_site_link',
            'image',
            'is_active',
            'is_digital',
            'download_file',
        )

        labels = {
            'name': 'Nombre',
            'description': 'Descripción',
            'price': 'Precio',
            'created_by': 'Creado Por', # Assuming this field exists
            'category': 'Categoría',
            'providers': 'Proveedores',
            'other_site_link': 'Enlace a Gamma',
            'image': 'Imagen',
            'is_active': 'Publicar',
            'is_digital': 'Descargable',
            'download_file': 'Archivo para Descargar',
        }
        
        widgets = {
            # 1. Text/Number/URL Inputs: Apply 'form-control'
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'price': forms.NumberInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'other_site_link': forms.URLInput(attrs={'class': 'form-control'}),
            # Image field setup to enable camera capture
            'image': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*', 'capture': 'user'}),

            # 2. Selection Fields: Apply 'form-select'
            # This makes the category field a clean dropdown.
            'category': forms.Select(attrs={'class': 'form-select'}),
            'is_digital': forms.CheckboxInput(),
        }


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description']
        
        labels = {
            'name': 'Nombre',
            'description': 'Descripción',
        }

        widgets = {
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
        }
