from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

from ..models import PrecioActivo


ZERO = Decimal("0")

def crear_precio_activo(*, activo, fecha, precio):

    if fecha > timezone.localdate():
        raise ValidationError({
            "fecha": "No puedes registrar un precio futuro."
        })

    if precio <= 0:
        raise ValidationError({
            "precio": "El precio debe ser mayor a 0."
        })

    return PrecioActivo.objects.create(
        activo=activo,
        fecha=fecha,
        precio=precio,
    )


def obtener_precio_activo(activo, fecha):
    """
    Obtiene el precio histórico exacto del activo.
    """
    precio = PrecioActivo.objects.filter(
        activo=activo,
        fecha=fecha,
    ).first()

    if not precio:
        raise ValidationError(
            f"No existe precio de {activo.ticker} para {fecha}."
        )

    return precio.precio

def obtener_ultimo_precio(activo):
    return (
        PrecioActivo.objects
        .filter(activo=activo)
        .order_by("-fecha", "-id")
        .first()
    )
