from rest_framework import permissions


class IsAlmacenistaOrAdmin(permissions.BasePermission):
    """Permite escritura solo a admin o almacenista. Técnicos solo lectura y préstamos propios."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role in ('admin', 'almacenista'):
            return True

        if request.user.role == 'tecnico':
            return request.method in permissions.SAFE_METHODS

        return False
