import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_SUPERUSER_EMAIL = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@armada.mil.do')
DEFAULT_SUPERUSER_NAME = os.environ.get('DEFAULT_ADMIN_NAME', 'Administrador')
DEFAULT_SUPERUSER_ROLE = 'admin'
DEFAULT_SUPERUSER_PASSWORD = os.environ.get('DEFAULT_ADMIN_PASSWORD')


class Command(BaseCommand):
    help = 'Create default superuser if it does not exist'

    def handle(self, *args, **options):
        if not DEFAULT_SUPERUSER_PASSWORD:
            self.stdout.write(
                self.style.WARNING(
                    'DEFAULT_ADMIN_PASSWORD is not set; skipping default superuser creation.'
                )
            )
            return

        if not User.objects.filter(email=DEFAULT_SUPERUSER_EMAIL).exists():
            user = User.objects.create_superuser(
                email=DEFAULT_SUPERUSER_EMAIL,
                name=DEFAULT_SUPERUSER_NAME,
                role=DEFAULT_SUPERUSER_ROLE,
                password=DEFAULT_SUPERUSER_PASSWORD,
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created superuser {user.email}')
            )
        else:
            self.stdout.write('Default superuser already exists.')
