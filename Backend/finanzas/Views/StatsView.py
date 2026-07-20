from ..models import Cuenta, Movimiento, Inversion
from django.db.models.functions import TruncMonth
from dateutil.relativedelta import relativedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils.timezone import now
from django.db.models import Sum, F, Min
from django.utils import timezone


@api_view(["GET"])
def StatsView(request):
    hoy = timezone.localtime()
    inicio_mes = hoy.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    fin_mes = inicio_mes + relativedelta(months=1)

    # 💰 Disponible
    cuentas = Cuenta.objects.all()
    disponible = sum([c.saldo_actual() for c in cuentas])

    # 🔒 Invertido
    invertido = Inversion.objects.filter(
        estado="activa"
    ).aggregate(total=Sum("monto_inicial"))["total"] or 0

    # 💎 Total
    total = disponible + invertido

    EXCLUDE_NAMES = ["Inicio", "Transferencia", "Inversión", "Reintegro inversión"]

    # 📈 Ingresos del mes
    ingresos_mes = (
        Movimiento.objects.filter(
            tipo__tipo="ingreso",
            fecha__gte=inicio_mes,
            fecha__lt=fin_mes,
        )
        .exclude(tipo__nombre__in=EXCLUDE_NAMES)
        .aggregate(total=Sum("monto"))["total"] or 0
    )

    # 📉 Gastos del mes
    gastos_mes = Movimiento.objects.filter(
        tipo__tipo="gasto",
        fecha__gte=inicio_mes
    ).exclude(
        tipo__nombre__in=EXCLUDE_NAMES
    ).aggregate(total=Sum("monto"))["total"] or 0

    # ⚖️ Balance actual
    balance_mes = ingresos_mes - gastos_mes

    # 💹 Ganancia inversiones
    ganancia = Inversion.objects.filter(
        estado="finalizada",
        monto_final__isnull=False
    ).aggregate(
        total=Sum(F("monto_final") - F("monto_inicial"))
    )["total"] or 0

    hace_6_meses = hoy - relativedelta(months=5)

    movimientos = Movimiento.objects.filter(
        fecha__gte=hace_6_meses
    ).exclude(
        tipo__nombre__in=EXCLUDE_NAMES
    )

    # 📈 Ingresos agrupados por mes
    ingresos = (
        movimientos
        .filter(tipo__tipo="ingreso")
        .annotate(mes=TruncMonth("fecha"))
        .values("mes")
        .annotate(total=Sum("monto"))
    )

    # 📉 Gastos agrupados por mes
    gastos = (
        movimientos
        .filter(tipo__tipo="gasto")
        .annotate(mes=TruncMonth("fecha"))
        .values("mes")
        .annotate(total=Sum("monto"))
    )

    data = {}

    # Ingresos
    for i in ingresos:
        mes = i["mes"].strftime("%Y-%m")
        data[mes] = {
            "mes": mes,
            "ingresos": float(i["total"]),
            "gastos": 0
        }

    # Gastos
    for g in gastos:
        mes = g["mes"].strftime("%Y-%m")
        if mes not in data:
            data[mes] = {
                "mes": mes,
                "ingresos": 0,
                "gastos": float(g["total"])
            }
        else:
            data[mes]["gastos"] = float(g["total"])

    # Ordenar por mes
    resultado = sorted(data.values(), key=lambda x: x["mes"])


    # 📆 Últimos 6 meses
    primer_movimiento = Movimiento.objects.aggregate(
        fecha=Min("fecha")
    )["fecha"]
    
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
        
    cuentas = []
    
    for cuenta in Cuenta.objects.all():
        saldo = cuenta.saldo_actual()
    
        cuentas.append({
            "id": cuenta.id,
            "nombre": cuenta.nombre,
            "saldo": saldo,
            "porcentaje": round(
                (saldo / disponible) * 100,
                1
            ) if disponible else 0
        })
    
    cuentas.sort(key=lambda x: x["saldo"], reverse=True)

    return Response({
        "disponible": disponible,
        "invertido": invertido,
        "total": total,
        "balance_mes": balance_mes,
        "gastos_mes": gastos_mes,
        "r": ingresos_mes,
        "ganancia_inversiones": ganancia,
        "flujo_6_meses": resultado,
        "cuentas": cuentas,
        "patrimonio_6_meses": patrimonio_mensual
    })