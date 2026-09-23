from django.db import transaction
from django.core.exceptions import ValidationError
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
        movimiento_inversion__fecha__date__lte=fecha
    ).select_related(
        "movimiento_inversion",
        "movimiento_reintegro"
    )

    total = ZERO

    for cdt in cdts:

        if cdt.movimiento_reintegro:
            if cdt.movimiento_reintegro.fecha.date() <= fecha:
                continue

        total += cdt.movimiento_inversion.monto

    return total


def obtener_cdts_activos():
    cdts = (
        CDT.objects
        .filter(movimiento_reintegro__isnull=True)
        .select_related("movimiento_inversion")
        .order_by("entidad")
    )

    return [
        {
            "id": cdt.id,
            "nombre": cdt.entidad,
            "monto": cdt.movimiento_inversion.monto,
            "fecha_inicio": cdt.fecha_inicio,
            "fecha_vencimiento": cdt.fecha_vencimiento,
        }
        for cdt in cdts
    ]

def get_ganancia_cdt_periodo(inicio, fin):
    cdts = (
        CDT.objects
        .filter(
            movimiento_reintegro__fecha__gte=inicio,
            movimiento_reintegro__fecha__lt=fin,
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
        ZERO,
    )


def obtener_cdts_estadisticas():
    cdts = (
        CDT.objects
        .filter(movimiento_reintegro__isnull=True)
        .select_related("movimiento_inversion")
        .order_by("fecha_vencimiento")
    )

    return [
        {
            "id": cdt.id,
            "entidad": cdt.entidad,
            "capital": cdt.movimiento_inversion.monto,
            "fecha_inicio": cdt.fecha_inicio,
            "fecha_vencimiento": cdt.fecha_vencimiento,
            "estado": cdt.estado,
        }
        for cdt in cdts
    ]