"""Idempotent: crea usuarios demo y datos mínimos sin importar DEBUG.

A diferencia de seed_demo_data (que rechaza en producción), este comando
es seguro en cualquier entorno porque usa get_or_create en todos lados.
Diseñado para ejecutarse en el startCommand de Render después de migrate.
"""
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


SEED_CONFIG = [
    {
        'email': 'admin@armada.mil.do',
        'password': os.environ.get('SEED_ADMIN_PASSWORD', 'Admin12345'),
        'name': 'Administrador',
        'role': User.Role.ADMIN,
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'email': 'almacenista@armada.mil.do',
        'password': os.environ.get('SEED_ALMACENISTA_PASSWORD', 'Almacen123'),
        'name': 'Encargado de Inventario',
        'role': User.Role.ALMACENISTA,
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'email': 'tecnico@armada.mil.do',
        'password': os.environ.get('SEED_TECNICO_PASSWORD', 'Tecnico123'),
        'name': 'Técnico Naval',
        'role': User.Role.TECNICO,
        'is_staff': False,
        'is_superuser': False,
    },
]

SEED_SOLICITANTES = [
    {'name': 'Capitán de Navío Juan Pérez', 'rank': 'Capitán de Navío'},
    {'name': 'Teniente de Navío María Gómez', 'rank': 'Teniente de Navío'},
    {'name': 'Suboficial Carlos Méndez', 'rank': 'Suboficial'},
]


class Command(BaseCommand):
    help = 'Crea usuarios demo + solicitantes + location types (idempotente, seguro en cualquier entorno)'

    def handle(self, *args, **options):
        self.stdout.write('=== Seed de producción (idempotente) ===')

        for cfg in SEED_CONFIG:
            user, created = User.objects.get_or_create(
                email=cfg['email'],
                defaults={
                    'name': cfg['name'],
                    'role': cfg['role'],
                    'is_staff': cfg['is_staff'],
                    'is_superuser': cfg['is_superuser'],
                    'is_active': True,
                },
            )
            if created or not user.has_usable_password():
                user.set_password(cfg['password'])
                user.save()
            self.stdout.write(f"  [OK] {cfg['email']} ({'creado' if created else 'existente'})")

        from workorders.models import Solicitante
        for sol in SEED_SOLICITANTES:
            Solicitante.objects.get_or_create(
                name=sol['name'],
                defaults={'rank': sol.get('rank', ''), 'is_active': True},
            )
            self.stdout.write(f"  [OK] Solicitante: {sol['name']}")

        from inventory.models import LocationType
        default_types = [
            ('taller', 'Taller de Electrónica'),
            ('base_naval', 'Base Naval'),
            ('unidad_naval', 'Unidad Naval'),
            ('comandancia', 'Comandancia / Capitanía'),
            ('destacamento', 'Destacamento / Puesto'),
        ]
        for code, name in default_types:
            LocationType.objects.get_or_create(
                code=code,
                defaults={'name': name, 'is_active': True},
            )
            self.stdout.write(f"  [OK] LocationType: {code} = {name}")

        self.stdout.write(self.style.SUCCESS('Seed de producción completado.'))
