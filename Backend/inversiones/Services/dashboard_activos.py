from decimal import Decimal
from django.core.exceptions import ValidationError
from django.utils import timezone

from ..models import (Broker,Moneda,Activo,CotizacionMoneda,PrecioActivo, MovimientoBroker, OperacionActivo )
from .precioActivo_service import obtener_precio_activo

from .broker_service import calcular_estadisticas_broker

ZERO = Decimal("0")


def obtener_tasa_cop(moneda, fecha):
    """
    Obtiene la última cotización disponible hasta una fecha.
    El resultado representa COP por unidad de moneda.
    """
    if moneda.codigo == "COP":
        return Decimal("1")

    cotizacion = (
        CotizacionMoneda.objects
        .filter(moneda=moneda, fecha__lte=fecha)
        .order_by("-fecha", "-id")
        .first()
    )

    if cotizacion is None:
        raise ValidationError(
            f"No existe cotización de {moneda.codigo} "
            f"hasta {fecha}."
        )

    return cotizacion.valor


def convertir_a_usd(monto, moneda, fecha, tasa_usd_cop):
    """
    Convierte un monto de cualquier moneda a USD,
    utilizando COP como moneda puente.
    """
    if moneda.codigo == "USD":
        return monto

    tasa_moneda_cop = obtener_tasa_cop(moneda, fecha)

    return monto * tasa_moneda_cop / tasa_usd_cop


def obtener_precio_vigente(activo, fecha):
    """
    Obtiene el último precio registrado hasta la fecha indicada.
    """
    return (
        PrecioActivo.objects
        .filter(activo=activo, fecha__lte=fecha)
        .order_by("-fecha", "-id")
        .first()
    )


def obtener_datos_brokers(fecha_corte):
    """
    Reconstruye cada broker una sola vez y obtiene:
    - Posiciones actuales.
    - Efectivo disponible.
    - Patrimonio por moneda.
    """

    posiciones = []
    estados = []

    brokers = Broker.objects.filter(activo=True)

    for broker in brokers:

        estadisticas = calcular_estadisticas_broker(
            broker=broker,
            fecha_corte=fecha_corte,
        )

        # ---------------------------------
        # POSICIONES DEL BROKER
        # ---------------------------------

        posiciones_broker = []

        for posicion in estadisticas["activos"]:

            cantidad = posicion["cantidad"]

            if cantidad <= ZERO:
                continue

            activo = Activo.objects.select_related(
                "moneda"
            ).get(pk=posicion["activo_id"])

            ultimo_precio = obtener_precio_vigente(
                activo,
                fecha_corte,
            )

            if ultimo_precio is None:
                raise ValidationError(
                    f"No existe ningún precio registrado "
                    f"para {activo.ticker}."
                )

            capital = posicion["capital_invertido"]
            valor_actual = cantidad * ultimo_precio.precio

            ganancia_no_realizada = valor_actual - capital
            ganancia_realizada = posicion["ganancia_realizada"]

            rendimiento = (
                ganancia_no_realizada / capital * Decimal("100")
                if capital > ZERO
                else ZERO
            )

            resultado = {
                "activo_id": activo.id,
                "broker_id": broker.id,
                "broker": broker.nombre,
                "nombre": activo.nombre,
                "ticker": activo.ticker,
                "tipo": activo.tipo,
                "cantidad": cantidad,
                "moneda": activo.moneda.codigo,
                "precio_actual": ultimo_precio.precio,
                "fecha_precio": ultimo_precio.fecha,
                "valor_actual": valor_actual,
                "capital_invertido": capital,
                "ganancia_realizada": ganancia_realizada,
                "ganancia_no_realizada": ganancia_no_realizada,
                "rendimiento": rendimiento,
            }

            posiciones.append(resultado)
            posiciones_broker.append(resultado)

        # ---------------------------------
        # EFECTIVO DEL BROKER
        # ---------------------------------

        efectivo = {
            item["moneda"]: item["efectivo"]
            for item in estadisticas["efectivo"]
        }

        # Reunimos todas las monedas que tienen
        # efectivo o posiciones.
        codigos_moneda = set(efectivo.keys())

        codigos_moneda.update(
            posicion["moneda"]
            for posicion in posiciones_broker
        )

        monedas = {
            moneda.codigo: moneda
            for moneda in Moneda.objects.filter(
                codigo__in=codigos_moneda
            )
        }

        # ---------------------------------
        # PATRIMONIO POR MONEDA
        # ---------------------------------

        for codigo in codigos_moneda:

            moneda = monedas[codigo]

            saldo_disponible = efectivo.get(codigo, ZERO)

            valor_invertido = sum(
                (
                    p["valor_actual"]
                    for p in posiciones_broker
                    if p["moneda"] == codigo
                ),
                ZERO,
            )

            patrimonio = saldo_disponible + valor_invertido

            tasa_cop = obtener_tasa_cop(
                moneda,
                fecha_corte,
            )

            estados.append({
                "broker_id": broker.id,
                "broker": broker.nombre,
                "moneda": codigo,
                "idmoneda": moneda.id,
                "saldo_disponible": saldo_disponible,
                "valor_invertido": valor_invertido,
                "patrimonio": patrimonio,
                "tasa_cop": tasa_cop,
                "patrimonio_cop": patrimonio * tasa_cop,
            })

    return posiciones, estados

