from django.utils import timezone
from django.db.models import Sum
from decimal import Decimal
from django.core.exceptions import ValidationError

from ..models import OperacionActivo, Activo, Broker
from .broker_service import calcular_estadisticas_broker


from .precioActivo_service import obtener_ultimo_precio
from .cotizacionMoneda_service import obtener_ultima_cotizacion


ZERO = Decimal("0")


def cantidad_disponible_activo(activo):
    compras = ( OperacionActivo.objects .filter( activo=activo, tipo="compra" ) .aggregate(total=Sum("cantidad"))["total"] or ZERO )

    ventas = ( OperacionActivo.objects .filter(activo=activo,tipo="venta") .aggregate(total=Sum("cantidad"))["total"] or ZERO )

    return compras - ventas


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


def obtener_activos_estadisticas():
    posiciones = {}

    # Obtener posiciones de todos los brokers
    for broker in Broker.objects.filter(activo=True):
        estadisticas = calcular_estadisticas_broker(
            broker=broker,
            fecha_corte=timezone.localdate()
        )

        for posicion in estadisticas["activos"]:
            activo_id = posicion["activo_id"]

            if activo_id not in posiciones:
                posiciones[activo_id] = {
                    "cantidad": ZERO,
                    "capital_invertido": ZERO,
                }

            posiciones[activo_id]["cantidad"] += posicion["cantidad"]
            posiciones[activo_id]["capital_invertido"] += (
                posicion["capital_invertido_cop"]
            )

    cantidad_activos = 0
    capital_invertido = ZERO
    valor_actual = ZERO

    activos = Activo.objects.filter(
        activo=True,
        id__in=posiciones.keys()
    ).select_related("moneda")

    for activo in activos:
        posicion = posiciones[activo.id]

        cantidad = posicion["cantidad"]
        capital = posicion["capital_invertido"]

        if cantidad <= ZERO:
            continue

        cantidad_activos += 1
        capital_invertido += capital

        precio = obtener_ultimo_precio(activo)
        cotizacion = obtener_ultima_cotizacion(activo.moneda)

        if precio is None or cotizacion is None:
            continue

        valor_actual += cantidad * precio.precio * cotizacion.valor

    return {
        "cantidad": cantidad_activos,
        "capital_invertido": capital_invertido,
        "valor_actual": valor_actual,
        "ganancia": valor_actual - capital_invertido,
    }