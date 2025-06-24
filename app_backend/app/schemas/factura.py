# app/schemas/factura.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .vendedor import Vendedor as VendedorSchema # Para anidar datos del vendedor
from .cliente import Cliente as ClienteSchema # Para anidar datos del cliente

class FacturaBase(BaseModel):
    numero_orden: Optional[str] = None
    numero_caso: Optional[str] = None
    honorarios_generados: float = Field(..., ge=0)
    gastos_generados: float = Field(..., ge=0)
    vendedor_id: int
    cliente_id: int

class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    numero_orden: Optional[str] = None
    numero_caso: Optional[str] = None
    honorarios_generados: Optional[float] = Field(None, ge=0)
    gastos_generados: Optional[float] = Field(None, ge=0)
    vendedor_id: Optional[int] = None
    cliente_id: Optional[int] = None

# --- CORRECCIÓN IMPORTANTE AQUÍ ---
# Este schema es el que se usa para las respuestas API y debe coincidir con el modelo
class Factura(FacturaBase): # Ya no hereda de InDBBase, se define explícitamente
    id: int
    # El campo se llama 'fecha_emision' en el modelo, no 'fecha_venta'
    fecha_emision: datetime 
    # El campo se llama 'created_at' en el modelo
    created_at: datetime

    vendedor: Optional[VendedorSchema] = None # Anidar objeto Vendedor
    cliente: Optional[ClienteSchema] = None # Anidar objeto Cliente

    class Config:
        from_attributes = True

class FacturasResponse(BaseModel):
    items: List[Factura]
    total_count: int