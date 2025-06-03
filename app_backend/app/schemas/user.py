# app/schemas/user.py
from pydantic import BaseModel, EmailStr, constr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole, ApprovalStatus # Importa los enums

# Propiedades compartidas
class UserBase(BaseModel):
    email: EmailStr
    username: constr(min_length=3, max_length=50)
    full_name: Optional[str] = None
    is_active: Optional[bool] = True
    is_superuser: Optional[bool] = False # Opcional, podrías basarte solo en role
    role: Optional[UserRole] = UserRole.USER

# Propiedades para recibir en la creación del usuario
class UserCreate(UserBase):
    password: constr(min_length=8)

# Propiedades para recibir en la actualización del usuario (por un admin)
class UserUpdate(UserBase):
    password: Optional[constr(min_length=8)] = None
    approval_status: Optional[ApprovalStatus] = None
    # Otros campos que un admin pueda actualizar

# Propiedades para recibir en la actualización del perfil por el propio usuario
class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    # No permitir cambiar username, role, is_active, etc. directamente por el usuario
    # La contraseña se cambiará por un endpoint dedicado

# Propiedades almacenadas en la BD pero que no deben ser retornadas siempre
class UserInDBBase(UserBase):
    id: int
    hashed_password: str
    approval_status: ApprovalStatus
    last_password_change_date: Optional[datetime] = None
    is_two_factor_enabled: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True # Pydantic V2, antes orm_mode = True

# Propiedades adicionales para retornar al cliente
class User(UserInDBBase):
    pass # No retornamos hashed_password por defecto

# Propiedades en la BD (incluyendo la contraseña hasheada)
class UserInDB(UserInDBBase):
    pass

# Schema para el formulario de login
class UserLogin(BaseModel):
    username: str # Login con username o email
    password: str
    totp_code: Optional[str] = None # Para 2FA

# Schema para cambiar contraseña
class PasswordChange(BaseModel):
    current_password: str
    new_password: constr(min_length=8)

# Schema para solicitar reseteo de contraseña
class PasswordResetRequest(BaseModel):
    email: EmailStr

# Schema para confirmar reseteo de contraseña
class PasswordResetConfirm(BaseModel):
    token: str
    new_password: constr(min_length=8)

# Schema para configurar 2FA
class TwoFactorSetup(BaseModel):
    totp_secret: Optional[str] = None # Para mostrar al usuario
    qr_code_uri: Optional[str] = None # URI para el código QR

class TwoFactorVerify(BaseModel):
    totp_code: str
