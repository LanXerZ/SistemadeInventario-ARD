from rest_framework import serializers
from django.core.validators import FileExtensionValidator
from .models import Category, Location, LocationType, Item, StockMovement, Transfer, ItemUnit, ItemLoan


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'abbreviation', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class LocationTypeSerializer(serializers.ModelSerializer):
    locations_count = serializers.SerializerMethodField()

    class Meta:
        model = LocationType
        fields = ['id', 'code', 'name', 'description', 'is_active', 'locations_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at', 'locations_count']

    def get_locations_count(self, obj):
        return obj.locations.count()


class LocationTypeSimpleSerializer(serializers.ModelSerializer):
    """Serializer ligero para autocomplete."""

    class Meta:
        model = LocationType
        fields = ['id', 'code', 'name']


class LocationSerializer(serializers.ModelSerializer):
    location_type_detail = LocationTypeSimpleSerializer(source='location_type', read_only=True)
    type_display = serializers.CharField(source='location_type.name', read_only=True, default=None)
    type_code = serializers.CharField(source='location_type.code', read_only=True, default=None)
    breadcrumb = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            'id', 'name', 'codigo', 'location_type', 'location_type_detail',
            'type_display', 'type_code', 'parent', 'breadcrumb',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_breadcrumb(self, obj):
        return obj.get_breadcrumb()


class LocationSimpleSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='location_type.name', read_only=True, default=None)

    class Meta:
        model = Location
        fields = ['id', 'name', 'codigo', 'location_type', 'type_display']


class ItemUnitSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.SerializerMethodField()
    active_loan = serializers.SerializerMethodField()

    class Meta:
        model = ItemUnit
        fields = [
            'id', 'item', 'item_name', 'item_code',
            'serial_number', 'status', 'status_display',
            'notes', 'acquired_at', 'disposed_at', 'disposal_reason',
            'is_overdue', 'active_loan',
        ]
        read_only_fields = ['id', 'acquired_at', 'disposed_at']

    def get_is_overdue(self, obj):
        active = obj.loans.filter(returned_at__isnull=True).first()
        return bool(active and active.is_overdue())

    def get_active_loan(self, obj):
        active = obj.loans.filter(returned_at__isnull=True).first()
        if not active:
            return None
        recipient = None
        if active.loaned_to:
            recipient = {'type': 'solicitante', 'id': active.loaned_to.id, 'name': active.loaned_to.name}
        elif active.loaned_to_user:
            recipient = {'type': 'user', 'id': active.loaned_to_user.id, 'name': active.loaned_to_user.name}
        return {
            'id': active.id,
            'recipient': recipient,
            'loaned_at': active.loaned_at,
            'expected_return_at': active.expected_return_at,
            'is_overdue': active.is_overdue(),
        }


class ItemUnitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemUnit
        fields = ['id', 'item', 'serial_number', 'notes']
        read_only_fields = ['id']

    def validate(self, data):
        item = data.get('item')
        if not item.track_by_serial:
            raise serializers.ValidationError(
                f'El item {item.name} no está configurado para rastrear por serial. Active track_by_serial primero.'
            )
        if ItemUnit.objects.filter(item=item, serial_number=data['serial_number']).exists():
            raise serializers.ValidationError(
                f'Ya existe una unidad con el serial {data["serial_number"]} para este item.'
            )
        return data


class ItemLoanSerializer(serializers.ModelSerializer):
    item_unit_detail = ItemUnitSerializer(source='item_unit', read_only=True)
    loaned_to_name = serializers.SerializerMethodField()
    loaned_by_name = serializers.CharField(source='loaned_by.name', read_only=True)
    returned_to_name = serializers.CharField(source='returned_to.name', read_only=True, default=None)
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = ItemLoan
        fields = [
            'id', 'item_unit', 'item_unit_detail',
            'loaned_to', 'loaned_to_user', 'loaned_to_name',
            'loaned_by', 'loaned_by_name',
            'loaned_at', 'expected_return_at', 'returned_at', 'returned_to', 'returned_to_name',
            'notes', 'is_overdue',
        ]
        read_only_fields = [
            'id', 'loaned_by', 'loaned_at', 'returned_at', 'returned_to',
        ]

    def get_loaned_to_name(self, obj):
        if obj.loaned_to:
            return obj.loaned_to.name
        if obj.loaned_to_user:
            return obj.loaned_to_user.name
        return None

    def get_is_overdue(self, obj):
        return obj.is_overdue()

    def validate(self, data):
        item_unit = data.get('item_unit')
        if not item_unit:
            raise serializers.ValidationError({'item_unit': 'Requerido.'})
        if item_unit.status == 'disposed':
            raise serializers.ValidationError({'item_unit': 'No se puede prestar una unidad dada de baja.'})
        if item_unit.status == 'asignado':
            raise serializers.ValidationError({'item_unit': 'La unidad ya está asignada. Devuélvala antes de reasignar.'})
        if not data.get('loaned_to') and not data.get('loaned_to_user'):
            raise serializers.ValidationError(
                {'loaned_to': 'Debe especificar un solicitante o un usuario del sistema.'}
            )
        return data


class ItemListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)
    image_url = serializers.ImageField(source='image', read_only=True)
    location_display = serializers.SerializerMethodField()
    barcode_value = serializers.SerializerMethodField()
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)
    stock_available = serializers.IntegerField(read_only=True)
    stock_loaned = serializers.IntegerField(read_only=True)
    stock_asignado = serializers.IntegerField(read_only=True)
    units_count = serializers.SerializerMethodField()
    availability_state = serializers.SerializerMethodField()
    availability_state_display = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'sku', 'part_number', 'marca', 'modelo', 'numero_serie',
            'category', 'category_name', 'application', 'location', 'location_display',
            'kind', 'kind_display', 'track_by_serial',
            'quantity', 'minimum_stock', 'unit', 'stock_available', 'stock_loaned', 'stock_asignado',
            'availability_state', 'availability_state_display',
            'units_count',
            'image_url', 'is_active', 'is_critical', 'barcode_value',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'barcode_value', 'stock_available', 'stock_loaned', 'stock_asignado', 'availability_state', 'availability_state_display']

    def get_availability_state(self, obj):
        # Para herramientas, el estado de disponibilidad se mide por unidades (no automático).
        # Para consumibles, se calcula: ok | critico | asignado.
        if obj.track_by_serial:
            return None
        if obj.stock_asignado > 0:
            return 'asignado'
        if obj.is_critical:
            return 'critico'
        return 'ok'

    def get_availability_state_display(self, obj):
        state = self.get_availability_state(obj)
        if state is None:
            return None
        return {'ok': 'OK', 'critico': 'Crítico', 'asignado': 'Asignado'}.get(state, state)

    def get_location_display(self, obj):
        if obj.location:
            return obj.location.get_breadcrumb()
        return '—'

    def get_barcode_value(self, obj):
        return obj.code or f"ITEM-{obj.id:06d}"

    def get_units_count(self, obj):
        if not obj.track_by_serial:
            return 0
        return obj.units.count()


class ItemDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)
    image_url = serializers.ImageField(source='image', read_only=True)
    location_display = serializers.SerializerMethodField()
    location_breadcrumb = serializers.SerializerMethodField()
    barcode_value = serializers.SerializerMethodField()
    kind_display = serializers.CharField(source='get_kind_display', read_only=True)
    stock_available = serializers.IntegerField(read_only=True)
    stock_loaned = serializers.IntegerField(read_only=True)
    stock_asignado = serializers.IntegerField(read_only=True)
    units = ItemUnitSerializer(many=True, read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'sku', 'part_number', 'marca', 'modelo', 'numero_serie',
            'category', 'category_name', 'description', 'application',
            'location', 'location_display', 'location_breadcrumb',
            'kind', 'kind_display', 'track_by_serial',
            'quantity', 'minimum_stock', 'unit', 'stock_available', 'stock_loaned', 'stock_asignado',
            'units',
            'image', 'image_url',
            'is_active', 'is_critical', 'barcode_value',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'quantity', 'created_at', 'updated_at', 'barcode_value',
                            'stock_available', 'stock_loaned', 'stock_asignado', 'units']
        extra_kwargs = {
            'image': {'write_only': True, 'required': False},
        }

    def get_location_display(self, obj):
        if obj.location:
            return obj.location.name
        return None

    def get_location_breadcrumb(self, obj):
        if obj.location:
            return obj.location.get_breadcrumb()
        return None

    def get_barcode_value(self, obj):
        return obj.code or f"ITEM-{obj.id:06d}"

    def validate_image(self, value):
        if value:
            max_size = 2 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError('La imagen no debe superar los 2MB.')
        return value


class StockMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    document_file_url = serializers.FileField(source='document_file', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'item_name', 'movement_type', 'quantity',
            'document_type', 'document_number', 'document_file', 'document_file_url',
            'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'document_file': {'required': False},
        }

    def validate(self, data):
        item = data.get('item')
        movement_type = data.get('movement_type')
        quantity = data.get('quantity')

        if movement_type == StockMovement.MovementType.EXIT and item:
            if item.quantity < quantity:
                raise serializers.ValidationError(
                    'No hay suficiente stock disponible para esta salida.'
                )

        return data

    def validate_document_file(self, value):
        if value:
            max_size = 5 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError('El archivo no debe superar los 5MB.')
        return value


class TransferSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)
    origin_location_name = serializers.CharField(
        source='origin_location.name',
        read_only=True,
        default=None,
    )
    destination_location_name = serializers.CharField(
        source='destination_location.name',
        read_only=True,
    )
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True)
    approved_by_name = serializers.CharField(
        source='approved_by.name',
        read_only=True,
        default=None,
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Transfer
        fields = [
            'id', 'item', 'item_name', 'item_code',
            'origin_location', 'origin_location_name',
            'destination_location', 'destination_location_name',
            'quantity', 'requested_by', 'requested_by_name',
            'approved_by', 'approved_by_name',
            'status', 'status_display',
            'document_type', 'document_number', 'notes',
            'created_at', 'updated_at', 'completed_at',
        ]
        read_only_fields = [
            'id', 'requested_by', 'approved_by', 'status',
            'created_at', 'updated_at', 'completed_at',
        ]
