from django.db.models import Sum
from datetime import datetime
from decimal import Decimal
from ..models import ( MovimientoBroker, OperacionActivo, PrecioActivo, Broker )
from .precioActivo_service import obtener_precio_activo
from .cotizacionMoneda_service import obtener_cotizacion

from rest_framework.exceptions import ValidationError
from decimal import Decimal
from collections import defaultdict

ZERO = Decimal("0")


def obtener_saldo_broker(*, broker, moneda):

    entradas = MovimientoBroker.objects.filter(
        broker=broker,
        moneda=moneda,
        tipo="entrada",
    ).aggregate(
        total=Sum("monto")
    )["total"] or Decimal("0")

    salidas = MovimientoBroker.objects.filter(
        broker=broker,
        moneda=moneda,
        tipo="salida",
    ).aggregate(
        total=Sum("monto")
    )["total"] or Decimal("0")

    operaciones = (
        OperacionActivo.objects
        .filter(
            broker=broker,
            activo__moneda=moneda,
        )
        .select_related("activo")
    )

    compras = Decimal("0")
    ventas = Decimal("0")

    for operacion in operaciones:

        precio = PrecioActivo.objects.get(
            activo=operacion.activo,
            fecha=operacion.fecha,
        )

        valor = operacion.cantidad * precio.precio

        if operacion.tipo == "compra":
            compras += valor + operacion.comision
        else:
            ventas += valor - operacion.comision

    return entradas - salidas - compras + ventas
    

def validar_saldo_broker(*, broker, moneda, monto):
    saldo = obtener_saldo_broker( broker=broker, moneda=moneda, )

    if monto > saldo:
        raise ValidationError({
            "monto": (
                f"Saldo insuficiente en {moneda.codigo}. "
                f"Disponible: {saldo}."
            )
        })


def valor_efectivo_brokers_historico(fecha):
    total = ZERO

    for broker in Broker.objects.filter(activo=True):
        estadisticas = calcular_estadisticas_broker(
            broker=broker,
            fecha_corte=fecha,
        )

        total += estadisticas["capital_historico_efectivo_cop"]

    return total


