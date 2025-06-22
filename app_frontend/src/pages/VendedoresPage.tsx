// src/pages/VendedoresPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import vendedorService from '../services/vendedorService';
import { Vendedor, ClienteAsignado } from '../types/vendedor';
import { toast } from 'react-toastify';
import VendedorFormModal from '../components/vendedores/VendedorFormModal';
import VendedorUploadCSVModal from '../components/vendedores/VendedorUploadCSVModal';
import useDebounce from '../hooks/useDebounce'; // <-- 1. IMPORTAR EL HOOK

const VendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVendedores, setTotalVendedores] = useState(0);

  // Búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // <-- 2. USAR EL HOOK 

  const [isVendedorFormModalOpen, setIsVendedorFormModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [isVendedorUploadModalOpen, setIsVendedorUploadModalOpen] = useState(false);

  const totalPages = totalVendedores > 0 ? Math.ceil(totalVendedores / itemsPerPage) : 1;

  const fetchVendedores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // CALCULAR EL 'SKIP' U 'OFFSET' PARA EL BACKEND.
      // Si la página es 1, skip es 0. Si la página es 2, skip es 10 (si itemsPerPage es 10).
      const skip = (currentPage - 1) * itemsPerPage;

      const response = await vendedorService.getAllVendedores(
        skip, // <-- CORRECCIÓN: Enviar el 'skip' calculado
        itemsPerPage,
        debouncedSearchTerm // <-- 3. USAR EL TÉRMINO DE BÚSQUEDA RETRASADO
      );
      if (response && Array.isArray(response.items)) {
        setVendedores(response.items);
        setTotalVendedores(response.total_count);
      } else {
        console.warn("Formato de respuesta inesperado:", response);
        setVendedores([]);
        setTotalVendedores(0);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Error al cargar vendedores.';
      setError(errorMsg);
      toast.error(errorMsg);
      setVendedores([]);
      setTotalVendedores(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearchTerm]); // <-- 4. AÑADIR 'debouncedSearchTerm' A LAS DEPENDENCIAS

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  const handleOpenCreateVendedorModal = () => {
    setEditingVendedor(null);
    setIsVendedorFormModalOpen(true);
  };
  
  const handleOpenEditVendedorModal = (vendedor: Vendedor) => {
    setEditingVendedor(vendedor); 
    setIsVendedorFormModalOpen(true);
  };
  
  const handleCloseVendedorFormModal = () => {
    setIsVendedorFormModalOpen(false);
    setEditingVendedor(null);
  };
  
  const handleVendedorSaveSuccess = () => {
    handleCloseVendedorFormModal();
    fetchVendedores();
  };

  const handleOpenVendedorUploadModal = () => {
    setIsVendedorUploadModalOpen(true);
  };

  const handleCloseVendedorUploadModal = () => {
    setIsVendedorUploadModalOpen(false);
  };

  const handleUploadSuccess = (nuevosVendedores: Vendedor[]) => {
    handleCloseVendedorUploadModal();
    fetchVendedores(); 
  };
  
  const handleDeleteVendedor = async (vendedorId: number) => {
    if (window.confirm(`¿Está seguro de eliminar al vendedor ID: ${vendedorId}?`)) {
      try {
        await vendedorService.deleteVendedor(vendedorId);
        toast.success(`Vendedor ID: ${vendedorId} eliminado.`);
        fetchVendedores(); 
      } catch (err: any) {
        toast.error(err.response?.data?.detail || `Error al eliminar vendedor ID: ${vendedorId}.`);
      }
    }
  };

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
  const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };
  
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Gestión de Vendedores</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleOpenVendedorUploadModal}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm sm:text-base"
          >
            Cargar CSV
          </button>
          <button
            onClick={handleOpenCreateVendedorModal}
            className="px-4 py-2 bg-marrs-green text-white rounded-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-marrs-green focus:ring-opacity-50 text-sm sm:text-base"
          >
            + Nuevo Vendedor
          </button>
        </div>
      </div>

      {/* Bloque de depuración para la paginación y búsqueda */}
      <div className="my-2 p-2 bg-yellow-100 text-yellow-800 text-xs rounded-md">
        <p>Página actual: {currentPage}, Total Páginas: {totalPages}, Total Vendedores: {totalVendedores}, Vendedores por página: {itemsPerPage}, Término de búsqueda: "{debouncedSearchTerm}"</p>
      </div>

      {error && !isLoading && <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md border border-red-300">{error}</div>}

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por Nombre o RUT..."
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          value={searchTerm} // El input sigue usando el valor instantáneo
          onChange={(e) => { 
            setSearchTerm(e.target.value); 
            setCurrentPage(1); // Resetear la página a 1 en cada cambio de búsqueda
          }}
        />
      </div>

      <div className="bg-white p-0 sm:p-2 rounded-xl shadow-lg">
        {isLoading && <p className="py-4 text-center text-gray-500">Buscando...</p>}
        {!isLoading && vendedores.length === 0 ? (
          <p className="py-4 text-center text-gray-500">No hay vendedores registrados.</p>
        ) : !isLoading && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RUT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sueldo Base</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[250px]">Clientes Asignados (% Bono)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendedores.map(vendedor => (
                  <tr key={vendedor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{vendedor.nombre_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{vendedor.rut}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${vendedor.sueldo_base.toLocaleString('es-CL')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {vendedor.clientes_asignados && vendedor.clientes_asignados.length > 0 ? (
                        <ul className="list-disc list-inside text-xs">
                          {vendedor.clientes_asignados.map((asig: ClienteAsignado) => (
                            <li key={asig.id}>
                              {asig.cliente?.razon_social || `Cliente ID ${asig.cliente_id}`}
                              <span className="font-semibold"> ({asig.porcentaje_bono}%)</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">Ninguno</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleOpenEditVendedorModal(vendedor)} className="text-indigo-600 hover:text-indigo-800">
                        Editar / Asignar
                      </button>
                      <button onClick={() => handleDeleteVendedor(vendedor.id)} className="ml-4 text-red-600 hover:text-red-800">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!isLoading && totalVendedores > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
            <button onClick={handlePreviousPage} disabled={currentPage === 1}>Anterior</button>
            <span>Página {currentPage} de {totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage >= totalPages}>Siguiente</button>
        </div>
      )}

      {isVendedorFormModalOpen && (
        <VendedorFormModal
          isOpen={isVendedorFormModalOpen}
          onClose={handleCloseVendedorFormModal}
          onSaveSuccess={handleVendedorSaveSuccess}
          vendedorToEdit={editingVendedor}
        />
      )}

      {isVendedorUploadModalOpen && (
        <VendedorUploadCSVModal
          isOpen={isVendedorUploadModalOpen}
          onClose={handleCloseVendedorUploadModal}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default VendedoresPage;