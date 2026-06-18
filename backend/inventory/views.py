from django.db.models import Q, Max
from django.http import FileResponse
from django.utils import timezone
from datetime import datetime
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from utils.reports import build_report
from .models import Category, Location, Item, StockMovement, Transfer
from .serializers import (
    CategorySerializer,
    LocationSerializer,
    ItemListSerializer,
    ItemDetailSerializer,
    StockMovementSerializer,
    TransferSerializer,
)
from .permissions import IsAlmacenistaOrAdmin


class ItemFilter(FilterSet):
    category = NumberFilter(field_name='category__id')
    location = NumberFilter(field_name='location__id')

    class Meta:
        model = Item
        fields = ['category', 'is_active', 'location']


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]

    def get_queryset(self):
        queryset = super().get_queryset().select_related('parent')
        location_type = self.request.query_params.get('location_type')
        parent = self.request.query_params.get('parent')

        if location_type:
            queryset = queryset.filter(location_type=location_type)
        if parent is not None:
            if parent == '' or parent == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent)

        return queryset

    def perform_destroy(self, instance):
        if instance.has_items:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                'No se puede eliminar la ubicación porque tiene artículos o sub-ubicaciones asociadas.'
            )
        instance.delete()

    @action(detail=False, methods=['get'])
    def roots(self, request):
        roots = self.queryset.filter(parent__isnull=True)
        serializer = self.get_serializer(roots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def tree(self, request, pk=None):
        location = self.get_object()
        tree = self._build_tree(location)
        return Response(tree)

    def _build_tree(self, location):
        data = self.get_serializer(location).data
        data['children'] = [self._build_tree(child) for child in location.children.all()]
        return data

    @action(detail=False, methods=['get'])
    def full_tree(self, request):
        roots = self.get_queryset().filter(parent__isnull=True)
        tree = [self._build_tree(root) for root in roots]
        return Response(tree)


class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.select_related('category', 'location').all()
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
                | Q(code__icontains=search)
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

    def perform_create(self, serializer):
        category = serializer.validated_data.get('category')
        code = self._generate_code(category)
        serializer.save(code=code)

    def _generate_code(self, category):
        last_item = Item.objects.filter(category=category).order_by('code').last()
        if last_item and last_item.code:
            try:
                last_num = int(last_item.code.split('-')[-1])
                new_num = last_num + 1
            except ValueError:
                new_num = 1
        else:
            new_num = 1
        abbreviation = category.abbreviation.upper()
        return f"{abbreviation}-{new_num:03d}"

    @action(detail=False, methods=['get'])
    def report(self, request):
        format = request.query_params.get('format', 'pdf')
        if format not in ('pdf', 'excel'):
            return Response({'detail': 'Formato inválido. Use pdf o excel.'}, status=status.HTTP_400_BAD_REQUEST)

        items = self.get_queryset()
        headers = ['Código', 'Nombre', 'SKU', 'Categoría', 'Ubicación', 'Stock', 'Mínimo', 'Unidad', 'Estado']
        rows = [
            [
                item.code or '—',
                item.name,
                item.sku or '—',
                item.category.name,
                item.location.get_breadcrumb() if item.location else '—',
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

    def get_queryset(self):
        queryset = super().get_queryset()
        item_id = self.request.query_params.get('item')
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        return queryset

    def perform_create(self, serializer):
        movement = serializer.save()
        item = movement.item

        if movement.movement_type == StockMovement.MovementType.ENTRY:
            item.quantity += movement.quantity
        elif movement.movement_type == StockMovement.MovementType.EXIT:
            item.quantity -= movement.quantity

        item.save(update_fields=['quantity'])


class TransferFilter(FilterSet):
    item = NumberFilter(field_name='item__id')
    origin_location = NumberFilter(field_name='origin_location__id')
    destination_location = NumberFilter(field_name='destination_location__id')
    requested_by = NumberFilter(field_name='requested_by__id')
    approved_by = NumberFilter(field_name='approved_by__id')

    class Meta:
        model = Transfer
        fields = ['item', 'origin_location', 'destination_location', 'status',
                  'requested_by', 'approved_by']


class TransferViewSet(viewsets.ModelViewSet):
    queryset = Transfer.objects.select_related(
        'item', 'origin_location', 'destination_location',
        'requested_by', 'approved_by',
    ).all()
    serializer_class = TransferSerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_class = TransferFilter

    def get_queryset(self):
        queryset = super().get_queryset()
        item_id = self.request.query_params.get('item')
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != Transfer.Status.PENDIENTE:
            return Response(
                {'detail': 'Solo se pueden aprobar traslados pendientes.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.role in ('admin', 'almacenista'):
            return Response(
                {'detail': 'No tiene permisos para aprobar traslados.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        transfer.status = Transfer.Status.COMPLETADA
        transfer.approved_by = request.user
        transfer.completed_at = timezone.now()
        transfer.item.location = transfer.destination_location
        transfer.item.save(update_fields=['location'])
        transfer.save()
        return Response(self.get_serializer(transfer).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status != Transfer.Status.PENDIENTE:
            return Response(
                {'detail': 'Solo se pueden rechazar traslados pendientes.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.role in ('admin', 'almacenista'):
            return Response(
                {'detail': 'No tiene permisos para rechazar traslados.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        transfer.status = Transfer.Status.RECHAZADA
        transfer.approved_by = request.user
        transfer.completed_at = timezone.now()
        transfer.notes = (transfer.notes + '\n' if transfer.notes else '') + \
            f"Rechazado por {request.user.name}"
        transfer.save()
        return Response(self.get_serializer(transfer).data)
