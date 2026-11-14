from django.db import transaction
from django.db.models import Sum
from rest_framework import serializers
from .models import Cuenta, TipoMovimiento, Movimiento, Inversion, TarjetaCredito, CompraCredito, PagoCredito
from .Services.card_service import calcular_ciclo_actual, calcular_minimo_tarjeta
from .Services.movimiento_service import get_flujo_cuenta
from django.utils.timezone import localtime

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
    mes_resumen = serializers.SerializerMethodField()
    impacto = serializers.SerializerMethodField()
    flujo_caja = serializers.SerializerMethodField()

    class Meta:
        model = Cuenta
        fields = [
            "id",
            "nombre",
            "saldo",
            "mes_resumen",
            "ingresos_total",
            "gastos_total",
            "impacto",
            "flujo_caja",
            "movimientos",
        ]

    def get_saldo(self, obj):
        return obj.saldo_actual()

    def get_movimientos(self, obj):
        movimientos = obj.movimientos.all().order_by("-fecha")
        return MovimientoSerializer(movimientos, many=True).data

    def _get_ultimo_mes(self, obj):
        ultimo_movimiento = obj.movimientos.order_by("-fecha").first()
    
        if not ultimo_movimiento:
            return None, None
    
        fecha = ultimo_movimiento.fecha
    
        return fecha.year, fecha.month

    def get_mes_resumen(self, obj):
        year, month = self._get_ultimo_mes(obj)

        if not year:
            return None

        return f"{month:02}/{year}"

    def get_ingresos_total(self, obj):
        year, month = self._get_ultimo_mes(obj)

        if not year:
            return 0

        return Movimiento.objects.filter(
            cuenta=obj,
            tipo__tipo="ingreso",
            fecha__year=year,
            fecha__month=month
        ).aggregate(total=Sum("monto"))["total"] or 0

    def get_gastos_total(self, obj):
        year, month = self._get_ultimo_mes(obj)

        if not year:
            return 0

        return Movimiento.objects.filter(
            cuenta=obj,
            tipo__tipo="gasto",
            fecha__year=year,
            fecha__month=month
        ).aggregate(total=Sum("monto"))["total"] or 0

    def get_flujo_caja(self, obj):
        return get_flujo_cuenta(obj)
    
    def get_impacto(self, obj):
        year, month = self._get_ultimo_mes(obj)

        if not year:
            return {
                "gastos": [],
                "ingresos": []
            }

        gastos = Movimiento.objects.filter(
            cuenta=obj,
            tipo__tipo="gasto",
            fecha__year=year,
            fecha__month=month
        ).values(
            "tipo__nombre"
        ).annotate(
            total=Sum("monto")
        ).order_by("-total")

        ingresos = Movimiento.objects.filter(
            cuenta=obj,
            tipo__tipo="ingreso",
            fecha__year=year,
            fecha__month=month
        ).values(
            "tipo__nombre"
        ).annotate(
            total=Sum("monto")
        ).order_by("-total")

        total_gastos = sum(item["total"] for item in gastos) or 1
        total_ingresos = sum(item["total"] for item in ingresos) or 1

        return {
            "gastos": [
                {
                    "nombre": item["tipo__nombre"],
                    "total": item["total"],
                    "porcentaje": round(item["total"] * 100 / total_gastos, 2)
                }
                for item in gastos
            ],
            "ingresos": [
                {
                    "nombre": item["tipo__nombre"],
                    "total": item["total"],
                    "porcentaje": round(item["total"] * 100 / total_ingresos, 2)
                }
                for item in ingresos
            ]
        }


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


# Credito
class TarjetaCreditoSerializer(serializers.ModelSerializer):

    deuda_actual = serializers.ReadOnlyField()
    cupo_disponible = serializers.ReadOnlyField()
    porcentaje_utilizado = serializers.ReadOnlyField()

    class Meta:
        model = TarjetaCredito
        fields = "__all__"


class PagoCreditoSerializer(serializers.ModelSerializer):

    cuenta = serializers.PrimaryKeyRelatedField(
        queryset=Cuenta.objects.all(),
        write_only=True
    )

    movimiento = MovimientoSerializer(read_only=True)

    class Meta:
        model = PagoCredito
        fields = [
            "id",
            "compra",
            "cuenta",
            "movimiento",
            "monto",
            "fecha",
        ]

        read_only_fields = [
            "id",
            "movimiento",
        ]


class CompraCreditoSerializer(serializers.ModelSerializer):

    tarjeta_nombre = serializers.CharField(
            source="tarjeta.nombre",
            read_only=True
        )
    
    tipo_nombre = serializers.CharField(
        source="tipo.nombre",
        read_only=True
    )

    total_pagado = serializers.ReadOnlyField()
    saldo_pendiente = serializers.ReadOnlyField()
    valor_cuota = serializers.ReadOnlyField()

    pagos = PagoCreditoSerializer(
        many=True,
        read_only=True
    )
    estado = serializers.ReadOnlyField()

    class Meta:
        model = CompraCredito
        fields = [
                    "id",
                    "tarjeta",
                    "tarjeta_nombre",
                    "tipo",
                    "tipo_nombre",
                    "monto",
                    "descripcion",
                    "fecha_compra",
                    "numero_cuotas",
                    "valor_cuota",
                    "total_pagado",
                    "saldo_pendiente",
                    "estado",
                    "pagos",
                ]


class CompraCreditoDetailSerializer(serializers.ModelSerializer):

    tarjeta_nombre = serializers.CharField(
        source="tarjeta.nombre",
        read_only=True
    )

    tipo_nombre = serializers.CharField(
        source="tipo.nombre",
        read_only=True
    )

    total_pagado = serializers.ReadOnlyField()
    saldo_pendiente = serializers.ReadOnlyField()
    valor_cuota = serializers.ReadOnlyField()

    pagos = PagoCreditoSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = CompraCredito
        fields = [
            "id",
            "tarjeta",
            "tarjeta_nombre",
            "tipo",
            "tipo_nombre",
            "monto",
            "descripcion",
            "fecha_compra",
            "numero_cuotas",
            "valor_cuota",
            "total_pagado",
            "saldo_pendiente",
            "estado",
            "pagos",
        ]


class TarjetaCreditoDetailSerializer(serializers.ModelSerializer):

    deuda_actual = serializers.ReadOnlyField()
    cupo_disponible = serializers.ReadOnlyField()
    porcentaje_utilizado = serializers.ReadOnlyField()

    ciclo_actual = serializers.SerializerMethodField()
    proximo = serializers.SerializerMethodField()

    compras = CompraCreditoDetailSerializer(
        many=True,
        read_only=True
    )

    def get_ciclo_actual(self, obj):
        ciclo = calcular_ciclo_actual(obj)

        return {
            "inicio": ciclo["inicio"],
            "fin": ciclo["fin"],
            "dias_restantes": ciclo["dias_restantes"],
        }

    def get_proximo(self, obj):
            proximo = calcular_minimo_tarjeta(obj)
    
            return {
                "fecha": proximo["fecha"],
                "monto": proximo["monto"],
            }

    class Meta:
        model = TarjetaCredito
        fields = [
            "id",
            "nombre",
            "cupo_total",
            "cupo_disponible",
            "deuda_actual",
            "porcentaje_utilizado",
            "dia_corte",
            "dia_pago",
            "activa",
            "ciclo_actual",
            "proximo",
            "compras",
        ]