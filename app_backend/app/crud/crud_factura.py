# app/crud/crud_factura.py
from sqlalchemy.orm import Session, joinedload
from typing import List, Tuple, Optional
import pandas as pd

from app.models.factura import Factura
from app.models.vendedor import Vendedor
from app.models.cliente import Cliente
from app.schemas.factura import FacturaCreate
from sqlalchemy import func # <--- CORRECCIÓN 1: 23 jun 25

def get_factura(db: Session, factura_id: int) -> Optional[Factura]:
    return db.query(Factura).options(joinedload(Factura.vendedor), joinedload(Factura.cliente)).filter(Factura.id == factura_id).first()

def get_facturas(db: Session, skip: int = 0, limit: int = 100) -> Tuple[List[Factura], int]:
    query = db.query(Factura).options(joinedload(Factura.vendedor), joinedload(Factura.cliente))

    # Usar with_entities para contar de forma eficiente
    total_count = query.with_entities(func.count(Factura.id)).scalar() # func.count ahora está definido

    # --- CORRECCIÓN 2: Usar 'fecha_emision' que es el nombre correcto en el modelo ---
    items = query.order_by(Factura.fecha_emision.desc()).offset(skip).limit(limit).all()

    return items, total_count

def create_factura(db: Session, *, factura_in: FacturaCreate) -> Factura:
    db_factura = Factura(**factura_in.model_dump())
    db.add(db_factura)
    db.commit()
    db.refresh(db_factura)
    return db_factura

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