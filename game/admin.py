from django.contrib import admin
from .models import Run
@admin.register(Run)
class RunAdmin(admin.ModelAdmin):
    list_display = ('nickname', 'created_at', 'completed_at', 'next_index')
    readonly_fields = ('id', 'owner', 'years', 'choices', 'next_index', 'created_at', 'completed_at')
