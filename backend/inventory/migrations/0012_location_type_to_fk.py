"""Paso 2: Alterar Location.location_type de CharField a FK (preservando datos).

Estrategia:
1. Renombrar `location_type` a `location_type_old` (CharField)
2. Agregar `location_type` IntegerField (null=True)
3. RunPython: para cada Location, buscar LocationType con code = old y asignar su ID
4. Eliminar `location_type_old`
5. Alterar `location_type` a ForeignKey
"""
from django.db import migrations, models
import django.db.models.deletion


def migrate_location_type_to_fk(apps, schema_editor):
    Location = apps.get_model('inventory', 'Location')
    LocationType = apps.get_model('inventory', 'LocationType')
    types_by_code = {lt.code: lt.id for lt in LocationType.objects.all()}
    for loc in Location.objects.all():
        old = loc.location_type_old
        if old in types_by_code:
            loc.location_type = types_by_code[old]
        else:
            other, _ = LocationType.objects.get_or_create(
                code=old or 'unknown',
                defaults={'name': old or 'Sin clasificar', 'is_active': True},
            )
            loc.location_type = other.id
        loc.save(update_fields=['location_type'])


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0011_locationtype_and_seed'),
    ]

    operations = [
        # 1. Renombrar CharField a location_type_old
        migrations.RenameField(
            model_name='location',
            old_name='location_type',
            new_name='location_type_old',
        ),
        # 2. Agregar location_type IntegerField (null=True)
        migrations.AddField(
            model_name='location',
            name='location_type',
            field=models.IntegerField(null=True, blank=True),
        ),
        # 3. Migrar datos: de CharField a FK
        migrations.RunPython(migrate_location_type_to_fk, reverse_noop),
        # 4. Alterar location_type a ForeignKey (no-null)
        migrations.AlterField(
            model_name='location',
            name='location_type',
            field=models.ForeignKey(
                help_text='Tipo de ubicación (taller, base naval, etc.)',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='locations',
                to='inventory.locationtype',
            ),
        ),
        # 5. Eliminar location_type_old
        migrations.RemoveField(
            model_name='location',
            name='location_type_old',
        ),
        # 6. Actualizar Meta options
        migrations.AlterModelOptions(
            name='location',
            options={'ordering': ['location_type__name', 'name'], 'verbose_name': 'ubicación', 'verbose_name_plural': 'ubicaciones'},
        ),
        # 7. Actualizar display labels de ItemUnit.Status
        migrations.AlterField(
            model_name='itemunit',
            name='status',
            field=models.CharField(
                choices=[
                    ('available', 'Disponible'),
                    ('asignado', 'Asignado'),
                    ('maintenance', 'En Reparación'),
                    ('disposed', 'Descargado'),
                ],
                default='available',
                max_length=20,
            ),
        ),
    ]
