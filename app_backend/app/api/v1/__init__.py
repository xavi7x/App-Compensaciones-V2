# En app/api/v1/__init__.py
from fastapi import APIRouter
from .endpoints import auth, users, clientes, vendedores, facturas, bonos, reportes # <--- bonos y reportes 23 jun 25

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(clientes.router, prefix="/clientes", tags=["clientes"])
api_router.include_router(vendedores.router, prefix="/vendedores", tags=["vendedores"])
api_router.include_router(facturas.router, prefix="/facturas", tags=["Facturación"]) # <--- 23 jun 25
api_router.include_router(bonos.router, prefix="/bonos", tags=["Bonos"]) # <--- 23 jun 25
api_router.include_router(reportes.router, prefix="/reportes", tags=["Reportes"]) # <--- 23 jun 25

