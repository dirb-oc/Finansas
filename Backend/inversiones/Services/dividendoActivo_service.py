from decimal import Decimal
from django.db.models import Sum
from django.db import transaction
from django.core.exceptions import ValidationError

from ..models import DividendoActivo, CotizacionMoneda

from finanzas.Services.movimiento_service import crear_movimiento
from finanzas.models import TipoMovimiento

ZERO = Decimal("0")

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
    total = (
        DividendoActivo.objects
        .aggregate(total=Sum("movimiento__monto"))["total"]
        or ZERO
    )

    cantidad = DividendoActivo.objects.count()

    return {
        "cantidad": cantidad,
        "total": total,
    }