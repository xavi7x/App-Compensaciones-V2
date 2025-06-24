# app/crud/crud_reporte.py
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional, Tuple, Any
from datetime import date

from app.models.factura import Factura
from app.models.vendedor import Vendedor
from app.models.cliente import Cliente

def get_reporte_facturacion(
    db: Session,
    *,
    start_date: date,
    end_date: date,
    numero_caso: Optional[str] = None,
    vendedor_id: Optional[int] = None,
    cliente_id: Optional[int] = None,
    vendedor_rut: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> Tuple[List[Any], int]:

    # Iniciar la consulta uniendo las tablas necesarias
    query = db.query(
        Factura.id.label("factura_id"),
        Factura.numero_orden,
        Factura.numero_caso,
        Factura.fecha_emision,
        Factura.honorarios_generados,
        Factura.gastos_generados,
        Vendedor.id.label("vendedor_id"),
        Vendedor.nombre_completo.label("vendedor_nombre"),
        Vendedor.rut.label("vendedor_rut"),
        Cliente.id.label("cliente_id"),
        Cliente.razon_social.label("cliente_razon_social"),
        Cliente.rut.label("cliente_rut")
    ).join(Vendedor, Factura.vendedor_id == Vendedor.id).join(Cliente, Factura.cliente_id == Cliente.id)

    # Aplicar filtros dinámicamente

    # Filtro de período (siempre requerido)
    query = query.filter(Factura.fecha_emision.between(start_date, end_date))

    if numero_caso:
        query = query.filter(Factura.numero_caso.ilike(f"%{numero_caso}%"))

    if vendedor_id:
        query = query.filter(Factura.vendedor_id == vendedor_id)

    if cliente_id:
        query = query.filter(Factura.cliente_id == cliente_id)

    if vendedor_rut:
        # Limpiar RUT si viene con puntos o guion
        rut_limpio = vendedor_rut.replace(".", "").replace("-", "")
        query = query.filter(
            func.replace(func.replace(Vendedor.rut, '.', ''), '-', '').ilike(f"%{rut_limpio}%")
        )

    # Contar el total de resultados que coinciden con los filtros (para paginación)
    count_query = query.statement.with_only_columns(func.count()).order_by(None)
    total_count = db.execute(count_query).scalar_one()

    # Aplicar ordenamiento y paginación para la consulta final
    items = query.order_by(Factura.fecha_emision.desc()).offset(skip).limit(limit).all()

    return items, total_count