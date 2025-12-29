from google.oauth2 import service_account
from googleapiclient.discovery import build
from django.conf import settings
from datetime import timedelta
import datetime

SCOPES = ['https://www.googleapis.com/auth/calendar']

class GoogleCalendarService:
    def __init__(self):
        self.creds = None
        # Load credentials from the file specified in settings
        if hasattr(settings, 'GOOGLE_SERVICE_ACCOUNT_FILE'):
            try:
                self.creds = service_account.Credentials.from_service_account_file(
                    settings.GOOGLE_SERVICE_ACCOUNT_FILE, scopes=SCOPES)
            except Exception as e:
                print(f"Error loading service account credentials: {e}")
                self.creds = None

    def get_service(self):
        if not self.creds:
            print("No credentials available for Google Calendar Service")
            return None
        return build('calendar', 'v3', credentials=self.creds)

    def check_availability(self, calendar_id, start_time, end_time):
        # This method seems redundant if get_busy_slots does the same work
        # But keeping it for backward compatibility if used elsewhere
        busy_slots = self.get_busy_slots(calendar_id, start_time, end_time)
        return len(busy_slots) == 0

    def get_busy_slots(self, calendar_id, start_time, end_time):
        service = self.get_service()
        if not service:
            return []

        body = {
            "timeMin": start_time.isoformat(),
            "timeMax": end_time.isoformat(),
            "timeZone": 'UTC',
            "items": [{"id": calendar_id}]
        }

        try:
            events_result = service.freebusy().query(body=body).execute()
            calendars = events_result.get('calendars', {})
            # Check if the calendar_id exists in the response
            if calendar_id not in calendars:
                 print(f"Calendar ID {calendar_id} not found in response. Check permissions.")
                 return []
                 
            busy_slots = calendars.get(calendar_id, {}).get('busy', [])
            return busy_slots
        except Exception as e:
            print(f"Error querying Google Calendar API: {e}")
            return []

    def create_event(self, calendar_id, appointment):
        service = self.get_service()
        if not service:
            return None

        event = {
            'summary': f'Appointment: {appointment.product.name}',
            'location': 'Online', 
            'description': f'Appointment with {appointment.customer.username if appointment.customer else "Guest"}',
            'start': {
                'dateTime': appointment.start_time.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': appointment.end_time.isoformat(),
                'timeZone': 'UTC',
            },
        }

        try:
            created_event = service.events().insert(calendarId=calendar_id, body=event).execute()
            return created_event.get('id')
        except Exception as e:
            print(f"Error creating event in Google Calendar: {e}")
            return None
