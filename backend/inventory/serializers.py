from rest_framework import serializers
from django.core.validators import FileExtensionValidator
from .models import Category, Location, Item, StockMovement


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
        fields = ['id', 'name', 'location_type', 'type_display', 'parent', 'breadcrumb', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_breadcrumb(self, obj):
        return obj.get_breadcrumb()


class ItemListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)
    image_url = serializers.ImageField(source='image', read_only=True)
    location_display = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'sku', 'part_number', 'category', 'category_name',
            'application', 'location', 'location_display',
            'quantity', 'minimum_stock', 'unit',
            'image_url', 'is_active', 'is_critical', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_location_display(self, obj):
        if obj.location:
            return obj.location.get_breadcrumb()
        return '—'


class ItemDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)
    image_url = serializers.ImageField(source='image', read_only=True)
    location_display = serializers.SerializerMethodField()
    location_breadcrumb = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'sku', 'part_number', 'category', 'category_name',
            'description', 'application', 'location', 'location_display', 'location_breadcrumb',
            'quantity', 'minimum_stock', 'unit', 'image', 'image_url', 'is_active', 'is_critical',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'quantity', 'created_at', 'updated_at']
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
