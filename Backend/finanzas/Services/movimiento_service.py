from ..models import ( Movimiento )
from django.db.models import Sum, Q
from django.db import transaction
from rest_framework.exceptions import ValidationError

@transaction.atomic
def crear_movimiento( *, cuenta, tipo, monto, descripcion="", fecha=None ):

    """ Crea un movimiento aplicando las reglas de negocio. """
    # -------------------------
    # Validaciones básicas

    if monto <= 0:
        raise ValidationError({ "monto": "El monto debe ser mayor a 0." })

    # -------------------------
    # Regla para gastos

    if tipo.tipo == "gasto":

        saldo_actual = cuenta.saldo_actual()

        if monto > saldo_actual:
            raise ValidationError({
                "monto": (
                    f"No puedes registrar este gasto. "
                    f"El saldo disponible es {saldo_actual}"
                )
            })

    # -------------------------
    # Crear movimiento

    movimiento = Movimiento.objects.create(
        cuenta=cuenta,
        tipo=tipo,
        monto=monto,
        descripcion=descripcion,
        **({"fecha": fecha} if fecha else {})
    )

    return movimiento

@transaction.atomic
def actualizar_movimiento( *, movimiento, cuenta, tipo, monto, descripcion="", fecha=None ):
    """Actualiza un movimiento aplicando las reglas de negocio."""

    if monto <= 0:
        raise ValidationError({
            "monto": "El monto debe ser mayor a 0."
        })

    # Saldo actual excluyendo el movimiento que estamos editando
    saldo = Movimiento.objects.filter(
        cuenta=cuenta
    ).exclude(
        pk=movimiento.pk
    ).aggregate(
        ingresos=Sum(
            "monto",
            filter=Q(tipo__tipo="ingreso")
        ),
        gastos=Sum(
            "monto",
            filter=Q(tipo__tipo="gasto")
        ),
        inicial=Sum(
            "monto",
            filter=Q(tipo__tipo="inicial")
        )
    )

    ingresos = saldo["ingresos"] or 0
    gastos = saldo["gastos"] or 0
    inicial = saldo["inicial"] or 0

    saldo_disponible = inicial + ingresos - gastos

    # Validar gasto
    if tipo.tipo == "gasto" and monto > saldo_disponible:
        raise ValidationError({
            "monto": (
                f"No puedes registrar este gasto. "
                f"El saldo disponible es {saldo_disponible}."
            )
        })

    # Actualizar movimiento
    movimiento.cuenta = cuenta
    movimiento.tipo = tipo
    movimiento.monto = monto
    movimiento.descripcion = descripcion

    if fecha is not None:
        movimiento.fecha = fecha

    movimiento.save()

    return movimiento