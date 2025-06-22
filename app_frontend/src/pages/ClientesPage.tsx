// src/pages/ClientesPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import clienteService from '../services/clienteService';
import { Cliente } from '../types/cliente';
import ClienteFormModal from '../components/clientes/ClienteFormModal';
import ClienteUploadModal from '../components/clientes/ClienteUploadModal';
import ClienteTable from '../components/clientes/ClienteTable';
import { toast } from 'react-toastify';

const ClientesPage: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalClientes, setTotalClientes] = useState(0);

  const totalPages = totalClientes > 0 ? Math.ceil(totalClientes / itemsPerPage) : 1; 

  const fetchClientes = useCallback(async () => {
    console.log(`ClientesPage: Iniciando fetchClientes. currentPage: ${currentPage}, searchTerm: '${searchTerm}', itemsPerPage: ${itemsPerPage}`);
    setIsLoading(true);
    setError(null);
    try {
      const response = await clienteService.getAllClientes(
        (currentPage - 1) * itemsPerPage,
        itemsPerPage,
        searchTerm
      );
      console.log("ClientesPage: Respuesta COMPLETA de getAllClientes:", JSON.stringify(response, null, 2));

      if (response && Array.isArray(response.items) && typeof response.total_count === 'number') {
        const clientesRecibidos = response.items;
        const clientesProcesados: Cliente[] = [];

        clientesRecibidos.forEach((c: any, index: number) => {
          const idAsNumber = Number(c.id);
          if (c && typeof idAsNumber === 'number' && !isNaN(idAsNumber)) {
            clientesProcesados.push({ ...c, id: idAsNumber });
          } else {
            console.warn(`ClientesPage: Cliente con ID inválido o faltante (índice ${index}):`, c, `ID recibido: ${c.id}, tipo: ${typeof c.id}`);
          }
        });

        if (clientesProcesados.length !== clientesRecibidos.length) {
          toast.warn("Advertencia: Algunos registros de clientes no se pudieron procesar correctamente debido a IDs inválidos.");
        }

        setClientes(clientesProcesados);
        setTotalClientes(response.total_count);
        console.log(`ClientesPage: Clientes establecidos. Total del backend: ${response.total_count}. ItemsPerPage: ${itemsPerPage}. TotalPages calculado ahora: ${Math.ceil(response.total_count / itemsPerPage)}`);

      } else {
        console.error("ClientesPage: Formato de respuesta inesperado de getAllClientes:", response);
        const errorMsg = "Formato de respuesta del servidor inesperado al cargar clientes.";
        setError(errorMsg);
        toast.error(errorMsg);
        setClientes([]);
        setTotalClientes(0);
      }
    } catch (err: any) {
      console.error("ClientesPage: Error en fetchClientes:", err.response || err.message || err);
      let errorMessage = 'Error al cargar clientes.';
      if (err.response?.data?.detail) {
        errorMessage = typeof err.response.data.detail === 'string' 
                       ? err.response.data.detail 
                       : JSON.stringify(err.response.data.detail);
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(`Error al cargar clientes: ${errorMessage}`);
      setClientes([]);
      setTotalClientes(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleOpenCreateModal = () => { setEditingCliente(null); setIsFormModalOpen(true); };
  const handleOpenEditModal = (cliente: Cliente) => { 
    if (cliente?.id && typeof cliente.id === 'number' && !isNaN(cliente.id)) {
      setEditingCliente(cliente); 
      setIsFormModalOpen(true);
    } else {
      toast.error("No se puede editar: Cliente inválido.");
      console.error("Cliente inválido recibido para edición:", cliente);
    }
  };
  const handleOpenUploadModal = () => { setIsUploadModalOpen(true); };
  const handleCloseModals = () => { setIsFormModalOpen(false); setIsUploadModalOpen(false); setEditingCliente(null); };
  const handleDataChange = async () => { await fetchClientes(); handleCloseModals(); };
  const handleDeleteCliente = async (clienteId: number) => {
    if (typeof clienteId !== 'number' || isNaN(clienteId)) {
        toast.error("Error: ID de cliente inválido para la eliminación."); return;
    }
    if (window.confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
        setIsLoading(true); setError(null);
        try {
            await clienteService.deleteCliente(clienteId);
            toast.success('Cliente eliminado exitosamente!');
            if (clientes.length === 1 && currentPage > 1) {
                setCurrentPage(prev => prev - 1);
            } else {
                await fetchClientes(); 
            }
        } catch (err: any) { 
          const errorMsg = err.response?.data?.detail || 'Error al eliminar cliente.';
          toast.error(errorMsg);
          setError(errorMsg);
        } finally { setIsLoading(false); }
    }
  };

  const handleNextPage = () => {
    console.log("handleNextPage: Intentando ir a siguiente. currentPage:", currentPage, "totalPages:", totalPages);
    if (currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
    } else {
        console.log("handleNextPage: Ya en la última página o totalPages no permite avanzar.");
        toast.info("Ya estás en la última página.");
    }
  };

  const handlePreviousPage = () => {
    console.log("handlePreviousPage: Intentando ir a anterior. currentPage:", currentPage);
    if (currentPage > 1) {
        setCurrentPage(prev => prev - 1);
    }
  };

  let errorDisplay = null;
  if (error && !isLoading) { 
    const message = typeof error === 'string' ? error : (error as any).message || "Error desconocido";
    errorDisplay = <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md border border-red-300">{message}</div>;
  }

  console.log("ClientesPage: Renderizando. currentPage:", currentPage, "totalPages:", totalPages, "totalClientes:", totalClientes, "isLoading:", isLoading);
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Gestión de Clientes</h1>
        <div className="flex flex-wrap gap-2">
             <button
                onClick={handleOpenUploadModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-150 ease-in-out text-sm sm:text-base"
            >
                Cargar CSV
            </button>
            <button
                onClick={handleOpenCreateModal}
                className="px-4 py-2 bg-marrs-green text-white rounded-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-marrs-green focus:ring-opacity-50 transition duration-150 ease-in-out text-sm sm:text-base"
            >
                + Nuevo Cliente
            </button>
        </div>
      </div>

      {errorDisplay}

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por Razón Social o RUT..."
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); 
          }}
        />
      </div>

      <div className="my-2 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md">
        <p>Página actual: {currentPage}, Total Páginas: {totalPages}, Total Clientes: {totalClientes}, Clientes por página: {itemsPerPage}</p>
      </div>

      <div className="bg-white p-0 sm:p-2 rounded-xl shadow-lg">
        <ClienteTable 
          clientes={clientes}
          onEdit={handleOpenEditModal}
          onDelete={handleDeleteCliente}
          isLoading={isLoading && clientes.length === 0}
        />
        {isLoading && clientes.length > 0 && <p className="text-sm text-gray-500 p-4 text-center animate-pulse">Actualizando lista...</p>}
      </div>

      {/* Paginación: Mostrar solo si no está cargando Y hay más de una página */}
      {!isLoading && totalClientes > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
            <button 
                onClick={handlePreviousPage} 
                disabled={currentPage === 1 || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
                Anterior
            </button>
            <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
            </span>
            <button 
                onClick={handleNextPage} 
                disabled={currentPage >= totalPages || isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
                Siguiente
            </button>
        </div>
      )}

      {/* --- SECCIÓN CRÍTICA PARA EL ERROR DE SINTAXIS --- */}
      {/* Asegúrate de que aquí estés renderizando los componentes modales correctamente */}
      {isFormModalOpen && (
        <ClienteFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModals}
          onSaveSuccess={handleDataChange}
          clienteToEdit={editingCliente}
        />
      )}
      {isUploadModalOpen && (
        <ClienteUploadModal
            isOpen={isUploadModalOpen}
            onClose={handleCloseModals}
            onUploadSuccess={handleDataChange}
        />
      )}
      {/* --- FIN DE LA SECCIÓN CRÍTICA --- */}
    </div>
  );
};

export default ClientesPage;
