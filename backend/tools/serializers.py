from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tool, ToolLoan

User = get_user_model()


class TechnicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']


class ToolLoanSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    loaned_by_name = serializers.CharField(source='loaned_by.name', read_only=True)
    returned_to_name = serializers.CharField(source='returned_to.name', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = ToolLoan
        fields = [
            'id', 'tool', 'technician', 'technician_name', 'loaned_by', 'loaned_by_name',
            'loaned_at', 'expected_return_at', 'returned_at', 'returned_to', 'returned_to_name',
            'notes', 'is_overdue',
        ]
        read_only_fields = ['id', 'loaned_at', 'returned_at', 'loaned_by', 'returned_to']


class ToolListSerializer(serializers.ModelSerializer):
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Tool
        fields = [
            'id', 'code', 'name', 'tool_type', 'brand', 'model',
            'status', 'is_overdue', 'created_at',
        ]


class ToolDetailSerializer(serializers.ModelSerializer):
    loans = ToolLoanSerializer(many=True, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Tool
        fields = [
            'id', 'code', 'name', 'tool_type', 'brand', 'model', 'serial',
            'description', 'status', 'disposal_reason', 'disposal_date',
            'is_overdue', 'loans', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_code(self, value):
        instance = self.instance
        if Tool.objects.filter(code=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError('Ya existe una herramienta con este código.')
        return value
