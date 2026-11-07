from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

from ..models import CotizacionMoneda


def crear_cotizacion_moneda(*, moneda, fecha, valor):

    if fecha > timezone.localdate():
        raise ValidationError({
            "fecha": "No puedes registrar una cotización futura."
        })

    if valor <= 0:
        raise ValidationError({
            "valor": "El valor debe ser mayor a 0."
        })

    return CotizacionMoneda.objects.create(
        moneda=moneda,
        fecha=fecha,
        valor=valor
    )


def obtener_cotizacion(moneda, fecha):
    """
    Obtiene la cotización exacta de una moneda en una fecha.
    No utiliza cotizaciones de días anteriores.
    """

    if moneda.codigo == "COP":
        return Decimal("1")
    
    cotizacion = CotizacionMoneda.objects.filter(
        moneda=moneda,
        fecha=fecha,
    ).first()

    if not cotizacion:
        raise ValidationError(
            f"No existe cotización de {moneda.codigo} para {fecha}."
        )

    return cotizacion.valor

def obtener_ultima_cotizacion(moneda):
    return (
        CotizacionMoneda.objects
        .filter(moneda=moneda)
        .order_by("-fecha", "-id")
        .first()
    )