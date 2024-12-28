from django import forms
from .models import KeyMoment, STATUS
from django.forms import DateInput


class KeyMomentsForm(forms.ModelForm):
    start_date = forms.DateField(widget=DateInput(attrs={'type': 'date'}))
    end_date = forms.DateField(widget=DateInput(attrs={'type': 'date'}), required=False)

    class Meta:
        model = KeyMoment
        fields = [
            'title',
            'description',
            'excerpt',
            'start_date',
            'end_date',
            'moment_type',
            'location',
            'image',
            'status'
        ]
