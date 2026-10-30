from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .broker_service import validar_saldo_broker

from finanzas.models import TipoMovimiento


from ..models import ( MovimientoBroker, CotizacionMoneda, )

from finanzas.Services.movimiento_service import crear_movimiento


@transaction.atomic
def crear_movimiento_broker( *, broker, cuenta, moneda, monto, costo=0, tipo, fecha, ):
    """
    Crea un movimiento entre una Cuenta y un Broker.

    MovimientoBroker:
        Representa el movimiento dentro del broker.

    Movimiento:
        Representa el impacto real sobre la Cuenta en COP.
    """

    # -----------------------------------
    # Fecha
    # -----------------------------------

    print(fecha)
    fecha = fecha or timezone.localdate()

    # -----------------------------------
    # Validaciones básicas
    # -----------------------------------

    if monto <= 0:
        raise ValidationError({
            "monto": "El monto debe ser mayor a 0."
        })

    if costo < 0:
        raise ValidationError({
            "costo": "El costo no puede ser negativo."
        })

    # -----------------------------------
    # Validar moneda del broker
    # -----------------------------------

    if not broker.monedas.filter(pk=moneda.pk).exists():
        raise ValidationError({
            "moneda": (
                f"El broker {broker.nombre} "
                f"no maneja la moneda {moneda.codigo}."
            )
        })

    # -----------------------------------
    # Buscar cotización exacta
    # -----------------------------------

    cotizacion = CotizacionMoneda.objects.filter(
        moneda=moneda,
        fecha=fecha,
    ).first()

    if not cotizacion:
        raise ValidationError({
            "fecha": (
                f"No existe una cotización para "
                f"{moneda.codigo} en la fecha {fecha}."
            )
        })

    # -----------------------------------
    # Convertir a COP
    # -----------------------------------

    valor_cop = monto * cotizacion.valor

    # -----------------------------------
    # Determinar movimiento financiero
    # -----------------------------------

    if tipo == "entrada":
        # Dinero entra al broker.
        # Por lo tanto sale de la cuenta.

        monto_movimiento = valor_cop + costo

        tipo_obj, _ = TipoMovimiento.objects.get_or_create(
            nombre="Inversión",
            tipo="gasto",
        )

        descripcion = (
            f"Transferencia de {monto} {moneda.codigo} "
            f"a {broker.nombre}"
        )

    elif tipo == "salida":

        # Broker → Cuenta
        validar_saldo_broker( broker=broker, moneda=moneda, monto=monto, )

        if valor_cop < costo:
            raise ValidationError({
                "costo": (
                    "El costo no puede ser mayor "
                    "al valor convertido del movimiento."
                )
            })

        monto_movimiento = valor_cop - costo

        tipo_obj, _ = TipoMovimiento.objects.get_or_create(
            nombre="Reintegro de inversión",
            tipo="ingreso",
        )

        descripcion = (
            f"Retiro de {monto} {moneda.codigo} "
            f"desde {broker.nombre}"
        )

    else:
        raise ValidationError({
            "tipo": "El tipo debe ser 'entrada' o 'salida'."
        })

    # -----------------------------------
    # Obtener TipoMovimiento
    # -----------------------------------



    # -----------------------------------
    # Crear movimiento financiero
    # -----------------------------------

    movimiento = crear_movimiento(
        cuenta=cuenta,
        tipo=tipo_obj,
        monto=monto_movimiento,
        descripcion=descripcion,
        fecha=fecha,
    )

    # -----------------------------------
    # Crear movimiento del broker
    # -----------------------------------

    movimiento_broker = MovimientoBroker.objects.create(
        broker=broker,
        moneda=moneda,
        tipo=tipo,
        costo=costo,
        monto=monto,
        movimiento=movimiento,
    )

    return movimiento_broker