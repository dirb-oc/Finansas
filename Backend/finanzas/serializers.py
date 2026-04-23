from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import Cuenta, TipoMovimiento, Movimiento, Inversion

class CuentaSerializer(serializers.ModelSerializer):
    porcentaje_total = serializers.SerializerMethodField()
    porcentaje_disponible = serializers.SerializerMethodField()
    saldo = serializers.SerializerMethodField()

    class Meta:
        model = Cuenta
        fields = "__all__"

    def get_saldo(self, obj):
        return self.context["saldos"].get(obj.id, 0)

    def get_porcentaje_total(self, obj):
        total_global = self.context["total_global"]
        if total_global == 0:
            return 0

        saldo = self.context["saldos"].get(obj.id, 0)
        invertido = self.context["invertido_por_cuenta"].get(obj.id, 0)

        total_cuenta = saldo + invertido

        return round((total_cuenta / total_global) * 100, 2)

    def get_porcentaje_disponible(self, obj):
        disponible_total = self.context["disponible_total"]
        if disponible_total == 0:
            return 0

        saldo = self.context["saldos"].get(obj.id, 0)

        return round((saldo / disponible_total) * 100, 2)

class CuentaDetailSerializer(serializers.ModelSerializer):

    saldo = serializers.SerializerMethodField()
    movimientos = serializers.SerializerMethodField()
    ingresos_total = serializers.SerializerMethodField()
    gastos_total = serializers.SerializerMethodField()

    class Meta:
        model = Cuenta
        fields = [
            "id",
            "nombre",
            "saldo",
            "ingresos_total",
            "gastos_total",
            "movimientos",
        ]

    def get_saldo(self, obj):
        return obj.saldo_actual()

    def get_movimientos(self, obj):
        movimientos = obj.movimientos.all().order_by("-fecha")
        return MovimientoSerializer(movimientos, many=True).data

    def get_ingresos_total(self, obj):
        return Movimiento.objects.filter(
            cuenta=obj,
            tipo__tipo="ingreso"
        ).aggregate(total=Sum("monto"))["total"] or 0

    def get_gastos_total(self, obj):
        return Movimiento.objects.filter(
            cuenta=obj,
            tipo__tipo="gasto"
        ).aggregate(total=Sum("monto"))["total"] or 0

class TipoMovimientoSerializer(serializers.ModelSerializer):

    class Meta:
        model = TipoMovimiento
        fields = "__all__"


class MovimientoSerializer(serializers.ModelSerializer):

    tipo_nombre = serializers.CharField(source="tipo.nombre", read_only=True)
    tipo_base = serializers.CharField(source="tipo.tipo", read_only=True)

    class Meta:
        model = Movimiento
        fields = ["id","cuenta","tipo","tipo_nombre","tipo_base","monto","descripcion","fecha"]

class InversionSerializer(serializers.ModelSerializer):
    
    cuenta_nombre = serializers.CharField(source="cuenta.nombre", read_only=True)

    class Meta:
        model = Inversion
        fields = "__all__"
        read_only_fields = ("estado", "monto_final")

    def create(self, validated_data):

        cuenta = validated_data["cuenta"]
        monto = validated_data["monto_inicial"]

        # 🔴 1. Validar saldo
        if cuenta.saldo_actual() < monto:
            raise serializers.ValidationError("Saldo insuficiente")

        with transaction.atomic():

            # 🟡 2. Obtener tipo correcto (gasto inversión)
            tipo_inversion = TipoMovimiento.objects.get(
                nombre="Inversión",
                tipo="gasto",
            )

            # 🟡 3. Crear movimiento (salida)
            Movimiento.objects.create(
                cuenta=cuenta,
                tipo=tipo_inversion,
                monto=monto,
                descripcion=f"Inversión: {validated_data['nombre']}"
            )

            # 🟢 4. Crear inversión
            inversion = Inversion.objects.create(**validated_data)

        return inversion
        
class FinalizarInversionSerializer(serializers.Serializer):
    monto_final = serializers.DecimalField(max_digits=12, decimal_places=2)