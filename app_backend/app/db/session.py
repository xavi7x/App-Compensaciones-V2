# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Función para crear tablas (usada por Alembic o para configuración inicial si no usas Alembic al principio)
# from .base_class import Base # Importar Base desde donde definas tus modelos
# def init_db():
#     Base.metadata.create_all(bind=engine)
