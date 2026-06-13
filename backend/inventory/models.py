from django.db import models
from django.core.validators import MinValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'categoría'
        verbose_name_plural = 'categorías'
        ordering = ['name']

    def __str__(self):
        return self.name


class Item(models.Model):
    class DocumentType(models.TextChoices):
        OFICIO = 'oficio', 'Oficio'
        CONDUCE = 'conduce', 'Conduce'
        FACTURA = 'factura', 'Factura'
        DIRECTO = 'directo', 'Directo'

    name = models.CharField(max_length=200)
    sku = models.CharField(max_length=100, unique=True, blank=True, null=True)
    part_number = models.CharField(max_length=100, blank=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name='items',
    )
    description = models.TextField(blank=True)
    application = models.CharField(
        max_length=255,
        blank=True,
        help_text='Equipo o sistema donde se aplica (e.g., Radar AN/SPS-67)',
    )
    location = models.CharField(
        max_length=100,
        help_text='Ubicación usando nomenclatura militar (e.g., E-01-A-03)',
    )
    quantity = models.PositiveIntegerField(default=0, validators=[MinValueValidator(0)])
    minimum_stock = models.PositiveIntegerField(default=0)
    unit = models.CharField(max_length=50, default='unidad')
    image = models.ImageField(upload_to='items/%Y/%m/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'artículo'
        verbose_name_plural = 'artículos'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.sku or self.part_number or 'sin código'})"

    @property
    def is_critical(self):
        return self.minimum_stock > 0 and self.quantity <= self.minimum_stock


class StockMovement(models.Model):
    class MovementType(models.TextChoices):
        ENTRY = 'entry', 'Entrada'
        EXIT = 'exit', 'Salida'

    class DocumentType(models.TextChoices):
        OFICIO = 'oficio', 'Oficio'
        CONDUCE = 'conduce', 'Conduce'
        FACTURA = 'factura', 'Factura'
        DIRECTO = 'directo', 'Directo'

    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name='movements',
    )
    movement_type = models.CharField(max_length=10, choices=MovementType.choices)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    document_type = models.CharField(
        max_length=20,
        choices=DocumentType.choices,
        blank=True,
        help_text='Tipo de documento que respalda el movimiento',
    )
    document_number = models.CharField(
        max_length=100,
        blank=True,
        help_text='Número de oficio, conduce o factura',
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'movimiento de stock'
        verbose_name_plural = 'movimientos de stock'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_movement_type_display()} {self.quantity} x {self.item.name}"
