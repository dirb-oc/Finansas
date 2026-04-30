from .serializers import CuentaSerializer, TipoMovimientoSerializer, MovimientoSerializer, FinalizarInversionSerializer, InversionSerializer, CuentaDetailSerializer
from .models import Cuenta, TipoMovimiento, Movimiento, Inversion
from django.db.models.functions import TruncMonth
from dateutil.relativedelta import relativedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils.timezone import now
from django.db.models import Sum, F
from rest_framework import viewsets
from django.db import transaction
from django.utils import timezone

class CuentaViewSet(viewsets.ModelViewSet):
    queryset = Cuenta.objects.all()
    serializer_class = CuentaSerializer

    def get_serializer_class(self):
        if self.action == "retrieve":
            return CuentaDetailSerializer
        return CuentaSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()

        cuentas = Cuenta.objects.all()

        # 🔹 Saldos
        saldos = {c.id: c.saldo_actual() for c in cuentas}
        disponible_total = sum(saldos.values())

        # 🔹 Inversiones agrupadas
        inversiones = (
            Inversion.objects
            .filter(estado="activa")
            .values("cuenta")
            .annotate(total=Sum("monto_inicial"))
        )

        invertido_por_cuenta = {
            inv["cuenta"]: inv["total"] for inv in inversiones
        }

        invertido_total = sum(invertido_por_cuenta.values())
        total_global = disponible_total + invertido_total

        context.update({
            "saldos": saldos,
            "invertido_por_cuenta": invertido_por_cuenta,
            "disponible_total": disponible_total,
            "total_global": total_global,
        })

        return context

class TipoMovimientoViewSet(viewsets.ModelViewSet):

    queryset = TipoMovimiento.objects.all()
    serializer_class = TipoMovimientoSerializer

class MovimientoViewSet(viewsets.ModelViewSet):

    queryset = Movimiento.objects.all()
    serializer_class = MovimientoSerializer

class InversionViewSet(viewsets.ModelViewSet):

    queryset = Inversion.objects.all()
    serializer_class = InversionSerializer

    @action(detail=True, methods=["post"])
    def finalizar(self, request, pk=None):
    
        inversion = self.get_object()
        serializer = FinalizarInversionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
    
        monto_final = serializer.validated_data["monto_final"]
    
        if inversion.estado == "finalizada":
            return Response({"error": "Ya está finalizada"}, status=400)
    
        with transaction.atomic():
        
            # 🟡 calcular ganancia
            ganancia = monto_final - inversion.monto_inicial
    
            # 🟡 1. actualizar inversión
            inversion.estado = "finalizada"
            inversion.monto_final = monto_final
            inversion.fecha_fin = timezone.now().date()
            inversion.save()
    
            # 🟢 2. tipos
            tipo_ganancia = TipoMovimiento.objects.get(
                nombre="Retorno inversión",
                tipo="ingreso"
            )
    
            tipo_reintegro = TipoMovimiento.objects.get(
                nombre="Reintegro inversión",
                tipo="ingreso"
            )
    
            # 🟢 3. reintegro (capital)
            Movimiento.objects.create(
                cuenta=inversion.cuenta,
                tipo=tipo_reintegro,
                monto=inversion.monto_inicial,
                descripcion=f"Reintegro de {inversion.nombre}"
            )
    
            # 🟢 4. ganancia
            if ganancia > 0:
                Movimiento.objects.create(
                    cuenta=inversion.cuenta,
                    tipo=tipo_ganancia,
                    monto=ganancia,
                    descripcion=f"Ganancia de {inversion.nombre}"
                )
    
        return Response({"message": "Inversión finalizada"})

@api_view(["GET"])
def stats(request):
    hoy = timezone.now()
    inicio_mes = hoy.replace(day=1)

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
    ingresos_mes = Movimiento.objects.filter(
        tipo__tipo="ingreso",
        fecha__gte=inicio_mes
    ).exclude(
        tipo__nombre__in=EXCLUDE_NAMES
    ).aggregate(total=Sum("monto"))["total"] or 0

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

    EXCLUDE_NAMES = ["Inicio", "Transferencia", "Inversión", "Reintegro inversión"]

    hoy = timezone.now()
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
    today = now().replace(day=1)
    months = []

    for i in range(5, -1, -1):
        m = today - relativedelta(months=i)
        months.append(m)

    meses = months
    patrimonio_mensual = []

    for mes in meses:
        fin_mes = (mes + relativedelta(months=1)) - relativedelta(seconds=1)

        ingresos = Movimiento.objects.filter(
            fecha__lte=fin_mes,
            tipo__tipo="ingreso"
        ).exclude(
            tipo_id=11  # reintegro ❌
        ).aggregate(total=Sum("monto"))["total"] or 0

        gastos = Movimiento.objects.filter(
            fecha__lte=fin_mes,
            tipo__tipo="gasto"
        ).exclude(
            tipo_id=2  # inversión ❌
        ).aggregate(total=Sum("monto"))["total"] or 0

        inicial = Movimiento.objects.filter(
            fecha__lte=fin_mes,
            tipo_id=1
        ).aggregate(total=Sum("monto"))["total"] or 0

        saldo_cuentas = ingresos + inicial - gastos

        patrimonio_mensual.append({
            "mes": mes.strftime("%Y-%m"),
            "total": float(saldo_cuentas)
        })

    return Response({
        "disponible": disponible,
        "invertido": invertido,
        "total": total,
        "balance_mes": balance_mes,
        "gastos_mes": gastos_mes,
        "ganancia_inversiones": ganancia,
        "flujo_6_meses": resultado,
        "patrimonio_6_meses": patrimonio_mensual
    })

@api_view(["GET"])
def resumen_inversiones(request):

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