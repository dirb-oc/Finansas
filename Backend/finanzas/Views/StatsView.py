from dateutil.relativedelta import relativedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from ..models import Cuenta, Movimiento, TarjetaCredito
from inversiones.Services.estadisticas_service import patrimonio_historico, cantidad_invertida
from inversiones.Services.broker_service import estadisticas_rentabilidad_brokers
from inversiones.Services.CDT_service import resultado_cdts_periodo
from ..Services.card_service import get_tarjetas


ZERO = Decimal("0")

EXCLUDE_NAMES = [
    "Inicio",
    "Transferencia",
    "Inversión",
    "Reintegro de inversión",
    "Venta de activo",
]

@api_view(["GET"])
def StatsView(request):
    hoy = timezone.localtime()
    inicio_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    fin_mes = inicio_mes + relativedelta(months=1)

    disponible = get_disponible()
    invertido = cantidad_invertida()

    return Response({
        "disponible": disponible,
        "invertido": invertido,
        "total": disponible + invertido,
        "balance_mes": get_balance_periodo(inicio_mes, fin_mes)["balance"],
        "flujo_6_meses": get_flujo_meses(hoy),
        "cuentas": get_cuentas(),
        "patrimonio_6_meses": patrimonio_ultimos_6_meses(),
        "deuda": get_deuda(),
        "gastos_categoria": get_gastos_categoria(inicio_mes, fin_mes),
        "ingreso_categoria": get_ingresos_categoria(inicio_mes, fin_mes),
        "tarjetas": get_tarjetas(),
        "ultimos_movimientos": get_ultimos_movimientos(),
    })

def get_disponible():
    return sum(c.saldo_actual() for c in Cuenta.objects.all())


def patrimonio_ultimos_6_meses():
    hoy = now().date()

    primer_mes = hoy.replace(day=1) - relativedelta(months=5)

    patrimonio_mensual = []

    for i in range(6):
        mes = primer_mes + relativedelta(months=i)
        siguiente_mes = mes + relativedelta(months=1)

        fecha_cierre = siguiente_mes - timedelta(days=1)

        patrimonio_mensual.append({
            "mes": mes.strftime("%Y-%m"),
            "total": patrimonio_historico(fecha_cierre),
        })

    return patrimonio_mensual


def get_balance_periodo(inicio, fin):
    movimientos = (
        Movimiento.objects
        .filter(
            fecha__gte=inicio,
            fecha__lt=fin,
        )
        .exclude(tipo__nombre__in=EXCLUDE_NAMES)
    )

    ingresos = (
        movimientos
        .filter(tipo__tipo="ingreso")
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    gastos = (
        movimientos
        .filter(tipo__tipo="gasto")
        .aggregate(total=Sum("monto"))["total"]
        or ZERO
    )

    estadisticas = estadisticas_rentabilidad_brokers(
        fecha_inicio=inicio,
        fecha_fin=fin,
    )

    costos_broker = estadisticas["costos_entrada_cop"]

    resultado_cdt = resultado_cdts_periodo(inicio, fin)

    # Evitar doble conteo: los resultados positivos son ingresos
    # y los negativos son gastos.
    ingresos += max(resultado_cdt, ZERO)
    gastos += abs(min(resultado_cdt, ZERO))

    gastos += costos_broker

    return {
        "ingresos": ingresos,
        "gastos": gastos,
        "gastos_broker": costos_broker,
        "resultado_cdts": resultado_cdt,
        "balance": ingresos - gastos,
    }


def get_flujo_meses(hoy, cantidad=6):
    flujo = []

    for i in range(cantidad - 1, -1, -1):
        inicio = (
            hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            - relativedelta(months=i)
        )
        fin = inicio + relativedelta(months=1)

        balance = get_balance_periodo(inicio, fin)

        flujo.append({
            "mes": inicio.strftime("%Y-%m"),
            **balance,
        })

    return flujo


def get_cuentas():
    cuentas = []
    disponible = get_disponible()
        
    for cuenta in Cuenta.objects.all():
        saldo = cuenta.saldo_actual()
    
        cuentas.append({
            "id": cuenta.id,
            "nombre": cuenta.nombre,
            "saldo": saldo,
            "porcentaje": round((saldo / disponible) * 100, 1) if disponible else 0
        })
    
    cuentas.sort(key=lambda x: x["saldo"], reverse=True)

    return cuentas


def get_deuda():

    return sum(
        tarjeta.deuda_actual
        for tarjeta in TarjetaCredito.objects.filter(activa=True)
    )


def get_gastos_categoria(inicio_mes, fin_mes):

    categorias = (
        Movimiento.objects.filter(
            tipo__tipo="gasto",
            fecha__gte=inicio_mes,
            fecha__lt=fin_mes,
        )
        .exclude(tipo__nombre__in=EXCLUDE_NAMES)
        .values("tipo__nombre")
        .annotate(total=Sum("monto"))
        .order_by("-total")
    )

    return [
        {
            "nombre": c["tipo__nombre"],
            "monto": float(c["total"]),
        }
        for c in categorias
    ]


def get_ingresos_categoria(inicio_mes, fin_mes):

    categorias = (
        Movimiento.objects.filter(
            tipo__tipo="ingreso",
            fecha__gte=inicio_mes,
            fecha__lt=fin_mes,
        )
        .exclude(tipo__nombre__in=EXCLUDE_NAMES)
        .values("tipo__nombre")
        .annotate(total=Sum("monto"))
        .order_by("-total")
    )

    return [
        {
            "nombre": c["tipo__nombre"],
            "monto": float(c["total"]),
        }
        for c in categorias
    ]


def get_ultimos_movimientos(cantidad=5):
    movimientos = list(
        Movimiento.objects
        .select_related("tipo")
        .order_by("-fecha")[:cantidad]
    )

    resultado = []

    def procesar(index):
        if index >= len(movimientos):
            return

        movimiento = movimientos[index]

        resultado.append({
            "id": movimiento.id,
            "tipo": movimiento.tipo.nombre,
            "categoria": movimiento.tipo.tipo,
            "monto": float(movimiento.monto),
            "fecha": movimiento.fecha,
            "idcuenta": movimiento.cuenta.id,
            "cuenta": movimiento.cuenta.nombre,
        })

        procesar(index + 1)

    procesar(0)

    return resultado