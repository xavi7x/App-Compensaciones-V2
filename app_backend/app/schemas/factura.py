# app/schemas/factura.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal
from .vendedor import VendedorSimple # Ahora esta importación funcionará
from .cliente import ClienteSimple  # Ahora esta importación funcionará

class FacturaBase(BaseModel):
    numero_orden: str
    numero_caso: Optional[str] = None
    honorarios_generados: Decimal
    gastos_generados: Decimal
    fecha_venta: date
    vendedor_id: int
    cliente_id: int

class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    numero_orden: Optional[str] = None
    # ... (otros campos opcionales)

class Factura(FacturaBase):
    id: int
    created_at: date
    vendedor: Optional[VendedorSimple] = None
    cliente: Optional[ClienteSimple] = None

    class Config:
        from_attributes = True

class FacturasResponse(BaseModel):
    items: List[Factura]
    total_count: int