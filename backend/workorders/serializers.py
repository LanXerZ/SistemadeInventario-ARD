from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import WorkOrder, WorkOrderPart

User = get_user_model()


class TechnicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']


class WorkOrderPartSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.name', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True)

    class Meta:
        model = WorkOrderPart
        fields = [
            'id', 'work_order', 'item', 'item_name', 'item_sku',
            'quantity_requested', 'quantity_approved', 'status',
            'requested_by', 'requested_by_name', 'approved_by', 'approved_by_name',
            'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'requested_by', 'approved_by']


class WorkOrderListSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = WorkOrder
        fields = [
            'id', 'ot_number', 'origin_unit', 'equipment_brand',
            'equipment_model', 'technician', 'technician_name',
            'status', 'status_display', 'received_at',
        ]


class WorkOrderDetailSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    parts = WorkOrderPartSerializer(many=True, read_only=True)

    class Meta:
        model = WorkOrder
        fields = [
            'id', 'ot_number', 'origin_unit', 'delivery_officer_name',
            'delivery_officer_rank', 'equipment_brand', 'equipment_model',
            'equipment_serial', 'equipment_description', 'reported_failure',
            'diagnosis', 'replaced_parts_note', 'technician', 'technician_name',
            'status', 'status_display', 'received_at', 'started_at',
            'completed_at', 'delivered_at', 'delivery_receipt_printed_at',
            'created_by', 'created_by_name', 'parts',
        ]
        read_only_fields = [
            'id', 'ot_number', 'received_at', 'created_by',
            'delivery_receipt_printed_at',
        ]
