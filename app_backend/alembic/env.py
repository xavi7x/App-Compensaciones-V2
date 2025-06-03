# alembic/env.py
import os
import sys
from logging.config import fileConfig

from sqlalchemy import create_engine
from sqlalchemy import pool

from alembic import context

# --- Inicio de la sección de configuración de sys.path ---
current_script_dir = os.path.dirname(os.path.abspath(__file__))
project_root_dir = os.path.join(current_script_dir, '..')

if project_root_dir not in sys.path:
    sys.path.insert(0, project_root_dir)
    print(f"DEBUG: Añadido '{project_root_dir}' a sys.path")
# --- Fin de la sección de configuración de sys.path ---

try:
    from app.core.config import settings
    print(f"DEBUG: settings importado. DATABASE_URL: {settings.DATABASE_URL}")
    from app.db.base_class import Base
    print("DEBUG: Base importada de app.db.base_class")

    # Importar y configurar PyMySQL para que actúe como MySQLdb
    import pymysql
    pymysql.install_as_MySQLdb()
    print("DEBUG: PyMySQL importado y configurado como MySQLdb.")

except ImportError as e:
    print(f"ERROR CRÍTICO al importar módulos de la app en env.py: {e}")
    raise

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata
print(f"DEBUG: target_metadata configurado con los modelos de Base: {Base.metadata.tables.keys()}")


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    db_url_from_settings = settings.DATABASE_URL
    if db_url_from_settings is None:
        print("ADVERTENCIA: settings.DATABASE_URL es None. Intentando leer 'sqlalchemy.url' de alembic.ini.")
        db_url_from_config_file = config.get_main_option("sqlalchemy.url")
        if db_url_from_config_file is None:
            raise ValueError("DATABASE_URL no está configurada ni en .env ni sqlalchemy.url en alembic.ini.")
        url_to_use = db_url_from_config_file
    else:
        url_to_use = db_url_from_settings

    print(f"DEBUG: Migraciones offline usando URL: {url_to_use}")
    context.configure(
        url=url_to_use,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    print(f"DEBUG: run_migrations_online - Intentando usar DATABASE_URL: {settings.DATABASE_URL}")

    if settings.DATABASE_URL is None:
        raise ValueError(
            "DATABASE_URL no está configurada o no se pudo cargar desde .env. "
            "Alembic no puede continuar sin una URL de base de datos."
        )

    connectable = create_engine(settings.DATABASE_URL)

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    print("DEBUG: Ejecutando migraciones en modo OFFLINE.")
    run_migrations_offline()
else:
    print("DEBUG: Ejecutando migraciones en modo ONLINE.")
    run_migrations_online()