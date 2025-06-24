# app/api/v1/endpoints/reportes.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Any, Optional
from datetime import date

from app import crud, schemas
from app.api import deps
from app.models.user import User as UserModel

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
    Obtener un reporte de facturación con filtros y sumatorias.
    """
    items, total_count, sumatoria_total, sumatorias_vendedor = crud.get_reporte_facturacion(
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
    return {
        "items": items, 
        "total_count": total_count,
        "sumatoria_total_honorarios": sumatoria_total,
        "sumatorias_por_vendedor": sumatorias_vendedor
    }