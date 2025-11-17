from django import forms
from django.contrib.auth import get_user_model

class SignupForm(forms.ModelForm):
    # Asegúrate de que el campo password use un widget de contraseña
    password = forms.CharField(widget=forms.PasswordInput())

    class Meta:
        model = get_user_model()
        fields = ['username', 'email', 'password']
        
    # Agrega o modifica el método save para hashear la contraseña
    def save(self, commit=True):
        # 1. Llama al save del padre, pero con commit=False. Esto crea el objeto 'user'
        # en memoria con la contraseña aún en texto plano.
        user = super().save(commit=False)
        
        # 2. Utiliza set_password para hashear el valor del campo 'password'
        # y actualizar el atributo 'password' del objeto 'user'.
        password = self.cleaned_data["password"]
        user.set_password(password)
        
        # 3. Guarda el objeto en la base de datos con la contraseña hasheada.
        if commit:
            user.save()
            
        return user