from django.db.models import Q
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import WorkOrder, WorkOrderPart
from inventory.models import Item
from .serializers import (
    WorkOrderListSerializer,
    WorkOrderDetailSerializer,
    WorkOrderPartSerializer,
    TechnicianSerializer,
)
from .permissions import IsAlmacenistaOrAdmin, IsAssignedTechnicianOrAdmin


class WorkOrderViewSet(viewsets.ModelViewSet):
    queryset = WorkOrder.objects.select_related('technician', 'created_by').prefetch_related('parts').all()
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin, IsAssignedTechnicianOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'technician']

    def get_serializer_class(self):
        if self.action == 'list':
            return WorkOrderListSerializer
        return WorkOrderDetailSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == 'tecnico':
            queryset = queryset.filter(technician=user)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(ot_number__icontains=search)
                | Q(origin_unit__icontains=search)
                | Q(equipment_brand__icontains=search)
                | Q(equipment_model__icontains=search)
                | Q(equipment_serial__icontains=search)
            )

        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def request_part(self, request, pk=None):
        work_order = self.get_object()
        item_id = request.data.get('item')
        quantity = request.data.get('quantity', 1)
        notes = request.data.get('notes', '')

        try:
            item = Item.objects.get(pk=item_id)
        except Item.DoesNotExist:
            return Response({'detail': 'Artículo no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        part = WorkOrderPart.objects.create(
            work_order=work_order,
            item=item,
            quantity_requested=quantity,
            requested_by=request.user,
            notes=notes,
        )
        serializer = WorkOrderPartSerializer(part)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve_part(self, request, pk=None):
        work_order = self.get_object()
        part_id = request.data.get('part_id')
        quantity = request.data.get('quantity')

        try:
            part = work_order.parts.get(pk=part_id)
            part.approve(request.user, quantity)
            serializer = WorkOrderPartSerializer(part)
            return Response(serializer.data)
        except WorkOrderPart.DoesNotExist:
            return Response({'detail': 'Repuesto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject_part(self, request, pk=None):
        work_order = self.get_object()
        part_id = request.data.get('part_id')

        try:
            part = work_order.parts.get(pk=part_id)
            part.reject(request.user)
            serializer = WorkOrderPartSerializer(part)
            return Response(serializer.data)
        except WorkOrderPart.DoesNotExist:
            return Response({'detail': 'Repuesto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def use_part(self, request, pk=None):
        work_order = self.get_object()
        part_id = request.data.get('part_id')

        try:
            part = work_order.parts.get(pk=part_id)
            part.mark_used()
            serializer = WorkOrderPartSerializer(part)
            return Response(serializer.data)
        except WorkOrderPart.DoesNotExist:
            return Response({'detail': 'Repuesto no encontrado.'}, status=status.HTTP_404_NOT_FOUND)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        work_order = self.get_object()
        diagnosis = request.data.get('diagnosis', '')
        replaced_parts_note = request.data.get('replaced_parts_note', '')

        work_order.diagnosis = diagnosis
        work_order.replaced_parts_note = replaced_parts_note
        work_order.status = WorkOrder.Status.READY
        work_order.completed_at = timezone.now()
        work_order.save()

        serializer = WorkOrderDetailSerializer(work_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def deliver(self, request, pk=None):
        work_order = self.get_object()

        work_order.status = WorkOrder.Status.DELIVERED
        work_order.delivered_at = timezone.now()
        work_order.save()

        serializer = WorkOrderDetailSerializer(work_order)
        return Response(serializer.data)


class TechnicianViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = get_user_model().objects.filter(role='tecnico', is_active=True)
    serializer_class = TechnicianSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
