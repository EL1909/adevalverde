from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.utils.dateparse import parse_datetime
from .models import Appointment, AdminCalendarSettings
from store.models import Product
from .services import GoogleCalendarService
import datetime
import json

@require_GET
def check_availability(request, product_id):
    product = get_object_or_404(Product, pk=product_id)
    admin_user = product.created_by
    
    if not admin_user:
        return JsonResponse({'error': 'Product has no admin assigned'}, status=400)

    try:
        settings = admin_user.calendar_settings
    except AdminCalendarSettings.DoesNotExist:
        return JsonResponse({'error': 'Admin has no calendar configured'}, status=400)

    start_date_str = request.GET.get('start')
    end_date_str = request.GET.get('end')
    
    if not start_date_str or not end_date_str:
        return JsonResponse({'error': 'Missing start or end date'}, status=400)

    start_time = parse_datetime(start_date_str)
    end_time = parse_datetime(end_date_str)
    
    if not start_time or not end_time:
        # Try parsing as date only and add time
        try:
            start_time = datetime.datetime.strptime(start_date_str, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
            end_time = datetime.datetime.strptime(end_date_str, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc) + datetime.timedelta(days=1)
        except ValueError:
             return JsonResponse({'error': 'Invalid date format'}, status=400)

    service = GoogleCalendarService()
    busy_slots = service.get_busy_slots(settings.google_calendar_id, start_time, end_time)
    
    # Also check internal pending appointments to avoid double booking before sync
    internal_appointments = Appointment.objects.filter(
        admin_user=admin_user,
        start_time__gte=start_time,
        end_time__lte=end_time,
        status__in=['pending', 'confirmed']
    )
    
    for appt in internal_appointments:
        busy_slots.append({
            'start': appt.start_time.isoformat(),
            'end': appt.end_time.isoformat()
        })

    return JsonResponse({'busy': busy_slots})


@require_POST
def reserve_appointment(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    product_id = data.get('product_id')
    start_str = data.get('start')
    end_str = data.get('end')

    if not all([product_id, start_str, end_str]):
        return JsonResponse({'error': 'Missing fields'}, status=400)

    product = get_object_or_404(Product, pk=product_id)
    start_time = parse_datetime(start_str)
    end_time = parse_datetime(end_str)

    # Create appointment
    appointment = Appointment.objects.create(
        product=product,
        admin_user=product.created_by,
        customer=request.user if request.user.is_authenticated else None,
        start_time=start_time,
        end_time=end_time,
        status='pending'
    )

    return JsonResponse({'appointment_id': appointment.id})


@login_required
def admin_calendar_view(request):
    if not request.user.is_superuser:
        return render(request, '403.html', status=403) # Or redirect
    return render(request, 'calendars/admin_calendar.html')


@login_required
def appointments_json(request):
    if not request.user.is_superuser:
        return JsonResponse({'error': 'Unauthorized'}, status=403)

    appointments = Appointment.objects.all()
    events = []
    for appt in appointments:
        customer_name = appt.customer.username if appt.customer else "Guest"
        email = appt.customer.email if appt.customer else "N/A"
        
        # Determine color based on status
        color = '#3788d8' # Default blue
        if appt.status == 'confirmed':
            color = '#28a745' # Green
        elif appt.status == 'cancelled':
            color = '#dc3545' # Red
            
        events.append({
            'title': f"{appt.product.name} ({customer_name})",
            'start': appt.start_time.isoformat(),
            'end': appt.end_time.isoformat(),
            'color': color,
            'extendedProps': {
                'customer': customer_name,
                'email': email,
                'status': appt.status
            }
        })
    
    return JsonResponse(events, safe=False)
