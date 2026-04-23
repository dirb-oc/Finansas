from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CuentaViewSet, TipoMovimientoViewSet, MovimientoViewSet, InversionViewSet, stats

router = DefaultRouter()

router.register("cuentas", CuentaViewSet)
router.register("tipos", TipoMovimientoViewSet)
router.register("movimientos", MovimientoViewSet)
router.register(r"inversiones", InversionViewSet)

urlpatterns = [
    path("stats/", stats),
    path("", include(router.urls)),
]