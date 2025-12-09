"""
Debug script to check domain detection in QR code generation

Run with: python manage.py shell < debug_domain.py
"""

from django.conf import settings

print("=" * 60)
print("DOMAIN DETECTION DEBUG")
print("=" * 60)

print(f"\nALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")

# Simulate the domain detection logic
domain = None
for host in settings.ALLOWED_HOSTS:
    print(f"\nChecking host: '{host}'")
    print(f"  - Is 'localhost'? {host == 'localhost'}")
    print(f"  - Is '127.0.0.1'? {host == '127.0.0.1'}")
    print(f"  - Is an IP? {host.replace('.', '').isdigit()}")
    
    if host not in ['localhost', '127.0.0.1'] and not host.replace('.', '').isdigit():
        domain = host
        print(f"  ✓ SELECTED: {host}")
        break
    else:
        print(f"  ✗ SKIPPED")

print("\n" + "=" * 60)
if domain:
    base_url = f"https://{domain}"
    print(f"DETECTED DOMAIN: {domain}")
    print(f"BASE URL: {base_url}")
else:
    print("NO DOMAIN DETECTED - Will use localhost:8000")
    print("BASE URL: http://localhost:8000")

print("=" * 60)

# Check existing downloadables
from store.models import Downloadable

print(f"\nTotal Downloadables: {Downloadable.objects.count()}")
example_count = Downloadable.objects.filter(verification_url__contains="example.com").count()
correct_count = Downloadable.objects.filter(verification_url__contains="adelavalverde.info").count()

print(f"With example.com: {example_count}")
print(f"With adelavalverde.info: {correct_count}")

if Downloadable.objects.exists():
    latest = Downloadable.objects.latest('id')
    print(f"\nLatest Downloadable:")
    print(f"  ID: {latest.id}")
    print(f"  URL: {latest.verification_url}")
    print(f"  Order: {latest.order_item.order.id}")

print("\n" + "=" * 60)
