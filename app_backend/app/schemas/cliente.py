# app/schemas/cliente.py
from pydantic import BaseModel, constr, Field
from typing import Optional, List
from datetime import datetime

# Propiedades base que se usan para crear y leer clientes
class ClienteBase(BaseModel):
    razon_social: str = Field(..., min_length=1, max_length=255)
    rut: constr(min_length=7, max_length=12)
    ramo: Optional[str] = Field(None, max_length=100)
    ubicacion: Optional[str] = Field(None, max_length=255)

# Propiedades para recibir al crear un nuevo cliente
class ClienteCreate(ClienteBase):
    pass

# Propiedades que se pueden actualizar (todas opcionales)
class ClienteUpdate(BaseModel):
    razon_social: Optional[str] = Field(None, min_length=1, max_length=255)
    rut: Optional[constr(min_length=7, max_length=12)] = None
    ramo: Optional[str] = Field(None, max_length=100)
    ubicacion: Optional[str] = Field(None, max_length=255)

# Propiedades que vienen de la base de datos, incluyendo el ID
class ClienteInDBBase(ClienteBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Schema principal para las respuestas de la API
class Cliente(ClienteInDBBase):
    pass

# Schema para la respuesta paginada de la tabla de clientes
class ClientesResponse(BaseModel):
    items: List[Cliente]
    total_count: int

# --- SCHEMA SIMPLIFICADO CORREGIDO ---
class ClienteSimple(BaseModel):
    id: int
    razon_social: str

    class Config:
        from_attributes = True
