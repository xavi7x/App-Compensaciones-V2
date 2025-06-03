# app/crud/crud_vendedor.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from app.models.vendedor import Vendedor, VendedorClientePorcentaje
from app.models.cliente import Cliente # Para verificar existencia de cliente
from app.schemas.vendedor import VendedorCreate, VendedorUpdate, VendedorClientePorcentajeCreate, VendedorClientePorcentajeUpdate
from typing import List, Optional, Tuple, Any, Dict, Union

# CRUD para Vendedor
def get_vendedor(db: Session, vendedor_id: int) -> Optional[Vendedor]:
    return db.query(Vendedor).options(joinedload(Vendedor.clientes_asignados).joinedload(VendedorClientePorcentaje.cliente)).filter(Vendedor.id == vendedor_id).first()

def get_vendedor_by_rut(db: Session, rut: str) -> Optional[Vendedor]:
    return db.query(Vendedor).filter(Vendedor.rut == rut).first()

def get_vendedores(
    db: Session, skip: int = 0, limit: int = 10, search: Optional[str] = None
) -> Tuple[List[Vendedor], int]:
    query = db.query(Vendedor).options(joinedload(Vendedor.clientes_asignados).joinedload(VendedorClientePorcentaje.cliente)) # Cargar relaciones

    if search:
        search_term = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Vendedor.nombre_completo).ilike(search_term),
                func.lower(Vendedor.rut).ilike(search_term)
            )
        )

    total_count = query.count()
    items = query.order_by(Vendedor.nombre_completo).offset(skip).limit(limit).all()
    return items, total_count

def create_vendedor(db: Session, *, vendedor_in: VendedorCreate) -> Vendedor:
    db_vendedor = Vendedor(
        nombre_completo=vendedor_in.nombre_completo,
        rut=vendedor_in.rut,
        sueldo_base=vendedor_in.sueldo_base
    )
    db.add(db_vendedor)
    db.commit() # Commit para obtener el ID del vendedor

    if vendedor_in.asignaciones:
        for asignacion_in in vendedor_in.asignaciones:
            # Verificar que el cliente exista
            cliente_db = db.query(Cliente).filter(Cliente.id == asignacion_in.cliente_id).first()
            if not cliente_db:
                # Podrías acumular errores o lanzar una excepción
                print(f"Advertencia: Cliente con ID {asignacion_in.cliente_id} no encontrado al crear asignación para vendedor {db_vendedor.rut}.")
                continue

            db_asignacion = VendedorClientePorcentaje(
                vendedor_id=db_vendedor.id,
                cliente_id=asignacion_in.cliente_id,
                porcentaje_bono=asignacion_in.porcentaje_bono
            )
            db.add(db_asignacion)
        db.commit() # Commit de las asignaciones

    db.refresh(db_vendedor)
    # Recargar las relaciones para que estén disponibles en el objeto retornado
    db.refresh(db_vendedor, attribute_names=['clientes_asignados'])
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
    db.refresh(db_vendedor, attribute_names=['clientes_asignados']) # Recargar relaciones
    return db_vendedor

def remove_vendedor(db: Session, *, vendedor_id: int) -> Optional[Vendedor]:
    db_vendedor = db.query(Vendedor).get(vendedor_id)
    if db_vendedor:
        # Considerar qué hacer con las asignaciones VendedorClientePorcentaje (cascade delete o error si existen)
        # Por ahora, las eliminamos si el modelo tiene cascade="all, delete-orphan" en la relación
        # o las eliminamos manualmente:
        db.query(VendedorClientePorcentaje).filter(VendedorClientePorcentaje.vendedor_id == vendedor_id).delete()
        db.delete(db_vendedor)
        db.commit()
    return db_vendedor

# CRUD para VendedorClientePorcentaje
def get_asignacion(db: Session, vendedor_id: int, cliente_id: int) -> Optional[VendedorClientePorcentaje]:
    return db.query(VendedorClientePorcentaje).filter_by(vendedor_id=vendedor_id, cliente_id=cliente_id).first()

def add_cliente_a_vendedor(
    db: Session, *, vendedor: Vendedor, asignacion_in: VendedorClientePorcentajeCreate
) -> VendedorClientePorcentaje:
    # Verificar que el cliente exista
    cliente_db = db.query(Cliente).filter(Cliente.id == asignacion_in.cliente_id).first()
    if not cliente_db:
        raise ValueError(f"Cliente con ID {asignacion_in.cliente_id} no encontrado.")

    # Verificar si ya existe una asignación para este vendedor y cliente
    db_asignacion_existente = get_asignacion(db, vendedor_id=vendedor.id, cliente_id=asignacion_in.cliente_id)
    if db_asignacion_existente:
        raise ValueError(f"El vendedor ya tiene una asignación para el cliente ID {asignacion_in.cliente_id}.")

    db_asignacion = VendedorClientePorcentaje(
        vendedor_id=vendedor.id,
        cliente_id=asignacion_in.cliente_id,
        porcentaje_bono=asignacion_in.porcentaje_bono
    )
    db.add(db_asignacion)
    db.commit()
    db.refresh(db_asignacion)
    db.refresh(vendedor, attribute_names=['clientes_asignados']) # Recargar la relación en el vendedor
    return db_asignacion

def update_porcentaje_cliente_vendedor(
    db: Session, *, db_asignacion: VendedorClientePorcentaje, asignacion_in: VendedorClientePorcentajeUpdate
) -> VendedorClientePorcentaje:
    db_asignacion.porcentaje_bono = asignacion_in.porcentaje_bono
    db.add(db_asignacion)
    db.commit()
    db.refresh(db_asignacion)
    # También podrías necesitar refrescar el vendedor si es relevante
    # db.refresh(db_asignacion.vendedor, attribute_names=['clientes_asignados'])
    return db_asignacion

def remove_cliente_de_vendedor(db: Session, *, vendedor_id: int, cliente_id: int) -> Optional[VendedorClientePorcentaje]:
    db_asignacion = get_asignacion(db, vendedor_id=vendedor_id, cliente_id=cliente_id)
    if db_asignacion:
        vendedor = db_asignacion.vendedor # Guardar referencia al vendedor antes de borrar
        db.delete(db_asignacion)
        db.commit()
        if vendedor:
             db.refresh(vendedor, attribute_names=['clientes_asignados']) # Recargar la relación en el vendedor
        return db_asignacion
    return None
