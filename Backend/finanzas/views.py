from .serializers import CuentaSerializer, TipoMovimientoSerializer, MovimientoSerializer, FinalizarInversionSerializer, InversionSerializer, CuentaDetailSerializer, TarjetaCreditoSerializer, CompraCreditoSerializer
from .models import Cuenta, TipoMovimiento, Movimiento, Inversion, TarjetaCredito, CompraCredito
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils.timezone import now
from django.db.models import Sum
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

class TarjetaCreditoViewSet(viewsets.ModelViewSet):

    queryset = TarjetaCredito.objects.all().order_by("nombre")
    serializer_class = TarjetaCreditoSerializer

class CompraCreditoViewSet(viewsets.ModelViewSet):

    queryset = (
        CompraCredito.objects
        .select_related("tarjeta", "tipo")
        .order_by("-fecha_compra")
    )

    serializer_class = CompraCreditoSerializer

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