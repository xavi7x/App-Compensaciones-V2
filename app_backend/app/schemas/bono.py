# app/schemas/bono.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date

# Schema para la solicitud de cálculo
class BonoCalculationRequest(BaseModel):
    start_date: date
    end_date: date
    vendedor_id: Optional[int] = Field(None, description="ID del vendedor para calcular. Si es None, se calculan todos.")

# Schema para el resultado de un vendedor
class BonoVendedorResult(BaseModel):
    vendedor_id: int
    nombre_vendedor: str
    rut_vendedor: str
    total_honorarios: float
    total_gastos: float
    total_neto: float
    bono_calculado: float
    detalle_facturas: List[dict] # Un diccionario simple para el detalle

# Schema para la respuesta completa de la API
class BonoCalculationResponse(BaseModel):
    start_date: date
    end_date: date
    resultados: List[BonoVendedorResult]