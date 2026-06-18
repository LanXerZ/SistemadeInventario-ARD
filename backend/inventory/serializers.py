from rest_framework import serializers
from django.core.validators import FileExtensionValidator
from .models import Category, Location, Item, StockMovement, Transfer


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'abbreviation', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class LocationSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_location_type_display', read_only=True)
    breadcrumb = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = [
            'id', 'name', 'codigo', 'location_type', 'type_display', 'parent',
            'breadcrumb', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_breadcrumb(self, obj):
        return obj.get_breadcrumb()


class LocationSimpleSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_location_type_display', read_only=True)

    class Meta:
        model = Location
        fields = ['id', 'name', 'codigo', 'location_type', 'type_display']


class ItemListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)
    image_url = serializers.ImageField(source='image', read_only=True)
    location_display = serializers.SerializerMethodField()
    barcode_value = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'sku', 'part_number', 'marca', 'modelo', 'numero_serie',
            'category', 'category_name', 'application', 'location', 'location_display',
            'quantity', 'minimum_stock', 'unit',
            'image_url', 'is_active', 'is_critical', 'barcode_value',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'barcode_value']

    def get_location_display(self, obj):
        if obj.location:
            return obj.location.get_breadcrumb()
        return '—'

    def get_barcode_value(self, obj):
        return obj.code or f"ITEM-{obj.id:06d}"


class ItemDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)
    image_url = serializers.ImageField(source='image', read_only=True)
    location_display = serializers.SerializerMethodField()
    location_breadcrumb = serializers.SerializerMethodField()
    barcode_value = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'sku', 'part_number', 'marca', 'modelo', 'numero_serie',
            'category', 'category_name', 'description', 'application',
            'location', 'location_display', 'location_breadcrumb',
            'quantity', 'minimum_stock', 'unit', 'image', 'image_url',
            'is_active', 'is_critical', 'barcode_value',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'quantity', 'created_at', 'updated_at', 'barcode_value']
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
