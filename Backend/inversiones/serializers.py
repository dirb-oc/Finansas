from rest_framework import serializers

from finanzas.models import Cuenta
from .models import *

from .Services.operacionActivo_service import cantidad_disponible_activo
from .Services.broker_service import obtener_saldo_broker
from .Services.CDT_service import obtener_progreso_cdt

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

    capital = serializers.DecimalField(
        source="movimiento_inversion.monto",
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    valor_reintegro = serializers.DecimalField(
        source="movimiento_reintegro.monto",
        max_digits=12,
        decimal_places=2,
        read_only=True,
        allow_null=True
    )

    dias_restantes = serializers.SerializerMethodField()
    progreso = serializers.SerializerMethodField()

    def get_dias_restantes(self, obj):
        return obtener_progreso_cdt(obj)["dias_restantes"]

    def get_progreso(self, obj):
        return obtener_progreso_cdt(obj)["progreso"]


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
            "capital",
            "valor_reintegro",
            "progreso",
            "dias_restantes"
        ]

        read_only_fields = [
            "id",
            "movimiento_inversion",
            "movimiento_reintegro",
        ]

class FinalizarCDTSerializer(serializers.Serializer):

    monto_recibido = serializers.DecimalField( max_digits=15, decimal_places=2 )
    fecha_cierre = serializers.DateField( required=False )


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
# Broker

class BrokerSerializer(serializers.ModelSerializer):

    saldos = serializers.SerializerMethodField()

    class Meta:
        model = Broker
        fields = [
            "id",
            "nombre",
            "monedas",
            "activo",
            "saldos",
        ]

    def get_saldos(self, obj):
        return [
            {
                "moneda": moneda.codigo,
                "saldo": obtener_saldo_broker(
                    broker=obj,
                    moneda=moneda,
                ),
            }
            for moneda in obj.monedas.all()
        ]

class MovimientoBrokerSerializer(serializers.ModelSerializer):

    cuenta = serializers.PrimaryKeyRelatedField( queryset=Cuenta.objects.all(), write_only=True )
    fecha = serializers.DateField( write_only=True )

    class Meta:
        model = MovimientoBroker
        fields = [
            "id",
            "broker",
            "moneda",
            "tipo",
            "monto",
            "costo",
            "movimiento",
            "cuenta",
            "fecha"
        ]
        read_only_fields = ["id", "movimiento"]


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

    class Meta:
        model = OperacionActivo
        fields = [
            "id",
            "activo",
            "broker",
            "tipo",
            "cantidad",
            "comision",
            "fecha",
        ]
        read_only_fields = ["id"]

    def validate_cantidad(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "La cantidad debe ser mayor a 0."
            )
        return value

    def validate_comision(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "La comisión no puede ser negativa."
            )
        return value


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
