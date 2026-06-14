from django.db.models import Count, F as models_F, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from inventory.models import Item
from tools.models import Tool
from workorders.models import WorkOrder, WorkOrderPart


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user

    total_items = Item.objects.count()
    critical_items = Item.objects.filter(quantity__lte=models_F('minimum_stock')).count()

    work_orders_qs = WorkOrder.objects.all()
    if user.role == 'tecnico':
        work_orders_qs = work_orders_qs.filter(technician=user)

    status_qs = work_orders_qs.values('status').annotate(count=Count('id')).values('status', 'count')
    work_order_status = {entry['status']: entry['count'] for entry in status_qs}
    all_statuses = dict(WorkOrder.Status.choices)
    status_counts = {label: work_order_status.get(code, 0) for code, label in all_statuses.items()}

    total_work_orders = work_orders_qs.count()
    pending_parts = WorkOrderPart.objects.filter(status=WorkOrderPart.Status.REQUESTED)
    if user.role == 'tecnico':
        pending_parts = pending_parts.filter(work_order__technician=user)
    pending_parts_count = pending_parts.count()

    total_tools = Tool.objects.count()
    loaned_tools = Tool.objects.filter(status=Tool.Status.LOANED).count()
    overdue_tools = sum(1 for tool in Tool.objects.all() if tool.is_overdue())
    disposed_tools = Tool.objects.filter(status=Tool.Status.DISPOSED).count()

    recent_work_orders = work_orders_qs.order_by('-received_at')[:5]
    recent_items = [
        {
            'id': wo.id,
            'ot_number': wo.ot_number,
            'origin_unit': wo.origin_unit,
            'status': wo.get_status_display(),
            'received_at': wo.received_at,
        }
        for wo in recent_work_orders
    ]

    return Response({
        'inventory': {
            'total_items': total_items,
            'critical_items': critical_items,
        },
        'work_orders': {
            'total': total_work_orders,
            'status_counts': status_counts,
            'pending_parts': pending_parts_count,
            'recent': recent_items,
        },
        'tools': {
            'total': total_tools,
            'loaned': loaned_tools,
            'overdue': overdue_tools,
            'disposed': disposed_tools,
        },
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'})
