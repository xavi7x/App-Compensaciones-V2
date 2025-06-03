# app/crud/crud_cliente.py
from sqlalchemy.orm import Session
from sqlalchemy import func, or_ 
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteCreate, ClienteUpdate 
from typing import List, Optional, Union, Dict, Any, Tuple

def get_clientes(
    db: Session, skip: int = 0, limit: int = 10, search: Optional[str] = None
) -> Tuple[List[Cliente], int]: # Ahora devuelve una tupla: (items, total_count)
    query = db.query(Cliente)

    if search:
        search_term = f"%{search.lower()}%" # Convertir a minúsculas para búsqueda insensible
        query = query.filter(
            or_(
                func.lower(Cliente.razon_social).ilike(search_term), # Usar func.lower y ilike
                func.lower(Cliente.rut).ilike(search_term)
            )
        )

    total_count = query.count() # Contar ANTES de aplicar skip y limit para la paginación

    items = query.order_by(Cliente.razon_social).offset(skip).limit(limit).all()

    return items, total_count

def get_cliente(db: Session, cliente_id: int) -> Optional[Cliente]:  # ✅ Función faltante
    return db.query(Cliente).filter(Cliente.id == cliente_id).first()

def get_cliente_by_rut(db: Session, rut: str) -> Optional[Cliente]:
    return db.query(Cliente).filter(Cliente.rut == rut).first()

def create_cliente(db: Session, *, cliente_in: ClienteCreate) -> Cliente:
    db_cliente = Cliente(
        razon_social=cliente_in.razon_social,
        rut=cliente_in.rut,
        ramo=cliente_in.ramo,
        ubicacion=cliente_in.ubicacion
    )
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def update_cliente(
    db: Session, *, db_cliente: Cliente, cliente_in: Union[ClienteUpdate, Dict[str, Any]]
) -> Cliente:
    if isinstance(cliente_in, dict):
        update_data = cliente_in
    else:
        update_data = cliente_in.model_dump(exclude_unset=True) # Para Pydantic v2
        # Para Pydantic v1 sería: update_data = cliente_in.dict(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_cliente, field, value)

    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def remove_cliente(db: Session, *, cliente_id: int) -> Optional[Cliente]:
    db_cliente = db.query(Cliente).get(cliente_id) # .get() es más directo para PK
    if db_cliente:
        db.delete(db_cliente)
        db.commit()
    return db_cliente # Retorna el objeto eliminado o None si no se encontró