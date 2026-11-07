from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from django.utils.timezone import now

# from datetime import timedelta
from .CDT_service import valor_cdt_historico, obtener_cdts_actuales, obtener_cdts_estadisticas
from .activo_service import obtener_activos_actuales, obtener_activos_estadisticas, valor_activos_historico
from .dividendoActivo_service import obtener_dividendos_estadisticas
from .rendimientoCuenta_service import obtener_rendimientos_estadisticas

from finanzas.Services.movimiento_service import saldo_total_cuentas_hasta
from .broker_service import calcular_estadisticas_broker, valor_efectivo_brokers_historico
from .CDT_service import valor_cdt_no_finalizados, ganancias_cdt

from ..models import *


ZERO = Decimal("0")

def cantidad_invertida():
    fecha_corte = date.today()

    capital_total = ZERO

    brokers = Broker.objects.filter(activo=True)

    for broker in brokers:
        estadisticas = calcular_estadisticas_broker(
            broker=broker,
            fecha_corte=fecha_corte,
        )

        capital_total += estadisticas["capital_historico_activos_cop"]

    capital_total += valor_cdt_no_finalizados()

    return capital_total


def inversiones_actuales():
    fecha_corte = timezone.localdate()

    inversiones = obtener_cdts_actuales(fecha_corte)
    inversiones.extend(obtener_activos_actuales(fecha_corte))

    return inversiones


def patrimonio_historico(fecha):
    return (
        saldo_total_cuentas_hasta(fecha)
        + valor_activos_historico(fecha)
        + valor_efectivo_brokers_historico(fecha)
        + valor_cdt_historico(fecha)
    )

def ganancia_realizada():

    return ( 
        ganancias_cdt()
        + total_dividendos()
        + total_rendimientos_cuenta()
        + ganancia_ventas()
    )


def ganancia_ventas_activo(activo, broker=None):
    """
    Calcula la ganancia o pérdida realizada por las ventas
    utilizando costo promedio ponderado.

    El resultado está expresado en la moneda del activo.
    """

    operaciones = (
        OperacionActivo.objects
        .filter(
            activo=activo,
            broker=broker,
        )
        .order_by("fecha", "id")
    )

    cantidad = ZERO
    costo = ZERO
    ganancia = ZERO

    for operacion in operaciones:

        precio = PrecioActivo.objects.get(
            activo=activo,
            fecha=operacion.fecha,
        )

        valor = operacion.cantidad * precio.precio

        if operacion.tipo == "compra":

            costo += valor + operacion.comision
            cantidad += operacion.cantidad

        elif operacion.tipo == "venta":

            if cantidad <= ZERO:
                continue

            costo_promedio = costo / cantidad

            costo_vendido = (
                operacion.cantidad * costo_promedio
            )

            ingreso_venta = (
                valor - operacion.comision
            )

            ganancia += (
                ingreso_venta - costo_vendido
            )

            costo -= costo_vendido
            cantidad -= operacion.cantidad

    return ganancia


def ganancia_ventas():

    return sum(
        (
            ganancia_ventas_activo(activo)
            for activo in Activo.objects.filter(activo=True)
        ),
        ZERO
    )


def total_dividendos():
    """
    Total histórico recibido por dividendos.
    """

    return (
        DividendoActivo.objects
        .select_related("movimiento")
        .aggregate(
            total=Sum("movimiento__monto")
        )["total"]
        or ZERO
    )


def total_rendimientos_cuenta():
    """
    Total histórico recibido por rendimientos de cuentas.
    """

    return (
        RendimientoCuenta.objects
        .select_related("movimiento")
        .aggregate(
            total=Sum("movimiento__monto")
        )["total"]
        or ZERO
    )


def ganancia_no_realizada(fecha):
    ganancia_total = ZERO

    for broker in Broker.objects.filter(activo=True):
        estadisticas = calcular_estadisticas_broker(
            broker=broker,
            fecha_corte=fecha,
        )

        for posicion in estadisticas["activos"]:
            cantidad = posicion["cantidad"]

            if cantidad <= ZERO:
                continue

            activo_id = posicion["activo_id"]
            moneda_codigo = posicion["moneda"]

            precio = PrecioActivo.objects.filter(
                activo_id=activo_id,
            ).first()

            if precio is None:
                raise ValidationError(
                    f"No existe precio del activo {posicion['ticker']} "
                    f"para {fecha}."
                )

            cotizacion = CotizacionMoneda.objects.filter(
                moneda__codigo=moneda_codigo,
            ).first()

            if cotizacion is None:
                raise ValidationError(
                    f"No existe cotización de {moneda_codigo} "
                    f"para {fecha}."
                )

            valor_mercado_cop = (
                cantidad
                * precio.precio
                * cotizacion.valor
            )

            costo_historico_cop = posicion["capital_invertido_cop"]

            ganancia_total += (
                valor_mercado_cop - costo_historico_cop
            )

    return ganancia_total

def porcentaje(total, cantidad):
    return (
            (total / cantidad) * Decimal("100")
            if cantidad > 0
            else ZERO
        )

def obtener_estadisticas():
    hoy = now().date()

    realizada = ganancia_realizada()
    no_realizada = ganancia_no_realizada(hoy)
    total = realizada + no_realizada

    patrimonio_actual = patrimonio_historico(hoy)
    capital_invertido = cantidad_invertida()

    porcentaje_ganancia = porcentaje(total, patrimonio_actual)

    rentabilidad = (
        (total / capital_invertido) * Decimal("100")
        if capital_invertido > 0
        else ZERO
    )

    return {
        "patrimonio": patrimonio_actual,
        "cantidad_invertida": capital_invertido,
        "ganancia": {
            "total": total,
            "realizada": realizada,
            "no_realizada": no_realizada,
        },
        "porcentajes": {
            "ganancia_sobre_patrimonio": porcentaje_ganancia,
            "rentabilidad_total": rentabilidad,
        },
        "activos": obtener_activos_estadisticas(),
        "cdts": obtener_cdts_estadisticas(),
        "dividendos": obtener_dividendos_estadisticas(),
        "rendimientos": obtener_rendimientos_estadisticas(),
    }
