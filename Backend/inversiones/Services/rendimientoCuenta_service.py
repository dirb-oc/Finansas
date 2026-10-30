from decimal import Decimal
from django.db.models import Sum
from django.db import transaction
from django.core.exceptions import ValidationError

from ..models import RendimientoCuenta
from finanzas.models import TipoMovimiento
from finanzas.Services.movimiento_service import crear_movimiento


ZERO = Decimal("0")


@transaction.atomic
def crear_rendimiento_cuenta( *, cuenta, fecha, monto, ):
    if monto <= 0:
        raise ValidationError({
            "monto": "El monto debe ser mayor a 0."
        })

    tipo_movimiento, _ = TipoMovimiento.objects.get_or_create(
        nombre="Rendimiento de cuenta",
        tipo="ingreso",
    )

    saldo_cuenta = cuenta.saldo_actual()

    movimiento = crear_movimiento(
        cuenta=cuenta,
        tipo=tipo_movimiento,
        monto=monto,
        fecha=fecha,
        descripcion=f"Rendimiento de cuenta - {cuenta.nombre}",
    )


    rendimiento = RendimientoCuenta.objects.create(
        movimiento=movimiento,
        saldo_cuenta=saldo_cuenta,
    )

    return rendimiento


def obtener_rendimientos_estadisticas():
    total = (
        RendimientoCuenta.objects
        .aggregate(total=Sum("movimiento__monto"))["total"]
        or ZERO
    )

    cantidad = RendimientoCuenta.objects.count()

    return {
        "cantidad": cantidad,
        "total": total,
    }