from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import RendimientoCuenta
from finanzas.models import TipoMovimiento
from finanzas.Services.movimiento_service import crear_movimiento


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
    rendimientos = (
        RendimientoCuenta.objects
        .select_related(
            "movimiento",
            "movimiento__cuenta",
        )
        .order_by("-movimiento__fecha")
    )

    return [
        {
            "id": rendimiento.id,
            "cuenta": rendimiento.movimiento.cuenta.nombre,
            "monto": rendimiento.movimiento.monto,
            "saldo_cuenta": rendimiento.saldo_cuenta,
            "fecha": rendimiento.movimiento.fecha,
        }
        for rendimiento in rendimientos
    ]