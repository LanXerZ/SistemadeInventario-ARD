"""Prepara la migración del modelo WorkOrder a Despacho:

1. Elimina el UniqueConstraint `unique_pending_part_per_work_order_item` de WorkOrderPart
2. Elimina todas las WorkOrder existentes (datos demo no migrables)
3. Elimina todas las WorkOrderPart (huérfanas tras eliminar WorkOrder)
"""
from django.db import migrations


def drop_constraint_and_data(apps, schema_editor):
    WorkOrder = apps.get_model('workorders', 'WorkOrder')
    WorkOrderPart = apps.get_model('workorders', 'WorkOrderPart')
    WorkOrderPart.objects.all().delete()
    WorkOrder.objects.all().delete()


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ('inventory', '0010_alter_itemunit_status'),
        ('workorders', '0005_solicitante'),
    ]

    operations = [
        migrations.RunPython(drop_constraint_and_data, reverse_noop),
    ]
