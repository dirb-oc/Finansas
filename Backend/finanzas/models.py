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
    fecha = models.DateTimeField(auto_now_add=True)

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