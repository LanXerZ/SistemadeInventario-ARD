from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkOrderViewSet, TechnicianViewSet

router = DefaultRouter()
router.register(r'work-orders', WorkOrderViewSet, basename='workorder')
router.register(r'technicians', TechnicianViewSet, basename='technician')

urlpatterns = [
    path('', include(router.urls)),
]
