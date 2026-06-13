from rest_framework import serializers
from .models import Category, Item, StockMovement


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class ItemListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'sku', 'part_number', 'category', 'category_name',
            'application', 'location', 'quantity', 'minimum_stock', 'unit',
            'is_active', 'is_critical', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ItemDetailSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_critical = serializers.BooleanField(read_only=True)

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'sku', 'part_number', 'category', 'category_name',
            'description', 'application', 'location', 'quantity',
            'minimum_stock', 'unit', 'is_active', 'is_critical',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'quantity', 'created_at', 'updated_at']


class StockMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'item_name', 'movement_type', 'quantity',
            'document_type', 'document_number', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

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