def calcular_estadisticas_broker(broker, fecha_corte):

    movimientos = list(
        MovimientoBroker.objects.filter(
            broker=broker,
            movimiento__fecha__lte=fecha_corte,
        ).select_related(
            "moneda",
            "movimiento",
            "movimiento__tipo",
        )
    )

    operaciones = list(
        OperacionActivo.objects.filter(
            broker=broker,
            fecha__lte=fecha_corte,
        ).select_related(
            "activo",
            "activo__moneda",
        )
    )

    eventos = []

    # Los depósitos se procesan antes de las operaciones del día.
    for movimiento in movimientos:
        prioridad = 0 if movimiento.tipo == "entrada" else 2

        eventos.append({
            "fecha": movimiento.movimiento.fecha,
            "prioridad": prioridad,
            "id": movimiento.id,
            "tipo": "movimiento",
            "objeto": movimiento,
        })

    for operacion in operaciones:
        eventos.append({
            "fecha": operacion.fecha,
            "prioridad": 1,
            "id": operacion.id,
            "tipo": "operacion",
            "objeto": operacion,
        })

    eventos.sort(
        key=lambda e: (
            e["fecha"],
            e["prioridad"],
            e["id"],
        )
    )

    # Efectivo y costo histórico en COP por moneda.
    efectivo = defaultdict(lambda: ZERO)
    efectivo_cop = defaultdict(lambda: ZERO)

    # Posiciones separadas por activo.
    activos = {}

    # Ganancia/pérdida realizada, expresada en la moneda del activo.
    ganancias_realizadas = defaultdict(lambda: ZERO)

    for evento in eventos:
        obj = evento["objeto"]

        if evento["tipo"] == "movimiento":
            moneda_id = obj.moneda_id
            monto = obj.monto
            fecha = obj.movimiento.fecha

            if obj.tipo == "entrada":
                tasa = obtener_cotizacion(obj.moneda, fecha)

                # Se excluyen los costos extra del capital aportado.
                efectivo[moneda_id] += monto
                efectivo_cop[moneda_id] += monto * tasa

            elif obj.tipo == "salida":
                disponible = efectivo[moneda_id]

                if monto > disponible:
                    raise ValidationError(
                        f"El retiro de {monto} {obj.moneda.codigo} "
                        f"supera el efectivo reconstruido ({disponible})."
                    )

                # Retiro proporcional del costo histórico del efectivo.
                proporcion = monto / disponible if disponible else ZERO
                costo_retirado_cop = efectivo_cop[moneda_id] * proporcion

                efectivo[moneda_id] -= monto
                efectivo_cop[moneda_id] -= costo_retirado_cop

        else:
            activo = obj.activo
            moneda_id = activo.moneda_id

            if activo.id not in activos:
                activos[activo.id] = {
                    "activo": activo,
                    "cantidad": ZERO,
                    "capital": ZERO,
                    "capital_cop": ZERO,
                }

            posicion = activos[activo.id]

            precio = obtener_precio_activo(activo, obj.fecha)
            valor = obj.cantidad * precio

            if obj.tipo == "compra":
                costo_operacion = valor + obj.comision
                saldo = efectivo[moneda_id]

                if costo_operacion > saldo:
                    raise ValidationError(
                        f"Saldo insuficiente para comprar {activo.ticker}. "
                        f"Necesitas {costo_operacion} "
                        f"{activo.moneda.codigo} y tienes {saldo}."
                    )

                # Se asigna al activo una proporción del costo histórico
                # del efectivo utilizado para financiar la compra.
                proporcion = (
                    costo_operacion / saldo if saldo else ZERO
                )
                costo_cop = efectivo_cop[moneda_id] * proporcion

                efectivo[moneda_id] -= costo_operacion
                efectivo_cop[moneda_id] -= costo_cop

                posicion["cantidad"] += obj.cantidad
                posicion["capital"] += costo_operacion
                posicion["capital_cop"] += costo_cop

            elif obj.tipo == "venta":
                if obj.cantidad > posicion["cantidad"]:
                    raise ValidationError(
                        f"Intentas vender más unidades de {activo.ticker} "
                        "de las que tienes."
                    )

                cantidad_antes = posicion["cantidad"]

                if cantidad_antes <= ZERO:
                    raise ValidationError(
                        f"No hay unidades disponibles de {activo.ticker}."
                    )

                proporcion = obj.cantidad / cantidad_antes

                # Capital histórico liberado por las unidades vendidas.
                capital_liberado = posicion["capital"] * proporcion
                capital_cop_liberado = (
                    posicion["capital_cop"] * proporcion
                )

                ingreso_venta = valor - obj.comision

                if ingreso_venta < ZERO:
                    raise ValidationError(
                        "La comisión de venta supera el importe de la venta."
                    )

                posicion["cantidad"] -= obj.cantidad
                posicion["capital"] -= capital_liberado
                posicion["capital_cop"] -= capital_cop_liberado

                # La venta devuelve efectivo al broker.
                efectivo[moneda_id] += ingreso_venta

                # Se devuelve al efectivo el costo histórico liberado.
                efectivo_cop[moneda_id] += capital_cop_liberado

                ganancias_realizadas[activo.id] += (
                    ingreso_venta - capital_liberado
                )

    resultado_activos = []

    for activo_id, posicion in activos.items():
        resultado_activos.append({
            "activo_id": activo_id,
            "ticker": posicion["activo"].ticker,
            "moneda": posicion["activo"].moneda.codigo,
            "cantidad": posicion["cantidad"],
            "capital_invertido": posicion["capital"],
            "capital_invertido_cop": posicion["capital_cop"],
            "ganancia_realizada": ganancias_realizadas[activo_id],
        })

    resultado_efectivo = []

    for moneda_id, monto in efectivo.items():
        moneda = next(
            (
                movimiento.moneda
                for movimiento in movimientos
                if movimiento.moneda_id == moneda_id
            ),
            None,
        )

        if moneda is None:
            moneda = next(
                (
                    operacion.activo.moneda
                    for operacion in operaciones
                    if operacion.activo.moneda_id == moneda_id
                ),
                None,
            )

        if moneda is not None:
            resultado_efectivo.append({
                "moneda": moneda.codigo,
                "efectivo": monto,
                "capital_historico_cop": efectivo_cop[moneda_id],
            })

    capital_activos_cop = sum(
        (a["capital_invertido_cop"] for a in resultado_activos),
        ZERO,
    )

    capital_efectivo_cop = sum(
        (e["capital_historico_cop"] for e in resultado_efectivo),
        ZERO,
    )

    return {
        "broker": broker.nombre,
        "fecha_corte": fecha_corte,
        "capital_historico_activos_cop": capital_activos_cop,
        "capital_historico_efectivo_cop": capital_efectivo_cop,
        "capital_historico_total_cop": ( capital_activos_cop + capital_efectivo_cop ),
        "efectivo": resultado_efectivo,
        "activos": resultado_activos,
    }


