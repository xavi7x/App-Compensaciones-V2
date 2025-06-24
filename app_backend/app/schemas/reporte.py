# app/schemas/reporte.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime

# Schema para una única fila del reporte
class ReporteFacturaItem(BaseModel):
    factura_id: int
    numero_orden: Optional[str] = None
    numero_caso: Optional[str] = None
    fecha_emision: date

    honorarios_generados: float
    gastos_generados: float

    vendedor_id: int
    vendedor_nombre: str
    vendedor_rut: str

    cliente_id: int
    cliente_razon_social: str
    cliente_rut: str

    class Config:
        from_attributes = True

# Schema para la respuesta completa de la API de reportes
class ReporteResponse(BaseModel):
    items: List[ReporteFacturaItem]
    total_count: int