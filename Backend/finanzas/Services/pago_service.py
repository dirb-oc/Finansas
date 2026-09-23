from ..models import PagoCredito, Movimiento
from rest_framework.exceptions import ValidationError
from django.db import transaction


@transaction.atomic
def realizar_pago_credito( compra, cuenta, monto, fecha ):
    # -------------------------
    # Validaciones

    if not compra.tarjeta.activa:
        raise ValidationError(
            "La tarjeta está inactiva."
        )

    if monto <= 0:
        raise ValidationError(
            "El monto del pago debe ser mayor a cero."
        )

    if compra.saldo_pendiente <= 0:
        raise ValidationError(
            "Esta compra ya está saldada."
        )

    if monto > compra.saldo_pendiente:
        raise ValidationError(
            "El pago supera el saldo pendiente de la compra."
        )

    if cuenta.saldo_actual() < monto:
        raise ValidationError(
            "La cuenta no tiene saldo suficiente."
        )

    # -------------------------
    # Crear movimiento
    # -------------------------

    movimiento = Movimiento.objects.create(
        cuenta=cuenta,
        tipo=compra.tipo,
        monto=monto,
        descripcion=f"Pago tarjeta - {compra}",
        fecha=fecha
    )

    # -------------------------
    # Crear pago
    # -------------------------

    pago = PagoCredito.objects.create(
        compra=compra,
        movimiento=movimiento,
        monto=monto,
        fecha=fecha
    )

    # -------------------------
    # Actualizar estado
    # -------------------------

    if compra.saldo_pendiente <= 0:
        compra.estado = "saldada"
    else:
        compra.estado = "pagando"

    compra.save(update_fields=["estado"])

    return pago


@transaction.atomic
def editar_pago_credito( pago, cuenta, monto, fecha ):
    # -------------------------
    # Obtener objetos
    # -------------------------

    compra = pago.compra
    movimiento = pago.movimiento

    # -------------------------
    # Validaciones
    # -------------------------

    if not compra.tarjeta.activa:
        raise ValidationError(
            "La tarjeta está inactiva."
        )

    if monto <= 0:
        raise ValidationError(
            "El monto del pago debe ser mayor a cero."
        )

    # -------------------------
    # Calcular saldo pendiente
    # ignorando el pago actual
    # -------------------------

    saldo_pendiente = (
        compra.saldo_pendiente + pago.monto
    )

    if monto > saldo_pendiente:
        raise ValidationError(
            "El pago supera el saldo pendiente de la compra."
        )

    # -------------------------
    # Saldo de la cuenta
    # ignorando el movimiento actual
    # -------------------------

    saldo_cuenta = (
        cuenta.saldo_actual() + movimiento.monto
        if movimiento.cuenta_id == cuenta.id
        else cuenta.saldo_actual()
    )

    if saldo_cuenta < monto:
        raise ValidationError(
            "La cuenta no tiene saldo suficiente."
        )

    # -------------------------
    # Actualizar movimiento
    # -------------------------

    movimiento.cuenta = cuenta
    movimiento.monto = monto
    movimiento.fecha = fecha
    movimiento.save( update_fields=[ "cuenta", "monto", "fecha" ] )

    # -------------------------
    # Actualizar pago
    # -------------------------

    pago.cuenta = None  # NO usar si tu modelo no tiene este campo
    pago.monto = monto
    pago.fecha = fecha
    pago.save(
        update_fields=[
            "monto",
            "fecha"
        ]
    )

    # -------------------------
    # Actualizar estado
    # -------------------------

    if compra.saldo_pendiente <= 0:
        compra.estado = "saldada"
    elif compra.total_pagado > 0:
        compra.estado = "pagando"
    else:
        compra.estado = "pendiente"

    compra.save(update_fields=["estado"])

    return pago