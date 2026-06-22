from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DespachoViewSet, SolicitanteViewSet

router = DefaultRouter()
router.register(r'despachos', DespachoViewSet, basename='despacho')
router.register(r'solicitantes', SolicitanteViewSet, basename='solicitante')

urlpatterns = [
    path('', include(router.urls)),
]
