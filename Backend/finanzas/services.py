from .models import ( CompraCredito, PagoCredito, Movimiento, )
from rest_framework.exceptions import ValidationError
from django.db import transaction

from django.utils import timezone
from dateutil.relativedelta import relativedelta

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

def calcular_ciclo_actual(tarjeta):
    hoy = timezone.localdate()

    if hoy.day <= tarjeta.dia_corte:
        fin_ciclo = hoy.replace(day=tarjeta.dia_corte)
    else:
        fin_ciclo = (
            hoy + relativedelta(months=1)
        ).replace(day=tarjeta.dia_corte)

    inicio_ciclo = (
        fin_ciclo - relativedelta(months=1)
    ).replace(day=tarjeta.dia_corte + 1)

    dias_restantes = (fin_ciclo - hoy).days

    return {
        "inicio": inicio_ciclo,
        "fin": fin_ciclo,
        "dias_restantes": dias_restantes,
    }

def get_proximo_pago(tarjeta, meses_a_revisar=12):
    hoy = timezone.localdate()

    compras = tarjeta.compras.filter(
        estado__in=["pendiente", "pagando"]
    ).prefetch_related("pagos")

    if not compras.exists():
        return {
            "fecha": None,
            "monto": 0,
        }

    # ---------------------------------------------------------
    # Determinar el último corte ocurrido
    # ---------------------------------------------------------

    if hoy.day > tarjeta.dia_corte:
        ultimo_corte = hoy.replace(
            day=tarjeta.dia_corte
        )
    else:
        ultimo_corte = (
            hoy - relativedelta(months=1)
        ).replace(
            day=tarjeta.dia_corte
        )

    # ---------------------------------------------------------
    # Revisar ciclos futuros
    # ---------------------------------------------------------

    for i in range(meses_a_revisar):

        fin_ciclo = (
            ultimo_corte
            + relativedelta(months=i + 1)
        )

        inicio_ciclo = (
            fin_ciclo
            - relativedelta(months=1)
        ).replace(
            day=tarjeta.dia_corte + 1
        )

        # -----------------------------------------------------
        # Fecha real de pago
        # -----------------------------------------------------

        fecha_pago = fin_ciclo.replace(
            day=tarjeta.dia_pago
        )

        # Si el día de pago ya pasó respecto al corte,
        # el pago pertenece al mes siguiente.
        if fecha_pago <= fin_ciclo:
            fecha_pago += relativedelta(months=1)

        # -----------------------------------------------------
        # Calcular deuda correspondiente al ciclo
        # -----------------------------------------------------

        monto_ciclo = 0

        for compra in compras:

            if not (
                inicio_ciclo
                <= compra.fecha_compra
                <= fin_ciclo
            ):
                continue

            valor_cuota = (
                compra.monto / compra.numero_cuotas
            )

            pagos = sum(
                pago.monto
                for pago in compra.pagos.all()
            )

            saldo = compra.monto - pagos

            if saldo <= 0:
                continue

            # Cuotas que todavía corresponden a la compra
            cuotas = min(
                compra.numero_cuotas,
                max(
                    1,
                    int(
                        saldo / valor_cuota
                    )
                )
            )

            monto_ciclo += valor_cuota

        # -----------------------------------------------------
        # Encontramos un pago real
        # -----------------------------------------------------

        if monto_ciclo > 0:
            return {
                "fecha": fecha_pago,
                "monto": monto_ciclo,
            }

    return {
        "fecha": None,
        "monto": 0,
    }