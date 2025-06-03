# app/models/cliente.py
from sqlalchemy import Column, Integer, String, DateTime, func
from app.db.base_class import Base # Asegúrate que Base esté correctamente importada

class Cliente(Base): # Nombre de clase en singular, la tabla será 'clientes'
    __tablename__ = "clientes" # Especificar explícitamente el nombre de la tabla

    id = Column(Integer, primary_key=True, index=True)
    razon_social = Column(String(255), index=True, nullable=False)
    rut = Column(String(20), unique=True, index=True, nullable=False) # RUT del cliente
    ramo = Column(String(100), nullable=True)
    ubicacion = Column(String(255), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Aquí podrías añadir relaciones si es necesario, por ejemplo, con Vendedores o Facturas
    # Ejemplo:
    # facturas = relationship("Factura", back_populates="cliente")