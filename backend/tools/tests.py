from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Tool, ToolLoan

User = get_user_model()


class ToolModelTest(TestCase):
    def setUp(self):
        self.tool = Tool.objects.create(
            code='MULT-001',
            name='Multímetro digital',
            tool_type='Medición eléctrica',
            brand='Fluke',
            model='115',
        )

    def test_tool_str(self):
        self.assertEqual(str(self.tool), 'MULT-001 - Multímetro digital')


class ToolAPITest(APITestCase):
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
        self.tool = Tool.objects.create(
            code='MULT-001',
            name='Multímetro digital',
            tool_type='Medición eléctrica',
            brand='Fluke',
            model='115',
        )

    def test_almacenista_can_create_tool(self):
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post('/api/v1/tools/tools/', {
            'code': 'OSC-001',
            'name': 'Osciloscopio',
            'tool_type': 'Medición',
            'brand': 'Tektronix',
            'model': 'TBS-1052B',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_technician_cannot_create_tool(self):
        self.client.force_authenticate(user=self.technician)
        response = self.client.post('/api/v1/tools/tools/', {
            'code': 'OSC-002',
            'name': 'Osciloscopio',
            'tool_type': 'Medición',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_loan_tool(self):
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post(
            f'/api/v1/tools/tools/{self.tool.id}/loan/',
            {
                'technician': self.technician.id,
                'expected_return_days': 1,
            }
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.tool.refresh_from_db()
        self.assertEqual(self.tool.status, Tool.Status.LOANED)

    def test_cannot_loan_already_loaned_tool(self):
        ToolLoan.objects.create(
            tool=self.tool,
            technician=self.technician,
            loaned_by=self.almacenista,
            expected_return_at=timezone.now() + timedelta(days=1),
        )
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post(
            f'/api/v1/tools/tools/{self.tool.id}/loan/',
            {
                'technician': self.technician.id,
                'expected_return_days': 1,
            }
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_return_tool(self):
        ToolLoan.objects.create(
            tool=self.tool,
            technician=self.technician,
            loaned_by=self.almacenista,
            expected_return_at=timezone.now() + timedelta(days=1),
        )
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post(f'/api/v1/tools/tools/{self.tool.id}/return_tool/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tool.refresh_from_db()
        self.assertEqual(self.tool.status, Tool.Status.AVAILABLE)

    def test_dispose_tool(self):
        self.client.force_authenticate(user=self.almacenista)
        response = self.client.post(
            f'/api/v1/tools/tools/{self.tool.id}/dispose/',
            {'reason': 'Daño irreparable'}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.tool.refresh_from_db()
        self.assertEqual(self.tool.status, Tool.Status.DISPOSED)

    def test_overdue_tool(self):
        ToolLoan.objects.create(
            tool=self.tool,
            technician=self.technician,
            loaned_by=self.almacenista,
            expected_return_at=timezone.now() - timedelta(days=1),
        )
        self.assertTrue(self.tool.is_overdue())