def obtener_resumen_activos(posiciones, fecha_corte):
    """
    Consolida las posiciones y ganancias de todos los brokers en USD.
    """

    moneda_usd = Moneda.objects.filter(codigo="USD").first()

    if moneda_usd is None:
        raise ValidationError(
            "No existe la moneda USD registrada."
        )

    tasa_usd_cop = obtener_tasa_cop(
        moneda_usd,
        fecha_corte,
    )

    capital_invertido = ZERO
    valor_actual = ZERO
    ganancia_realizada = ZERO
    ganancia_no_realizada = ZERO

    monedas = {
        moneda.id: moneda
        for moneda in Moneda.objects.all()
    }

    for posicion in posiciones:

        moneda = next(
            m for m in monedas.values()
            if m.codigo == posicion["moneda"]
        )

        capital_invertido += convertir_a_usd(
            posicion["capital_invertido"],
            moneda,
            fecha_corte,
            tasa_usd_cop,
        )

        valor_actual += convertir_a_usd(
            posicion["valor_actual"],
            moneda,
            fecha_corte,
            tasa_usd_cop,
        )

        ganancia_realizada += convertir_a_usd(
            posicion["ganancia_realizada"],
            moneda,
            fecha_corte,
            tasa_usd_cop,
        )

        ganancia_no_realizada += convertir_a_usd(
            posicion["ganancia_no_realizada"],
            moneda,
            fecha_corte,
            tasa_usd_cop,
        )

    ganancia_total = ganancia_realizada + ganancia_no_realizada

    rendimiento = (
        ganancia_total / capital_invertido * Decimal("100")
        if capital_invertido > ZERO
        else ZERO
    )

    return {
        "capital_invertido": capital_invertido,
        "valor_actual": valor_actual,
        "ganancia": ganancia_total,
        "ganancia_realizada": ganancia_realizada,
        "ganancia_no_realizada": ganancia_no_realizada,
        "rendimiento": rendimiento,
        "moneda": "USD",
    }


def obtener_historial_movimientos(fecha_corte):
    movimientos = (
        MovimientoBroker.objects
        .filter(
            movimiento__fecha__lte=fecha_corte,
        )
        .select_related(
            "broker",
            "moneda",
            "movimiento",
        )
        .order_by("-movimiento__fecha", "-id")
    )

    resultado = []

    for item in movimientos:
        resultado.append({
            "id": item.id,
            "broker_id": item.broker_id,
            "broker": item.broker.nombre,
            "fecha": item.movimiento.fecha,
            "tipo": item.tipo,
            "descripcion": item.movimiento.descripcion,
            "monto": item.monto,
            "moneda": item.moneda.codigo,
            "costo": item.costo,
        })

    return resultado


def obtener_historial_operaciones(fecha_corte):
    operaciones = (
        OperacionActivo.objects
        .filter(fecha__lte=fecha_corte)
        .select_related(
            "broker",
            "activo",
            "activo__moneda",
        )
        .order_by("-fecha", "-id")
    )

    resultado = []

    for item in operaciones:
        precio = obtener_precio_activo(
            item.activo,
            item.fecha,
        )

        monto = item.cantidad * precio

        if item.tipo == "compra":
            total = monto + item.comision
        else:
            total = monto - item.comision

        resultado.append({
            "id": item.id,
            "broker_id": item.broker_id,
            "broker": item.broker.nombre,
            "fecha": item.fecha,
            "activo_id": item.activo_id,
            "activo": item.activo.nombre,
            "ticker": item.activo.ticker,
            "tipo": item.tipo,
            "cantidad": item.cantidad,
            "precio_unitario": precio,
            "monto": monto,
            "comision": item.comision,
            "total": total,
            "moneda": item.activo.moneda.codigo,
        })

    return resultado

def obtener_dashboard_activos():
    fecha_corte = timezone.localdate()

    posiciones, estados_brokers = obtener_datos_brokers(
        fecha_corte
    )

    resumen = obtener_resumen_activos(
        posiciones,
        fecha_corte,
    )

    movimientos = obtener_historial_movimientos(fecha_corte)
    operaciones = obtener_historial_operaciones(fecha_corte)

    return {
        "fecha_corte": fecha_corte,
        "resumen": resumen,
        "activos": posiciones,
        "brokers": estados_brokers,
        "historial": {
            "movimientos": movimientos,
            "operaciones": operaciones,
        },
    }