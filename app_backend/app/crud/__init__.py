# app/crud/__init__.py
from .crud_user import (
    get_user, get_user_by_email, get_user_by_username, create_user, update_user,
    is_superuser, 
    get_active_users, # Usar el nuevo nombre
    get_pending_approval_users,
    get_archived_users,
    approve_user,
    reject_user
)

from .crud_cliente import ( 
    get_cliente, get_cliente_by_rut, get_clientes, create_cliente, 
    update_cliente, remove_cliente
)

from .crud_vendedor import ( 
    get_vendedor, get_vendedor_by_rut, get_vendedores, create_vendedor, update_vendedor, remove_vendedor,
    add_cliente_a_vendedor, update_porcentaje_cliente_vendedor, remove_cliente_de_vendedor, get_asignacion
)

from . import crud_factura
from .crud_factura import get_factura, get_facturas, create_factura # <--- 23 jun 25
from .crud_reporte import get_reporte_facturacion # <--- 23 jun 25