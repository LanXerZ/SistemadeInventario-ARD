from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Category, Item, StockMovement, Location, Transfer

User = get_user_model()


class CategoryModelTest(TestCase):
    def test_create_category(self):
        category = Category.objects.create(name='Electronicos', description='Componentes electronicos')
        self.assertEqual(str(category), 'Electronicos')


class ItemModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Resistencias')
        self.item = Item.objects.create(
            name='Resistencia 10kOhm',
            sku='R-10K',
            category=self.category,
            quantity=5,
            minimum_stock=10,
        )

    def test_item_is_critical(self):
        self.assertTrue(self.item.is_critical)

    def test_item_not_critical(self):
        self.item.quantity = 20
        self.item.save()
        self.assertFalse(self.item.is_critical)

    def test_item_marca_modelo_serial(self):
        item = Item.objects.create(
            name='Radio Harris',
            sku='HARRIS-001',
            marca='Harris',
            modelo='RF-7800V',
            numero_serie='SN-12345',
            category=self.category,
        )
        self.assertEqual(item.marca, 'Harris')
        self.assertEqual(item.modelo, 'RF-7800V')
        self.assertEqual(item.numero_serie, 'SN-12345')


class LocationModelTest(TestCase):
    def test_create_taller_root(self):
        taller = Location.objects.create(
            name='Taller de Electrónica',
            location_type='taller',
        )
        self.assertTrue(taller.location_type == 'taller')
        self.assertIsNone(taller.parent)
        self.assertIn('Taller', str(taller))

    def test_location_hierarchy(self):
        taller = Location.objects.create(name='Taller', location_type='taller')
        base = Location.objects.create(name='Base Naval 27F', location_type='base_naval', parent=taller)
        unidad = Location.objects.create(name='GC-101', location_type='unidad_naval', parent=base)
        breadcrumb = unidad.get_breadcrumb()
        self.assertIn('Taller', breadcrumb)
        self.assertIn('Base Naval 27F', breadcrumb)
        self.assertIn('GC-101', breadcrumb)

    def test_location_creation(self):
        taller = Location.objects.create(name='Taller Central', location_type='taller')
        base = Location.objects.create(name='Base Naval 27F', location_type='base_naval')
        self.assertEqual(taller.location_type, 'taller')
        self.assertIsNone(taller.parent)
        self.assertIsNone(base.parent)
        self.assertEqual(str(taller), 'Taller de Electrónica - Taller Central')


class TransferModelTest(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Equipos')
        self.item = Item.objects.create(name='Radio Test', category=self.category, quantity=1)
        self.taller = Location.objects.create(name='Taller', location_type='taller')
        self.base = Location.objects.create(name='Base Naval', location_type='base_naval', parent=self.taller)
        self.admin = User.objects.create_user(
            email='admin@test.com',
            password='Test12345',
            name='Admin',
            role=User.Role.ADMIN,
        )

    def test_create_transfer(self):
        transfer = Transfer.objects.create(
            item=self.item,
            origin_location=self.taller,
            destination_location=self.base,
            requested_by=self.admin,
            quantity=1,
        )
        self.assertEqual(transfer.status, Transfer.Status.PENDIENTE)
        self.assertEqual(transfer.requested_by, self.admin)
        self.assertIn('→', str(transfer))


class InventoryAPITest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@armada.mil.do',
            password='Admin12345',
            name='Admin',
            role=User.Role.ADMIN,
        )
        self.almacenista = User.objects.create_user(
            email='almacenista@armada.mil.do',
            password='Almacen123',
            name='Almacenista',
            role=User.Role.ALMACENISTA,
        )
        self.tecnico = User.objects.create_user(
            email='tecnico@armada.mil.do',
            password='Tecnico123',
            name='Tecnico',
            role=User.Role.TECNICO,
        )
        self.category = Category.objects.create(name='Capacitores')
        self.item = Item.objects.create(
            name='Capacitor 100uF',
            sku='C-100UF',
            category=self.category,
            quantity=20,
            minimum_stock=5,
        )

    def test_list_items_authenticated(self):
        self.client.force_authenticate(user=self.tecnico)
        response = self.client.get('/api/v1/inventory/items/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_item_requires_almacenista(self):
        self.client.force_authenticate(user=self.tecnico)
        response = self.client.post('/api/v1/inventory/items/', {
            'name': 'Diodo',
            'sku': 'D-001',
            'category': self.category.id,
            'minimum_stock': 0,
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_item_as_almacenista(self):
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post('/api/v1/inventory/items/', {
            'name': 'Diodo',
            'sku': 'D-001',
            'category': self.category.id,
            'minimum_stock': 0,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_stock_entry_increases_quantity(self):
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post('/api/v1/inventory/stock-movements/', {
            'item': self.item.id,
            'movement_type': StockMovement.MovementType.ENTRY,
            'quantity': 10,
            'document_type': StockMovement.DocumentType.FACTURA,
            'document_number': 'FAC-001',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 30)

    def test_stock_exit_decreases_quantity(self):
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post('/api/v1/inventory/stock-movements/', {
            'item': self.item.id,
            'movement_type': StockMovement.MovementType.EXIT,
            'quantity': 5,
            'document_type': StockMovement.DocumentType.CONDUCE,
            'document_number': 'CON-001',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 15)

    def test_stock_exit_with_insufficient_stock_fails(self):
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post('/api/v1/inventory/stock-movements/', {
            'item': self.item.id,
            'movement_type': StockMovement.MovementType.EXIT,
            'quantity': 100,
            'document_type': StockMovement.DocumentType.CONDUCE,
            'document_number': 'CON-002',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_transfer_and_approve(self):
        self.client.force_authenticate(user=self.almacenista)
        taller = Location.objects.create(name='Taller', location_type='taller')
        base = Location.objects.create(name='Base Naval', location_type='base_naval', parent=taller)
        self.item.location = taller
        self.item.save()
        response = self.client.post('/api/v1/inventory/transfers/', {
            'item': self.item.id,
            'origin_location': taller.id,
            'destination_location': base.id,
            'quantity': 1,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        transfer_id = response.data['id']

        response = self.client.post(f'/api/v1/inventory/transfers/{transfer_id}/approve/')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['status'], 'completada')

        self.item.refresh_from_db()
        self.assertEqual(self.item.location, base)

    def test_locations_list_flat(self):
        self.client.force_authenticate(user=self.tecnico)
        Location.objects.create(name='Taller Central', location_type='taller')
        Location.objects.create(name='Base Naval 27F', location_type='base_naval')
        Location.objects.create(name='GC-101', location_type='unidad_naval')

        response = self.client.get('/api/v1/inventory/locations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 3)
