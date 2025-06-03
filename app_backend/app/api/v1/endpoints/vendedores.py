# app/api/v1/endpoints/vendedores.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional

from app import crud, schemas
from app.api import deps
from app.models.user import User as UserModel
from app.models.vendedor import Vendedor as VendedorModel # Para type hints si es necesario

router = APIRouter()

@router.post("/", response_model=schemas.vendedor.Vendedor, status_code=status.HTTP_201_CREATED)
def create_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_in: schemas.vendedor.VendedorCreate,
    current_user: UserModel = Depends(deps.get_current_admin_user) # Solo admin crea vendedores
) -> Any:
    db_vendedor_rut = crud.crud_vendedor.get_vendedor_by_rut(db, rut=vendedor_in.rut)
    if db_vendedor_rut:
        raise HTTPException(status_code=400, detail="Un vendedor con este RUT ya existe.")
    try:
        vendedor = crud.crud_vendedor.create_vendedor(db=db, vendedor_in=vendedor_in)
    except ValueError as e: # Capturar errores de cliente_id no encontrado
        raise HTTPException(status_code=404, detail=str(e))
    return vendedor

@router.get("/", response_model=schemas.vendedor.VendedoresResponse)
def read_vendedores_endpoint(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    vendedores_items, total_count = crud.crud_vendedor.get_vendedores(db, skip=skip, limit=limit, search=search)
    return {"items": vendedores_items, "total_count": total_count}

@router.get("/{vendedor_id}", response_model=schemas.vendedor.Vendedor)
def read_vendedor_by_id_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    vendedor = crud.crud_vendedor.get_vendedor(db, vendedor_id=vendedor_id)
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    return vendedor

@router.put("/{vendedor_id}", response_model=schemas.vendedor.Vendedor)
def update_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    vendedor_in: schemas.vendedor.VendedorUpdate,
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Any:
    db_vendedor = crud.crud_vendedor.get_vendedor(db, vendedor_id=vendedor_id)
    if not db_vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    if vendedor_in.rut and vendedor_in.rut != db_vendedor.rut:
        existing_vendedor_rut = crud.crud_vendedor.get_vendedor_by_rut(db, rut=vendedor_in.rut)
        if existing_vendedor_rut and existing_vendedor_rut.id != vendedor_id:
             raise HTTPException(status_code=400, detail="Otro vendedor con este RUT ya existe.")
    vendedor = crud.crud_vendedor.update_vendedor(db=db, db_vendedor=db_vendedor, vendedor_in=vendedor_in)
    return vendedor

@router.delete("/{vendedor_id}", response_model=schemas.vendedor.Vendedor) # O un mensaje de éxito
def delete_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Any:
    vendedor = crud.crud_vendedor.get_vendedor(db, vendedor_id=vendedor_id)
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    deleted_vendedor = crud.crud_vendedor.remove_vendedor(db=db, vendedor_id=vendedor_id)
    return deleted_vendedor # O return {"message": "Vendedor eliminado"}

# Endpoints para gestionar asignaciones de clientes a vendedores
@router.post("/{vendedor_id}/clientes", response_model=schemas.vendedor.VendedorClientePorcentaje, status_code=status.HTTP_201_CREATED)
def add_cliente_a_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    asignacion_in: schemas.vendedor.VendedorClientePorcentajeCreate,
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Any:
    vendedor = crud.crud_vendedor.get_vendedor(db, vendedor_id=vendedor_id)
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    try:
        asignacion = crud.crud_vendedor.add_cliente_a_vendedor(db=db, vendedor=vendedor, asignacion_in=asignacion_in)
    except ValueError as e: # Capturar errores de cliente_id no encontrado o asignación duplicada
        raise HTTPException(status_code=400, detail=str(e))
    return asignacion

@router.put("/{vendedor_id}/clientes/{cliente_id}", response_model=schemas.vendedor.VendedorClientePorcentaje)
def update_asignacion_cliente_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    cliente_id: int,
    asignacion_in: schemas.vendedor.VendedorClientePorcentajeUpdate, # Solo se actualiza el porcentaje
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Any:
    db_asignacion = crud.crud_vendedor.get_asignacion(db, vendedor_id=vendedor_id, cliente_id=cliente_id)
    if not db_asignacion:
        raise HTTPException(status_code=404, detail="Asignación cliente-vendedor no encontrada.")
    asignacion = crud.crud_vendedor.update_porcentaje_cliente_vendedor(db=db, db_asignacion=db_asignacion, asignacion_in=asignacion_in)
    return asignacion

@router.delete("/{vendedor_id}/clientes/{cliente_id}", response_model=schemas.vendedor.VendedorClientePorcentaje)
def remove_cliente_de_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    cliente_id: int,
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Any:
    db_asignacion = crud.crud_vendedor.get_asignacion(db, vendedor_id=vendedor_id, cliente_id=cliente_id)
    if not db_asignacion:
        raise HTTPException(status_code=404, detail="Asignación cliente-vendedor no encontrada.")
    deleted_asignacion = crud.crud_vendedor.remove_cliente_de_vendedor(db=db, vendedor_id=vendedor_id, cliente_id=cliente_id)
    return deleted_asignacion # O un mensaje de éxito