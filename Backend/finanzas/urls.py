from .views import CuentaViewSet, TipoMovimientoViewSet, MovimientoViewSet, InversionViewSet, stats, resumen_inversiones
from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register("cuentas", CuentaViewSet)
router.register("tipos", TipoMovimientoViewSet)
router.register("movimientos", MovimientoViewSet)
router.register(r"inversiones", InversionViewSet)

urlpatterns = [
    path("stats/", stats),
    path("resumen-inv/", resumen_inversiones),
    path("", include(router.urls)),
]