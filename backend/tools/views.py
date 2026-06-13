from django.db.models import Q, Prefetch
from django.http import FileResponse
from django.utils import timezone
from datetime import timedelta, datetime
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from utils.reports import build_report
from .models import Tool, ToolLoan
from .serializers import (
    ToolListSerializer,
    ToolDetailSerializer,
    ToolLoanSerializer,
    TechnicianSerializer,
)
from .permissions import IsAlmacenistaOrAdmin

User = get_user_model()


class ToolViewSet(viewsets.ModelViewSet):
    queryset = Tool.objects.prefetch_related(
        Prefetch('loans', queryset=ToolLoan.objects.order_by('-loaned_at'))
    ).all()
    permission_classes = [permissions.IsAuthenticated, IsAlmacenistaOrAdmin]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'tool_type']

    def get_serializer_class(self):
        if self.action == 'list':
            return ToolListSerializer
        return ToolDetailSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search')
        overdue = self.request.query_params.get('overdue')

        if search:
            queryset = queryset.filter(
                Q(code__icontains=search)
                | Q(name__icontains=search)
                | Q(brand__icontains=search)
                | Q(model__icontains=search)
                | Q(serial__icontains=search)
            )

        if overdue is not None:
            if overdue.lower() in ('true', '1'):
                queryset = [tool for tool in queryset if tool.is_overdue()]
            elif overdue.lower() in ('false', '0'):
                queryset = [tool for tool in queryset if not tool.is_overdue()]

        return queryset

    @action(detail=True, methods=['post'])
    def loan(self, request, pk=None):
        tool = self.get_object()
        if tool.status != Tool.Status.AVAILABLE:
            return Response(
                {'detail': 'La herramienta no está disponible para préstamo.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        technician_id = request.data.get('technician')
        expected_return_days = request.data.get('expected_return_days', 1)
        notes = request.data.get('notes', '')

        try:
            technician = User.objects.get(pk=technician_id, role='tecnico', is_active=True)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Técnico no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        loan = ToolLoan.objects.create(
            tool=tool,
            technician=technician,
            loaned_by=request.user,
            expected_return_at=timezone.now() + timedelta(days=int(expected_return_days)),
            notes=notes,
        )
        serializer = ToolLoanSerializer(loan)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def return_tool(self, request, pk=None):
        tool = self.get_object()
        active_loan = tool.loans.filter(returned_at__isnull=True).first()

        if not active_loan:
            return Response(
                {'detail': 'No hay préstamo activo para esta herramienta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            active_loan.return_tool(request.user)
            serializer = ToolLoanSerializer(active_loan)
            return Response(serializer.data)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def dispose(self, request, pk=None):
        tool = self.get_object()
        reason = request.data.get('reason', '')

        if tool.status == Tool.Status.LOANED:
            return Response(
                {'detail': 'No se puede dar de baja una herramienta prestada.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tool.status = Tool.Status.DISPOSED
        tool.disposal_reason = reason
        tool.disposal_date = timezone.now()
        tool.save()

        serializer = ToolDetailSerializer(tool)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        tools = [tool for tool in self.get_queryset() if tool.is_overdue()]
        serializer = ToolListSerializer(tools, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def report(self, request):
        format = request.query_params.get('format', 'pdf')
        if format not in ('pdf', 'excel'):
            return Response({'detail': 'Formato inválido. Use pdf o excel.'}, status=status.HTTP_400_BAD_REQUEST)

        tools = self.get_queryset()
        headers = ['Código', 'Nombre', 'Tipo', 'Marca', 'Modelo', 'Serial', 'Estado']
        rows = [
            [
                tool.code,
                tool.name,
                tool.tool_type,
                tool.brand or '—',
                tool.model or '—',
                tool.serial or '—',
                tool.get_status_display(),
            ]
            for tool in tools
        ]

        buffer = build_report('Reporte de Herramientas', headers, rows, format)
        content_type = 'application/pdf' if format == 'pdf' else 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        extension = 'pdf' if format == 'pdf' else 'xlsx'
        return FileResponse(
            buffer,
            as_attachment=True,
            filename=f"herramientas_{datetime.now().strftime('%Y%m%d_%H%M%S')}.{extension}",
            content_type=content_type,
        )


class ToolLoanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ToolLoan.objects.select_related('tool', 'technician', 'loaned_by', 'returned_to').all()
    serializer_class = ToolLoanSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tool', 'technician', 'returned_at']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == 'tecnico':
            queryset = queryset.filter(technician=user)
        return queryset


class TechnicianViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.filter(role='tecnico', is_active=True)
    serializer_class = TechnicianSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None
