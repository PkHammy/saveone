from django.urls import path
from . import views
urlpatterns = [path('play/<uuid:run_id>/undo/', views.undo, name='undo'), path('r/<uuid:run_id>/image/', views.collection_image, name='collection_image'), path('', views.home, name='home'), path('play/<uuid:run_id>/', views.play, name='play'), path('play/<uuid:run_id>/choose/', views.choose, name='choose'), path('r/<uuid:run_id>/', views.result, name='result')]
