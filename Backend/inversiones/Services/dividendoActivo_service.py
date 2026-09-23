from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import DividendoActivo, CotizacionMoneda
from finanzas.models import TipoMovimiento
from finanzas.Services.movimiento_service import crear_movimiento


@transaction.atomic
def crear_dividendo_activo( *, activo, cuenta, fecha, monto, ):
    if monto <= 0:
        raise ValidationError({
            "monto": "El monto debe ser mayor a 0."
        })

    try:
        cotizacion = CotizacionMoneda.objects.get(
            moneda=activo.moneda,
            fecha=fecha
        )
    except CotizacionMoneda.DoesNotExist:
        raise ValidationError({
            "fecha": (
                "No existe una cotización registrada para la moneda "
                "del activo en esta fecha."
            )
        })

    monto_cop = monto * cotizacion.valor

    tipo_movimiento, _ = TipoMovimiento.objects.get_or_create(
        nombre="Dividendo de inversión",
        tipo="ingreso",
    )

    movimiento = crear_movimiento(
        cuenta=cuenta,
        tipo=tipo_movimiento,
        monto=monto_cop,
        fecha=fecha,
        descripcion=f"Dividendo de {activo.ticker}",
    )

    dividendo = DividendoActivo.objects.create(
        activo=activo,
        movimiento=movimiento,
        fecha=fecha,
        monto=monto,
    )

    return dividendo


def obtener_dividendos_estadisticas():
    dividendos = (
        DividendoActivo.objects
        .select_related(
            "activo",
            "movimiento",
        )
        .order_by("-movimiento__fecha")
    )

    return [
        {
            "id": dividendo.id,
            "ticker": dividendo.activo.ticker,
            "nombre": dividendo.activo.nombre,
            "monto": dividendo.movimiento.monto,
            "fecha": dividendo.movimiento.fecha,
        }
        for dividendo in dividendos
    ]