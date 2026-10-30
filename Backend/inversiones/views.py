from rest_framework import status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import *
from .serializers import *

from .Services.CDT_service import crear_cdt, finalizar_cdt
from .Services.precioActivo_service import crear_precio_activo
from .Services.estadisticas_service import obtener_estadisticas
from .Services.operacionActivo_service import crear_operacion_activo
from .Services.dividendoActivo_service import crear_dividendo_activo
from .Services.cotizacionMoneda_service import crear_cotizacion_moneda
from .Services.rendimientoCuenta_service import crear_rendimiento_cuenta
from .Services.movimientoBroker_service import crear_movimiento_broker


class CDTViewSet(ModelViewSet):

    queryset = CDT.objects.all().order_by("-fecha_inicio")
    serializer_class = CDTSerializer

    def perform_create(self, serializer):

        crear_cdt(
            cuenta=serializer.validated_data["cuenta"],
            entidad=serializer.validated_data["entidad"],
            monto=serializer.validated_data["monto"],
            fecha_inicio=serializer.validated_data["fecha_inicio"],
            fecha_vencimiento=serializer.validated_data["fecha_vencimiento"],
        )

    @action(detail=True, methods=["post"])
    def finalizar(self, request, pk=None):

        cdt = self.get_object()

        serializer = FinalizarCDTSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cdt = finalizar_cdt(
            cdt=cdt,
            monto_recibido=serializer.validated_data["monto_recibido"],
            fecha_cierre=serializer.validated_data.get("fecha_cierre"),
        )

        return Response(
            CDTSerializer(cdt).data,
            status=status.HTTP_200_OK
        )


class MonedaViewSet(ModelViewSet):
    queryset = Moneda.objects.all().order_by("codigo")
    serializer_class = MonedaSerializer


class CotizacionMonedaViewSet(ModelViewSet):

    queryset = CotizacionMoneda.objects.all()
    serializer_class = CotizacionMonedaSerializer

    def perform_create(self, serializer):

        crear_cotizacion_moneda(
            moneda=serializer.validated_data["moneda"],
            fecha=serializer.validated_data["fecha"],
            valor=serializer.validated_data["valor"],
        )


# Broker
class BrokerViewSet(ModelViewSet):

    queryset = (
        Broker.objects
        .prefetch_related("monedas")
        .all()
        .order_by("nombre")
    )

    serializer_class = BrokerSerializer

class MovimientoBrokerViewSet(ModelViewSet):

    queryset = (
        MovimientoBroker.objects
        .select_related(
            "broker",
            "moneda",
            "movimiento",
            "movimiento__cuenta",
        )
        .all()
        .order_by("-movimiento__fecha")
    )

    serializer_class = MovimientoBrokerSerializer

    def perform_create(self, serializer):

        crear_movimiento_broker(
            broker=serializer.validated_data["broker"],
            cuenta=serializer.validated_data["cuenta"],
            moneda=serializer.validated_data["moneda"],
            monto=serializer.validated_data["monto"],
            costo=serializer.validated_data.get("costo", 0),
            tipo=serializer.validated_data["tipo"],
            fecha=serializer.validated_data["fecha"],
        )


# Activos
class ActivoViewSet(ModelViewSet):

    queryset = Activo.objects.all().order_by("ticker")
    serializer_class = ActivoSerializer

class PrecioActivoViewSet(ModelViewSet):

    queryset = PrecioActivo.objects.all()
    serializer_class = PrecioActivoSerializer

    def perform_create(self, serializer):

        crear_precio_activo(
            activo=serializer.validated_data["activo"],
            fecha=serializer.validated_data["fecha"],
            precio=serializer.validated_data["precio"],
        )

class OperacionActivoViewSet(ModelViewSet):

    queryset = (
        OperacionActivo.objects
        .select_related("activo", "broker")
        .all()
        .order_by("-fecha", "-id")
    )

    serializer_class = OperacionActivoSerializer

    def perform_create(self, serializer):

        operacion = crear_operacion_activo(
            activo=serializer.validated_data["activo"],
            broker=serializer.validated_data["broker"],
            tipo=serializer.validated_data["tipo"],
            cantidad=serializer.validated_data["cantidad"],
            fecha=serializer.validated_data["fecha"],
            comision=serializer.validated_data["comision"],
        )

        serializer.instance = operacion


# Dividendos
class DividendoActivoViewSet(ModelViewSet):

    queryset = (
        DividendoActivo.objects
        .select_related("activo", "movimiento")
        .all()
        .order_by("-fecha")
    )

    serializer_class = DividendoActivoSerializer

    def perform_create(self, serializer):

        crear_dividendo_activo(
            activo=serializer.validated_data["activo"],
            cuenta=serializer.validated_data["cuenta"],
            fecha=serializer.validated_data["fecha"],
            monto=serializer.validated_data["monto"],
        )


# Rendimientos
class RendimientoCuentaViewSet(ModelViewSet):

    queryset = (
        RendimientoCuenta.objects
        .select_related(
            "movimiento",
            "movimiento__cuenta",
        )
        .all()
        .order_by("-movimiento__fecha")
    )

    serializer_class = RendimientoCuentaSerializer

    def perform_create(self, serializer):

        crear_rendimiento_cuenta(
            cuenta=serializer.validated_data["cuenta"],
            fecha=serializer.validated_data["fecha"],
            monto=serializer.validated_data["monto"],
        )


# Estadisticas
class EstadisticasView(APIView):

    def get(self, request):

        estadisticas = obtener_estadisticas()

        return Response(estadisticas)
    