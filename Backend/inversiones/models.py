from django.db import models
from finanzas.models import Movimiento
from datetime import date

# Renta Fija
class CDT(models.Model):

    ESTADO_CHOICES = [
        ("activa", "Activa"),
        ("vencida", "Vencida"),
        ("cerrada", "Cerrada"),
        ("cancelada", "Cancelada"),
    ]

    entidad = models.CharField(max_length=100)
    estado = models.CharField( max_length=20, choices=ESTADO_CHOICES, default="activa" )

    movimiento_inversion = models.OneToOneField(
        Movimiento,
        on_delete=models.PROTECT,
        related_name="cdt_inversion",
    )

    movimiento_reintegro = models.OneToOneField(
        Movimiento,
        on_delete=models.PROTECT,
        related_name="cdt_reintegro",
        null=True,
        blank=True
    )

    fecha_inicio = models.DateField()
    fecha_vencimiento = models.DateField()
    fecha_cierre = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"CDT - {self.entidad}"
    

# Renta Variable

# Monedas
class Moneda(models.Model):

    codigo = models.CharField( max_length=5, unique=True )
    nombre = models.CharField( max_length=50 )
    simbolo = models.CharField( max_length=5, blank=True )

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

class CotizacionMoneda(models.Model):

    moneda = models.ForeignKey( Moneda, on_delete=models.CASCADE, related_name="cotizaciones" )
    fecha = models.DateField()
    valor = models.DecimalField( max_digits=15, decimal_places=6 )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["moneda", "fecha"],
                name="unique_cotizacion_moneda_fecha"
            )
        ]
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.moneda.codigo} - {self.fecha}: {self.valor}"


# Brokers
class Broker(models.Model):
    nombre = models.CharField(max_length=100)
    monedas = models.ManyToManyField( Moneda, related_name="brokers" )
    activo = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre

class MovimientoBroker(models.Model):

    TIPO_CHOICES = [
        ("entrada", "Entrada"),
        ("salida", "Salida"),
    ]

    broker = models.ForeignKey( Broker, on_delete=models.PROTECT, related_name="movimientos" )
    moneda = models.ForeignKey( Moneda, on_delete=models.PROTECT, related_name="movimientos_broker" )
    tipo = models.CharField(max_length=10,choices=TIPO_CHOICES)
    costo = models.DecimalField( max_digits=18, decimal_places=6, null=True, blank=True )
    monto = models.DecimalField( max_digits=18, decimal_places=6 )
    movimiento = models.OneToOneField( Movimiento, on_delete=models.PROTECT, related_name="movimiento_broker" )

# Activos
class Activo(models.Model):

    TIPO_CHOICES = [
        ("accion", "Acción"),
        ("etf", "ETF"),
    ]

    ticker = models.CharField( max_length=20, unique=True )
    nombre = models.CharField( max_length=150 )
    tipo = models.CharField( max_length=20, choices=TIPO_CHOICES )
    moneda = models.ForeignKey( Moneda, on_delete=models.PROTECT, related_name="activos" )
    activo = models.BooleanField( default=True )

    def __str__(self):
        return f"{self.ticker} - {self.nombre}"

class PrecioActivo(models.Model):

    activo = models.ForeignKey( Activo, on_delete=models.CASCADE, related_name="precios" )
    fecha = models.DateField()
    precio = models.DecimalField( max_digits=15, decimal_places=6 )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["activo", "fecha"],
                name="unique_precio_activo_fecha"
            )
        ]
        ordering = ["-fecha"]

    def __str__(self):
        return f"{self.activo.ticker} - {self.fecha}: {self.precio}"

class OperacionActivo(models.Model):

    TIPO_CHOICES = [
        ("compra", "Compra"),
        ("venta", "Venta"),
    ]

    activo = models.ForeignKey( Activo, on_delete=models.PROTECT, related_name="operaciones" )
    broker = models.ForeignKey( Broker, on_delete=models.PROTECT, related_name="operaciones",)
    tipo = models.CharField( max_length=10, choices=TIPO_CHOICES )
    cantidad = models.DecimalField( max_digits=18, decimal_places=8 )
    comision = models.DecimalField( max_digits=15, decimal_places=2, default=0 )
    fecha = models.DateField()

    def __str__(self):
        return f"{self.tipo} - {self.activo.ticker} - {self.cantidad}"


# Dividendo
class DividendoActivo(models.Model):
    activo = models.ForeignKey( Activo, on_delete=models.PROTECT, related_name="dividendos" )
    movimiento = models.OneToOneField( Movimiento, on_delete=models.PROTECT, related_name="dividendo_activo", )
    fecha = models.DateField()
    monto = models.DecimalField(max_digits=15, decimal_places=6)

    def __str__(self):
            return f"Dividendo - {self.activo.ticker} - {self.fecha}"


# Rendimiento
class RendimientoCuenta(models.Model):

    movimiento = models.OneToOneField( Movimiento, on_delete=models.PROTECT, related_name="rendimiento_cuenta" )

    saldo_cuenta = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )

    def __str__(self):
        return (
            f"Rendimiento - "
            f"{self.movimiento.cuenta.nombre} - "
            f"{self.movimiento.fecha.date()}"
        )
    