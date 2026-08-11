from .serializers import CuentaSerializer, TipoMovimientoSerializer, MovimientoSerializer, FinalizarInversionSerializer, InversionSerializer, CuentaDetailSerializer, TarjetaCreditoSerializer, CompraCreditoSerializer, TarjetaCreditoDetailSerializer, PagoCreditoSerializer
from .models import Cuenta, TipoMovimiento, Movimiento, Inversion, TarjetaCredito, CompraCredito, PagoCredito
from rest_framework.response import Response
from rest_framework.decorators import action
from .services import realizar_pago_credito, crear_compra_credito
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

    def get_serializer_class(self):

        if self.action == "retrieve":
            return TarjetaCreditoDetailSerializer

        return TarjetaCreditoSerializer

class CompraCreditoViewSet(viewsets.ModelViewSet):

    queryset = (
        CompraCredito.objects
        .select_related("tarjeta", "tipo")
        .order_by("-fecha_compra")
    )

    serializer_class = CompraCreditoSerializer

    def perform_create(self, serializer):

        crear_compra_credito(
            **serializer.validated_data
        )

class PagoCreditoViewSet(viewsets.ModelViewSet):

    queryset = PagoCredito.objects.select_related(
        "compra",
        "cuenta",
        "compra__tarjeta"
    ).all()

    serializer_class = PagoCreditoSerializer

    def perform_create(self, serializer):

        realizar_pago_credito(
            **serializer.validated_data
        )