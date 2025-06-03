# test_db_connection.py
import os
import sys

# Añadir app_backend al sys.path para importar 'app'
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
print(f"DEBUG [test_script]: sys.path: {sys.path}")

try:
    print("DEBUG [test_script]: Intentando importar mysqlclient...")
    import mysqlclient
    print("DEBUG [test_script]: mysqlclient importado exitosamente.")
except ImportError as e:
    print(f"ERROR [test_script]: al importar mysqlclient: {e}")
    sys.exit(1)

try:
    print("DEBUG [test_script]: Intentando importar settings desde app.core.config...")
    from app.core.config import settings
    print(f"DEBUG [test_script]: Settings importado. DATABASE_URL: {settings.DATABASE_URL}")
except ImportError as e:
    print(f"ERROR [test_script]: al importar settings: {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR [test_script]: inesperado al importar settings: {e}")
    sys.exit(1)


if not settings.DATABASE_URL:
    print("ERROR [test_script]: settings.DATABASE_URL está vacía o es None.")
    sys.exit(1)

try:
    print(f"DEBUG [test_script]: Intentando crear engine con URL: {settings.DATABASE_URL}")
    from sqlalchemy import create_engine
    engine = create_engine(settings.DATABASE_URL)
    print("DEBUG [test_script]: Engine creado exitosamente.")
    with engine.connect() as connection:
        print("DEBUG [test_script]: Conexión a la base de datos exitosa.")
    print("--- PRUEBA DE CONEXIÓN Y DIALECTO COMPLETADA EXITOSAMENTE ---")
except Exception as e:
    print(f"ERROR [test_script]: durante la creación del engine o conexión: {e}")
    import traceback
    traceback.print_exc()