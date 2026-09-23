from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
# from datetime import timedelta
from finanzas.models import Cuenta, Movimiento
from .CDT_service import valor_cdt_historico, obtener_cdts_estadisticas
from .activo_service import costo_invertido_activo, cantidad_disponible_activo, obtener_activos_estadisticas, costo_invertido_activos, costo_invertido_activo_hasta
from .dividendoActivo_service import obtener_dividendos_estadisticas
from .rendimientoCuenta_service import obtener_rendimientos_estadisticas

from ..models import *


ZERO = Decimal("0")


def patrimonio_historico(fecha):
    return (
        saldo_total_cuentas_hasta(fecha)
        + valor_activos_historico(fecha)
        + valor_cdt_historico(fecha)
    )


def saldo_total_cuentas_hasta(fecha):
    return sum((saldo_cuenta_hasta(cuenta, fecha)for cuenta in Cuenta.objects.all()),ZERO)


def saldo_cuenta_hasta(cuenta, fecha):
    ingresos = (
        Movimiento.objects
        .filter(
            cuenta=cuenta,
            fecha__date__lte=fecha,
            tipo__tipo="ingreso"
        )
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    gastos = (
        Movimiento.objects
        .filter(
            cuenta=cuenta,
            fecha__date__lte=fecha,
            tipo__tipo="gasto"
        )
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    inicial = (
        Movimiento.objects
        .filter(
            cuenta=cuenta,
            fecha__date__lte=fecha,
            tipo__tipo="inicial"
        )
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    return inicial + ingresos - gastos


def valor_activos_historico(fecha):
    """
    Valor de mercado de todos los activos
    hasta una fecha determinada.
    """
    return sum(
        (
            costo_invertido_activo_hasta(activo, fecha)
            for activo in Activo.objects.filter(activo=True)
        ),
        ZERO,
    )


def inversiones_actuales():
    inversiones = []

    # CDT
    cdts = (
        CDT.objects
        .filter(movimiento_reintegro__isnull=True)
        .select_related("movimiento_inversion")
    )

    for cdt in cdts:
        inversiones.append({
            "tipo": "cdt",
            "nombre": f"CDT {cdt.entidad}",
            "monto": cdt.movimiento_inversion.monto,
        })

    # Activos
    activos = Activo.objects.filter(activo=True)

    for activo in activos:
        costo = costo_invertido_activo(activo)

        if costo <= 0:
            continue

        inversiones.append({
            "tipo": activo.tipo,
            "nombre": activo.nombre,
            "ticker": activo.ticker,
            "monto": costo,
        })

    return inversiones


def saldo_total_cuentas():
    cuentas = Cuenta.objects.all()

    return sum( (cuenta.saldo_actual() for cuenta in cuentas), ZERO )


def obtener_precio_actual(activo, fecha=None):

    fecha = fecha or timezone.localdate()

    return (
        PrecioActivo.objects.filter(activo=activo,fecha__lte=fecha,).order_by("-fecha").first()
    )


def obtener_cotizacion_actual(moneda, fecha=None):

    fecha = fecha or timezone.localdate()

    if moneda.codigo == "COP":
        return Decimal("1")

    return (
        CotizacionMoneda.objects.filter(moneda=moneda,fecha__lte=fecha,).order_by("-fecha").first()
    )


def valor_actual_activo(activo, fecha=None):

    cantidad = cantidad_disponible_activo(activo)

    if cantidad <= 0:
        return ZERO

    precio = obtener_precio_actual(activo, fecha)

    if precio is None:
        return ZERO

    cotizacion = obtener_cotizacion_actual(activo.moneda,fecha)

    if cotizacion is None:
        return ZERO

    return (cantidad* precio.precio* cotizacion.valor)


def valor_actual_activos(fecha=None):

    return sum(
        (valor_actual_activo(activo, fecha)for activo in Activo.objects.filter(activo=True)),
        ZERO
    )


def valor_cdt_no_finalizados():

    cdt = CDT.objects.filter(
        movimiento_reintegro__isnull=True
    ).select_related(
        "movimiento_inversion"
    )

    return sum(
        (
            item.movimiento_inversion.monto
            for item in cdt
        ),
        ZERO
    )


def cantidad_inversion():
    return (valor_actual_activos()+ valor_cdt_no_finalizados())


def cantidad_invertida():

    return (
        costo_invertido_activos()
        + valor_cdt_no_finalizados()
    )


def ganancia_ventas_activo(activo):
    """
    Calcula la ganancia o pérdida realizada por ventas
    utilizando costo promedio ponderado.
    """

    operaciones = (
        OperacionActivo.objects
        .filter(activo=activo)
        .select_related("movimiento")
        .order_by(
            "movimiento__fecha",
            "id",
        )
    )

    cantidad = ZERO
    costo = ZERO
    ganancia = ZERO

    for operacion in operaciones:

        if operacion.tipo == "compra":
            cantidad += operacion.cantidad
            costo += operacion.movimiento.monto

        elif operacion.tipo == "venta":

            if cantidad <= 0:
                continue

            costo_promedio = costo / cantidad

            costo_vendido = (
                operacion.cantidad
                * costo_promedio
            )

            ganancia += (
                operacion.movimiento.monto
                - costo_vendido
            )

            costo -= costo_vendido
            cantidad -= operacion.cantidad

    return ganancia


def ganancia_ventas():
    """
    Retorna la ganancia o pérdida realizada
    por todas las ventas de activos.
    """

    return sum(
        (
            ganancia_ventas_activo(activo)
            for activo in Activo.objects.filter(activo=True)
        ),
        ZERO
    )


def ganancia_cdt():
    """
    Ganancia realizada de CDT que ya fueron reintegrados.

    Ganancia = dinero recibido - capital invertido.
    """

    cdts = (
        CDT.objects
        .filter(
            movimiento_reintegro__isnull=False
        )
        .select_related(
            "movimiento_inversion",
            "movimiento_reintegro",
        )
    )

    return sum(
        (
            cdt.movimiento_reintegro.monto
            - cdt.movimiento_inversion.monto
            for cdt in cdts
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


def ganancia_no_realizada():
    """
    Valorización actual de los activos que todavía se poseen.

    No incluye dividendos ni rendimientos.
    """

    return (
        valor_actual_activos()
        - costo_invertido_activos()
    )


def ganancia_realizada():
    """
    Total de ganancias realizadas.
    """

    return (
        ganancia_cdt()
        + total_dividendos()
        + total_rendimientos_cuenta()
        + ganancia_ventas()
    )


def ganancia_total():
    """
    Ganancia total acumulada.
    """

    return (
        ganancia_realizada()
        + ganancia_no_realizada()
    )


def porcentaje_ganancia_sobre_patrimonio():
    patrimonio_actual = saldo_total_cuentas() + cantidad_inversion()

    if patrimonio_actual <= 0:
        return ZERO

    return (ganancia_total() / patrimonio_actual) * Decimal("100")


def rentabilidad_total():
    capital_invertido = cantidad_invertida()

    if capital_invertido <= 0:
        return ZERO

    return (ganancia_total() / capital_invertido) * Decimal("100")

def obtener_estadisticas():
    realizada = ganancia_realizada()
    no_realizada = ganancia_no_realizada()
    total = realizada + no_realizada

    patrimonio_actual = saldo_total_cuentas() + cantidad_inversion()
    capital_invertido = cantidad_invertida()

    porcentaje_ganancia = (
        (total / patrimonio_actual) * Decimal("100")
        if patrimonio_actual > 0
        else ZERO
    )

    rentabilidad = (
        (total / capital_invertido) * Decimal("100")
        if capital_invertido > 0
        else ZERO
    )

    return {
        "patrimonio": patrimonio_actual,
        "cantidad_inversion": cantidad_inversion(),
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

