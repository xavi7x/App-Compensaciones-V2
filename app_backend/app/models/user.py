# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLAlchemyEnum
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum

class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"

class ApprovalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    username = Column(String(50), unique=True, index=True, nullable=False) # Nuevo campo
    hashed_password = Column(String(255), nullable=False)

    is_active = Column(Boolean(), default=True)
    is_superuser = Column(Boolean(), default=False) # Similar a admin, puedes usar role
    role = Column(SQLAlchemyEnum(UserRole), default=UserRole.USER, nullable=False)
    approval_status = Column(SQLAlchemyEnum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)

    # Campos para expiración de contraseña
    last_password_change_date = Column(DateTime(timezone=True), server_default=func.now())

    # Campos para 2FA (Two-Factor Authentication)
    two_factor_secret = Column(String(255), nullable=True) # Almacena el secreto TOTP encriptado o un identificador
    is_two_factor_enabled = Column(Boolean(), default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())