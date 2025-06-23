# app/schemas/vendedor.py
from pydantic import BaseModel, constr, Field
from typing import Optional, List
from datetime import datetime
from .cliente import Cliente as ClienteSchema # Usando import relativo

# --- Schemas para VendedorClientePorcentaje ---
class VendedorClientePorcentajeBase(BaseModel):
    cliente_id: int
    porcentaje_bono: float = Field(..., gt=0, le=1)

class VendedorClientePorcentajeCreate(VendedorClientePorcentajeBase):
    pass

class VendedorClientePorcentajeUpdate(BaseModel):
    porcentaje_bono: float = Field(..., gt=0, le=1)

class VendedorClientePorcentaje(VendedorClientePorcentajeBase):
    id: int
    cliente: Optional[ClienteSchema] = None

    class Config:
        from_attributes = True

# --- Schemas para Vendedor ---
class VendedorBase(BaseModel):
    nombre_completo: str = Field(..., min_length=3, max_length=255)
    rut: constr(min_length=7, max_length=12)
    sueldo_base: float = Field(..., ge=0)

class VendedorCreate(VendedorBase):
    asignaciones: Optional[List[VendedorClientePorcentajeCreate]] = []

class VendedorUpdate(BaseModel):
    nombre_completo: Optional[str] = Field(None, min_length=3, max_length=255)
    rut: Optional[constr(min_length=7, max_length=12)] = None
    sueldo_base: Optional[float] = Field(None, ge=0)

class VendedorInDBBase(VendedorBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Vendedor(VendedorInDBBase):
    clientes_asignados: List[VendedorClientePorcentaje] = []

class VendedoresResponse(BaseModel):
    items: List[Vendedor]
    total_count: int

# --- NUEVO SCHEMA AÑADIDO ---
# Este es el schema para la lista simplificada que necesita el formulario.
class VendedorSimple(BaseModel):
    id: int
    nombre_completo: str

    class Config:
        from_attributes = True
