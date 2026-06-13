from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.migrations.recorder import MigrationRecorder
from .models import AuditLog
from .middleware import get_current_request


@receiver(post_save)
def log_save(sender, instance, created, **kwargs):
    if sender == AuditLog or sender == MigrationRecorder.Migration:
        return

    request = get_current_request()
    user = request.user if request and request.user.is_authenticated else None
    ip = request.META.get('REMOTE_ADDR') if request else None

    action = AuditLog.Action.CREATE if created else AuditLog.Action.UPDATE
    changes = {}
    if not created and hasattr(instance, 'get_dirty_fields'):
        changes = instance.get_dirty_fields()

    AuditLog.objects.create(
        action=action,
        model_name=f"{sender._meta.app_label}.{sender._meta.model_name}",
        object_id=str(instance.pk),
        changes=changes,
        user=user,
        ip_address=ip,
    )


@receiver(post_delete)
def log_delete(sender, instance, **kwargs):
    if sender == AuditLog or sender == MigrationRecorder.Migration:
        return

    request = get_current_request()
    user = request.user if request and request.user.is_authenticated else None
    ip = request.META.get('REMOTE_ADDR') if request else None

    AuditLog.objects.create(
        action=AuditLog.Action.DELETE,
        model_name=f"{sender._meta.app_label}.{sender._meta.model_name}",
        object_id=str(instance.pk),
        changes={},
        user=user,
        ip_address=ip,
    )
