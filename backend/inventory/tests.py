from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Category, Item, StockMovement

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
