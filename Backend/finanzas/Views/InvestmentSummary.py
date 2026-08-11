from ..models import Movimiento, Inversion
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Sum

@api_view(["GET"])
def InvestmentSummary(request):

    # -------------------------
    # TOTAL DINERO (PATRIMONIO)
    # -------------------------
    ingresos = Movimiento.objects.filter(
        tipo__tipo="ingreso"
    ).exclude(
        tipo_id=11  # reintegro ❌
    ).aggregate(total=Sum("monto"))["total"] or 0

    gastos = Movimiento.objects.filter(
        tipo__tipo="gasto"
    ).exclude(
        tipo_id=2  # inversión ❌
    ).aggregate(total=Sum("monto"))["total"] or 0

    inicial = Movimiento.objects.filter(
        tipo_id=1
    ).aggregate(total=Sum("monto"))["total"] or 0

    total = ingresos + inicial - gastos

    # -------------------------
    # GANANCIA INVERSIONES
    # -------------------------
    retornos = Movimiento.objects.filter(
        tipo_id=3  # retorno inversión ✅
    ).aggregate(total=Sum("monto"))["total"] or 0

    # -------------------------
    # DINERO INVERTIDO ACTUAL
    # -------------------------
    invertido = Inversion.objects.filter(
        estado="activa"
    ).aggregate(total=Sum("monto_inicial"))["total"] or 0

    # -------------------------
    # PORCENTAJE
    # -------------------------
    if total > 0:
        porcentaje = round((retornos / total) * 100, 1)
    else:
        porcentaje = 0.0

    return Response({
        "total": float(total),
        "invertido": float(invertido),
        "ganancia_inversiones": float(retornos),
        "porcentaje": porcentaje
    })