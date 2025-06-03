// src/components/clientes/ClienteTable.tsx
import React from 'react';
import { Cliente } from '../../types/cliente'; // Ajusta la ruta si es necesario
import { toast } from 'react-toastify'; // <--- AÑADE ESTA IMPORTACIÓN

interface ClienteTableProps {
  clientes: Cliente[];
  onEdit: (cliente: Cliente) => void;
  onDelete: (clienteId: number) => void;
  isLoading?: boolean; 
}

const ClienteTable: React.FC<ClienteTableProps> = ({ clientes, onEdit, onDelete, isLoading }) => {
  // console.log("ClienteTable: Renderizando con clientes:", clientes, "isLoading:", isLoading); // DEBUG

  // Mostrar loader solo si está cargando Y no hay clientes para mostrar (evita parpadeo si ya hay datos)
  if (isLoading && (!clientes || clientes.length === 0)) { 
    return <p className="py-4 text-center text-gray-500">Cargando lista de clientes...</p>;
  }

  // Mostrar mensaje si no está cargando Y no hay clientes
  if (!isLoading && (!clientes || clientes.length === 0)) {
    return <p className="py-4 text-center text-gray-500">No hay clientes registrados para mostrar.</p>;
  }

  // Si hay clientes, renderizar la tabla
  return (
    <div className="overflow-x-auto mt-4">
      {/* Mostrar indicador de actualización si está cargando pero ya hay clientes */}
      {isLoading && clientes && clientes.length > 0 && <p className="text-sm text-gray-500 mb-2 text-center">Actualizando lista...</p>}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ramo</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clientes.map((cliente, index) => (
            <tr key={cliente.id !== undefined && cliente.id !== null ? cliente.id : `cliente-fallback-${index}`} className="hover:bg-gray-50 transition duration-150 ease-in-out">
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{cliente.id !== undefined && cliente.id !== null ? cliente.id : 'N/A'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{cliente.razon_social}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.rut}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.ramo || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{cliente.ubicacion || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                  <button 
                    onClick={() => {
                      if (cliente && typeof cliente.id === 'number') {
                        onEdit(cliente);
                      } else {
                        console.error("ClienteTable: Intento de editar cliente con ID inválido:", cliente);
                        toast.error("Error: No se puede editar este cliente (ID inválido).");
                      }
                    }} 
                    className="text-indigo-600 hover:text-indigo-800 focus:outline-none transition duration-150 ease-in-out"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => {
                      if (cliente && typeof cliente.id === 'number') {
                        onDelete(cliente.id);
                      } else {
                        console.error("ClienteTable: Intento de eliminar cliente con ID inválido:", cliente);
                        toast.error("Error: No se puede eliminar este cliente (ID inválido).");
                      }
                    }} 
                    className="text-red-600 hover:text-red-800 focus:outline-none transition duration-150 ease-in-out"
                  >
                    Eliminar
                  </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClienteTable;
