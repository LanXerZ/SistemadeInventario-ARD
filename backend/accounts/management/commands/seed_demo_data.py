import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

DEV_PASSWORD_WARNING = (
    "AVISO: El comando seed_demo_data crea usuarios con contraseñas débiles "
    "diseñadas solo para desarrollo/QA. NO ejecutar en producción."
)


SEED_CONFIG = [
    {
        'email': os.environ.get('SEED_ADMIN_EMAIL', 'admin@armada.mil.do'),
        'password': os.environ.get('SEED_ADMIN_PASSWORD', 'Admin12345'),
        'name': 'Administrador',
        'role': User.Role.ADMIN,
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'email': os.environ.get('SEED_ALMACENISTA_EMAIL', 'almacenista@armada.mil.do'),
        'password': os.environ.get('SEED_ALMACENISTA_PASSWORD', 'Almacen123'),
        'name': 'Encargado de Inventario',
        'role': User.Role.ALMACENISTA,
        'is_staff': False,
        'is_superuser': False,
    },
    {
        'email': os.environ.get('SEED_TECNICO_EMAIL', 'tecnico@armada.mil.do'),
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
    help = 'Crea usuarios demo (admin, almacenista, tecnico) con contraseñas conocidas para desarrollo'

    def handle(self, *args, **options):
        if not settings.DEBUG:
            self.stderr.write(
                self.style.ERROR(
                    'ABORTADO: DEBUG=False. seed_demo_data solo puede ejecutarse en entorno de desarrollo.'
                )
            )
            return

        self.stdout.write(self.style.WARNING(DEV_PASSWORD_WARNING))
        self.stdout.write()
        self.stdout.write(self.style.MIGRATE_HEADING('=== Seed de datos demo (3 roles) ==='))
        self.stdout.write()

        self._seed_solicitantes()

        results = []
        for cfg in SEED_CONFIG:
            skip_msg = self._ensure_user(cfg)
            results.append((cfg['email'], cfg['role'], cfg['password'], skip_msg))

        self.stdout.write()
        self.stdout.write(self.style.SUCCESS('Credenciales demo activas:'))
        host = 'http://localhost:8001'
        self.stdout.write(f'  Login API:  {host}/api/v1/auth/login/')
        self.stdout.write(f'  Frontend:   http://localhost:5173/login')
        self.stdout.write()
        for email, role, password, msg in results:
            self.stdout.write(f'  {email}  [{role}]  {password}  {msg}')

    def _seed_solicitantes(self):
        from workorders.models import Solicitante
        for sol in SEED_SOLICITANTES:
            obj, created = Solicitante.objects.get_or_create(
                name=sol['name'],
                defaults={'rank': sol.get('rank', ''), 'is_active': True},
            )
            if not obj.is_active:
                obj.is_active = True
                obj.save(update_fields=['is_active'])
            verb = 'creado' if created else 'ya existía'
            self.stdout.write(
                f"  [OK]   Solicitante: {sol['name']} - {verb}"
            )

    def _ensure_user(self, cfg):
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

        if created:
            msg = 'creado'
        else:
            msg = 'actualizado'
            dirty = False
            for field, value in [('name', cfg['name']), ('role', cfg['role']),
                                  ('is_staff', cfg['is_staff']), ('is_superuser', cfg['is_superuser'])]:
                if getattr(user, field) != value:
                    setattr(user, field, value)
                    dirty = True
            if not user.is_active:
                user.is_active = True
                dirty = True
            if dirty:
                user.save()

        user.set_password(cfg['password'])
        user.save(update_fields=['password'])

        self.stdout.write(
            self.style.SUCCESS(
                f"  [OK]   {cfg['email']:<30} - {msg} "
                f"(rol={cfg['role']}, password={cfg['password']})"
            )
        )
        return cfg['password']
