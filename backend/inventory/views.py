from django.db.models import Q
from django.http import FileResponse
from datetime import datetime
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from utils.reports import build_report
from .models import Category, Item, StockMovement
from .serializers import (
    CategorySerializer,
    ItemListSerializer,
    ItemDetailSerializer,
    StockMovementSerializer,
)
from .permissions import IsAlmacenistaOrAdmin


class ItemFilter(FilterSet):
    category = NumberFilter(field_name='category__id')

    class Meta:
        model = Item
        fields = ['category', 'is_active']


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related('category').all()
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ItemFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return ItemListSerializer
        return ItemDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        critical = self.request.query_params.get('critical')

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(sku__icontains=search)
                | Q(part_number__icontains=search)
                | Q(application__icontains=search)
            )

        if critical is not None:
            if critical.lower() in ('true', '1'):
                queryset = [item for item in queryset if item.is_critical]
            elif critical.lower() in ('false', '0'):
                queryset = [item for item in queryset if not item.is_critical]

        return queryset

    @action(detail=False, methods=['get'])
    def report(self, request):
        format = request.query_params.get('format', 'pdf')
        if format not in ('pdf', 'excel'):
            return Response({'detail': 'Formato inválido. Use pdf o excel.'}, status=status.HTTP_400_BAD_REQUEST)

        items = self.get_queryset()
        headers = ['Nombre', 'SKU', 'Categoría', 'Ubicación', 'Stock', 'Mínimo', 'Unidad', 'Estado']
        rows = [
            [
                item.name,
                item.sku or '—',
                item.category.name,
                item.location,
                item.quantity,
                item.minimum_stock,
                item.unit,
                'Activo' if item.is_active else 'Inactivo',
            ]
            for item in items
        ]

        buffer = build_report('Reporte de Inventario', headers, rows, format)
        content_type = 'application/pdf' if format == 'pdf' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'pdf' if format == 'pdf' else 'xlsx'
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"inventario_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{extension}",
            content_type=content_type,
        )

    @action(detail=False, methods=['get'])
    def critical(self, request):
        items = [item for item in self.get_queryset() if item.is_critical]
        serializer = ItemListSerializer(items, many=True)
        return Response(serializer.data)


class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.select_related('item').all()
    serializer_class = StockMovementSerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['item', 'movement_type', 'document_type']

    def perform_create(self, serializer):
        movement = serializer.save()
        item = movement.item

        if movement.movement_type == StockMovement.MovementType.ENTRY:
            item.quantity += movement.quantity
        elif movement.movement_type == StockMovement.MovementType.EXIT:
            item.quantity -= movement.quantity

        item.save(update_fields=['quantity'])
