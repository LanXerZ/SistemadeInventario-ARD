from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from inventory.models import Category, Item, Location
from .models import WorkOrder, WorkOrderPart

User = get_user_model()


class WorkOrderModelTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin@armada.mil.do',
            password='Admin12345',
            name='Admin',
            role=User.Role.ADMIN,
        )
        self.technician = User.objects.create_user(
            email='tecnico@armada.mil.do',
            password='Tecnico123',
            name='Técnico',
            role=User.Role.TECNICO,
        )

    def test_ot_number_generation(self):
        wo = WorkOrder.objects.create(
            origin_unit='BA-1101',
            delivery_officer_name='Capitán Pérez',
            equipment_description='Radio VHF',
            technician=self.technician,
            created_by=self.admin,
        )
        self.assertTrue(wo.ot_number.startswith('OT-'))
        self.assertIn(str(WorkOrder.generate_ot_number().split('-')[1]), wo.ot_number)

    def test_sequential_ot_numbers(self):
        wo1 = WorkOrder.objects.create(
            origin_unit='BA-1101',
            delivery_officer_name='Capitán Pérez',
            equipment_description='Radio VHF',
            technician=self.technician,
            created_by=self.admin,
        )
        wo2 = WorkOrder.objects.create(
            origin_unit='BA-1102',
            delivery_officer_name='Capitán Gómez',
            equipment_description='Radar',
            technician=self.technician,
            created_by=self.admin,
        )
        self.assertGreater(wo2.ot_number, wo1.ot_number)


class WorkOrderAPITest(APITestCase):
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
        self.technician = User.objects.create_user(
            email='tecnico@armada.mil.do',
            password='Tecnico123',
            name='Técnico',
            role=User.Role.TECNICO,
        )
        self.category = Category.objects.create(name='Electrónicos')
        self.location = Location.objects.create(name='Estante E-01', location_type='taller')
        self.item = Item.objects.create(
            name='Capacitor',
            sku='C-001',
            category=self.category,
            location=self.location,
            quantity=10,
            minimum_stock=2,
        )
        self.work_order = WorkOrder.objects.create(
            origin_unit='BA-1101',
            delivery_officer_name='Capitán Pérez',
            equipment_description='Radio VHF',
            technician=self.technician,
            created_by=self.admin,
        )

    def test_admin_can_create_work_order(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/v1/work-orders/work-orders/', {
            'origin_unit': 'BA-1102',
            'delivery_officer_name': 'Capitán Gómez',
            'equipment_description': 'Radar',
            'technician': self.technician.id,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['ot_number'].startswith('OT-'))

    def test_technician_can_only_see_assigned_work_orders(self):
        other_technician = User.objects.create_user(
            email='tecnico2@armada.mil.do',
            password='Tecnico123',
            name='Técnico 2',
            role=User.Role.TECNICO,
        )
        WorkOrder.objects.create(
            origin_unit='BA-1103',
            delivery_officer_name='Capitán López',
            equipment_description='GPS',
            technician=other_technician,
            created_by=self.admin,
        )

        self.client.force_authenticate(user=self.technician)
        response = self.client.get('/api/v1/work-orders/work-orders/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)

    def test_technician_can_request_part(self):
        self.client.force_authenticate(user=self.technician)
        response = self.client.post(
            f'/api/v1/work-orders/work-orders/{self.work_order.id}/request_part/',
            {
                'item': self.item.id,
                'quantity': 2,
                'notes': 'Urgente',
            }
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(WorkOrderPart.objects.count(), 1)

    def test_almacenista_can_approve_part(self):
        part = WorkOrderPart.objects.create(
            work_order=self.work_order,
            item=self.item,
            quantity_requested=2,
            requested_by=self.technician,
        )
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post(
            f'/api/v1/work-orders/work-orders/{self.work_order.id}/approve_part/',
            {'part_id': part.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        part.refresh_from_db()
        self.assertEqual(part.status, WorkOrderPart.Status.APPROVED)

    def test_use_part_deducts_stock(self):
        part = WorkOrderPart.objects.create(
            work_order=self.work_order,
            item=self.item,
            quantity_requested=2,
            requested_by=self.technician,
            status=WorkOrderPart.Status.APPROVED,
            quantity_approved=2,
            approved_by=self.almacenista,
        )
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post(
            f'/api/v1/work-orders/work-orders/{self.work_order.id}/use_part/',
            {'part_id': part.id}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.item.refresh_from_db()
        self.assertEqual(self.item.quantity, 8)

    def test_close_work_order(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/work-orders/work-orders/{self.work_order.id}/close/',
            {
                'diagnosis': 'Reemplazo de módulo',
                'replaced_parts_note': 'Módulo principal',
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.work_order.refresh_from_db()
        self.assertEqual(self.work_order.status, WorkOrder.Status.READY)

    def test_deliver_work_order(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(
            f'/api/v1/work-orders/work-orders/{self.work_order.id}/deliver/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.work_order.refresh_from_db()
        self.assertEqual(self.work_order.status, WorkOrder.Status.DELIVERED)
