// src/components/facturas/FacturasTable.tsx
import React from 'react';
import { Factura } from '../../types/factura';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/user'; // Importar el enum de roles

interface FacturasTableProps {
    facturas: Factura[];
    isLoading: boolean;
    onEdit: (factura: Factura) => void;
    onDelete: (facturaId: number) => void;
}

const FacturasTable: React.FC<FacturasTableProps> = ({ facturas, isLoading, onEdit, onDelete }) => {
    const { user } = useAuth(); // Obtenemos la información del usuario actual

    // FIX: La condición ahora usa user.role y el valor 'admin' del enum.
    const isAdmin = user?.role === UserRole.ADMIN;

    return (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full table-auto">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-6 py-3 text-left">N° Orden</th>
                        <th className="px-6 py-3 text-left">Vendedor</th>
                        <th className="px-6 py-3 text-left">Cliente</th>
                        <th className="px-6 py-3 text-left">Fecha Emisión</th>
                        <th className="px-6 py-3 text-right">Honorarios</th>
                        <th className="px-6 py-3 text-right">Gastos</th>
                        {/* Se muestra la columna de acciones si es admin */}
                        {isAdmin && <th className="px-6 py-3 text-center">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {isLoading ? (
                        <tr><td colSpan={isAdmin ? 7 : 6} className="p-4 text-center text-gray-500">Cargando facturas...</td></tr>
                    ) : facturas.length > 0 ? facturas.map(factura => (
                        <tr key={factura.id}>
                            <td className="px-6 py-4">{factura.numero_orden}</td>
                            <td className="px-6 py-4">{factura.vendedor?.nombre_completo || 'N/A'}</td>
                            <td className="px-6 py-4">{factura.cliente?.razon_social || 'N/A'}</td>
                            {/* El backend envía 'fecha_emision' */}
                            <td className="px-6 py-4">{new Date(factura.fecha_emision).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right">${factura.honorarios_generados.toLocaleString('es-CL')}</td>
                            <td className="px-6 py-4 text-right">${factura.gastos_generados.toLocaleString('es-CL')}</td>
                            {/* Se muestran los botones si es admin */}
                            {isAdmin && (
                                <td className="px-6 py-4 text-center">
                                    <button onClick={() => onEdit(factura)} className="text-indigo-600 hover:text-indigo-900 mr-3 font-medium">Editar</button>
                                    <button onClick={() => onDelete(factura.id)} className="text-red-600 hover:text-red-900 font-medium">Eliminar</button>
                                </td>
                            )}
                        </tr>
                    )) : (
                        <tr><td colSpan={isAdmin ? 7 : 6} className="p-4 text-center text-gray-500">No hay facturas registradas.</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default FacturasTable;