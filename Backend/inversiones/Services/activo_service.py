from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal

from ..models import OperacionActivo, Activo
from .precioActivo_service import obtener_precio_activo_historico
from .cotizacionMoneda_service import obtener_cotizacion_moneda_historica


ZERO = Decimal("0")

def obtener_activos_estadisticas():
    activos = (
        Activo.objects
        .filter(activo=True)
        .select_related("moneda")
    )

    resultado = []

    for activo in activos:
        cantidad = cantidad_disponible_activo(activo)

        if cantidad <= ZERO:
            continue

        precio = obtener_precio_activo_historico( activo, timezone.localdate(), )
        cotizacion = obtener_cotizacion_moneda_historica( activo.moneda, timezone.localdate(), )
        precio_actual = ( precio.precio if precio else ZERO )
        cotizacion_actual = ( cotizacion if cotizacion is not None else ZERO )
        valor_actual = ( cantidad * precio_actual * cotizacion_actual )
        capital_invertido = costo_invertido_activo(activo)

        resultado.append({
            "id": activo.id,
            "ticker": activo.ticker,
            "nombre": activo.nombre,
            "tipo": activo.tipo,
            "moneda": activo.moneda.codigo,
            "cantidad": cantidad,
            "precio_actual": precio_actual,
            "valor_actual": valor_actual,
            "capital_invertido": capital_invertido,
        })

    return resultado

def cantidad_disponible_activo(activo):
    compras = (
        OperacionActivo.objects
        .filter( activo=activo, tipo="compra" )
        .aggregate(total=Sum("cantidad"))["total"]
        or ZERO
    )

    ventas = (
        OperacionActivo.objects
        .filter(activo=activo,tipo="venta")
        .aggregate(total=Sum("cantidad"))["total"]
        or ZERO
    )

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


def costo_invertido_activo(activo):
    """
    Capital histórico que permanece invertido actualmente
    en un activo, usando costo promedio ponderado.
    """
    operaciones = (
        OperacionActivo.objects
        .filter(activo=activo)
        .select_related("movimiento")
        .order_by("movimiento__fecha", "id")
    )

    cantidad = ZERO
    costo = ZERO

    for operacion in operaciones:

        if operacion.tipo == "compra":
            cantidad += operacion.cantidad
            costo += operacion.movimiento.monto

        elif operacion.tipo == "venta":
            if cantidad <= ZERO:
                continue

            costo_promedio = costo / cantidad
            costo_vendido = operacion.cantidad * costo_promedio

            cantidad -= operacion.cantidad
            costo -= costo_vendido

    return costo


def costo_invertido_activo_hasta(activo, fecha):
    
    operaciones = (
        OperacionActivo.objects
        .filter(
            activo=activo,
            movimiento__fecha__date__lte=fecha,
        )
        .select_related("movimiento")
        .order_by("movimiento__fecha", "id")
    )

    cantidad = ZERO
    costo = ZERO

    for operacion in operaciones:

        if operacion.tipo == "compra":
            cantidad += operacion.cantidad
            costo += operacion.movimiento.monto

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
            movimiento__fecha__date__lte=fecha,
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
            costo_invertido_activo(activo)
            for activo in Activo.objects.filter(activo=True)
        ),
        ZERO
    )