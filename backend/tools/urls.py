from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ToolViewSet, ToolLoanViewSet, TechnicianViewSet

router = DefaultRouter()
router.register(r'tools', ToolViewSet, basename='tool')
router.register(r'loans', ToolLoanViewSet, basename='toolloan')
router.register(r'technicians', TechnicianViewSet, basename='technician')

urlpatterns = [
    path('', include(router.urls)),
]