def normalizar_fecha(fecha):
    if isinstance(fecha, datetime):
        return fecha.date()

    return fecha


def estadisticas_rentabilidad_broker(broker, fecha_inicio, fecha_fin):
    """
    fecha_inicio: incluida.
    fecha_fin: excluida.

    Retorna costos de entrada, ganancias/pérdidas realizadas por ventas
    y resultado de retiros, expresados en COP.

    Supone que Movimiento.monto representa el valor en COP registrado
    en la cuenta bancaria asociada al movimiento del bróker.
    """

    fecha_inicio = normalizar_fecha(fecha_inicio)
    fecha_fin = normalizar_fecha(fecha_fin)

    if fecha_inicio >= fecha_fin:
        raise ValidationError(
            "La fecha de inicio debe ser anterior a la fecha final."
        )


    if fecha_inicio >= fecha_fin:
        raise ValidationError(
            "La fecha de inicio debe ser anterior a la fecha final."
        )

    movimientos = list(
        MovimientoBroker.objects.filter(
            broker=broker,
            movimiento__fecha__lt=fecha_fin,
        ).select_related(
            "moneda",
            "movimiento",
            "movimiento__cuenta",
        ).order_by(
            "movimiento__fecha",
            "id",
        )
    )

    operaciones = list(
        OperacionActivo.objects.filter(
            broker=broker,
            fecha__lt=fecha_fin,
        ).select_related(
            "activo",
            "activo__moneda",
        ).order_by(
            "fecha",
            "id",
        )
    )

    eventos = []

    for movimiento in movimientos:
        fecha = movimiento.movimiento.fecha

        eventos.append({
            "fecha": fecha,
            "prioridad": 0 if movimiento.tipo == "entrada" else 2,
            "id": movimiento.id,
            "tipo": "movimiento",
            "objeto": movimiento,
        })

    for operacion in operaciones:
        eventos.append({
            "fecha": operacion.fecha,
            "prioridad": 1,
            "id": operacion.id,
            "tipo": "operacion",
            "objeto": operacion,
        })

    eventos.sort(
        key=lambda e: (e["fecha"], e["prioridad"], e["id"])
    )

    efectivo = defaultdict(lambda: ZERO)
    efectivo_cop = defaultdict(lambda: ZERO)

    posiciones = {}
    costos_entrada_cop = ZERO
    ganancia_ventas_cop = ZERO
    perdida_ventas_cop = ZERO
    ganancia_retiros_cop = ZERO
    perdida_retiros_cop = ZERO

    for evento in eventos:
        fecha = evento["fecha"]
        obj = evento["objeto"]

        en_periodo = fecha_inicio <= fecha < fecha_fin

        if evento["tipo"] == "movimiento":
            moneda_id = obj.moneda_id
            monto = obj.monto

            if obj.tipo == "entrada":
                tasa = obtener_cotizacion(obj.moneda, fecha)

                efectivo[moneda_id] += monto
                efectivo_cop[moneda_id] += monto * tasa

                if en_periodo:
                    # costo es el costo de transferencia en COP.
                    costos_entrada_cop += obj.costo

            elif obj.tipo == "salida":
                disponible = efectivo[moneda_id]

                if monto > disponible:
                    raise ValidationError(
                        f"El retiro de {monto} {obj.moneda.codigo} "
                        f"supera el efectivo disponible ({disponible})."
                    )

                proporcion = monto / disponible if disponible else ZERO

                capital_retirado_cop = (
                    efectivo_cop[moneda_id] * proporcion
                )

                efectivo[moneda_id] -= monto
                efectivo_cop[moneda_id] -= capital_retirado_cop

                if en_periodo:
                    # Valor que realmente volvió a la cuenta bancaria.
                    recibido_cop = obj.movimiento.monto

                    diferencia = recibido_cop - capital_retirado_cop

                    if diferencia > ZERO:
                        ganancia_retiros_cop += diferencia
                    elif diferencia < ZERO:
                        perdida_retiros_cop += abs(diferencia)

        else:
            activo = obj.activo
            moneda_id = activo.moneda_id

            if activo.id not in posiciones:
                posiciones[activo.id] = {
                    "activo": activo,
                    "cantidad": ZERO,
                    "capital": ZERO,
                    "capital_cop": ZERO,
                }

            posicion = posiciones[activo.id]

            precio = obtener_precio_activo(activo, fecha)
            importe = obj.cantidad * precio

            if obj.tipo == "compra":
                costo = importe + obj.comision
                saldo = efectivo[moneda_id]

                if costo > saldo:
                    raise ValidationError(
                        f"Saldo insuficiente para comprar {activo.ticker}: "
                        f"necesitas {costo} {activo.moneda.codigo}, "
                        f"disponible {saldo}."
                    )

                proporcion = costo / saldo if saldo else ZERO
                costo_cop = efectivo_cop[moneda_id] * proporcion

                efectivo[moneda_id] -= costo
                efectivo_cop[moneda_id] -= costo_cop

                posicion["cantidad"] += obj.cantidad
                posicion["capital"] += costo
                posicion["capital_cop"] += costo_cop

            elif obj.tipo == "venta":
                cantidad_antes = posicion["cantidad"]

                if obj.cantidad > cantidad_antes:
                    raise ValidationError(
                        f"No hay suficientes unidades de {activo.ticker}."
                    )

                if cantidad_antes <= ZERO:
                    raise ValidationError(
                        f"No hay unidades disponibles de {activo.ticker}."
                    )

                proporcion = obj.cantidad / cantidad_antes

                capital_liberado = posicion["capital"] * proporcion
                capital_cop_liberado = (
                    posicion["capital_cop"] * proporcion
                )

                ingreso_venta = importe - obj.comision

                if ingreso_venta < ZERO:
                    raise ValidationError(
                        "La comisión supera el importe de la venta."
                    )

                # Ganancia/pérdida en COP: ingreso de venta convertido
                # a COP a la cotización de la fecha de la operación,
                # menos el costo histórico COP de las unidades vendidas.
                tasa = obtener_cotizacion(activo.moneda, fecha)
                resultado_venta_cop = (
                    ingreso_venta * tasa - capital_cop_liberado
                )

                if en_periodo:
                    if resultado_venta_cop > ZERO:
                        ganancia_ventas_cop += resultado_venta_cop
                    elif resultado_venta_cop < ZERO:
                        perdida_ventas_cop += abs(resultado_venta_cop)

                posicion["cantidad"] -= obj.cantidad
                posicion["capital"] -= capital_liberado
                posicion["capital_cop"] -= capital_cop_liberado

                efectivo[moneda_id] += ingreso_venta

                # Conservamos el costo histórico asignado al capital,
                # no el valor de mercado de la venta.
                efectivo_cop[moneda_id] += capital_cop_liberado

    resultado_realizado_cop = (
        ganancia_ventas_cop
        + ganancia_retiros_cop
        - perdida_ventas_cop
        - perdida_retiros_cop
    )

    resultado_neto_cop = (
        resultado_realizado_cop - costos_entrada_cop
    )

    return {
        "broker": broker.nombre,
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "costos_entrada_cop": costos_entrada_cop,
        "ganancia_ventas_cop": ganancia_ventas_cop,
        "perdida_ventas_cop": perdida_ventas_cop,
        "ganancia_retiros_cop": ganancia_retiros_cop,
        "perdida_retiros_cop": perdida_retiros_cop,
        "resultado_realizado_cop": resultado_realizado_cop,
        "resultado_neto_cop": resultado_neto_cop,
    }


def estadisticas_rentabilidad_brokers(fecha_inicio, fecha_fin):
    resultado = {
        "fecha_inicio": fecha_inicio,
        "fecha_fin": fecha_fin,
        "costos_entrada_cop": ZERO,
        "ganancia_ventas_cop": ZERO,
        "perdida_ventas_cop": ZERO,
        "ganancia_retiros_cop": ZERO,
        "perdida_retiros_cop": ZERO,
        "resultado_realizado_cop": ZERO,
        "resultado_neto_cop": ZERO,
        "brokers": [],
    }

    campos = (
        "costos_entrada_cop",
        "ganancia_ventas_cop",
        "perdida_ventas_cop",
        "ganancia_retiros_cop",
        "perdida_retiros_cop",
        "resultado_realizado_cop",
        "resultado_neto_cop",
    )

    for broker in Broker.objects.filter(activo=True):
        stats = estadisticas_rentabilidad_broker(
            broker=broker,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
        )

        resultado["brokers"].append(stats)

        for campo in campos:
            resultado[campo] += stats[campo]

    return resultado