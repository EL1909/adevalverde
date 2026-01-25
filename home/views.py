from django.shortcuts import render


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


def EscuelaSilencio(request):
    """ A View to return the Privacy page"""
    return render(request, 'escuela_silencio.html')


def test_coherencia(request):
    return render(request, 'coherencia_app/escanner.html')