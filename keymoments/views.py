from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from .models import KeyMoment
from .forms import KeyMomentsForm



def key_moments_list(request):
    """ View to return the Key Moments page"""
    key_moments_list = KeyMoment.objects.all()

    return render(request, 'keymoments/keymoments.html', {'key_moments_list': key_moments_list})


@login_required
def create_key_moment(request):
    """ View to Create key moments"""
    if request.method == 'POST':
        form = KeyMomentsForm(request.POST, request.FILES)
        if form.is_valid():
            new_moment = form.save(commit=False)
            new_moment.user = request.user  # This line is missing
            new_moment.save()

            response_data = {
                'user': request.user.id,
                'title': new_moment.title,
                'start_date': new_moment.start_date,
                'excerpt': new_moment.excerpt,
                'end_date': new_moment.end_date,
                'description': new_moment.description,
                'moment_type': new_moment.moment_type,
                'image_url': new_moment.image.url if new_moment.image else None,
            }
            return JsonResponse(response_data)
        else:
            # Handle form validation errors
            errors = form.errors.as_json()
            return JsonResponse({'errors': errors}, status=400)
    else:
        form = KeyMomentsForm()

    return render(request, 'keymoments/create_key_moment.html', {'form': form})


@login_required
def edit_key_moment(request, moment_id):
    """ View to edit moments"""
    moment = get_object_or_404(KeyMoment, id=moment_id)

    if request.method == 'GET':
        # Extract necessary fields from the 'moment' object and return them in the response
        response_data = {
            'title': moment.title,
            'excerpt': moment.excerpt,
            'description': moment.description,
            'start_date': moment.start_date.strftime('%Y-%m-%d'),
            'end_date': moment.end_date.strftime('%Y-%m-%d') if moment.end_date else None,
            'moment_type': moment.moment_type,
            'location': moment.location,
            'image_url': moment.image.url if moment.image else None,  # Use the original image URL
        }
        return JsonResponse(response_data)

    if request.method == 'POST':
        form = KeyMomentsForm(request.POST, instance=moment)
        if form.is_valid():
            form.save()
            # Optionally, update the image field if a new image is uploaded
            new_image = request.FILES.get('image')
            if new_image:
                moment.image = new_image
                moment.save()  # Save the moment with the updated image
            return JsonResponse({'success': True})
        else:
            # Handle form validation errors
            errors = form.errors.as_json()
            return JsonResponse({'errors': errors}, status=400)


@login_required
def delete_key_moment(request, moment_id):
    """ View to delete moments"""
    print(f"Received moment_id: {moment_id}")  # Debug print
    item = get_object_or_404(KeyMoment, id=moment_id)

    if request.method == 'POST':
        # Check if the user has confirmed the deletion
        if request.POST.get('delete'):
            item.delete()
            # add a success message to the messages framework
            messages.success(request, 'Eliminado')
            return redirect('keymoments')
    else:
        # Render the confirmation template
        pass
