"""Paso 1: Crear LocationType y seedear los tipos default.

Location.location_type sigue como CharField (migration posterior lo convierte a FK).
"""
import django.db.models.deletion
from django.db import migrations, models


def seed_default_location_types(apps, schema_editor):
    LocationType = apps.get_model('inventory', 'LocationType')

    defaults = [
        ('taller', 'Taller de Electrónica', 'Taller principal del taller de electrónica'),
        ('base_naval', 'Base Naval', 'Base naval de la Armada'),
        ('unidad_naval', 'Unidad Naval', 'Buque o unidad naval'),
        ('comandancia', 'Comandancia / Capitanía', 'Comandancia o capitanía de puerto'),
        ('destacamento', 'Destacamento / Puesto', 'Destacamento o puesto naval'),
    ]
    for code, name, desc in defaults:
        LocationType.objects.get_or_create(
            code=code,
            defaults={'name': name, 'description': desc, 'is_active': True},
        )


def reverse_noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0010_alter_itemunit_status'),
    ]

    operations = [
        # 1. Crear LocationType (la tabla)
        migrations.CreateModel(
            name='LocationType',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(help_text='Código interno (e.g., "taller", "base_naval", "buque")', max_length=30, unique=True)),
                ('name', models.CharField(help_text='Nombre visible (e.g., "Taller de Electrónica", "Buque")', max_length=100)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'tipo de ubicación',
                'verbose_name_plural': 'tipos de ubicación',
                'ordering': ['name'],
            },
        ),
        # 2. Seedear los 5 tipos default
        migrations.RunPython(seed_default_location_types, reverse_noop),
    ]
