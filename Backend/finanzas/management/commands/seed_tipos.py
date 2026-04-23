from django.core.management.base import BaseCommand
from finanzas.models import TipoMovimiento


class Command(BaseCommand):
    help = "Crear tipos de movimiento iniciales"

    def handle(self, *args, **kwargs):

        tipos = [
            {"nombre": "Inicio", "tipo": "inicial"},
            {"nombre": "Inversión", "tipo": "gasto"},
            {"nombre": "Retorno inversión", "tipo": "ingreso"},
            {"nombre": "Salario", "tipo": "ingreso"},
            {"nombre": "Comida", "tipo": "gasto"},
        ]

        for t in tipos:
            TipoMovimiento.objects.get_or_create(
                nombre=t["nombre"],
                tipo=t["tipo"]
            )

        self.stdout.write(self.style.SUCCESS("Tipos creados correctamente"))