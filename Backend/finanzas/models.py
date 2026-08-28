from django.utils import timezone
from django.db import models
from django.db.models import Sum

class Cuenta(models.Model):

    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre

    def saldo_actual(self):
        from .models import Movimiento

        ingresos = Movimiento.objects.filter(
            cuenta=self,
            tipo__tipo="ingreso"
        ).aggregate(total=Sum("monto"))["total"] or 0

        gastos = Movimiento.objects.filter(
            cuenta=self,
            tipo__tipo="gasto"
        ).aggregate(total=Sum("monto"))["total"] or 0

        inicial = Movimiento.objects.filter(
            cuenta=self,
            tipo__tipo="inicial"
        ).aggregate(total=Sum("monto"))["total"] or 0

        return ingresos + inicial - gastos

class TipoMovimiento(models.Model):

    TIPO_CHOICES = [
        ("ingreso", "Ingreso"),
        ("gasto", "Gasto"),
        ("inicial", "Monto inicial"),
    ]

    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=10,choices=TIPO_CHOICES)

    def __str__(self):
        return f"{self.nombre} ({self.tipo})"

class Movimiento(models.Model):

    cuenta = models.ForeignKey(Cuenta,on_delete=models.CASCADE,related_name="movimientos")
    tipo = models.ForeignKey(TipoMovimiento,on_delete=models.CASCADE)
    monto = models.DecimalField(max_digits=10,decimal_places=2)
    descripcion = models.TextField(blank=True)
    fecha = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.tipo.nombre} - {self.monto}"

class Inversion(models.Model):

    nombre = models.CharField(max_length=100)

    tipo = models.CharField(
        max_length=50,
        choices=[
            ("cdt", "CDT"),
            ("crypto", "Cripto"),
            ("acciones", "Acciones"),
            ("otro", "Otro"),
        ]
    )

    monto_inicial = models.DecimalField(max_digits=12, decimal_places=2)

    monto_final = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True
    )

    fecha_inicio = models.DateField(auto_now_add=True)
    fecha_fin = models.DateField(null=True, blank=True)

    estado = models.CharField(
        max_length=20,
        choices=[
            ("activa", "Activa"),
            ("finalizada", "Finalizada"),
        ],
        default="activa"
    )

    cuenta = models.ForeignKey(
        "Cuenta",
        on_delete=models.CASCADE,
        related_name="inversiones"
    )

    def __str__(self):
        return self.nombre

class TarjetaCredito(models.Model):

    nombre = models.CharField(max_length=100)
    cupo_total = models.DecimalField(max_digits=12,decimal_places=2)
    dia_corte = models.PositiveSmallIntegerField()
    dia_pago = models.PositiveSmallIntegerField()
    activa = models.BooleanField(default=True)

    @property
    def deuda_actual(self):
        return sum(
            compra.saldo_pendiente
            for compra in self.compras.all()
        )

    @property
    def cupo_disponible(self):
        return self.cupo_total - self.deuda_actual

    @property
    def porcentaje_utilizado(self):
        if self.cupo_total == 0:
            return 0

        return round((self.deuda_actual / self.cupo_total) * 100, 2)

    def __str__(self):
        return self.nombre

class CompraCredito(models.Model):

    tarjeta = models.ForeignKey(
        TarjetaCredito,
        on_delete=models.CASCADE,
        related_name="compras"
    )

    tipo = models.ForeignKey(
        TipoMovimiento,
        on_delete=models.PROTECT,
        limit_choices_to={"tipo": "gasto"}
    )

    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    descripcion = models.TextField(
        blank=True
    )

    fecha_compra = models.DateField()

    numero_cuotas = models.PositiveSmallIntegerField()

    estado = models.CharField(
        max_length=20,
        choices=[
            ("pendiente", "Pendiente"),
            ("pagando", "Pagando"),
            ("saldada", "Saldada"),
        ],
        default="pendiente"
    )

    def __str__(self):
        return f"{self.tipo.nombre} - ${self.monto}"

    @property
    def total_pagado(self):
        return self.pagos.aggregate(
            total=Sum("monto")
        )["total"] or 0

    @property
    def saldo_pendiente(self):
        return self.monto - self.total_pagado

    @property
    def valor_cuota(self):
        return self.monto / self.numero_cuotas

class PagoCredito(models.Model):

    compra = models.ForeignKey(
        CompraCredito,
        on_delete=models.CASCADE,
        related_name="pagos"
    )

    movimiento = models.OneToOneField(
        Movimiento,
        on_delete=models.PROTECT,
        related_name="pago_credito",
        null=True,
        blank=True
    )

    monto = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    fecha = models.DateField()

    def __str__(self):
        return f"Pago - ${self.monto}"