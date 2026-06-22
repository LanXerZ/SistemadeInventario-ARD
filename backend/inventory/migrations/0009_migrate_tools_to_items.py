"""Migra los registros de Tool a Item(kind=herramienta) + ItemUnit.

Por cada Tool:
- Crea Item con kind=herramienta, track_by_serial=True, code=tool.code,
  name=tool.name, marca=tool.brand, modelo=tool.model, description=tool.description
- Crea un ItemUnit por cada Tool con su serial_number (o codigo si no tiene serial)
- Si Tool.status=disposed, el ItemUnit queda como disposed con disposal_reason
- Si Tool.status=loaned, el ItemUnit queda como loaned (los ToolLoan se migran aparte)

Por cada ToolLoan:
- Se crea ItemLoan sobre el ItemUnit correspondiente
- loaned_to_user = ToolLoan.technician (User con rol tecnico)
- loaned_by = ToolLoan.loaned_by
- loaned_at, expected_return_at, returned_at, returned_to se copian
"""
from django.db import migrations
from django.utils import timezone


def migrate_tools(apps, schema_editor):
    # Si la app tools ya no existe (migrada), no hay nada que migrar.
    from django.apps import apps as global_apps
    if not global_apps.is_installed('tools'):
        return

    Tool = apps.get_model('tools', 'Tool')
    ToolLoan = apps.get_model('tools', 'ToolLoan')
    Item = apps.get_model('inventory', 'Item')
    ItemUnit = apps.get_model('inventory', 'ItemUnit')
    ItemLoan = apps.get_model('inventory', 'ItemLoan')
    Category = apps.get_model('inventory', 'Category')
    Location = apps.get_model('inventory', 'Location')

    # Categoría por defecto para herramientas (si no existe, crear "Herramientas")
    cat, _ = Category.objects.get_or_create(
        name='Herramientas',
        defaults={'abbreviation': 'HERR', 'description': 'Herramientas e instrumentos del taller'},
    )

    # Location por defecto (taller principal) si no hay ninguna
    taller = Location.objects.filter(location_type='taller').first()

    for tool in Tool.objects.all():
        item = Item.objects.create(
            code=tool.code,
            name=tool.name,
            kind='herramienta',
            track_by_serial=True,
            quantity=0,
            unit='unidad',
            marca=tool.brand or '',
            modelo=tool.model or '',
            numero_serie=tool.serial or '',
            category=cat,
            location=taller,
            description=tool.description or '',
            is_active=(tool.status != 'disposed'),
            created_at=tool.created_at,
            updated_at=tool.updated_at,
        )

        # Una unidad por herramienta (la unidad física que se prestaba como Tool)
        unit_status = 'available'
        if tool.status == 'loaned':
            unit_status = 'loaned'
        elif tool.status == 'disposed':
            unit_status = 'disposed'

        unit = ItemUnit.objects.create(
            item=item,
            serial_number=tool.serial or tool.code,
            status=unit_status,
            notes=tool.disposal_reason or '',
            acquired_at=tool.created_at,
            disposed_at=tool.disposal_date if tool.status == 'disposed' else None,
            disposal_reason=tool.disposal_reason or '',
        )

        # Migrar préstamos
        for loan in ToolLoan.objects.filter(tool=tool):
            ItemLoan.objects.create(
                item_unit=unit,
                loaned_to_user=loan.technician,
                loaned_by=loan.loaned_by,
                loaned_at=loan.loaned_at,
                expected_return_at=loan.expected_return_at,
                returned_at=loan.returned_at,
                returned_to=loan.returned_to,
                notes=loan.notes,
            )


def reverse_migrate(apps, schema_editor):
    ItemUnit = apps.get_model('inventory', 'ItemUnit')
    ItemLoan = apps.get_model('inventory', 'ItemLoan')
    ItemLoan.objects.all().delete()
    ItemUnit.objects.filter(item__kind='herramienta').delete()
    Item.objects.filter(kind='herramienta').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('inventory', '0008_itemloan_loaned_to_itemloan_loaned_to_user_and_more'),
    ]

    operations = [
        migrations.RunPython(migrate_tools, reverse_migrate),
    ]
