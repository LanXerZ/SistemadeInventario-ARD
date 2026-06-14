from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

DEFAULT_SUPERUSER = {
    'email': 'admin@armada.mil.do',
    'name': 'Administrador',
    'role': 'admin',
    'password': 'Admin12345',
}


class Command(BaseCommand):
    help = 'Create default superuser if it does not exist'

    def handle(self, *args, **options):
        if not User.objects.filter(email=DEFAULT_SUPERUSER['email']).exists():
            user = User.objects.create_superuser(
                email=DEFAULT_SUPERUSER['email'],
                name=DEFAULT_SUPERUSER['name'],
                role=DEFAULT_SUPERUSER['role'],
                password=DEFAULT_SUPERUSER['password'],
            )
            self.stdout.write(
                self.style.SUCCESS(f'Successfully created superuser {user.email}')
            )
        else:
            self.stdout.write('Default superuser already exists.')
