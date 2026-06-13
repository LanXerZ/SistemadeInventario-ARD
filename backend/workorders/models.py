from django.db import models
from django.conf import settings


class WorkOrder(models.Model):
    class Status(models.TextChoices):
        RECEIVED = 'received', 'Recibido'
        IN_DIAGNOSIS = 'in_diagnosis', 'En diagnóstico'
        WAITING_PARTS = 'waiting_parts', 'Esperando repuestos'
        IN_REPAIR = 'in_repair', 'En reparación'
        READY = 'ready', 'Listo para entregar'
        DELIVERED = 'delivered', 'Entregado'
        DISMISSED = 'dismissed', 'Dado de baja'

    ot_number = models.CharField(max_length=20, unique=True, editable=False)
    origin_unit = models.CharField(
        max_length=150,
        help_text='Unidad o buque de origen (e.g., BA-1101)',
    )
    delivery_officer_name = models.CharField(
        max_length=150,
        verbose_name='nombre del oficial que entrega',
    )
    delivery_officer_rank = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='grado del oficial que entrega',
    )
    equipment_brand = models.CharField(max_length=100, blank=True)
    equipment_model = models.CharField(max_length=100, blank=True)
    equipment_serial = models.CharField(max_length=100, blank=True)
    equipment_description = models.TextField(
        help_text='Descripción del equipo ingresado',
    )
    reported_failure = models.TextField(
        blank=True,
        help_text='Fallo reportado por la unidad',
    )
    diagnosis = models.TextField(
        blank=True,
        help_text='Diagnóstico técnico',
    )
    replaced_parts_note = models.TextField(
        blank=True,
        help_text='Resumen de repuestos reemplazados',
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='assigned_workorders',
        limit_choices_to={'role': 'tecnico'},
        verbose_name='técnico asignado',
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RECEIVED,
    )
    received_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(blank=True, null=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    delivered_at = models.DateTimeField(blank=True, null=True)
    delivery_receipt_printed_at = models.DateTimeField(blank=True, null=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_workorders',
    )

    class Meta:
        verbose_name = 'orden de trabajo'
        verbose_name_plural = 'órdenes de trabajo'
        ordering = ['-received_at']

    def __str__(self):
        return f"{self.ot_number} - {self.equipment_brand} {self.equipment_model}"

    def save(self, *args, **kwargs):
        if not self.ot_number:
            self.ot_number = self.generate_ot_number()
        super().save(*args, **kwargs)

    @classmethod
    def generate_ot_number(cls):
        from datetime import datetime
        year = datetime.now().year
        prefix = f"OT-{year}-"
        last = cls.objects.filter(ot_number__startswith=prefix).order_by('-ot_number').first()
        if last:
            last_sequence = int(last.ot_number.replace(prefix, ''))
            next_sequence = last_sequence + 1
        else:
            next_sequence = 1
        return f"{prefix}{next_sequence:05d}"


class WorkOrderPart(models.Model):
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Solicitado'
        APPROVED = 'approved', 'Aprobado'
        REJECTED = 'rejected', 'Rechazado'
        USED = 'used', 'Usado'

    work_order = models.ForeignKey(
        WorkOrder,
        on_delete=models.CASCADE,
        related_name='parts',
    )
    item = models.ForeignKey(
        'inventory.Item',
        on_delete=models.PROTECT,
        related_name='work_order_parts',
    )
    quantity_requested = models.PositiveIntegerField()
    quantity_approved = models.PositiveIntegerField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.REQUESTED,
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='requested_parts',
    )
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='approved_parts',
        blank=True,
        null=True,
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'repuesto de orden de trabajo'
        verbose_name_plural = 'repuestos de órdenes de trabajo'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.quantity_requested} x {self.item.name} para {self.work_order.ot_number}"

    def approve(self, user, quantity=None):
        if self.status != self.Status.REQUESTED:
            raise ValueError('Solo se pueden aprobar solicitudes pendientes.')
        self.status = self.Status.APPROVED
        self.quantity_approved = quantity or self.quantity_requested
        self.approved_by = user
        self.save()

    def reject(self, user):
        if self.status != self.Status.REQUESTED:
            raise ValueError('Solo se pueden rechazar solicitudes pendientes.')
        self.status = self.Status.REJECTED
        self.approved_by = user
        self.save()

    def mark_used(self):
        if self.status != self.Status.APPROVED:
            raise ValueError('Solo se pueden marcar como usadas las solicitudes aprobadas.')
        if self.item.quantity < self.quantity_approved:
            raise ValueError('No hay suficiente stock para consumir.')
        self.status = self.Status.USED
        self.item.quantity -= self.quantity_approved
        self.item.save()
        self.save()
