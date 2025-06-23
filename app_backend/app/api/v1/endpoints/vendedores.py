# app/api/v1/endpoints/vendedores.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Any, Optional
import pandas as pd
import io

from app import crud, schemas
from app.api import deps
from app.models.user import User as UserModel

router = APIRouter()

# --- RUTA CRÍTICA AÑADIDA ---
@router.get("/{vendedor_id}/clientes-asignados", response_model=List[schemas.cliente.ClienteSimple])
def read_clientes_asignados_por_vendedor(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Obtiene la lista simplificada de clientes asignados a un vendedor específico.
    """
    vendedor = crud.crud_vendedor.get_vendedor(db=db, vendedor_id=vendedor_id)
    if not vendedor:
        raise HTTPException(status_code=404, detail="Vendedor no encontrado")
    
    # Extrae los clientes de las asignaciones y los convierte al schema simple
    clientes_asignados = [asignacion.cliente for asignacion in vendedor.clientes_asignados if asignacion.cliente]
    clientes_simples = [
        schemas.cliente.ClienteSimple(id=c.id, razon_social=c.razon_social)
        for c in clientes_asignados
    ]
    return clientes_simples

# --- NUEVA RUTA PARA LISTA SIMPLIFICADA ---
@router.get("/simple", response_model=List[schemas.vendedor.VendedorSimple])
def read_vendedores_simple(
    db: Session = Depends(deps.get_db),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Obtiene una lista simplificada de todos los vendedores (id, nombre_completo).
    Ideal para usar en dropdowns en el frontend sin paginación.
    """
    vendedores, _ = crud.crud_vendedor.get_vendedores(db, skip=0, limit=10000) # Limite alto para traer todos
    return vendedores

@router.post("/", response_model=schemas.vendedor.Vendedor, status_code=status.HTTP_201_CREATED)
def create_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_in: schemas.vendedor.VendedorCreate,
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Any:
    db_vendedor_rut = crud.crud_vendedor.get_vendedor_by_rut(db, rut=vendedor_in.rut)
    if db_vendedor_rut:
        raise HTTPException(status_code=400, detail="Un vendedor con este RUT ya existe.")
    try:
        vendedor = crud.crud_vendedor.create_vendedor(db=db, vendedor_in=vendedor_in)
    except ValueError as e:
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

@router.delete("/{vendedor_id}", response_model=schemas.vendedor.Vendedor)
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
    return deleted_vendedor

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
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return asignacion

@router.put("/{vendedor_id}/clientes/{cliente_id}", response_model=schemas.vendedor.VendedorClientePorcentaje)
def update_asignacion_cliente_vendedor_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    vendedor_id: int,
    cliente_id: int,
    asignacion_in: schemas.vendedor.VendedorClientePorcentajeUpdate,
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
    deleted_asignacion = crud.crud_vendedor.remove_cliente_de_vendedor(db=db, vendedor_id=vendedor_id, cliente_id=cliente_id)
    if not deleted_asignacion:
        raise HTTPException(status_code=404, detail="Asignación cliente-vendedor no encontrada.")
    return deleted_asignacion

# --- NUEVO ENDPOINT PARA CARGA CSV ---
@router.post("/upload-csv/", response_model=List[schemas.vendedor.Vendedor])
def upload_vendedores_from_csv(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: UserModel = Depends(deps.get_current_admin_user)
):
    """
    Crea o actualiza vendedores desde un archivo CSV.
    Columnas requeridas: 'nombre_completo', 'rut', 'sueldo_base'.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV.")

    try:
        content = file.file.read()
        buffer = io.BytesIO(content)
        df = pd.read_csv(buffer)

        required_columns = {'nombre_completo', 'rut', 'sueldo_base'}
        if not required_columns.issubset(df.columns):
            raise HTTPException(
                status_code=400,
                detail=f"El CSV debe contener las columnas: {', '.join(required_columns)}"
            )

        vendedores_procesados, errores = crud.crud_vendedor.process_vendedores_csv(db=db, df=df)
        
        if errores:
             raise HTTPException(
                status_code=422,
                detail={"message": "Se encontraron errores en el CSV.", "errors": errores}
            )
            
        return vendedores_procesados

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
