# app/crud/crud_vendedor.py
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, or_
from app.models.vendedor import Vendedor, VendedorClientePorcentaje
from app.models.cliente import Cliente
from app.schemas.vendedor import VendedorCreate, VendedorUpdate, VendedorClientePorcentajeCreate, VendedorClientePorcentajeUpdate
from typing import List, Optional, Tuple, Any, Dict, Union
import pandas as pd

# CRUD para Vendedor
def get_vendedor(db: Session, vendedor_id: int) -> Optional[Vendedor]:
    return db.query(Vendedor).options(joinedload(Vendedor.clientes_asignados).joinedload(VendedorClientePorcentaje.cliente)).filter(Vendedor.id == vendedor_id).first()

def get_vendedor_by_rut(db: Session, rut: str) -> Optional[Vendedor]:
    return db.query(Vendedor).filter(Vendedor.rut == rut).first()

def get_vendedores(
    db: Session, skip: int = 0, limit: int = 10, search: Optional[str] = None
) -> Tuple[List[Vendedor], int]:
    query = db.query(Vendedor).options(joinedload(Vendedor.clientes_asignados).joinedload(VendedorClientePorcentaje.cliente))

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Vendedor.nombre_completo).ilike(search_term),
                func.lower(Vendedor.rut).ilike(search_term)
            )
        )

    total_count_query = query.with_entities(func.count(Vendedor.id))
    total_count = total_count_query.scalar() or 0
    items = query.order_by(Vendedor.nombre_completo).offset(skip).limit(limit).all()
    return items, total_count

def create_vendedor(db: Session, *, vendedor_in: VendedorCreate) -> Vendedor:
    db_vendedor = Vendedor(
        nombre_completo=vendedor_in.nombre_completo,
        rut=vendedor_in.rut,
        sueldo_base=vendedor_in.sueldo_base
    )
    db.add(db_vendedor)
    db.commit()
    db.refresh(db_vendedor)
    return db_vendedor

def update_vendedor(
    db: Session, *, db_vendedor: Vendedor, vendedor_in: Union[VendedorUpdate, Dict[str, Any]]
) -> Vendedor:
    update_data = vendedor_in if isinstance(vendedor_in, dict) else vendedor_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_vendedor, field, value)
    db.add(db_vendedor)
    db.commit()
    db.refresh(db_vendedor)
    return db_vendedor

def remove_vendedor(db: Session, *, vendedor_id: int) -> Optional[Vendedor]:
    db_vendedor = db.query(Vendedor).get(vendedor_id)
    if db_vendedor:
        db.delete(db_vendedor)
        db.commit()
    return db_vendedor

# --- CRUD PARA ASIGNACIONES ---
def get_asignacion(db: Session, vendedor_id: int, cliente_id: int) -> Optional[VendedorClientePorcentaje]:
    return db.query(VendedorClientePorcentaje).options(
        selectinload(VendedorClientePorcentaje.cliente)
    ).filter_by(vendedor_id=vendedor_id, cliente_id=cliente_id).first()

def add_cliente_a_vendedor(
    db: Session, *, vendedor: Vendedor, asignacion_in: VendedorClientePorcentajeCreate
) -> VendedorClientePorcentaje:
    cliente_db = db.query(Cliente).filter(Cliente.id == asignacion_in.cliente_id).first()
    if not cliente_db:
        raise ValueError(f"Cliente con ID {asignacion_in.cliente_id} no encontrado.")
    db_asignacion_existente = get_asignacion(db, vendedor_id=vendedor.id, cliente_id=asignacion_in.cliente_id)
    if db_asignacion_existente:
        raise ValueError(f"El vendedor ya tiene una asignación para el cliente ID {asignacion_in.cliente_id}.")
    db_asignacion = VendedorClientePorcentaje(**asignacion_in.model_dump(), vendedor_id=vendedor.id)
    db.add(db_asignacion)
    db.commit()
    db.refresh(db_asignacion)
    return db_asignacion

def update_porcentaje_cliente_vendedor(
    db: Session, *, db_asignacion: VendedorClientePorcentaje, asignacion_in: VendedorClientePorcentajeUpdate
) -> VendedorClientePorcentaje:
    db_asignacion.porcentaje_bono = asignacion_in.porcentaje_bono
    db.add(db_asignacion)
    db.commit()
    db.refresh(db_asignacion)
    return db_asignacion

def remove_cliente_de_vendedor(db: Session, *, vendedor_id: int, cliente_id: int) -> Optional[VendedorClientePorcentaje]:
    db_asignacion = get_asignacion(db, vendedor_id=vendedor_id, cliente_id=cliente_id)
    if db_asignacion:
        db.delete(db_asignacion)
        db.commit()
    return db_asignacion

# --- FUNCIÓN PARA PROCESAR CSV ---
def process_vendedores_csv(db: Session, *, df: pd.DataFrame) -> Tuple[List[Vendedor], List[str]]:
    vendedores_procesados = []
    errores = []
    for index, row in df.iterrows():
        try:
            rut = str(row['rut']).strip()
            nombre_completo = str(row['nombre_completo']).strip()
            sueldo_base_str = str(row['sueldo_base']).strip()
            if not rut or not nombre_completo or not sueldo_base_str:
                errores.append(f"Fila {index + 2}: Datos faltantes.")
                continue
            try:
                sueldo_base = float(sueldo_base_str.replace('.', '').replace(',', '.'))
            except ValueError:
                errores.append(f"Fila {index + 2} (RUT: {rut}): 'sueldo_base' no es un número válido.")
                continue

            db_vendedor = get_vendedor_by_rut(db, rut=rut)
            if db_vendedor:
                update_data = VendedorUpdate(nombre_completo=nombre_completo, sueldo_base=sueldo_base)
                updated_vendedor = update_vendedor(db, db_vendedor=db_vendedor, vendedor_in=update_data)
                vendedores_procesados.append(updated_vendedor)
            else:
                create_data = VendedorCreate(nombre_completo=nombre_completo, rut=rut, sueldo_base=sueldo_base)
                new_vendedor = create_vendedor(db, vendedor_in=create_data)
                vendedores_procesados.append(new_vendedor)
        except Exception as e:
            errores.append(f"Fila {index + 2} (RUT: {row.get('rut', 'N/A')}): Error inesperado - {str(e)}")

    if errores:
        db.rollback()
        return [], errores
    else:
        return vendedores_procesados, []