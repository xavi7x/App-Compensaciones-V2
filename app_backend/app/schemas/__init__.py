# app/schemas/__init__.py
from pydantic import BaseModel
from .cliente import Cliente, ClienteCreate, ClienteUpdate, ClientesResponse
from .user import (
    User, UserCreate, UserUpdate, UserLogin, UserInDB, 
    PasswordChange, UserProfileUpdate, ApprovalStatus, UserRole,
    TwoFactorSetup, TwoFactorVerify 
)
from .token import Token, TokenPayload
from .cliente import Cliente, ClienteCreate, ClienteUpdate, ClientesResponse
from .vendedor import (
    Vendedor, VendedorCreate, VendedorUpdate, VendedoresResponse,
    VendedorClientePorcentaje, VendedorClientePorcentajeCreate, VendedorClientePorcentajeUpdate
)

from . import factura
from .bono import BonoCalculationRequest, BonoVendedorResult, BonoCalculationResponse # <--- 23 jun 25
from .reporte import ReporteFacturaItem, ReporteResponse # <--- 23 jun 25

class Token(BaseModel):
    access_token: str
    token_type: str
# Añade otros schemas a medida que los crees