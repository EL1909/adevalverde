import os
from django.db import models
from django.core.files.storage import default_storage
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from django.utils.crypto import get_random_string



STATUS = ((0, "Draft"), (1, "Published"))

MOMENT_TYPE_CHOICES = [
        ("SOCIAL", (
            ("birth", "Birth"),
            ("death", "End"),
            ("love", "Love"),
            ("moving", "Moving"),
            ),
        ),
        ("ACADEMIC", (
            ("school", "School"),
            ("college", "College"),
            ("institute", "Institutes"),
            ("self", "Self Learned"),
            ),
        ),
        ("WORK", (
            ("hired", "Hired"),
            ("fired", "Fired"),
            ("own", "Own Bussiness"),
            ("gig", "Independent"),
            ),
        ),
        ("UNKNOWN", "Unknown"),
    ]


class KeyMoment(models.Model):
    class Meta:
        verbose_name_plural = 'Key Moments'
        ordering = ['-start_date']

    # Custom upload path for images
    def get_image_path(self, filename):
        name, ext = os.path.splitext(filename)
        return f'keymoments/{slugify(name)}-{get_random_string(length=8)}{ext}'

    title = models.CharField(max_length=128)
    excerpt = models.CharField(max_length=256)
    user = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='key_moments')
    status = models.IntegerField(choices=STATUS, default=0)
    description = models.TextField(null=True, blank=True)
    image = models.ImageField(upload_to=get_image_path, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=256, null=True, blank=True)
    likes = models.ManyToManyField(get_user_model(), related_name='moment_likes', blank=True)
    moment_type = models.CharField(max_length=30, choices=MOMENT_TYPE_CHOICES, default="UNKNOWN")


    def delete(self, *args, **kwargs):
        # Delete the image file from the storage before deleting the object
        if self.image:
            if default_storage.exists(self.image.name):
                default_storage.delete(self.image.name)
        
        super().delete(*args, **kwargs)
        
    def __str__(self):
        return self.title
