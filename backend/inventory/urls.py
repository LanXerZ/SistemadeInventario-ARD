from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, LocationTypeViewSet, LocationViewSet, ItemViewSet,
    StockMovementViewSet, TransferViewSet,
    ItemUnitViewSet, ItemLoanViewSet,
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'location-types', LocationTypeViewSet, basename='locationtype')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')
router.register(r'transfers', TransferViewSet, basename='transfer')
router.register(r'item-units', ItemUnitViewSet, basename='itemunit')
router.register(r'item-loans', ItemLoanViewSet, basename='itemloan')

urlpatterns = [
    path('', include(router.urls)),
]
