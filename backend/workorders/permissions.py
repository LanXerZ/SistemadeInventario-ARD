from rest_framework import permissions


class IsAlmacenistaOrAdmin(permissions.BasePermission):
    """Permite escritura solo a admin o almacenista. Técnicos solo lectura y solicitud de repuestos."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.role in ('admin', 'almacenista'):
            return True

        if request.user.role == 'tecnico':
            if request.method in permissions.SAFE_METHODS:
                return True
            # Técnicos solo pueden solicitar repuestos
            return getattr(view, 'action', None) == 'request_part'

        return False


class IsAssignedTechnicianOrAdmin(permissions.BasePermission):
    """Permite ver/actualizar una OT solo al técnico asignado o admin/almacenista."""

    def has_object_permission(self, request, view, obj):
        user = request.user

        if user.role in ('admin', 'almacenista'):
            return True

        if user.role == 'tecnico':
            if obj.technician != user:
                return False
            return request.method in permissions.SAFE_METHODS or getattr(view, 'action', None) == 'request_part'

        return False
