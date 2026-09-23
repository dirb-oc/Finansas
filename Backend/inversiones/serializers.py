from rest_framework import serializers

from finanzas.models import Cuenta
from .models import *

from .Services.operacionActivo_service import cantidad_disponible_activo

# ─────────────────────────────
# Renta fija

class CDTSerializer(serializers.ModelSerializer):

    cuenta = serializers.PrimaryKeyRelatedField(
        queryset=Cuenta.objects.all(),
        write_only=True
    )

    monto = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        write_only=True
    )

    class Meta:
        model = CDT
        fields = [
            "id",
            "cuenta",
            "monto",
            "entidad",
            "estado",
            "movimiento_inversion",
            "movimiento_reintegro",
            "fecha_inicio",
            "fecha_vencimiento",
            "fecha_cierre",
        ]

        read_only_fields = [
            "id",
            "movimiento_inversion",
            "movimiento_reintegro",
        ]


class FinalizarCDTSerializer(serializers.Serializer):

    monto_recibido = serializers.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    fecha_cierre = serializers.DateField(
        required=False
    )

# ─────────────────────────────
# Monedas

class MonedaSerializer(serializers.ModelSerializer):

    class Meta:
        model = Moneda
        fields = [
            "id",
            "codigo",
            "nombre",
            "simbolo",
        ]

        read_only_fields = [
            "id",
        ]


class CotizacionMonedaSerializer(serializers.ModelSerializer):

    class Meta:
        model = CotizacionMoneda
        fields = [
            "id",
            "moneda",
            "fecha",
            "valor",
        ]

        read_only_fields = [
            "id",
        ]


# ─────────────────────────────
# Activos

class ActivoSerializer(serializers.ModelSerializer):

    cantidad = serializers.SerializerMethodField()

    class Meta:
        model = Activo
        fields = [
            "id",
            "ticker",
            "nombre",
            "tipo",
            "moneda",
            "activo",
            "cantidad",
        ]

        read_only_fields = [
            "id",
        ]

    def get_cantidad(self, obj):
        return cantidad_disponible_activo(obj)


class PrecioActivoSerializer(serializers.ModelSerializer):

    class Meta:
        model = PrecioActivo
        fields = [
            "id",
            "activo",
            "fecha",
            "precio",
        ]

        read_only_fields = [
            "id",
        ]


# ─────────────────────────────
# Operaciones

class OperacionActivoSerializer(serializers.ModelSerializer):

    cuenta = serializers.PrimaryKeyRelatedField( queryset=Cuenta.objects.all(), write_only=True )
    fecha = serializers.DateField( write_only=True )

    class Meta:
        model = OperacionActivo
        fields = [
            "id",
            "activo",
            "cuenta",
            "tipo",
            "cantidad",
            "comision",
            "fecha",
            "movimiento",
        ]

        read_only_fields = [
            "id",
            "movimiento",
        ]


# ─────────────────────────────
# Dividendos

class DividendoActivoSerializer(serializers.ModelSerializer):

    cuenta = serializers.PrimaryKeyRelatedField( queryset=Cuenta.objects.all(), write_only=True )
    fecha = serializers.DateField( write_only=True )

    class Meta:
        model = DividendoActivo
        fields = [
            "id",
            "activo",
            "cuenta",
            "movimiento",
            "fecha",
            "monto",
        ]

        read_only_fields = [
            "id",
            "movimiento",
        ]


# ─────────────────────────────
# Rendimientos de cuentas

class RendimientoCuentaSerializer(serializers.ModelSerializer):

    cuenta = serializers.PrimaryKeyRelatedField( queryset=Cuenta.objects.all(), write_only=True )
    fecha = serializers.DateField( write_only=True )
    monto = serializers.DecimalField( max_digits=10, decimal_places=2, write_only=True )

    monto_registrado = serializers.DecimalField(
        source="movimiento.monto",
        max_digits=10,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = RendimientoCuenta

        fields = [
            "id",
            "movimiento",
            "cuenta",
            "fecha",
            "monto",
            "monto_registrado",
            "saldo_cuenta",
        ]

        read_only_fields = [
            "id",
            "movimiento",
            "monto_registrado",
            "saldo_cuenta",
        ]
