from .views import CuentaViewSet, TipoMovimientoViewSet, MovimientoViewSet, InversionViewSet, TarjetaCreditoViewSet, CompraCreditoViewSet, PagoCreditoViewSet
from .Views.InvestmentSummary import InvestmentSummary 
from rest_framework.routers import DefaultRouter
from .Views.StatsView import StatsView 
from django.urls import path, include

router = DefaultRouter()
router.register("cuentas", CuentaViewSet)
router.register("tipos", TipoMovimientoViewSet)
router.register("movimientos", MovimientoViewSet)
router.register("TarjetaCredito", TarjetaCreditoViewSet)
router.register("ComprasCredito", CompraCreditoViewSet)
router.register("PagoCredito", PagoCreditoViewSet)
router.register(r"inversiones", InversionViewSet)

urlpatterns = [
    path("stats/", StatsView),
    path("resumen-inv/", InvestmentSummary),
    path("", include(router.urls)),
]