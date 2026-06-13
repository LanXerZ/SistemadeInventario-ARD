from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ItemViewSet, StockMovementViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'items', ItemViewSet, basename='item')
router.register(r'stock-movements', StockMovementViewSet, basename='stockmovement')

urlpatterns = [
    path('', include(router.urls)),
]
