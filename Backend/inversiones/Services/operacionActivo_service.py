from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import OperacionActivo, PrecioActivo, CotizacionMoneda
from finanzas.models import TipoMovimiento
from finanzas.Services.movimiento_service import crear_movimiento
from .activo_service import cantidad_disponible_activo


@transaction.atomic
def crear_operacion_activo( *, activo, cuenta, tipo, cantidad, fecha, comision=Decimal("0"), ):
    # -------------------------
    # Validaciones básicas
    # -------------------------

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

    # -------------------------
    # Validar cantidad disponible
    # -------------------------

    if tipo == "venta":
        disponible = cantidad_disponible_activo(activo)

        if cantidad > disponible:
            raise ValidationError({
                "cantidad": (
                    f"No puedes vender {cantidad} unidades de "
                    f"{activo.ticker}. "
                    f"Solo tienes {disponible} disponibles."
                )
            })

    # -------------------------
    # Obtener precio del activo
    # -------------------------

    try:
        precio = PrecioActivo.objects.get(
            activo=activo,
            fecha=fecha
        )
    except PrecioActivo.DoesNotExist:
        raise ValidationError({
            "fecha": (
                "No existe un precio registrado para el activo "
                "en la fecha de la operación."
            )
        })

    # -------------------------
    # Obtener tasa de cambio
    # -------------------------

    try:
        cotizacion = CotizacionMoneda.objects.get(
            moneda=activo.moneda,
            fecha=fecha
        )
    except CotizacionMoneda.DoesNotExist:
        raise ValidationError({
            "fecha": (
                "No existe una cotización registrada para la moneda "
                "del activo en la fecha de la operación."
            )
        })

    # -------------------------
    # Calcular valor
    # -------------------------

    monto_activo = cantidad * precio.precio

    if tipo == "compra":
        monto_total = monto_activo + comision
        nombre_tipo = "Inversión"
        tipo_movimiento = "gasto"

    else:
        monto_total = monto_activo - comision
        nombre_tipo = "Venta de activo"
        tipo_movimiento = "ingreso"

    monto_cop = monto_total * cotizacion.valor

    # -------------------------
    # Obtener tipo de movimiento
    # -------------------------

    tipo_movimiento_obj, _ = TipoMovimiento.objects.get_or_create(
        nombre=nombre_tipo,
        tipo=tipo_movimiento,
    )

    # -------------------------
    # Crear movimiento financiero
    # -------------------------

    cantidad_texto = format(cantidad.normalize(), "f")

    movimiento = crear_movimiento(
        cuenta=cuenta,
        tipo=tipo_movimiento_obj,
        monto=monto_cop,
        fecha=fecha,
        descripcion=(
            f"{tipo.capitalize()} de "
            f"{cantidad_texto} {activo.ticker}"
        ),
    )

    # -------------------------
    # Crear operación
    # -------------------------

    operacion = OperacionActivo.objects.create(
        activo=activo,
        movimiento=movimiento,
        tipo=tipo,
        cantidad=cantidad,
        comision=comision,
    )

    return operacion