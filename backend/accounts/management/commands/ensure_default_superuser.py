import os

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_SUPERUSER_EMAIL = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@armada.mil.do')
DEFAULT_SUPERUSER_NAME = os.environ.get('DEFAULT_ADMIN_NAME', 'Administrador')
DEFAULT_SUPERUSER_ROLE = 'admin'
DEFAULT_SUPERUSER_PASSWORD = os.environ.get('DEFAULT_ADMIN_PASSWORD')


class Command(BaseCommand):
    help = 'Ensure the default superuser exists with the configured password'

    def handle(self, *args, **options):
        if not DEFAULT_SUPERUSER_PASSWORD:
            self.stdout.write(
                self.style.WARNING(
                    'DEFAULT_ADMIN_PASSWORD is not set; skipping default superuser setup.'
                )
            )
            return

        user, created = User.objects.get_or_create(
            email=DEFAULT_SUPERUSER_EMAIL,
            defaults={
                'name': DEFAULT_SUPERUSER_NAME,
                'role': DEFAULT_SUPERUSER_ROLE,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        user.set_password(DEFAULT_SUPERUSER_PASSWORD)
        user.is_staff = True
        user.is_superuser = True
        user.save()

        action = 'created' if created else 'updated'
        self.stdout.write(
            self.style.SUCCESS(
                f'Superuser {DEFAULT_SUPERUSER_EMAIL} {action} successfully'
            )
        )
