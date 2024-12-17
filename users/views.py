from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.views import LoginView
from django.contrib.auth.forms import AuthenticationForm
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views import View
from .forms import SignupForm


# Create your views here.


def HomeIndex(request):
    """ A View to return the index page"""
    svgPaths = [
        'CanvaContent/1.svg',
        'CanvaContent/5.svg',
    ]

    context = {
        'svgPaths': svgPaths,
    }

    return render(request, 'home-content.html', context)


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
            return redirect('home')
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
    
    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Log the user in after signing up
            return JsonResponse({'success': True})
        else:
            # Return the errors in JSON format
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
        

def direct_logout_view(request):
    logout(request)
    return redirect('home')
