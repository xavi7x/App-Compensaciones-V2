# app/models/factura.py
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base

class Factura(Base):
    __tablename__ = "facturas"

    id = Column(Integer, primary_key=True, index=True)
    # CORRECCIÓN: Se añade una longitud máxima a los campos String/VARCHAR.
    numero_orden = Column(String(255), index=True, nullable=False)
    numero_caso = Column(String(255), index=True)
    
    honorarios_generados = Column(Numeric(12, 2), nullable=False)
    gastos_generados = Column(Numeric(12, 2), nullable=False)
    
    fecha_venta = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"), nullable=False)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    
    vendedor = relationship("Vendedor")
    cliente = relationship("Cliente")
