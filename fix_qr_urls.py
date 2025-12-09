"""
Script to fix existing QR codes and verification URLs that point to example.com

Run this with: python manage.py shell < fix_qr_urls.py
"""

from store.models import Downloadable
from django.urls import reverse
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile

# New correct domain
NEW_DOMAIN = "https://adelavalverde.info"

# Get all downloadables with example.com in the URL
downloadables = Downloadable.objects.filter(verification_url__contains="example.com")

print(f"Found {downloadables.count()} downloadables with example.com URLs")

updated_count = 0
for downloadable in downloadables:
    try:
        # Extract token from old URL
        token = downloadable.token
        
        # Build new verification URL
        verify_path = reverse('store:verify_download', args=[token])
        new_verification_url = f"{NEW_DOMAIN}{verify_path}"
        
        # Generate new QR code
        qr = qrcode.make(new_verification_url)
        qr_buffer = BytesIO()
        qr.save(qr_buffer, 'PNG')
        qr_file = ContentFile(qr_buffer.getvalue(), name=f"qr_{token}.png")
        
        # Update the downloadable
        downloadable.verification_url = new_verification_url
        downloadable.qr_image.delete(save=False)  # Delete old QR image
        downloadable.qr_image = qr_file
        downloadable.save()
        
        updated_count += 1
        print(f"✓ Updated downloadable {downloadable.id} - Order {downloadable.order_item.order.id}")
        
    except Exception as e:
        print(f"✗ Error updating downloadable {downloadable.id}: {e}")

print(f"\n{updated_count} QR codes updated successfully!")
print("New orders will automatically use the correct domain.")
