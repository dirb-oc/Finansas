from .models import ( CompraCredito, PagoCredito, Movimiento, TipoMovimiento, )
from rest_framework.exceptions import ValidationError
from django.db import transaction

@transaction.atomic
def crear_compra_credito( tarjeta, tipo, monto, descripcion, fecha_compra, numero_cuotas, ):
    
    if not tarjeta.activa:
        raise ValidationError(
            "La tarjeta está inactiva."
        )

    if monto <= 0:
        raise ValidationError(
            "El monto debe ser mayor a cero."
        )

    if numero_cuotas <= 0:
        raise ValidationError(
            "La cantidad de cuotas debe ser mayor a cero."
        )

    if monto > tarjeta.cupo_disponible:
        raise ValidationError(
            "El monto supera el cupo disponible."
        )

    return CompraCredito.objects.create(
        tarjeta=tarjeta,
        tipo=tipo,
        monto=monto,
        descripcion=descripcion,
        fecha_compra=fecha_compra,
        numero_cuotas=numero_cuotas,
        estado="pendiente",
    )

@transaction.atomic
def realizar_pago_credito(compra, cuenta, monto, fecha):

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

    pago = PagoCredito.objects.create(
        compra=compra,
        cuenta=cuenta,
        monto=monto,
        fecha=fecha
    )

    Movimiento.objects.create(
        cuenta=cuenta,
        tipo=compra.tipo,
        monto=monto,
        descripcion=f"Pago tarjeta - {compra}",
        fecha=fecha
    )

    if pago.compra.saldo_pendiente <= 0:
        compra.estado = "saldada"
    else:
        compra.estado = "pagando"

    compra.save(update_fields=["estado"])

    return pago