"""Refactor: WorkOrder → Despacho. Elimina WorkOrderPart + WorkOrder, crea Despacho + LineaDespacho."""
import dirtyfields.dirtyfields
import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0010_alter_itemunit_status'),
        ('workorders', '0006_prepare_despacho_migration'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # 1. Eliminar UniqueConstraint que referencia work_order (requerido antes de eliminar el campo)
        migrations.RemoveConstraint(
            model_name='workorderpart',
            name='unique_pending_part_per_work_order_item',
        ),
        # 2. Eliminar WorkOrder (sus partes ya están eliminadas por la migración previa)
        migrations.DeleteModel(
            name='WorkOrder',
        ),
        # 3. Eliminar WorkOrderPart (ya sin relaciones, ya sin partes)
        migrations.DeleteModel(
            name='WorkOrderPart',
        ),
        # 4. Crear Despacho
        migrations.CreateModel(
            name='Despacho',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ot_number', models.CharField(editable=False, help_text='Número correlativo del despacho (formato DV-YYYY-XXXXX)', max_length=20, unique=True)),
                ('issued_at', models.DateTimeField(auto_now_add=True, help_text='Fecha y hora del despacho')),
                ('equipment_reference', models.CharField(blank=True, help_text='Referencia libre al equipo o sistema destino (opcional)', max_length=255)),
                ('notes', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('issued', 'Despachado'), ('cancelled', 'Anulado')], default='issued', max_length=20)),
                ('cancelled_at', models.DateTimeField(blank=True, null=True)),
                ('cancellation_reason', models.TextField(blank=True)),
                ('cancelled_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='despachos_anulados', to=settings.AUTH_USER_MODEL)),
                ('delivered_by', models.ForeignKey(help_text='Usuario del taller que entrega (auto desde sesión)', on_delete=django.db.models.deletion.PROTECT, related_name='despachos_entregados', to=settings.AUTH_USER_MODEL)),
                ('solicitante', models.ForeignKey(help_text='Persona o unidad que recibe el despacho', on_delete=django.db.models.deletion.PROTECT, related_name='despachos', to='workorders.solicitante')),
                ('unit', models.ForeignKey(blank=True, help_text='Unidad/buque de procedencia del solicitante (opcional)', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='despachos_recibidos', to='inventory.location')),
            ],
            options={
                'verbose_name': 'despacho',
                'verbose_name_plural': 'despachos',
                'ordering': ['-issued_at'],
            },
            bases=(dirtyfields.dirtyfields.DirtyFieldsMixin, models.Model),
        ),
        # 5. Crear LineaDespacho
        migrations.CreateModel(
            name='LineaDespacho',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(help_text='Cantidad despachada (1 para herramientas)', validators=[django.core.validators.MinValueValidator(1)])),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('despacho', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='lineas', to='workorders.despacho')),
                ('item', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='lineas_despacho', to='inventory.item')),
                ('item_unit', models.ForeignKey(blank=True, help_text='Unidad física específica (solo para herramientas serializadas)', null=True, on_delete=django.db.models.deletion.PROTECT, related_name='lineas_despacho', to='inventory.itemunit')),
            ],
            options={
                'verbose_name': 'línea de despacho',
                'verbose_name_plural': 'líneas de despacho',
                'ordering': ['id'],
            },
            bases=(dirtyfields.dirtyfields.DirtyFieldsMixin, models.Model),
        ),
        # 6. Índices
        migrations.AddIndex(
            model_name='despacho',
            index=models.Index(fields=['status', '-issued_at'], name='workorders__status_19c6a0_idx'),
        ),
        migrations.AddIndex(
            model_name='despacho',
            index=models.Index(fields=['solicitante', '-issued_at'], name='workorders__solicit_44fe84_idx'),
        ),
    ]
