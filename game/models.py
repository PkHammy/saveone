import uuid
from django.db import models
class Run(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.CharField(max_length=40)
    nickname = models.CharField(max_length=30, default='Player')
    years = models.JSONField(default=list)
    choices = models.JSONField(default=list)
    next_index = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True, db_index=True)
    class Meta:
        ordering = ['-created_at']
