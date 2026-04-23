from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Cuenta, TipoMovimiento, Movimiento, Inversion
from .serializers import CuentaSerializer, TipoMovimientoSerializer, MovimientoSerializer, FinalizarInversionSerializer, InversionSerializer, CuentaDetailSerializer
from rest_framework.decorators import api_view
from django.db.models import Sum, F, Q
from django.utils import timezone
from django.db.models.functions import TruncMonth
from datetime import timedelta

from dateutil.relativedelta import relativedelta

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

    # 🚫 Exclusiones
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

    EXCLUDE_NAMES = ["Inicio", "Transferencia", "Inversión"]

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



    meses = []
    for i in range(6):
        fecha = hoy - relativedelta(months=i)
        inicio = fecha.replace(day=1)
        fin = (inicio + relativedelta(months=1)) - timedelta(seconds=1)
        meses.append((inicio, fin))

    patrimonio_mensual = []

    for inicio, fin in reversed(meses):

        # 💰 Disponible hasta ese mes
        ingresos = Movimiento.objects.filter(
            tipo__tipo="ingreso",
            fecha__lte=fin
        ).aggregate(total=Sum("monto"))["total"] or 0

        gastos = Movimiento.objects.filter(
            tipo__tipo="gasto",
            fecha__lte=fin
        ).aggregate(total=Sum("monto"))["total"] or 0

        inicial = Movimiento.objects.filter(
            tipo__tipo="inicial",
            fecha__lte=fin
        ).aggregate(total=Sum("monto"))["total"] or 0

        disponible_mes = ingresos + inicial - gastos

        # 🔒 Inversiones activas en ese mes
        invertido_mes = Inversion.objects.filter(
            fecha_inicio__lte=fin
        ).filter(
            Q(estado="activa") | Q(fecha_fin__gte=inicio)
        ).aggregate(total=Sum("monto_inicial"))["total"] or 0

        total_mes = disponible_mes + invertido_mes

        patrimonio_mensual.append({
            "mes": inicio.strftime("%Y-%m"),
            "total": float(total_mes)
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