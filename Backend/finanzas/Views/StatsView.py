from dateutil.relativedelta import relativedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from ..models import Cuenta, Movimiento, TarjetaCredito
from inversiones.Services.estadisticas_service import patrimonio_historico, inversiones_actuales, cantidad_invertida

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
        "inversiones": inversiones_actuales(),
        "deuda": get_deuda(),
        "gastos_categoria": get_gastos_categoria(inicio_mes, fin_mes),
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

    return {
        "ingresos": ingresos,
        "gastos": gastos,
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

def get_tarjetas():

    tarjetas = []

    for tarjeta in TarjetaCredito.objects.filter(activa=True):

        deuda = tarjeta.deuda_actual

        tarjetas.append({
            "id": tarjeta.id,
            "nombre": tarjeta.nombre,
            "deuda": float(deuda),
            "proximo_pago": get_proximo_pago(tarjeta),
            "cupo": float(tarjeta.cupo_total),
            "porcentaje": round((deuda / tarjeta.cupo_total) * 100,2
            ) if tarjeta.cupo_total else 0,
        })

        tarjetas.sort(key=lambda t: t["porcentaje"],reverse=True,)

    return tarjetas

def get_proximo_pago(tarjeta):
    hoy = timezone.localdate()

    compras = tarjeta.compras.filter(
        estado__in=["pendiente", "pagando"]
    )

    if not compras.exists():
        return {
            "fecha": None,
            "monto": 0,
        }

    # Último día de corte anterior al ciclo actual
    ultimo_corte = hoy.replace(day=tarjeta.dia_corte)

    if hoy.day <= tarjeta.dia_corte:
        ultimo_corte -= relativedelta(months=1)

    # Revisamos ciclos hasta encontrar uno con deuda
    for _ in range(12):

        inicio_ciclo = (
            ultimo_corte - relativedelta(months=1)
        ).replace(
            day=tarjeta.dia_corte + 1
        )

        fin_ciclo = ultimo_corte

        compras_ciclo = compras.filter(
            fecha_compra__gte=inicio_ciclo,
            fecha_compra__lte=fin_ciclo,
        )

        monto = sum(
            compra.monto / compra.numero_cuotas
            for compra in compras_ciclo
        )

        if monto > 0:
            fecha_pago = fin_ciclo + relativedelta(months=1)
            fecha_pago = fecha_pago.replace(day=tarjeta.dia_pago)

            return {
                "fecha": fecha_pago,
                "monto": monto,
            }

        # No hubo deuda en este ciclo → revisar el siguiente
        ultimo_corte += relativedelta(months=1)

    return {
        "fecha": None,
        "monto": 0,
    }

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
        })

        procesar(index + 1)

    procesar(0)

    return resultado