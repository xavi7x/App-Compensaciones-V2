# app/schemas/cliente.py
from pydantic import BaseModel, constr, Field
from typing import Optional
from datetime import datetime
from typing import List
    
# Propiedades base compartidas (no incluye 'id' porque no siempre se espera en la entrada)
class ClienteBase(BaseModel):
    razon_social: str = Field(..., min_length=1, max_length=255)
    rut: constr(min_length=7, max_length=12)
    ramo: Optional[str] = Field(None, max_length=100)
    ubicacion: Optional[str] = Field(None, max_length=255)

# Propiedades para recibir en la creación
class ClienteCreate(ClienteBase):
    pass

# Propiedades para recibir en la actualización
class ClienteUpdate(BaseModel):
    razon_social: Optional[str] = Field(None, min_length=1, max_length=255)
    rut: Optional[constr(min_length=7, max_length=12)] = None
    ramo: Optional[str] = Field(None, max_length=100)
    ubicacion: Optional[str] = Field(None, max_length=255)

# Esta clase es la base para las respuestas que incluyen datos de la BD.
class ClienteInDBBase(ClienteBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Para Pydantic v2. Si usas Pydantic v1, debe ser orm_mode = True
                               # Esta línea permite que Pydantic lea los atributos del modelo SQLAlchemy.
                               # Si estás en Pydantic v1 y esto no funciona, prueba orm_mode = True

# Schema para retornar al cliente (API)
# Esta clase hereda de ClienteInDBBase, por lo tanto, DEBERÍA incluir 'id'.
class Cliente(ClienteInDBBase):
    pass # No necesita campos adicionales si ClienteInDBBase ya tiene todo lo necesario para la respuesta.

# Schema para respuesta paginada
class ClientesResponse(BaseModel):
    items: List[Cliente] # Usa el schema Cliente, que DEBE incluir el 'id'.
    total_count: int

class ClienteSimple(BaseModel):
    id: int
    razon_social: str
    rut: str

    class Config:
        from_attributes = True