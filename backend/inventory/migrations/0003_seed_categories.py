from django.db import migrations

SEED_CATEGORIES = [
    {'name': 'Componentes', 'description': 'Resistencias, capacitores, transistores, circuitos integrados'},
    {'name': 'Conectores y Cableado', 'description': 'Conectores militares, cables, terminales, adaptadores'},
    {'name': 'Soldadura y Químicos', 'description': 'Estaño, flux, limpiadores, lubricantes, pegamentos'},
    {'name': 'Ferretería', 'description': 'Tornillos, fusibles, breakers, soportes, canaletas'},
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model('inventory', 'Category')
    for cat in SEED_CATEGORIES:
        Category.objects.get_or_create(
            name=cat['name'],
            defaults={'description': cat['description']},
        )


def reverse_seed(apps, schema_editor):
    Category = apps.get_model('inventory', 'Category')
    Category.objects.filter(
        name__in=[c['name'] for c in SEED_CATEGORIES]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_item_image'),
    ]

    operations = [
        migrations.RunPython(seed_categories, reverse_seed),
    ]
