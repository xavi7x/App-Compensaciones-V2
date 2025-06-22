# app/schemas/vendedor.py
from pydantic import BaseModel, constr, Field, EmailStr # EmailStr si lo necesitas para Vendedor
from typing import Optional, List
from datetime import datetime
from app.schemas.cliente import Cliente as ClienteSchema # Para mostrar info del cliente

# --- Schemas para VendedorClientePorcentaje ---
class VendedorClientePorcentajeBase(BaseModel):
    cliente_id: int
    porcentaje_bono: float = Field(..., gt=0, le=1) # Porcentaje entre 0 y 1 (ej. 0.1 para 10%)

class VendedorClientePorcentajeCreate(VendedorClientePorcentajeBase):
    pass

class VendedorClientePorcentajeUpdate(BaseModel): # Para actualizar solo el porcentaje
    porcentaje_bono: float = Field(..., gt=0, le=1)

class VendedorClientePorcentaje(VendedorClientePorcentajeBase): # Para respuestas API
    id: int
    cliente: Optional[ClienteSchema] = None # Incluir datos del cliente al mostrar

    class Config:
        from_attributes = True

# --- Schemas para Vendedor ---
class VendedorBase(BaseModel):
    nombre_completo: str = Field(..., min_length=3, max_length=255)
    rut: constr(min_length=7, max_length=12) # Validar formato específico si es necesario
    sueldo_base: float = Field(..., ge=0)

class VendedorCreate(VendedorBase):
    # Opcionalmente, permitir crear asignaciones de cliente/porcentaje al crear el vendedor
    asignaciones: Optional[List[VendedorClientePorcentajeCreate]] = []

class VendedorUpdate(BaseModel): # Para actualizaciones parciales
    nombre_completo: Optional[str] = Field(None, min_length=3, max_length=255)
    rut: Optional[constr(min_length=7, max_length=12)] = None # RUT usualmente no se actualiza
    sueldo_base: Optional[float] = Field(None, ge=0)
    # No permitir actualizar asignaciones directamente aquí, usar endpoints dedicados

class VendedorInDBBase(VendedorBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class Vendedor(VendedorInDBBase): # Schema para respuestas API
    clientes_asignados: List[VendedorClientePorcentaje] = [] # Mostrar clientes asignados

# Schema para respuesta paginada de vendedores
class VendedoresResponse(BaseModel):
    items: List[Vendedor]
    total_count: int

class VendedorSimple(BaseModel):
    id: int
    nombre_completo: str
    rut: str

    class Config:
        from_attributes = True