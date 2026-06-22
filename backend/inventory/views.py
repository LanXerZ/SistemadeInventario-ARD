from django.db import transaction
from django.db.models import Q, Max
from django.http import FileResponse
from django.utils import timezone
from datetime import datetime
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend, FilterSet, NumberFilter
from django_filters import rest_framework as django_filters
from utils.reports import build_report
from .models import Category, Location, LocationType, Item, StockMovement, Transfer, ItemUnit, ItemLoan
from .serializers import (
    CategorySerializer,
    LocationSerializer,
    LocationTypeSerializer,
    LocationTypeSimpleSerializer,
    ItemListSerializer,
    ItemDetailSerializer,
    StockMovementSerializer,
    TransferSerializer,
    ItemUnitSerializer,
    ItemUnitCreateSerializer,
    ItemLoanSerializer,
)
from .permissions import IsAlmacenistaOrAdmin


class ItemFilter(FilterSet):
    category = NumberFilter(field_name='category__id')
    location = NumberFilter(field_name='location__id')
    kind = django_filters.CharFilter(field_name='kind')

    class Meta:
        model = Item
        fields = ['category', 'is_active', 'location', 'kind', 'track_by_serial']


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]


class LocationTypeViewSet(viewsets.ModelViewSet):
    """CRUD de tipos de ubicación. Lectura abierta, escritura solo admin/almacenista."""
    queryset = LocationType.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]
    pagination_class = None

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action == 'list':
            return LocationTypeSimpleSerializer
        return LocationTypeSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')

        if is_active is not None:
            if is_active.lower() in ('true', '1'):
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in ('false', '0'):
                queryset = queryset.filter(is_active=False)
        else:
            queryset = queryset.filter(is_active=True)

        if search:
            queryset = queryset.filter(
                Q(code__icontains=search) | Q(name__icontains=search)
            )

        return queryset.order_by('name')

    def perform_destroy(self, instance):
        if instance.locations.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                f'No se puede eliminar el tipo "{instance.name}" porque tiene {instance.locations.count()} ubicación(es) asociada(s).'
            )
        instance.delete()


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.select_related('location_type', 'parent').all()
    serializer_class = LocationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        location_type = self.request.query_params.get('location_type')
        parent = self.request.query_params.get('parent')

        if location_type:
            queryset = queryset.filter(location_type_id=location_type)
        if parent is not None:
            if parent == '' or parent == 'null':
                queryset = queryset.filter(parent__isnull=True)
            else:
                queryset = queryset.filter(parent_id=parent)

        return queryset

    def perform_destroy(self, instance):
        if instance.items.exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                'No se puede eliminar la ubicación porque tiene artículos asociados.'
            )
        instance.delete()


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
        kind = self.request.query_params.get('kind')

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

        if kind:
            queryset = queryset.filter(kind=kind)

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
        from rest_framework.exceptions import PermissionDenied
        if request.user.role not in ('admin', 'almacenista'):
            raise PermissionDenied('No tiene permisos para generar reportes.')

        format = request.query_params.get('type', 'pdf')
        if format not in ('pdf', 'excel'):
            return Response({'detail': 'Formato inválido. Use pdf o excel.'}, status=status.HTTP_400_BAD_REQUEST)

        only_critical = request.query_params.get('critical', 'false').lower() == 'true'
        only_herramientas = request.query_params.get('kind', '').lower() == 'herramienta'

        items = list(self.get_queryset())
        if only_critical:
            items = [i for i in items if i.is_critical]
        if only_herramientas:
            items = [i for i in items if i.kind == 'herramienta']

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

        if only_critical:
            title = 'Reporte de Stock Crítico'
        elif only_herramientas:
            title = 'Reporte de Herramientas / Instrumentos'
        else:
            title = 'Reporte de Inventario'

        buffer = build_report(title, headers, rows, format)
        content_type = 'application/pdf' if format == 'pdf' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'pdf' if format == 'pdf' else 'xlsx'
        suffix = 'critico' if only_critical else ('herramientas' if only_herramientas else 'completo')
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"inventario_{suffix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{extension}",
            content_type=content_type,
        )

    @action(detail=False, methods=['get'])
    def critical(self, request):
        items = [item for item in self.get_queryset() if item.is_critical]
        serializer = ItemListSerializer(items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_unit(self, request, pk=None):
        """Agrega una unidad física (serial) a un item con track_by_serial=True."""
        item = self.get_object()
        if not item.track_by_serial:
            return Response(
                {'detail': 'Este item no está configurado para rastrear por serial. Active track_by_serial primero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serial_number = request.data.get('serial_number', '').strip()
        if not serial_number:
            return Response(
                {'serial_number': 'Requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if ItemUnit.objects.filter(item=item, serial_number=serial_number).exists():
            return Response(
                {'serial_number': f'Ya existe una unidad con este serial para {item.name}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        unit = ItemUnit.objects.create(item=item, serial_number=serial_number)
        return Response(ItemUnitSerializer(unit).data, status=status.HTTP_201_CREATED)


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
        with transaction.atomic():
            item = Item.objects.select_for_update().get(pk=serializer.validated_data['item'].pk)
            movement = serializer.save()

            if movement.movement_type == StockMovement.MovementType.ENTRY:
                item.quantity += movement.quantity
            elif movement.movement_type == StockMovement.MovementType.EXIT:
                if item.quantity < movement.quantity:
                    from rest_framework.exceptions import ValidationError
                    raise ValidationError('Stock insuficiente para registrar la salida.')
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
        if request.user.role not in ('admin', 'almacenista'):
            return Response(
                {'detail': 'No tiene permisos para aprobar traslados.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        with transaction.atomic():
            item = Item.objects.select_for_update().get(pk=transfer.item.pk)
            transfer.status = Transfer.Status.COMPLETADA
            transfer.approved_by = request.user
            transfer.completed_at = timezone.now()
            item.location = transfer.destination_location
            item.save(update_fields=['location'])
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
        if request.user.role not in ('admin', 'almacenista'):
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


class ItemUnitFilter(FilterSet):
    item = NumberFilter(field_name='item__id')
    status = django_filters.CharFilter(field_name='status')

    class Meta:
        model = ItemUnit
        fields = ['item', 'status']


class ItemUnitViewSet(viewsets.ModelViewSet):
    """Unidades físicas (con serial) de items con track_by_serial=True (típicamente herramientas)."""
    queryset = ItemUnit.objects.select_related('item').all()
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ItemUnitFilter

    def get_serializer_class(self):
        if self.action in ('create', 'update', 'partial_update'):
            return ItemUnitCreateSerializer
        return ItemUnitSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        overdue = self.request.query_params.get('overdue')
        if overdue == 'true':
            queryset = queryset.filter(status=ItemUnit.Status.ASIGNADO, loans__returned_at__isnull=True).distinct()
        return queryset

    def perform_destroy(self, instance):
        if instance.status == ItemUnit.Status.ASIGNADO:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('No se puede eliminar una unidad actualmente prestada. Devuélvala primero.')
        if instance.status != ItemUnit.Status.DISPOSED:
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Solo se pueden eliminar unidades dadas de baja.')
        instance.delete()

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """Cambia el estado de una unidad manualmente (Disponible / En Reparación / Descargado)."""
        unit = self.get_object()
        new_status = request.data.get('status')
        reason = request.data.get('reason', '').strip()

        valid = {ItemUnit.Status.AVAILABLE, ItemUnit.Status.MAINTENANCE, ItemUnit.Status.DISPOSED}
        if new_status not in valid:
            return Response(
                {'detail': f'Estado inválido. Use uno de: {sorted(valid)}.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if unit.status == ItemUnit.Status.ASIGNADO:
            return Response(
                {'detail': 'No se puede cambiar el estado de una unidad actualmente asignada. Devuélvala primero.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            if new_status == ItemUnit.Status.DISPOSED:
                unit.status = ItemUnit.Status.DISPOSED
                unit.disposed_at = timezone.now()
                unit.disposal_reason = reason
                unit.save()
            elif new_status == ItemUnit.Status.MAINTENANCE:
                unit.status = ItemUnit.Status.MAINTENANCE
                unit.save()
            else:
                unit.status = ItemUnit.Status.AVAILABLE
                unit.save()

        return Response(ItemUnitSerializer(unit).data)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Recibe la devolución de una unidad prestada.

        Cierra el ItemLoan activo, marca returned_at, libera la unidad
        y opcionalmente cambia su estado final.

        Body:
        {
            "final_status": "available" | "maintenance" | "disposed" (default: available),
            "notes": "Motivo si va a maintenance/disposed"
        }
        """
        from datetime import timedelta

        unit = self.get_object()
        if unit.status != ItemUnit.Status.ASIGNADO:
            return Response(
                {'detail': 'La unidad no está asignada, no hay nada que recibir.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            loan = ItemLoan.objects.select_for_update().get(
                item_unit=unit, returned_at__isnull=True
            )
        except ItemLoan.DoesNotExist:
            return Response(
                {'detail': 'No hay préstamo activo para esta unidad.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        final_status = request.data.get('final_status', ItemUnit.Status.AVAILABLE)
        if final_status not in (ItemUnit.Status.AVAILABLE, ItemUnit.Status.MAINTENANCE, ItemUnit.Status.DISPOSED):
            return Response(
                {'detail': f'Estado final inválido. Use uno de: available, maintenance, disposed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        notes = (request.data.get('notes') or '').strip()

        with transaction.atomic():
            loan.returned_at = timezone.now()
            loan.returned_to = request.user
            if notes:
                prefix = loan.notes + '\n' if loan.notes else ''
                loan.notes = f"{prefix}Devolución: {notes}"
            loan.save()

            if final_status == ItemUnit.Status.AVAILABLE:
                unit.return_to_stock()
            elif final_status == ItemUnit.Status.MAINTENANCE:
                unit.status = ItemUnit.Status.MAINTENANCE
                unit.save()
            else:
                unit.status = ItemUnit.Status.DISPOSED
                unit.disposed_at = timezone.now()
                unit.disposal_reason = notes
                unit.save()

        return Response(ItemUnitSerializer(unit).data)


class ItemLoanViewSet(viewsets.ModelViewSet):
    """Préstamos de unidades físicas (ItemUnit) a un solicitante o usuario del taller."""
    queryset = ItemLoan.objects.select_related(
        'item_unit', 'item_unit__item', 'loaned_to', 'loaned_to_user', 'loaned_by', 'returned_to',
    ).all()
    serializer_class = ItemLoanSerializer
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['item_unit', 'loaned_to', 'loaned_to_user', 'loaned_by']

    def get_queryset(self):
        queryset = super().get_queryset()
        returned = self.request.query_params.get('returned_at')
        if returned == 'null':
            queryset = queryset.filter(returned_at__isnull=True)
        overdue = self.request.query_params.get('overdue')
        if overdue == 'true':
            queryset = queryset.filter(returned_at__isnull=True, expected_return_at__lt=timezone.now())
        return queryset

    def perform_create(self, serializer):
        serializer.save(loaned_by=self.request.user)

    @action(detail=True, methods=['post'])
    def return_unit(self, request, pk=None):
        loan = self.get_object()
        if loan.returned_at:
            return Response(
                {'detail': 'Esta unidad ya fue devuelta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            loan.return_unit(user=request.user)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(self.get_serializer(loan).data)

    @action(detail=True, methods=['post'])
    def extend(self, request, pk=None):
        """Extiende la fecha de devolución esperada por N días."""
        from datetime import timedelta

        loan = self.get_object()
        if loan.returned_at:
            return Response(
                {'detail': 'El préstamo ya fue devuelto.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            days = int(request.data.get('days', 0))
        except (TypeError, ValueError):
            return Response({'detail': 'Días inválidos.'}, status=status.HTTP_400_BAD_REQUEST)
        if days < 1 or days > 365:
            return Response(
                {'detail': 'Debe indicar entre 1 y 365 días.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        loan.expected_return_at = loan.expected_return_at + timedelta(days=days)
        loan.save()
        return Response(self.get_serializer(loan).data)

    @action(detail=False, methods=['get'])
    def report(self, request):
        """Reporte de asignaciones en PDF o Excel.

        Query params:
        - type: pdf|excel (default: pdf)
        - status: active|all (default: active). active = no devueltos; all = histórico
        - overdue: true|false (default: false). Filtra solo vencidos.
        """
        from datetime import datetime as dt
        from rest_framework.exceptions import PermissionDenied

        if request.user.role not in ('admin', 'almacenista'):
            raise PermissionDenied('No tiene permisos para generar reportes.')

        fmt = request.query_params.get('type', 'pdf')
        if fmt not in ('pdf', 'excel'):
            return Response(
                {'detail': 'Formato inválido. Use pdf o excel.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        status_filter = request.query_params.get('status', 'active')
        only_overdue = request.query_params.get('overdue', 'false').lower() == 'true'

        loans = self.get_queryset()
        if status_filter == 'active':
            loans = loans.filter(returned_at__isnull=True)
        if only_overdue:
            loans = loans.filter(returned_at__isnull=True, expected_return_at__lt=timezone.now())

        loans = loans.order_by('-loaned_at')

        headers = [
            'ID', 'Item', 'Serial', 'Asignado a', 'Prestado por',
            'Fecha préstamo', 'Devolución esperada', 'Devuelto en', 'Estado',
        ]
        rows = []
        for l in loans:
            recipient = l.loaned_to.name if l.loaned_to else (
                l.loaned_to_user.name if l.loaned_to_user else '—'
            )
            if l.returned_at:
                estado = 'Devuelto'
            elif l.is_overdue():
                estado = 'VENCIDO'
            else:
                estado = 'Vigente'
            rows.append([
                l.id,
                l.item_unit.item.name,
                l.item_unit.serial_number,
                recipient,
                l.loaned_by.name,
                l.loaned_at.strftime('%d/%m/%Y'),
                l.expected_return_at.strftime('%d/%m/%Y'),
                l.returned_at.strftime('%d/%m/%Y') if l.returned_at else '—',
                estado,
            ])

        title_suffix = ''
        if status_filter == 'active':
            title_suffix = ' (Activos)'
            if only_overdue:
                title_suffix = ' (Vencidos)'
        else:
            title_suffix = ' (Histórico)'

        buffer = build_report(
            'Reporte de Asignaciones' + title_suffix, headers, rows, fmt
        )
        content_type = (
            'application/pdf' if fmt == 'pdf'
            else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        extension = 'pdf' if fmt == 'pdf' else 'xlsx'
        ts = dt.now().strftime('%Y%m%d_%H%M%S')
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"asignaciones_{ts}.{extension}",
            content_type=content_type,
        )
