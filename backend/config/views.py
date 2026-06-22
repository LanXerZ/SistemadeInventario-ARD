from django.db.models import Count, F as models_F, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from inventory.models import Item, ItemUnit, ItemLoan
from workorders.models import Despacho, LineaDespacho


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user

    total_items = Item.objects.count()
    critical_items = sum(1 for item in Item.objects.all() if item.is_critical)
    herramienta_items = Item.objects.filter(kind='herramienta').count()
    consumible_items = Item.objects.filter(kind='consumible').count()

    despachos_qs = Despacho.objects.all()

    status_qs = despachos_qs.values('status').annotate(count=Count('id')).values('status', 'count')
    despacho_status = {entry['status']: entry['count'] for entry in status_qs}
    all_statuses = dict(Despacho.Status.choices)
    status_counts = {label: despacho_status.get(code, 0) for code, label in all_statuses.items()}

    total_despachos = despachos_qs.count()

    total_units = ItemUnit.objects.count()
    asignado_units = ItemUnit.objects.filter(status=ItemUnit.Status.ASIGNADO).count()
    available_units = ItemUnit.objects.filter(status=ItemUnit.Status.AVAILABLE).count()
    disposed_units = ItemUnit.objects.filter(status=ItemUnit.Status.DISPOSED).count()
    overdue_units = ItemLoan.objects.filter(
        returned_at__isnull=True,
        expected_return_at__lt=timezone.now(),
    ).count()

    recent_despachos = despachos_qs.order_by('-issued_at')[:5]
    recent_items = [
        {
            'id': d.id,
            'ot_number': d.ot_number,
            'solicitante': d.solicitante.name,
            'status': d.get_status_display(),
            'issued_at': d.issued_at,
        }
        for d in recent_despachos
    ]

    return Response({
        'inventory': {
            'total_items': total_items,
            'consumible_items': consumible_items,
            'herramienta_items': herramienta_items,
            'critical_items': critical_items,
        },
        'work_orders': {
            'total': total_despachos,
            'status_counts': status_counts,
            'recent': recent_items,
        },
        'tools': {
            'total_units': total_units,
            'available': available_units,
            'asignado': asignado_units,
            'overdue': overdue_units,
            'disposed': disposed_units,
        },
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok'})
