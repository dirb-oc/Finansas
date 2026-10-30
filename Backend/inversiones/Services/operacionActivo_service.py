from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import OperacionActivo, PrecioActivo
from .activo_service import cantidad_disponible_activo
from .broker_service import obtener_saldo_broker


@transaction.atomic
def crear_operacion_activo( *, activo, broker, tipo, cantidad, fecha, comision=0, ):

    if cantidad <= 0:
        raise ValidationError({
            "cantidad": "La cantidad debe ser mayor a 0."
        })

    if comision < 0:
        raise ValidationError({
            "comision": "La comisión no puede ser negativa."
        })

    if tipo not in ("compra", "venta"):
        raise ValidationError({
            "tipo": "El tipo de operación no es válido."
        })

    precio = PrecioActivo.objects.filter( activo=activo, fecha=fecha, ).first()

    if not precio:
        raise ValidationError({
            "fecha": (
                "No existe un precio registrado para el activo "
                "en la fecha de la operación."
            )
        })

    monto = cantidad * precio.precio

    if tipo == "compra":

        costo = monto + comision

        saldo = obtener_saldo_broker( broker=broker, moneda=activo.moneda, )

        if costo > saldo:
            raise ValidationError({
                "cantidad": (
                    f"Saldo insuficiente en {activo.moneda.codigo}. "
                    f"Disponible: {saldo}."
                )
            })

    else:

        disponible = cantidad_disponible_activo( 
            # broker=broker, 
            activo=activo, 
        )

        if cantidad > disponible:
            raise ValidationError({
                "cantidad": (
                    f"No puedes vender {cantidad} unidades de "
                    f"{activo.ticker}. "
                    f"Solo tienes {disponible} disponibles."
                )
            })

        costo = monto - comision

    return OperacionActivo.objects.create(
        activo=activo,
        broker=broker,
        tipo=tipo,
        cantidad=cantidad,
        comision=comision,
        fecha=fecha,
    )