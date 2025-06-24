# app/api/v1/endpoints/bonos.py
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import Any

from app import schemas
from app.api import deps
from app.core.calculations import calcular_bonos_por_periodo
from app.models.user import User as UserModel

router = APIRouter()

@router.post("/calcular", response_model=schemas.bono.BonoCalculationResponse)
def calcular_bonos_endpoint(
    *,
    db: Session = Depends(deps.get_db),
    request_body: schemas.bono.BonoCalculationRequest,
    current_user: UserModel = Depends(deps.get_current_admin_user) # Proteger endpoint, solo admin puede calcular
) -> Any:
    """
    Calcula los bonos para uno o todos los vendedores en un período de fechas.
    """
    if request_body.start_date > request_body.end_date:
        raise HTTPException(status_code=400, detail="La fecha de inicio no puede ser posterior a la fecha de fin.")

    try:
        resultados = calcular_bonos_por_periodo(
            db=db,
            start_date=request_body.start_date,
            end_date=request_body.end_date,
            vendedor_id=request_body.vendedor_id
        )

        return {
            "start_date": request_body.start_date,
            "end_date": request_body.end_date,
            "resultados": resultados
        }
    except Exception as e:
        # En un caso real, loguear el error `e`
        print(f"Error durante el cálculo de bonos: {e}")
        raise HTTPException(status_code=500, detail="Ocurrió un error interno durante el cálculo de bonos.")
