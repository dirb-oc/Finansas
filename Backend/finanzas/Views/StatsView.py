from ..models import Cuenta, Movimiento, Inversion, TarjetaCredito
from dateutil.relativedelta import relativedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Sum, Min
from django.utils import timezone

EXCLUDE_NAMES = ["Inicio", "Transferencia", "Inversión", "Reintegro inversión"]

@api_view(["GET"])
def StatsView(request):
    hoy = timezone.localtime()
    inicio_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    fin_mes = inicio_mes + relativedelta(months=1)

    disponible = get_disponible()
    invertido = get_invertido()

    return Response({
        "disponible": disponible,
        "invertido": invertido,
        "total": disponible + invertido,
        "balance_mes": get_balance_periodo(inicio_mes, fin_mes)["balance"],
        "flujo_6_meses": get_flujo_meses(hoy),
        "cuentas": get_cuentas(),
        "patrimonio_6_meses": get_patrimonio6Meses(),
        "inversiones": get_inversiones(),
        "deuda": get_deuda(),
        "gastos_categoria": get_gastos_categoria(inicio_mes, fin_mes),
        "tarjetas": get_tarjetas(),
    })

def get_disponible():
    return sum(c.saldo_actual() for c in Cuenta.objects.all())

def get_invertido():
    return (
        Inversion.objects.filter(estado="activa")
        .aggregate(total=Sum("monto_inicial"))["total"]
        or 0
    )

def get_patrimonio6Meses():
    primer_movimiento = Movimiento.objects.aggregate(fecha=Min("fecha"))["fecha"]
    patrimonio_mensual = []
    
    if primer_movimiento:
    
        mes = primer_movimiento.replace(day=1)
        ultimo_mes = now().replace(day=1)

        while True:

            siguiente_mes = mes + relativedelta(months=1)
        
            ingresos = Movimiento.objects.filter(
                fecha__lt=siguiente_mes,
                tipo__tipo="ingreso"
            ).exclude(
                tipo_id=11
            ).aggregate(total=Sum("monto"))["total"] or 0
        
            gastos = Movimiento.objects.filter(
                fecha__lt=siguiente_mes,
                tipo__tipo="gasto"
            ).exclude(
                tipo_id=2
            ).aggregate(total=Sum("monto"))["total"] or 0
        
            inicial = Movimiento.objects.filter(
                fecha__lt=siguiente_mes,
                tipo_id=1
            ).aggregate(total=Sum("monto"))["total"] or 0
        
            patrimonio_mensual.append({
                "mes": mes.strftime("%Y-%m"),
                "total": float(ingresos + inicial - gastos)
            })
        
            if mes.year == ultimo_mes.year and mes.month == ultimo_mes.month:
                break
            
            mes = siguiente_mes

    return patrimonio_mensual

def get_balance_periodo(inicio, fin):
    ingresos = (
        Movimiento.objects.filter(
            tipo__tipo="ingreso",
            fecha__gte=inicio,
            fecha__lt=fin,
        )
        .exclude(tipo__nombre__in=EXCLUDE_NAMES)
        .aggregate(total=Sum("monto"))["total"]
        or 0
    )

    gastos = (
        Movimiento.objects.filter(
            tipo__tipo="gasto",
            fecha__gte=inicio,
            fecha__lt=fin,
        )
        .exclude(tipo__nombre__in=EXCLUDE_NAMES)
        .aggregate(total=Sum("monto"))["total"]
        or 0
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
        
    for cuenta in Cuenta.objects.all():
        saldo = cuenta.saldo_actual()
    
        cuentas.append({
            "id": cuenta.id,
            "nombre": cuenta.nombre,
            "saldo": saldo,
            "porcentaje": round(
                (saldo / get_disponible()) * 100, 1
            ) if get_disponible() else 0
        })
    
    cuentas.sort(key=lambda x: x["saldo"], reverse=True)

    return cuentas

def get_inversiones():

    inversiones = list(
        Inversion.objects.filter(estado="activa")
        .values("id", "nombre", "monto_inicial")
    )

    for inv in inversiones:
        inv["monto"] = float(inv.pop("monto_inicial"))

    return inversiones

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
            "cupo": float(tarjeta.cupo_total),
            "deuda": float(deuda),
            "disponible": float(tarjeta.cupo_total - deuda),
            "porcentaje": round((deuda / tarjeta.cupo_total) * 100,2
            ) if tarjeta.cupo_total else 0,
        })

        tarjetas.sort(key=lambda t: t["porcentaje"],reverse=True,)

    return tarjetas