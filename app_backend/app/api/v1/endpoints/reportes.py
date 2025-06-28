# app/api/v1/endpoints/reportes.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from typing import Any, Optional, List
from datetime import date

from app import crud, schemas
from app.api import deps
from app.models.user import User as UserModel
from app.models.vendedor import Vendedor # Importamos Vendedor
from app.models.cliente import Cliente   # Importamos Cliente

router = APIRouter()

@router.get("/facturacion", response_model=schemas.reporte.ReporteResponse)
def get_reporte_facturacion_endpoint(
    db: Session = Depends(deps.get_db),
    start_date: date = Query(..., description="Fecha de inicio (YYYY-MM-DD)"),
    end_date: date = Query(..., description="Fecha de fin (YYYY-MM-DD)"),
    numero_caso: Optional[str] = Query(None),
    vendedor_id: Optional[int] = Query(None),
    cliente_id: Optional[int] = Query(None),
    vendedor_rut: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener un reporte de facturación enriquecido con el cálculo de bono por factura.
    """
    # 1. Obtenemos los datos base de la facturación.
    items_db, total_count, sumatoria_total, sumatorias_vendedor = crud.get_reporte_facturacion(
        db=db, 
        start_date=start_date, 
        end_date=end_date,
        numero_caso=numero_caso,
        vendedor_id=vendedor_id,
        cliente_id=cliente_id,
        vendedor_rut=vendedor_rut,
        skip=skip,
        limit=limit
    )

    if not items_db:
        # Si no hay facturas, devolvemos una respuesta vacía de inmediato.
        return {
            "items": [], 
            "total_count": 0,
            "sumatoria_total_honorarios": 0,
            "sumatorias_por_vendedor": []
        }

    # --- INICIO DE LA NUEVA LÓGICA ROBUSTA ---
    
    # 2. Obtenemos los IDs únicos de vendedores y clientes de los resultados.
    vendedor_ids = {item.vendedor_id for item in items_db}
    cliente_ids = {item.cliente_id for item in items_db}
    
    # 3. Hacemos consultas eficientes para obtener todos los datos necesarios de una sola vez.
    vendedores_con_porcentajes = db.query(Vendedor).options(
        joinedload(Vendedor.clientes_asignados)
    ).filter(Vendedor.id.in_(vendedor_ids)).all()
    
    clientes_db = db.query(Cliente).filter(Cliente.id.in_(cliente_ids)).all()
        
    # 4. Creamos mapas para un acceso rápido y fácil a los datos, sin más consultas a la DB.
    mapa_vendedores = {v.id: v for v in vendedores_con_porcentajes}
    mapa_clientes = {c.id: c for c in clientes_db}

    items_enriquecidos = []
    for item in items_db: # 'item' es un objeto Factura de SQLAlchemy
        bono_por_factura = 0.0
        porcentaje_aplicado = 0.0

        vendedor = mapa_vendedores.get(item.vendedor_id)
        cliente = mapa_clientes.get(item.cliente_id)

        # Calculamos el bono solo si encontramos al vendedor
        if vendedor:
            mapa_porcentajes_vendedor = {
                asignacion.cliente_id: asignacion.porcentaje_bono 
                for asignacion in vendedor.clientes_asignados
            }
            porcentaje_real = mapa_porcentajes_vendedor.get(item.cliente_id, 0.0)
            
            neto_factura = (item.honorarios_generados or 0.0) - (item.gastos_generados or 0.0)
            bono_por_factura = max(0, neto_factura) * porcentaje_real
            porcentaje_aplicado = porcentaje_real * 100

        # 5. Creamos un objeto de respuesta explícito para cada item, usando los datos de los mapas.
        # Este es el paso clave para evitar errores.
        item_enriquecido = schemas.reporte.ReporteFacturaItem(
            factura_id=item.factura_id,
            numero_orden=item.numero_orden,
            numero_caso=item.numero_caso,
            fecha_emision=item.fecha_emision,
            honorarios_generados=item.honorarios_generados,
            gastos_generados=item.gastos_generados,
            vendedor_id=item.vendedor_id,
            # Se usan los datos de los mapas, con un fallback por seguridad
            vendedor_nombre=vendedor.nombre_completo if vendedor else "N/A",
            vendedor_rut=vendedor.rut if vendedor else "N/A",
            cliente_id=item.cliente_id,
            cliente_razon_social=cliente.razon_social if cliente else "N/A",
            cliente_rut=cliente.rut if cliente else "N/A",
            # Se asignan los nuevos valores calculados
            bono_calculado=bono_por_factura,
            porcentaje_bono_aplicado=porcentaje_aplicado
        )
        items_enriquecidos.append(item_enriquecido)

    # --- FIN DE LA LÓGICA ---

    # 6. Devolvemos la respuesta con los items ya enriquecidos.
    return {
        "items": items_enriquecidos, 
        "total_count": total_count,
        "sumatoria_total_honorarios": sumatoria_total,
        "sumatorias_por_vendedor": sumatorias_vendedor
    }