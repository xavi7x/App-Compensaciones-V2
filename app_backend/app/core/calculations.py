# app/core/calculations.py
from sqlalchemy.orm import Session, joinedload # Asegúrate de que joinedload esté importado
from datetime import date
from typing import List, Optional

from app.models.vendedor import Vendedor
from app.models.factura import Factura
# Importa el modelo Cliente si no está ya importado
from app.models.cliente import Cliente 
from app.schemas.bono import BonoVendedorResult

def calcular_bonos_por_periodo(
    db: Session,
    start_date: date,
    end_date: date,
    vendedor_id: Optional[int] = None
) -> List[BonoVendedorResult]:

    query_vendedores = db.query(Vendedor)
    if vendedor_id:
        query_vendedores = query_vendedores.filter(Vendedor.id == vendedor_id)

    # Cargar eficientemente las relaciones necesarias
    vendedores_a_procesar = query_vendedores.options(joinedload(Vendedor.clientes_asignados)).all()
    
    resultados_finales = []

    for vendedor in vendedores_a_procesar:
        # Usamos joinedload para cargar el cliente junto con la factura y evitar N+1 queries
        facturas_periodo = db.query(Factura).options(joinedload(Factura.cliente)).filter(
            Factura.vendedor_id == vendedor.id,
            Factura.fecha_emision >= start_date,
            Factura.fecha_emision <= end_date
        ).all()

        if not facturas_periodo:
            continue

        bono_total_vendedor = 0.0
        total_honorarios = 0.0
        total_gastos = 0.0
        detalle_facturas_procesadas = []
        
        mapa_porcentajes = {
            asignacion.cliente_id: asignacion.porcentaje_bono 
            for asignacion in vendedor.clientes_asignados
        }
        
        for factura in facturas_periodo:
            honorario = factura.honorarios_generados or 0.0
            gasto = factura.gastos_generados or 0.0
            total_honorarios += honorario
            total_gastos += gasto
            
            porcentaje_aplicable = mapa_porcentajes.get(factura.cliente_id, 0)
            neto_factura = honorario - gasto
            bono_factura = max(0, neto_factura) * porcentaje_aplicable
            bono_total_vendedor += bono_factura

            # --- MODIFICACIÓN AQUÍ ---
            # Añadimos el campo 'razon_social_cliente' al detalle
            detalle_facturas_procesadas.append({
                "factura_id": factura.id, 
                "numero_orden": factura.numero_orden,
                "razon_social_cliente": factura.cliente.razon_social if factura.cliente else "N/A", # <-- LÍNEA AÑADIDA
                "honorarios": honorario, 
                "gastos": gasto, 
                "neto": neto_factura,
                "porcentaje_aplicado": porcentaje_aplicable, 
                "bono_generado": bono_factura,
            })
            
        resultado_vendedor = BonoVendedorResult(
            vendedor_id=vendedor.id, 
            nombre_vendedor=vendedor.nombre_completo,
            rut_vendedor=vendedor.rut, 
            total_honorarios=total_honorarios,
            total_gastos=total_gastos, 
            total_neto=total_honorarios - total_gastos,
            bono_calculado=bono_total_vendedor, 
            detalle_facturas=detalle_facturas_procesadas
        )
        resultados_finales.append(resultado_vendedor)

    return resultados_finales