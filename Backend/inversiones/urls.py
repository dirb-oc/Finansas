from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import *

router = DefaultRouter()

router.register(r"cdt", CDTViewSet, basename="cdt")
router.register(r"monedas", MonedaViewSet, basename="moneda")
router.register(r"cotizaciones", CotizacionMonedaViewSet, basename="cotizacion")
router.register(r"activos", ActivoViewSet, basename="activo")
router.register(r"precios-activos", PrecioActivoViewSet, basename="precio-activo")
router.register(r"operaciones", OperacionActivoViewSet, basename="operacion-activo")
router.register(r"dividendos", DividendoActivoViewSet, basename="dividendo")
router.register(r"rendimientos", RendimientoCuentaViewSet, basename="rendimiento-cuenta")

router.register(r"broker", BrokerViewSet, basename="broker")
router.register(r"movimientosbroker", MovimientoBrokerViewSet, basename="movimiento-broker")


urlpatterns = [
    path("", include(router.urls)),
    path("stats/", EstadisticasView.as_view(), name="estadisticas"),
    path("CDTstats/", DashboardCDTView.as_view(), name="estadisticasCDT"),
]