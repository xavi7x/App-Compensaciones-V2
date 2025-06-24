# app/schemas/reporte.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date, datetime

# Schema para una única fila del reporte
class ReporteFacturaItem(BaseModel):
    factura_id: int
    numero_orden: Optional[str] = None
    numero_caso: Optional[str] = None
    fecha_emision: datetime
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

# --- NUEVOS SCHEMAS PARA SUMATORIAS ---
# Schema para la sumatoria por vendedor
class SumatoriaPorVendedor(BaseModel):
    vendedor_id: int
    vendedor_nombre: str
    total_honorarios: float

# Schema para la respuesta completa de la API, ahora con sumatorias
class ReporteResponse(BaseModel):
    items: List[ReporteFacturaItem]
    total_count: int
    sumatoria_total_honorarios: float # Suma total de honorarios en la respuesta
    sumatorias_por_vendedor: List[SumatoriaPorVendedor] # Lista de sumas por vendedor