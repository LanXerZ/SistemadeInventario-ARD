from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Despacho, LineaDespacho, Solicitante

User = get_user_model()


class SolicitanteSerializer(serializers.ModelSerializer):
    unit_name = serializers.CharField(source='unit.name', read_only=True, default=None)
    unit_type = serializers.CharField(source='unit.get_location_type_display', read_only=True, default=None)
    full_name = serializers.CharField(read_only=True)
    despachos_count = serializers.SerializerMethodField()

    class Meta:
        model = Solicitante
        fields = [
            'id', 'name', 'rank', 'unit', 'unit_name', 'unit_type',
            'agent_id', 'notes', 'is_active', 'full_name',
            'despachos_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_despachos_count(self, obj):
        return obj.despachos.count()


class SolicitanteSimpleSerializer(serializers.ModelSerializer):
    """Serializer ligero para autocomplete (retorna id, name, rank, unit_name)."""

    class Meta:
        model = Solicitante
        fields = ['id', 'name', 'rank', 'unit', 'agent_id']


class LineaDespachoSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)
    item_kind = serializers.CharField(source='item.kind', read_only=True)
    item_unit_serial = serializers.CharField(source='item_unit.serial_number', read_only=True, default=None)

    class Meta:
        model = LineaDespacho
        fields = [
            'id', 'despacho', 'item', 'item_name', 'item_code', 'item_kind',
            'item_unit', 'item_unit_serial',
            'quantity', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at', 'despacho']


class DespachoListSerializer(serializers.ModelSerializer):
    solicitante_name = serializers.CharField(source='solicitante.name', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True, default=None)
    delivered_by_name = serializers.CharField(source='delivered_by.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lineas_count = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Despacho
        fields = [
            'id', 'ot_number', 'solicitante', 'solicitante_name',
            'unit', 'unit_name',
            'delivered_by', 'delivered_by_name',
            'status', 'status_display',
            'issued_at', 'cancelled_at',
            'equipment_reference', 'notes',
            'lineas_count', 'total_items',
        ]

    def get_lineas_count(self, obj):
        return obj.lineas.count()

    def get_total_items(self, obj):
        return sum(linea.quantity for linea in obj.lineas.all())


class DespachoDetailSerializer(serializers.ModelSerializer):
    solicitante_detail = SolicitanteSerializer(source='solicitante', read_only=True)
    unit_name = serializers.CharField(source='unit.name', read_only=True, default=None)
    delivered_by_name = serializers.CharField(source='delivered_by.name', read_only=True)
    cancelled_by_name = serializers.CharField(source='cancelled_by.name', read_only=True, default=None)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    lineas = LineaDespachoSerializer(many=True, read_only=True)
    lineas_count = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Despacho
        fields = [
            'id', 'ot_number',
            'solicitante', 'solicitante_detail',
            'unit', 'unit_name',
            'delivered_by', 'delivered_by_name',
            'status', 'status_display',
            'issued_at', 'cancelled_at', 'cancelled_by', 'cancelled_by_name', 'cancellation_reason',
            'equipment_reference', 'notes',
            'lineas', 'lineas_count', 'total_items',
        ]
        read_only_fields = [
            'id', 'ot_number', 'delivered_by', 'issued_at',
            'status', 'cancelled_at', 'cancelled_by', 'cancellation_reason',
        ]

    def get_lineas_count(self, obj):
        return obj.lineas.count()

    def get_total_items(self, obj):
        return sum(linea.quantity for linea in obj.lineas.all())


class DespachoCreateSerializer(serializers.ModelSerializer):
    """Serializer para creación de Despacho. No se usa directamente;
    la creación se hace via DispatchService.create() para atomicidad.
    """
    class Meta:
        model = Despacho
        fields = [
            'id', 'ot_number', 'solicitante', 'unit', 'equipment_reference', 'notes',
            'status', 'issued_at', 'delivered_by',
        ]
        read_only_fields = ['id', 'ot_number', 'status', 'issued_at', 'delivered_by']

    def validate(self, data):
        if not data.get('solicitante'):
            raise serializers.ValidationError({'solicitante': 'Requerido.'})
        return data
