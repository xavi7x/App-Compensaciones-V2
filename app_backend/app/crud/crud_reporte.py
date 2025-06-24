# app/crud/crud_reporte.py
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, cast, Float
from typing import List, Optional, Tuple, Any, Dict
from datetime import date
from collections import defaultdict

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
) -> Tuple[List[Any], int, float, List[Dict[str, Any]]]: # <-- Tipo de retorno actualizado

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
    query = query.filter(Factura.fecha_emision.between(start_date, end_date))
    if numero_caso:
        query = query.filter(Factura.numero_caso.ilike(f"%{numero_caso}%"))
    if vendedor_id:
        query = query.filter(Factura.vendedor_id == vendedor_id)
    if cliente_id:
        query = query.filter(Factura.cliente_id == cliente_id)
    if vendedor_rut:
        rut_limpio = vendedor_rut.replace(".", "").replace("-", "")
        query = query.filter(func.replace(func.replace(Vendedor.rut, '.', ''), '-', '').ilike(f"%{rut_limpio}%"))

    # --- LÓGICA DE SUMATORIAS ---
    # Ejecutar la consulta filtrada una vez para obtener todos los datos para los cálculos
    all_filtered_results = query.all()

    # 1. Calcular la sumatoria total de honorarios
    sumatoria_total_honorarios = sum(item.honorarios_generados for item in all_filtered_results)

    # 2. Calcular las sumatorias por vendedor
    sumatorias_vendedor_dict = defaultdict(lambda: {"vendedor_nombre": "", "total_honorarios": 0.0})
    for item in all_filtered_results:
        sumatorias_vendedor_dict[item.vendedor_id]["vendedor_nombre"] = item.vendedor_nombre
        sumatorias_vendedor_dict[item.vendedor_id]["total_honorarios"] += item.honorarios_generados

    sumatorias_por_vendedor = [
        {"vendedor_id": vid, **data} for vid, data in sumatorias_vendedor_dict.items()
    ]
    sumatorias_por_vendedor.sort(key=lambda x: x["total_honorarios"], reverse=True)

    # --- FIN LÓGICA DE SUMATORIAS ---

    # 3. Aplicar paginación a los resultados ya obtenidos
    total_count = len(all_filtered_results)
    paginated_items = all_filtered_results[skip : skip + limit]

    return paginated_items, total_count, sumatoria_total_honorarios, sumatorias_por_vendedor