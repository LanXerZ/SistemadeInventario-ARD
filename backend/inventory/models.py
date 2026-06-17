from django.db import models
from django.core.validators import MinValueValidator


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    abbreviation = models.CharField(max_length=4, default='CAT', help_text='Abreviatura de 3-4 letras (e.g., COM, CON, SOL, FER)')
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'categoría'
        verbose_name_plural = 'categorías'
        ordering = ['name']

    def __str__(self):
        return self.name


class Location(models.Model):
    class LocationType(models.TextChoices):
        BASE_NAVAL = 'base_naval', 'Base Naval'
        UNIDAD_NAVAL = 'unidad_naval', 'Unidad Naval'
        COMANDANCIA = 'comandancia', 'Comandancia / Capitanía'
        DESTACAMENTO = 'destacamento', 'Destacamento / Puesto'

    name = models.CharField(max_length=200)
    location_type = models.CharField(
        max_length=20,
        choices=LocationType.choices,
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='children',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'ubicación'
        verbose_name_plural = 'ubicaciones'
        ordering = ['location_type', 'name']

    def __str__(self):
        return f"{self.get_location_type_display()} - {self.name}"

    def get_breadcrumb(self):
        parts = [self.name]
        parent = self.parent
        while parent:
            parts.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(parts)


class Item(models.Model):
    class DocumentType(models.TextChoices):
        OFICIO = 'oficio', 'Oficio'
        CONDUCE = 'conduce', 'Conduce'
        FACTURA = 'factura', 'Factura'
        DIRECTO = 'directo', 'Directo'
        LEGADO = 'legado', 'Legado'

    name = models.CharField(max_length=200)
    code = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        null=True,
        help_text='Código auto-generado (e.g., COM-001)',
    )
    sku = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        help_text='SKU del sistema anterior (legado)',
    )
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
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        related_name='items',
        null=True,
        blank=True,
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
        return f"{self.name} ({self.code or self.sku or self.part_number or 'sin código'})"

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
        LEGADO = 'legado', 'Legado'

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
    document_file = models.FileField(
        upload_to='movements/%Y/%m/',
        blank=True,
        null=True,
        help_text='Archivo digitalizado del documento',
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'movimiento de stock'
        verbose_name_plural = 'movimientos de stock'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_movement_type_display()} {self.quantity} x {self.item.name}"
