from .views import CuentaViewSet, TipoMovimientoViewSet, MovimientoViewSet, InversionViewSet, resumen_inversiones, TarjetaCreditoViewSet, CompraCreditoViewSet
from .Views.StatsView import StatsView 
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register("cuentas", CuentaViewSet)
router.register("tipos", TipoMovimientoViewSet)
router.register("movimientos", MovimientoViewSet)
router.register("TarjetaCredito", TarjetaCreditoViewSet)
router.register("ComprasCredito", CompraCreditoViewSet)
router.register(r"inversiones", InversionViewSet)

urlpatterns = [
    path("stats/", StatsView),
    path("resumen-inv/", resumen_inversiones),
    path("", include(router.urls)),
]