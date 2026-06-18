from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, LocationViewSet, ItemViewSet,
    StockMovementViewSet, TransferViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')
router.register(r'transfers', TransferViewSet, basename='transfer')

urlpatterns = [
    path('', include(router.urls)),
]
