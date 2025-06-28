# app/crud/crud_factura.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from typing import List, Tuple, Optional, Dict, Any
import pandas as pd
from datetime import date

from app.models.factura import Factura
from app.models.vendedor import Vendedor
from app.models.cliente import Cliente
from app.schemas.factura import FacturaCreate, FacturaUpdate
from sqlalchemy import func

def get_factura(db: Session, factura_id: int) -> Optional[Factura]:
    return db.query(Factura).options(joinedload(Factura.vendedor), joinedload(Factura.cliente)).filter(Factura.id == factura_id).first()

def get_facturas(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    vendedor_id: Optional[int] = None,
    cliente_id: Optional[int] = None
) -> Tuple[List[Factura], int]:
    
    query = db.query(Factura).options(joinedload(Factura.vendedor), joinedload(Factura.cliente))

    if start_date:
        query = query.filter(Factura.fecha_emision >= start_date)
    if end_date:
        query = query.filter(Factura.fecha_emision <= end_date)
    if vendedor_id:
        query = query.filter(Factura.vendedor_id == vendedor_id)
    if cliente_id:
        query = query.filter(Factura.cliente_id == cliente_id)

    total_count = query.with_entities(func.count(Factura.id)).scalar()
    items = query.order_by(Factura.fecha_emision.desc()).offset(skip).limit(limit).all()
    return items, total_count

def create_factura(db: Session, *, factura_in: FacturaCreate) -> Factura:
    db_factura = Factura(**factura_in.model_dump())
    db.add(db_factura)
    db.commit()
    db.refresh(db_factura)
    return db_factura

def update_factura(db: Session, *, db_obj: Factura, obj_in: FacturaUpdate | Dict[str, Any]) -> Factura:
    if isinstance(obj_in, dict):
        update_data = obj_in
    else:
        update_data = obj_in.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_obj, field, value)
        
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

def delete_factura(db: Session, *, factura_id: int) -> Optional[Factura]:
    db_obj = db.query(Factura).filter(Factura.id == factura_id).first()
    if db_obj:
        try:
            db.delete(db_obj)
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se puede eliminar la factura porque está asociada a otros registros."
            )
    return db_obj

# ... Función process_facturas_csv 

def process_facturas_csv(db: Session, *, df: pd.DataFrame) -> Tuple[List[Factura], List[str]]:
    facturas_procesadas = []
    errores = []
    vendedores_rut_map = {v.rut: v.id for v in db.query(Vendedor.id, Vendedor.rut).all()}
    clientes_rut_map = {c.rut: c.id for c in db.query(Cliente.id, Cliente.rut).all()}

    for index, row in df.iterrows():
        try:
            vendedor_rut = str(row['vendedor_rut']).strip()
            cliente_rut = str(row['cliente_rut']).strip()
            vendedor_id = vendedores_rut_map.get(vendedor_rut)
            cliente_id = clientes_rut_map.get(cliente_rut)
            
            if not vendedor_id:
                errores.append(f"Fila {index + 2}: Vendedor con RUT '{vendedor_rut}' no encontrado.")
                continue
            if not cliente_id:
                errores.append(f"Fila {index + 2}: Cliente con RUT '{cliente_rut}' no encontrado.")
                continue

            factura_in = FacturaCreate(
                numero_orden=str(row['numero_orden']),
                numero_caso=str(row.get('numero_caso', '')),
                honorarios_generados=float(str(row['honorarios_generados']).replace(',', '.')),
                gastos_generados=float(str(row['gastos_generados']).replace(',', '.')),
                fecha_venta=pd.to_datetime(row['fecha_venta']).date(),
                vendedor_id=vendedor_id,
                cliente_id=cliente_id
            )
            db_factura = create_factura(db, factura_in=factura_in)
            facturas_procesadas.append(db_factura)
        except Exception as e:
            errores.append(f"Fila {index + 2}: Error - {str(e)}")

    if errores:
        db.rollback()
        return [], errores
    else:
        return facturas_procesadas, []