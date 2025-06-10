from sqlalchemy import Column, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class ClienteVendedor(Base):
    __tablename__ = "cliente_vendedor"
    
    id = Column(Integer, primary_key=True, index=True)
    vendedor_id = Column(Integer, ForeignKey("vendedores.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"))
    porcentaje_bono = Column(Float, nullable=False)
    
    vendedor = relationship("Vendedor", back_populates="clientes")
    cliente = relationship("Cliente", back_populates="vendedores")