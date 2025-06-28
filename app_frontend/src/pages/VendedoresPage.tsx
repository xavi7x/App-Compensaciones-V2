// src/pages/VendedoresPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import vendedorService from '../services/vendedorService';
import { Vendedor, ClienteAsignado } from '../types/vendedor';
import { toast } from 'react-toastify';
import VendedorFormModal from '../components/vendedores/VendedorFormModal';
import VendedorUploadCSVModal from '../components/vendedores/VendedorUploadCSVModal';
import useDebounce from '../hooks/useDebounce';

const VendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalVendedores, setTotalVendedores] = useState(0);

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [isVendedorFormModalOpen, setIsVendedorFormModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [isVendedorUploadModalOpen, setIsVendedorUploadModalOpen] = useState(false);

  const totalPages = totalVendedores > 0 ? Math.ceil(totalVendedores / itemsPerPage) : 1;

  const fetchVendedores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * itemsPerPage;
      const response = await vendedorService.getAllVendedores(
        skip,
        itemsPerPage,
        debouncedSearchTerm
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
  }, [currentPage, itemsPerPage, debouncedSearchTerm]);

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

      {/* MODIFICACIÓN: Se elimina el div amarillo de estadísticas */}
      
      {error && !isLoading && <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md border border-red-300">{error}</div>}

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por Nombre o RUT..."
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          value={searchTerm}
          onChange={(e) => { 
            setSearchTerm(e.target.value); 
            setCurrentPage(1);
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
      
      {/* --- INICIO DE LA SECCIÓN MODIFICADA --- */}
      {/* Paginación y recuento: Se muestra solo si no está cargando y hay vendedores */}
      {!isLoading && totalVendedores > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-700">
          
          {/* Recuento de resultados */}
          <div className="mb-2 sm:mb-0">
            <p>
              Mostrando <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalVendedores)}</span> de <span className="font-semibold">{totalVendedores}</span> resultados
            </p>
          </div>

          {/* Controles de Paginación (solo si hay más de una página) */}
          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
                <button 
                    onClick={handlePreviousPage} 
                    disabled={currentPage === 1 || isLoading}
                    className="px-4 py-2 font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <span className="px-4 py-2 bg-white border-t border-b border-gray-300">
                    Página {currentPage} de {totalPages}
                </span>
                <button 
                    onClick={handleNextPage} 
                    disabled={currentPage >= totalPages || isLoading}
                    className="px-4 py-2 font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente
                </button>
            </div>
          )}
        </div>
      )}
      {/* --- FIN DE LA SECCIÓN MODIFICADA --- */}

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