from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTests(TestCase):
    def test_create_user_with_email(self):
        user = User.objects.create_user(email='tecnico@armada.mil', password='testpass123', name='Técnico Uno')
        self.assertEqual(user.email, 'tecnico@armada.mil')
        self.assertEqual(user.role, User.Role.TECNICO)
        self.assertTrue(user.check_password('testpass123'))

    def test_create_superuser(self):
        admin = User.objects.create_superuser(email='admin@armada.mil', password='adminpass123', name='Admin')
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertEqual(admin.role, User.Role.ADMIN)

    def test_email_normalized(self):
        user = User.objects.create_user(email='Test@ARMADA.MIL', password='testpass123', name='Test')
        self.assertEqual(user.email, 'Test@armada.mil')


class AuthAPITests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='tecnico@armada.mil',
            password='testpass123',
            name='Técnico Uno',
            role=User.Role.TECNICO
        )

    def test_login_returns_tokens(self):
        response = self.client.post('/api/v1/auth/login/', {
            'email': 'tecnico@armada.mil',
            'password': 'testpass123',
        }, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())

    def test_me_requires_authentication(self):
        response = self.client.get('/api/v1/auth/me/')
        self.assertEqual(response.status_code, 401)

    def test_me_returns_user_data(self):
        login = self.client.post('/api/v1/auth/login/', {
            'email': 'tecnico@armada.mil',
            'password': 'testpass123',
        }, content_type='application/json')
        token = login.json()['access']
        response = self.client.get('/api/v1/auth/me/', HTTP_AUTHORIZATION=f'Bearer {token}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['email'], 'tecnico@armada.mil')
