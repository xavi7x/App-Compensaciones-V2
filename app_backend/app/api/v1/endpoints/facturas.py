# app/api/v1/endpoints/facturas.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from typing import List, Any, Optional, Dict
from datetime import date
import csv
import io

from app import crud, schemas
from app.api import deps
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/", response_model=schemas.factura.Factura, status_code=status.HTTP_201_CREATED)
def create_factura_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    factura_in: schemas.factura.FacturaCreate,
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Crear nueva factura.
    """
    return crud.crud_factura.create_factura(db=db, factura_in=factura_in)

@router.get("/", response_model=schemas.factura.FacturasResponse)
def read_facturas_endpoint(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    vendedor_id: Optional[int] = Query(None),
    cliente_id: Optional[int] = Query(None),
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener lista de facturas con paginación y búsqueda.
    """
    items, total_count = crud.crud_factura.get_facturas(
        db, skip=skip, limit=limit,
        start_date=start_date, end_date=end_date,
        vendedor_id=vendedor_id, cliente_id=cliente_id
    )
    return {"items": items, "total_count": total_count}

# --- FIX: Corregido el nombre del parámetro en la ruta de {cliente_id} a {factura_id} ---
@router.get("/{factura_id}", response_model=schemas.factura.Factura)
def read_factura_by_id_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    factura_id: int,
    current_user: UserModel = Depends(deps.get_current_user)
) -> Any:
    """
    Obtener una factura por ID.
    """
    factura = crud.crud_factura.get_factura(db, factura_id=factura_id)
    if not factura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
    return factura

@router.put("/{factura_id}", response_model=schemas.factura.Factura)
def update_factura_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    factura_id: int,
    factura_in: schemas.factura.FacturaUpdate,
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Any:
    """
    Actualizar una factura.
    """
    db_factura = crud.crud_factura.get_factura(db, factura_id=factura_id)
    if not db_factura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
    factura = crud.crud_factura.update_factura(db=db, db_obj=db_factura, obj_in=factura_in)
    return factura

@router.delete("/{factura_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_factura_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    factura_id: int,
    current_user: UserModel = Depends(deps.get_current_admin_user)
) -> Response:
    """
    Eliminar una factura.
    """
    deleted_factura = crud.crud_factura.delete_factura(db=db, factura_id=factura_id)
    if not deleted_factura:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Factura no encontrada")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- FIX: Endpoint de carga CSV completo y corregido ---
@router.post("/upload-csv/", response_model=List[schemas.factura.Factura])
async def upload_facturas_from_csv(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: UserModel = Depends(deps.get_current_user)
):
    """
    Cargar facturas desde un archivo CSV.
    El CSV debe tener las columnas: numero_orden, honorarios_generados, gastos_generados, fecha_emision, vendedor_rut, cliente_rut, numero_caso (opcional)
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo debe ser un CSV.")

    try:
        # Se usa 'async def' y 'await' para la correcta lectura del archivo
        contents = await file.read()
        decoded_content = contents.decode('utf-8')
        csv_file = io.StringIO(decoded_content)
        
        # Usamos DictReader para leer el CSV por filas como diccionarios
        csv_reader = csv.DictReader(csv_file)
        
        if not csv_reader.fieldnames:
            raise HTTPException(status_code=400, detail="CSV vacío o sin cabeceras.")

        # Verificamos que las columnas requeridas existan
        required_columns = {"numero_orden", "honorarios_generados", "gastos_generados", "fecha_emision", "vendedor_rut", "cliente_rut"}
        csv_columns = {col.lower() for col in csv_reader.fieldnames}
        if not required_columns.issubset(csv_columns):
            missing = required_columns - csv_columns
            raise HTTPException(status_code=400, detail=f"Faltan columnas requeridas en el CSV: {', '.join(missing)}")

        facturas_creadas, errores = crud.crud_factura.process_facturas_csv(db=db, csv_reader=csv_reader)
        
        if errores:
             # Si hubo errores, se informa al usuario con detalles
             raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={"message": "Se encontraron errores en algunas filas del CSV.", "errors": errores, "created_count": len(facturas_creadas)}
            )

        return facturas_creadas

    except Exception as e:
        # Imprimimos el error en la terminal para depuración
        print(f"ERROR CRÍTICO AL PROCESAR CSV: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al procesar el archivo: {str(e)}")