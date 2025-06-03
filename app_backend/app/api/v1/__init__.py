# app/api/v1/__init__.py
from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, clientes, vendedores 

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(clientes.router, prefix="/clientes", tags=["Clientes"]) 
api_router.include_router(vendedores.router, prefix="/vendedores", tags=["Vendedores"])