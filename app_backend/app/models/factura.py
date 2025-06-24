# app/models/factura.py
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.vendedor import Vendedor
from app.models.cliente import Cliente

class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    numero_orden = Column(String(50), nullable=True)
    numero_caso = Column(String(50), nullable=True, index=True)

    # El nombre del atributo debe ser exactamente 'fecha_emision'
    fecha_emision = Column(DateTime(timezone=True), server_default=func.now()) 

    honorarios_generados = Column(Float, nullable=False, default=0.0)
    gastos_generados = Column(Float, nullable=False, default=0.0)

    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)

    # --- CORRECCIÓN IMPORTANTE AQUÍ ---
    # Añadir el campo created_at, que estaba faltando y siendo esperado por el schema
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    vendedor = relationship("Vendedor")
    cliente = relationship("Cliente")