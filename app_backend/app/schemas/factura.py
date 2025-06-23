# app/schemas/factura.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# --- Schema Base para Factura ---
# Define los campos que se reciben del frontend.
class FacturaBase(BaseModel):
    numero_orden: str
    numero_caso: Optional[str] = None
    honorarios_generados: float
    gastos_generados: float
    fecha_venta: date # El frontend envía un string, Pydantic lo convierte a fecha.
    vendedor_id: int
    cliente_id: int

# --- Schema para la creación de una Factura ---
class FacturaCreate(FacturaBase):
    pass

# --- Schema para la actualización de una Factura ---
class FacturaUpdate(BaseModel):
    numero_orden: Optional[str] = None
    monto: Optional[float] = None
    fecha_venta: Optional[date] = None

# --- Schema para las respuestas de la API ---
# Define la estructura de una factura cuando se devuelve desde la API.
class Factura(FacturaBase):
    id: int
    created_at: datetime # Este campo es generado por la BD y es un datetime.
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Schema para la respuesta paginada de facturas ---
class FacturasResponse(BaseModel):
    items: List[Factura]
    total_count: int
