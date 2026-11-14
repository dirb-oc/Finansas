from decimal import Decimal

from django.db.models import Sum, Q
from django.db import transaction

from ..models import ( Movimiento, Cuenta )
from rest_framework.exceptions import ValidationError
from dateutil.relativedelta import relativedelta
from django.db.models.functions import TruncMonth
from django.utils import timezone

ZERO = Decimal("0")

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


def saldo_total_cuentas_hasta(fecha):
    return sum((saldo_cuenta_hasta(cuenta, fecha)for cuenta in Cuenta.objects.all()),ZERO)


def saldo_cuenta_hasta(cuenta, fecha):
    ingresos = (
        Movimiento.objects
        .filter(
            cuenta=cuenta,
            fecha__lte=fecha,
            tipo__tipo="ingreso"
        )
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    gastos = (
        Movimiento.objects
        .filter(
            cuenta=cuenta,
            fecha__lte=fecha,
            tipo__tipo="gasto"
        )
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    inicial = (
        Movimiento.objects
        .filter(
            cuenta=cuenta,
            fecha__lte=fecha,
            tipo__tipo="inicial"
        )
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    return inicial + ingresos - gastos

def get_flujo_cuenta(cuenta, cantidad=3):
    hoy = timezone.localtime(timezone.now())

    inicio_periodo = (
        hoy.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )
        - relativedelta(months=cantidad - 1)
    )

    fin_periodo = (
        hoy.replace(
            day=1,
            hour=0,
            minute=0,
            second=0,
            microsecond=0
        )
        + relativedelta(months=1)
    )

    movimientos = (
        Movimiento.objects
        .filter(
            cuenta=cuenta,
            fecha__gte=inicio_periodo,
            fecha__lt=fin_periodo,
            tipo__tipo__in=["ingreso", "gasto"]
        )
        .annotate(mes=TruncMonth("fecha"))
        .values("mes")
        .annotate(
            ingresos=Sum(
                "monto",
                filter=Q(tipo__tipo="ingreso")
            ),
            gastos=Sum(
                "monto",
                filter=Q(tipo__tipo="gasto")
            )
        )
        .order_by("mes")
    )

    resultados = {
        item["mes"].strftime("%Y-%m"): item
        for item in movimientos
    }

    flujo = []

    for i in range(cantidad - 1, -1, -1):
        fecha = inicio_periodo + relativedelta(months=i)
        mes = fecha.strftime("%Y-%m")

        datos = resultados.get(mes, {})

        ingresos = datos.get("ingresos") or 0
        gastos = datos.get("gastos") or 0

        flujo.append({
            "mes": mes,
            "ingresos": ingresos,
            "gastos": gastos,
            "balance": ingresos - gastos
        })

    return flujo