from datetime import date, datetime
from decimal import Decimal
from calendar import monthrange
from django.utils import timezone
from dateutil.relativedelta import relativedelta
from ..models import ( TarjetaCredito )


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


def calcular_minimo_tarjeta(tarjeta, fecha=None):

    if fecha is None:
        fecha = timezone.localdate()
    elif isinstance(fecha, datetime):
        fecha = timezone.localtime(fecha).date() if timezone.is_aware(fecha) else fecha.date()

    dia_corte = tarjeta.dia_corte
    dia_pago = tarjeta.dia_pago

    # 1. Determinar la siguiente fecha de pago
    if fecha.day <= dia_pago:
        anio_pago = fecha.year
        mes_pago = fecha.month
    else:
        if fecha.month == 12:
            anio_pago = fecha.year + 1
            mes_pago = 1
        else:
            anio_pago = fecha.year
            mes_pago = fecha.month + 1

    fecha_pago = date(
        anio_pago,
        mes_pago,
        min(dia_pago, monthrange(anio_pago, mes_pago)[1])
    )

    # 2. Determinar el corte correspondiente a ese pago
    if dia_corte >= dia_pago:
        if mes_pago == 1:
            anio_corte = anio_pago - 1
            mes_corte = 12
        else:
            anio_corte = anio_pago
            mes_corte = mes_pago - 1
    else:
        anio_corte = anio_pago
        mes_corte = mes_pago

    fecha_corte = date(
        anio_corte,
        mes_corte,
        min(dia_corte, monthrange(anio_corte, mes_corte)[1])
    )

    # 3. Obtener compras que entran en el ciclo
    compras = tarjeta.compras.filter(
        estado__in=["pendiente", "pagando"],
        fecha_compra__lte=fecha_corte
    )

    monto_ciclo = sum(
        (compra.valor_cuota for compra in compras),
        Decimal("0.00")
    )

    return {
        "fecha": fecha_pago,
        "monto": monto_ciclo,
    }

def get_tarjetas():
    tarjetas = []

    for tarjeta in TarjetaCredito.objects.filter(activa=True):

        deuda = tarjeta.deuda_actual

        tarjetas.append({
            "id": tarjeta.id,
            "nombre": tarjeta.nombre,
            "deuda": float(deuda),
            "proximo_pago": calcular_minimo_tarjeta(tarjeta),
            "cupo": float(tarjeta.cupo_total),
            "porcentaje": round((deuda / tarjeta.cupo_total) * 100,2
            ) if tarjeta.cupo_total else 0,
        })

        tarjetas.sort(key=lambda t: t["porcentaje"],reverse=True,)

    return tarjetas