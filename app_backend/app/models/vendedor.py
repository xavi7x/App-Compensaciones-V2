# app/models/vendedor.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, DateTime, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
# Necesitarás importar Cliente si la relación lo usa directamente, aunque aquí no es estrictamente necesario para la definición de la FK
# from app.models.cliente import Cliente 

class Vendedor(Base):
    __tablename__ = "vendedores"

    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String(255), index=True, nullable=False)
    rut = Column(String(20), unique=True, index=True, nullable=False)
    sueldo_base = Column(Float, nullable=False, default=0.0) # Sueldo base actual

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relación con la tabla asociativa VendedorClientePorcentaje
    clientes_asignados = relationship("VendedorClientePorcentaje", back_populates="vendedor", cascade="all, delete-orphan")

class VendedorClientePorcentaje(Base):
    __tablename__ = "vendedor_cliente_porcentajes"

    id = Column(Integer, primary_key=True, index=True)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False) # Asegúrate que 'clientes' es el nombre de tu tabla de clientes
    porcentaje_bono = Column(Float, nullable=False) # Ej. 0.1 para 10%

    vendedor = relationship("Vendedor", back_populates="clientes_asignados")
    cliente = relationship("Cliente") # Asume que tienes un modelo Cliente importado o definido

    __table_args__ = (UniqueConstraint('vendedor_id', 'cliente_id', name='uq_vendedor_cliente'),)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())