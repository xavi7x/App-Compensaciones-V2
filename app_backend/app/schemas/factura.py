# app/schemas/factura.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# Importamos los schemas simplificados que ya creamos
from .vendedor import VendedorSimple
from .cliente import ClienteSimple

# Schema Base para la entrada de datos de la factura
class FacturaBase(BaseModel):
    numero_orden: str
    numero_caso: Optional[str] = None
    honorarios_generados: float
    gastos_generados: float
    fecha_venta: date
    vendedor_id: int
    cliente_id: int

class FacturaCreate(FacturaBase):
    pass

class FacturaUpdate(BaseModel):
    # Campos que se podrían actualizar en el futuro
    pass

# --- SCHEMA DE RESPUESTA CORREGIDO ---
# Esta es la estructura que la API devolverá.
class Factura(FacturaBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    # --- CORRECCIÓN CRÍTICA ---
    # Incluimos los objetos completos de vendedor y cliente.
    # El backend se encargará de rellenar estos datos.
    vendedor: Optional[VendedorSimple] = None
    cliente: Optional[ClienteSimple] = None

    class Config:
        from_attributes = True

# Schema para la respuesta paginada que usa la tabla
class FacturasResponse(BaseModel):
    items: List[Factura] # La lista ahora contendrá objetos de tipo Factura (con los detalles)
    total_count: int
