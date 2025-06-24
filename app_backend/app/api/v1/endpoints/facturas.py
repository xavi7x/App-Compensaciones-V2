# app/api/v1/endpoints/facturas.py
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Any
import pandas as pd
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
):
    return crud.crud_factura.create_factura(db=db, factura_in=factura_in)
    
    vendedor = crud.crud_vendedor.get_vendedor(db, vendedor_id=factura_in.vendedor_id)
    if not vendedor:
        raise HTTPException(status_code=404, detail=f"Vendedor con ID {factura_in.vendedor_id} no encontrado.")
    
    cliente = crud.crud_cliente.get_cliente(db, cliente_id=factura_in.cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail=f"Cliente con ID {factura_in.cliente_id} no encontrado.")

    factura = crud.crud_factura.create_factura(db=db, factura_in=factura_in)
    return factura

@router.get("/", response_model=schemas.factura.FacturasResponse)
def read_facturas_endpoint(
    db: Session = Depends(deps.get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: UserModel = Depends(deps.get_current_user)
):
    items, total_count = crud.crud_factura.get_facturas(db, skip=skip, limit=limit)
    return {"items": items, "total_count": total_count}

@router.post("/upload-csv/", response_model=List[schemas.factura.Factura])
def upload_facturas_from_csv(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: UserModel = Depends(deps.get_current_user)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV.")

    try:
        content = file.file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        required_columns = {'numero_orden', 'honorarios_generados', 'gastos_generados', 'fecha_venta', 'vendedor_rut', 'cliente_rut'}
        if not required_columns.issubset(df.columns):
            raise HTTPException(status_code=400, detail=f"CSV debe contener las columnas: {', '.join(required_columns)}")

        facturas, errores = crud.crud_factura.process_facturas_csv(db=db, df=df)
        
        if errores:
             raise HTTPException(
                status_code=422,
                detail={"message": "Errores en el CSV.", "errors": errores}
            )
        return facturas
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")
