# app/api/v1/endpoints/clientes.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import List, Any, Optional
import csv
import io

from app import crud, schemas
from app.api import deps
from app.models.user import User as UserModel 

router = APIRouter()

@router.post("/", response_model=schemas.cliente.Cliente, status_code=status.HTTP_201_CREATED)
def create_cliente_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    cliente_in: schemas.cliente.ClienteCreate,
    current_user: UserModel = Depends(deps.get_current_user) # Proteger endpoint
) -> Any:
    """
    Crear nuevo cliente.
    """
    db_cliente_rut = crud.crud_cliente.get_cliente_by_rut(db, rut=cliente_in.rut)
    if db_cliente_rut:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un cliente con este RUT ya existe en el sistema.",
        )
    cliente = crud.crud_cliente.create_cliente(db=db, cliente_in=cliente_in)
    return cliente

@router.get("/", response_model=schemas.cliente.ClientesResponse)
def read_clientes_endpoint(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener lista de clientes con paginación y búsqueda.
    Busca por razón social o RUT.
    """
    clientes_items, total_count = crud.crud_cliente.get_clientes(
        db, skip=skip, limit=limit, search=search
    )
    
    return {"items": clientes_items, "total_count": total_count}

@router.get("/{cliente_id}", response_model=schemas.cliente.Cliente)
def read_cliente_by_id_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    cliente_id: int,
    current_user: UserModel = Depends(deps.get_current_user) # Proteger endpoint
) -> Any:
    """
    Obtener un cliente por ID.
    """
    cliente = crud.crud_cliente.get_cliente(db, cliente_id=cliente_id)
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    return cliente

@router.put("/{cliente_id}", response_model=schemas.cliente.Cliente)
def update_cliente_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    cliente_id: int,
    cliente_in: schemas.cliente.ClienteUpdate,
    current_user: UserModel = Depends(deps.get_current_admin_user) # Solo admin puede actualizar
) -> Any:
    """
    Actualizar un cliente.
    """
    db_cliente = crud.crud_cliente.get_cliente(db, cliente_id=cliente_id)
    if not db_cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")

    if cliente_in.rut and cliente_in.rut != db_cliente.rut:
        existing_cliente_rut = crud.crud_cliente.get_cliente_by_rut(db, rut=cliente_in.rut)
        if existing_cliente_rut and existing_cliente_rut.id != cliente_id:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Otro cliente con este RUT ya existe.")

    cliente = crud.crud_cliente.update_cliente(db=db, db_cliente=db_cliente, cliente_in=cliente_in)
    return cliente

@router.delete("/{cliente_id}", response_model=schemas.cliente.Cliente)
def delete_cliente_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    cliente_id: int,
    current_user: UserModel = Depends(deps.get_current_admin_user) # Solo admin puede borrar
) -> Any:
    """
    Eliminar un cliente.
    """
    cliente = crud.crud_cliente.get_cliente(db, cliente_id=cliente_id)
    if not cliente:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cliente no encontrado")
    # Aquí podrías añadir lógica para verificar si el cliente está asociado a vendedores/facturas antes de borrar
    deleted_cliente = crud.crud_cliente.remove_cliente(db=db, cliente_id=cliente_id)
    return deleted_cliente # O un mensaje de éxito

@router.post("/upload-csv/", response_model=List[schemas.cliente.Cliente]) # O un response_model más detallado con éxitos y errores
async def upload_clientes_csv(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: UserModel = Depends(deps.get_current_admin_user) # Solo admin puede cargar masivamente
):
    """
    Cargar clientes desde un archivo CSV.
    El CSV debe tener las columnas: razon_social, rut, ramo, ubicacion (ramo y ubicacion son opcionales)
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo debe ser un CSV.")

    created_clientes: List[schemas.cliente.Cliente] = []
    errors: List[Dict[str, Any]] = []

    try:
        contents = await file.read()
        decoded_content = contents.decode('utf-8') # Asume UTF-8, ajusta si es necesario
        # Usar io.StringIO para tratar la cadena como un archivo
        csv_file = io.StringIO(decoded_content)
        csv_reader = csv.DictReader(csv_file)

        # Verifica que las columnas existan en el DictReader
        if not csv_reader.fieldnames:
             raise HTTPException(status_code=400, detail="CSV vacío o sin cabeceras.")

        required_columns = {"razon_social", "rut"}
        if not required_columns.issubset(set(name.lower() for name in csv_reader.fieldnames)): # Normalizar a minúsculas
            missing = required_columns - set(name.lower() for name in csv_reader.fieldnames)
            raise HTTPException(status_code=400, detail=f"Faltan columnas requeridas en el CSV: {', '.join(missing)}")

        # Mapeo de nombres de columna del CSV a nombres de campo del schema (normalizando)
        column_map = {name.lower(): name for name in csv_reader.fieldnames}

        for row_num, row_dict in enumerate(csv_reader, start=1):
            # Normalizar claves del diccionario de la fila a minúsculas
            row = {k.lower(): v for k,v in row_dict.items()}
            try:
                # Validar y crear el schema ClienteCreate
                cliente_data = {
                    "razon_social": row[column_map["razon_social"]],
                    "rut": row[column_map["rut"]],
                    "ramo": row.get(column_map.get("ramo")), # .get() para campos opcionales
                    "ubicacion": row.get(column_map.get("ubicacion"))
                }
                cliente_in = schemas.cliente.ClienteCreate(**cliente_data)

                db_cliente_rut = crud.crud_cliente.get_cliente_by_rut(db, rut=cliente_in.rut)
                if db_cliente_rut:
                    errors.append({"row": row_num, "rut": cliente_in.rut, "error": "RUT ya existe."})
                    continue 

                cliente = crud.crud_cliente.create_cliente(db, cliente_in=cliente_in)
                created_clientes.append(cliente)
            except Exception as e_row: # Captura errores de validación Pydantic o de BD por fila
                errors.append({"row": row_num, "rut": row.get(column_map.get("rut"), 'N/A'), "error": str(e_row)})

    except Exception as e:
        # Captura errores generales del procesamiento del archivo
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error procesando el archivo CSV: {str(e)}")

    if errors:
        # Si quieres retornar los errores al cliente, puedes hacerlo de varias maneras.
        # Aquí, por simplicidad, los incluimos en un detalle de una excepción si hubo errores y no se creó nada.
        if not created_clientes:
             raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail={"message": "No se crearon clientes debido a errores en el CSV.", "errors": errors})
        # Si algunos se crearon y otros no, podrías retornar una estructura mixta.
        # Por ahora, solo retornamos los creados y el cliente puede verificar los errores si el total no coincide.
        # Opcional: loguear los errores en el servidor.
        print(f"INFO: Carga CSV de clientes completada. Creados: {len(created_clientes)}, Errores: {len(errors)}")
        print(f"Detalle de errores en carga CSV: {errors}")


    return created_clientes # Retorna solo los clientes creados exitosamente
