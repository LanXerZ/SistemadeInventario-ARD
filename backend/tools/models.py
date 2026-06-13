from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Tool(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Disponible'
        LOANED = 'loaned', 'Prestado'
        DISPOSED = 'disposed', 'Dado de baja'

    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    tool_type = models.CharField(max_length=100, verbose_name='tipo')
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    serial = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    disposal_reason = models.TextField(
        blank=True,
        verbose_name='motivo de baja',
    )
    disposal_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='fecha de baja',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'herramienta'
        verbose_name_plural = 'herramientas'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"

    def is_overdue(self):
        if self.status != self.Status.LOANED:
            return False
        active_loan = self.loans.filter(returned_at__isnull=True).first()
        if not active_loan:
            return False
        return active_loan.is_overdue()


class ToolLoan(models.Model):
    tool = models.ForeignKey(
        Tool,
        on_delete=models.PROTECT,
        related_name='loans',
    )
    technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='tool_loans',
        limit_choices_to={'role': 'tecnico'},
        verbose_name='técnico',
    )
    loaned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='approved_tool_loans',
        verbose_name='prestado por',
    )
    loaned_at = models.DateTimeField(auto_now_add=True)
    expected_return_at = models.DateTimeField(
        verbose_name='devolución esperada',
    )
    returned_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name='devuelto en',
    )
    returned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='received_tool_returns',
        blank=True,
        null=True,
        verbose_name='recibido por',
    )
    notes = models.TextField(blank=True)

    class Meta:
        verbose_name = 'préstamo de herramienta'
        verbose_name_plural = 'préstamos de herramientas'
        ordering = ['-loaned_at']

    def __str__(self):
        return f"{self.tool.name} → {self.technician.name}"

    def is_overdue(self):
        if self.returned_at:
            return False
        return timezone.now() > self.expected_return_at

    def return_tool(self, user):
        if self.returned_at:
            raise ValueError('Esta herramienta ya fue devuelta.')
        self.returned_at = timezone.now()
        self.returned_to = user
        self.save()
        self.tool.status = Tool.Status.AVAILABLE
        self.tool.save()

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.tool.status = Tool.Status.LOANED
            self.tool.save()
