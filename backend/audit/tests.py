from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from audit.models import AuditLog
from audit.middleware import AuditMiddleware

User = get_user_model()


class AuditMiddlewareTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='almacenista@armada.mil',
            password='testpass123',
            name='Almacenista Uno',
            role=User.Role.ALMACENISTA
        )

    def test_audit_log_created_on_user_update(self):
        self.user.name = 'Almacenista Actualizado'
        self.user.save()
        log = AuditLog.objects.first()
        self.assertIsNotNone(log)
        self.assertEqual(log.model_name, 'accounts.user')
        self.assertEqual(log.action, AuditLog.Action.UPDATE)


class AuditLogModelTests(TestCase):
    def test_audit_log_str(self):
        log = AuditLog.objects.create(
            action=AuditLog.Action.CREATE,
            model_name='accounts.user',
            object_id='1',
            changes={'name': 'Test'},
        )
        self.assertIn('CREATE', str(log))
