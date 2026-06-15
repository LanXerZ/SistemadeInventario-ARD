from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_SUPERUSER_EMAIL = 'admin@armada.mil.do'
DEFAULT_SUPERUSER_NAME = 'Administrador'
DEFAULT_SUPERUSER_PASSWORD = 'Admin12345'
DEFAULT_SUPERUSER_ROLE = 'admin'


class Command(BaseCommand):
    help = 'Create or reset default superuser (presentation-only)'

    def handle(self, *args, **options):
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

        action = 'created' if created else 'reset'
        self.stdout.write(
            self.style.SUCCESS(
                f'Superuser {DEFAULT_SUPERUSER_EMAIL} {action} successfully'
            )
        )
