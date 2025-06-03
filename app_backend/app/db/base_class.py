# app/db/base_class.py
from sqlalchemy.ext.declarative import as_declarative, declared_attr

@as_declarative()
class Base:
    id: int
    __name__: str

    # Generar __tablename__ automáticamente
    @declared_attr
    def __tablename__(cls) -> str:
        return cls.__name__.lower() + "s" # Ej: User -> users
