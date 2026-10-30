from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from ..models import OperacionActivo, Activo, PrecioActivo
from .precioActivo_service import obtener_precio_activo_historico
from .cotizacionMoneda_service import obtener_cotizacion_moneda_historica
from .broker_service import calcular_estadisticas_broker

from ..models import Broker


ZERO = Decimal("0")

def obtener_activos_estadisticas():
    activos = Activo.objects.filter(activo=True)

    cantidad_activos = 0
    capital_invertido = ZERO
    valor_actual = ZERO

    for activo in activos:
        cantidad = cantidad_disponible_activo(activo)

        if cantidad <= ZERO:
            continue

        precio = obtener_precio_activo_historico(
            activo,
            timezone.localdate()
        )

        cotizacion = obtener_cotizacion_moneda_historica(
            activo.moneda,
            timezone.localdate()
        )

        if precio is None or cotizacion is None:
            continue

        cantidad_activos += 1

        capital_invertido += costo_invertido_activo(activo)
        valor_actual += cantidad * precio.precio * cotizacion

    return {
        "cantidad": cantidad_activos,
        "capital_invertido": capital_invertido,
        "valor_actual": valor_actual,
        "ganancia": valor_actual - capital_invertido,
    }

def cantidad_disponible_activo(activo):
    compras = ( OperacionActivo.objects .filter( activo=activo, tipo="compra" ) .aggregate(total=Sum("cantidad"))["total"] or ZERO )

    ventas = ( OperacionActivo.objects .filter(activo=activo,tipo="venta") .aggregate(total=Sum("cantidad"))["total"] or ZERO )

    return compras - ventas


def obtener_activos_en_cartera():
    activos = (
        Activo.objects
        .filter(activo=True)
        .select_related("moneda")
        .order_by("ticker")
    )

    resultado = []

    for activo in activos:
        cantidad = cantidad_disponible_activo(activo)

        if cantidad <= 0:
            continue

        resultado.append({
            "id": activo.id,
            "ticker": activo.ticker,
            "nombre": activo.nombre,
            "tipo": activo.tipo,
            "cantidad": cantidad,
            "moneda": activo.moneda.codigo,
        })

    return resultado


def get_ganancia_ventas_periodo(inicio, fin):
    ventas = (
        OperacionActivo.objects
        .filter(
            tipo="venta",
            movimiento__fecha__gte=inicio,
            movimiento__fecha__lt=fin,
        )
        .select_related("activo", "movimiento")
        .order_by("movimiento__fecha", "id")
    )

    ganancia_total = ZERO

    for venta in ventas:

        operaciones_anteriores = (
            OperacionActivo.objects
            .filter(
                activo=venta.activo,
                movimiento__fecha__lte=venta.movimiento.fecha,
                id__lt=venta.id,
            )
            .select_related("movimiento")
            .order_by("movimiento__fecha", "id")
        )

        cantidad = ZERO
        costo = ZERO

        for operacion in operaciones_anteriores:

            if operacion.tipo == "compra":
                cantidad += operacion.cantidad
                costo += operacion.movimiento.monto

            elif operacion.tipo == "venta":

                if cantidad <= ZERO:
                    continue

                costo_promedio = costo / cantidad
                costo_vendido = operacion.cantidad * costo_promedio

                costo -= costo_vendido
                cantidad -= operacion.cantidad

        if cantidad <= ZERO:
            continue

        costo_promedio = costo / cantidad
        costo_vendido = venta.cantidad * costo_promedio

        ganancia_total += ( venta.movimiento.monto - costo_vendido )

    return ganancia_total


def costo_invertido_activo( activo, broker=None):
    """
    Capital histórico que permanece invertido actualmente
    en un activo, usando costo promedio ponderado.

    El resultado está expresado en la moneda del activo.
    """

    operaciones = (
        OperacionActivo.objects
        .filter(activo=activo)
        .select_related("activo")
        .order_by("fecha", "id")
    )

    cantidad = ZERO
    costo = ZERO

    for operacion in operaciones:

        precio = PrecioActivo.objects.get(
            activo=activo,
            fecha=operacion.fecha,
        )

        valor = operacion.cantidad * precio.precio

        if operacion.tipo == "compra":

            costo_operacion = valor + operacion.comision

            cantidad += operacion.cantidad
            costo += costo_operacion

        elif operacion.tipo == "venta":

            if cantidad <= ZERO:
                continue

            costo_promedio = costo / cantidad
            costo_vendido = operacion.cantidad * costo_promedio

            cantidad -= operacion.cantidad
            costo -= costo_vendido

    return costo


def costo_invertido_activo_hasta(*, activo, fecha, broker=None):
    """
    Capital histórico que permanece invertido en un activo
    hasta una fecha determinada.

    El resultado está expresado en la moneda del activo.
    """

    operaciones = (
        OperacionActivo.objects
        .filter(
            activo=activo,
            fecha__lte=fecha,
        )
        .order_by("fecha", "id")
    )

    cantidad = ZERO
    costo = ZERO

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
            costo_vendido = operacion.cantidad * costo_promedio

            cantidad -= operacion.cantidad
            costo -= costo_vendido

    return costo


def cantidad_disponible_activo_hasta(activo, fecha):
    """
    Cantidad de unidades que se poseían del activo hasta una fecha.
    """
    operaciones = (
        OperacionActivo.objects
        .filter(
            activo=activo,
            movimiento__fecha__lte=fecha,
        )
        .order_by("movimiento__fecha", "id")
    )

    cantidad = ZERO

    for operacion in operaciones:
        if operacion.tipo == "compra":
            cantidad += operacion.cantidad

        elif operacion.tipo == "venta":
            cantidad -= operacion.cantidad

    return cantidad


def costo_invertido_activos():
    return sum(
        (
            costo_invertido_activo(
                activo=operacion.activo,
                broker=operacion.broker,
            )
            for operacion in OperacionActivo.objects
                .select_related("activo", "broker")
                .distinct("activo", "broker")
        ),
        ZERO,
    )


def obtener_activos_actuales(fecha_corte):
    inversiones = []

    activos = {
        activo.id: activo
        for activo in Activo.objects.filter(activo=True)
    }

    brokers = Broker.objects.filter(activo=True)

    for broker in brokers:
        estadisticas = calcular_estadisticas_broker(
            broker=broker,
            fecha_corte=fecha_corte,
        )

        capital_total = estadisticas[
            "capital_historico_total_cop"
        ]

        if capital_total <= ZERO:
            continue

        for posicion in estadisticas["activos"]:
            activo = activos.get(posicion["activo_id"])

            if activo is None:
                continue

            costo_cop = posicion["capital_invertido_cop"]

            if costo_cop <= ZERO:
                continue

            porcentaje = (
                costo_cop / capital_total * Decimal("100")
            ).quantize(Decimal("0.01"))

            inversiones.append({
                "tipo": activo.tipo,
                "nombre": activo.nombre,
                "ticker": activo.ticker,
                "broker": broker.nombre,
                "monto": costo_cop,
                "moneda": "COP",
                "porcentaje_broker": porcentaje,
            })

    return inversiones


def valor_activos_historico(fecha):
    total = ZERO

    for broker in Broker.objects.filter(activo=True):
        estadisticas = calcular_estadisticas_broker(
            broker=broker,
            fecha_corte=fecha,
        )

        total += estadisticas["capital_historico_activos_cop"]

    return total