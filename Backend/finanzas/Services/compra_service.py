from ..models import ( CompraCredito )
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
def editar_compra_credito( compra, tarjeta, tipo, monto, descripcion, fecha_compra, numero_cuotas, ):
    
    # -------------------------
    # Validaciones

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

    # -------------------------
    # Calcular cupo disponible
    # ignorando la compra actual

    cupo_disponible = ( tarjeta.cupo_disponible + compra.monto )

    if monto > cupo_disponible:
        raise ValidationError(
            "El monto supera el cupo disponible."
        )

    # -------------------------
    # Actualizar compra

    compra.tarjeta = tarjeta
    compra.tipo = tipo
    compra.monto = monto
    compra.descripcion = descripcion
    compra.fecha_compra = fecha_compra
    compra.numero_cuotas = numero_cuotas

    compra.save()

    return compra