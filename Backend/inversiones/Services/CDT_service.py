from django.db import transaction
from django.core.exceptions import ValidationError
from django.db.models import F, Sum, DecimalField, ExpressionWrapper
from datetime import datetime
from decimal import Decimal

from finanzas.Services.movimiento_service import crear_movimiento
from finanzas.models import TipoMovimiento
from ..models import CDT

ZERO = Decimal("0")

@transaction.atomic
def crear_cdt( *, cuenta, entidad, monto, fecha_inicio, fecha_vencimiento, ):

    if fecha_vencimiento <= fecha_inicio:
        raise ValidationError({
            "fecha_vencimiento": ( "La fecha de vencimiento debe ser posterior a la fecha de inicio." )
        })

    tipo_inversion, _ = TipoMovimiento.objects.get_or_create( nombre="Inversión", tipo="gasto", )

    movimiento = crear_movimiento(
        cuenta=cuenta,
        tipo=tipo_inversion,
        monto=monto,
        descripcion=f"Inversión CDT - {entidad}",
        fecha=fecha_inicio,
    )

    cdt = CDT.objects.create(
        entidad=entidad,
        movimiento_inversion=movimiento,
        fecha_inicio=fecha_inicio,
        fecha_vencimiento=fecha_vencimiento,
    )

    return cdt


@transaction.atomic
def finalizar_cdt(*, cdt, monto_recibido, fecha_cierre=None):

    if cdt.estado not in ["activa", "vencida"]:
        raise ValidationError({
            "estado": "El CDT no se puede finalizar en su estado actual."
        })

    if monto_recibido <= 0:
        raise ValidationError({
            "monto_recibido": "El monto recibido debe ser mayor a 0."
        })

    if cdt.movimiento_reintegro is not None:
        raise ValidationError({
            "cdt": "Este CDT ya tiene registrado un reintegro."
        })

    tipo_reintegro, _ = TipoMovimiento.objects.get_or_create(
        nombre="Reintegro de inversión",
        tipo="ingreso",
    )

    movimiento_reintegro = crear_movimiento(
        cuenta=cdt.movimiento_inversion.cuenta,
        tipo=tipo_reintegro,
        monto=monto_recibido,
        fecha=fecha_cierre,
        descripcion=f"Reintegro CDT - {cdt.entidad}",
    )

    cdt.movimiento_reintegro = movimiento_reintegro
    cdt.estado = "cerrada"
    cdt.fecha_cierre = fecha_cierre

    cdt.save(
        update_fields=[
            "movimiento_reintegro",
            "estado",
            "fecha_cierre",
        ]
    )

    return cdt


def valor_cdt_historico(fecha):
    cdts = CDT.objects.filter(
        movimiento_inversion__fecha__lte=fecha
    ).select_related(
        "movimiento_inversion",
        "movimiento_reintegro"
    )

    total = ZERO

    for cdt in cdts:

        if cdt.movimiento_reintegro:
            if cdt.movimiento_reintegro.fecha <= fecha:
                continue
            
        total += cdt.movimiento_inversion.monto

    return total


def obtener_cdts_estadisticas():
    cdts = (
        CDT.objects
        # .filter(movimiento_reintegro__isnull=True)
        .select_related("movimiento_inversion")
        .order_by("fecha_vencimiento")
    )

    cantidad = cdts.count()

    capital = sum(
        (cdt.movimiento_inversion.monto for cdt in cdts),
        ZERO
    )

    proximo_vencimiento = cdts.first()

    return {
        "cantidad": cantidad,
        "capital": capital,
        "proximo_vencimiento": (
            proximo_vencimiento.fecha_vencimiento
            if proximo_vencimiento
            else None
        ),
    }


def obtener_cdts_actuales(fecha_corte):
    cdts = (
        CDT.objects
        .filter(
            movimiento_reintegro__isnull=True,
            movimiento_inversion__fecha__lte=fecha_corte,
        )
        .select_related("movimiento_inversion")
    )

    return [
        {
            "tipo": "cdt",
            "nombre": f"CDT {cdt.entidad}",
            "monto": cdt.movimiento_inversion.monto,
            "moneda": "COP",
            "porcentaje_broker": None,
        }
        for cdt in cdts
    ]


def valor_cdt_no_finalizados():

    cdt = CDT.objects.filter(
        movimiento_reintegro__isnull=True
    ).select_related(
        "movimiento_inversion"
    )

    return sum(
        (
            item.movimiento_inversion.monto
            for item in cdt
        ),
        ZERO
    )


def normalizar_fecha(fecha):
    if isinstance(fecha, datetime):
        return fecha.date()

    return fecha


def resultado_cdts_periodo(inicio, fin):
    inicio = normalizar_fecha(inicio)
    fin = normalizar_fecha(fin)

    cdts = CDT.objects.filter(
        movimiento_reintegro__isnull=False,
        movimiento_reintegro__fecha__gte=inicio,
        movimiento_reintegro__fecha__lt=fin,
    )

    resultado = cdts.aggregate(
        total=Sum(
            ExpressionWrapper(
                F("movimiento_reintegro__monto")
                - F("movimiento_inversion__monto"),
                output_field=DecimalField(
                    max_digits=18,
                    decimal_places=2,
                ),
            )
        )
    )["total"]

    return resultado or ZERO

def ganancias_cdt():
    """
    Ganancia realizada de CDT que ya fueron reintegrados.

    Ganancia = dinero recibido - capital invertido.
    """

    cdts = (
        CDT.objects
        .filter(
            movimiento_reintegro__isnull=False
        )
        .select_related(
            "movimiento_inversion",
            "movimiento_reintegro",
        )
    )

    return sum(
        (
            cdt.movimiento_reintegro.monto
            - cdt.movimiento_inversion.monto
            for cdt in cdts
        ),
        ZERO
    )