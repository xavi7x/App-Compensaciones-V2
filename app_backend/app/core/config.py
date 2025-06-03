# app/core/config.py
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "App Compensaciones V2"
    API_V1_STR: str = "/api/v1"
    BACKEND_CORS_ORIGINS: str = "http://localhost:5173"

    # Configuración de la base de datos
    DATABASE_URL: str = "mysql+mysqlclient://root:121294@localhost:3306/compensaciones_v2_db"

    # Configuración de JWT
    SECRET_KEY: str = "tu_super_secreto_aqui" # ¡Cambia esto en producción!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Configuración de CORS (Orígenes permitidos)
    # Ejemplo: BACKEND_CORS_ORIGINS = "http://localhost:3000,http://localhost:5173,https://tufrontend.com"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'
        case_sensitive = True

settings = Settings()

