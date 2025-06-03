// src/pages/VendedoresPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import vendedorService from '../services/vendedorService'; // Asegúrate que este servicio esté implementado correctamente
import { Vendedor, ClienteAsignado } from '../types/vendedor'; // Asegúrate que Vendedor y sus tipos asociados estén definidos
import { toast } from 'react-toastify';
import VendedorFormModal from '../components/vendedores/VendedorFormModal'; // Este modal contendrá la lógica de asignación de clientes
// import VendedorUploadCSVModal from '../components/vendedores/VendedorUploadCSVModal'; // Descomenta cuando implementes este modal
// import VendedorClienteAsignacion from '../components/vendedores/VendedorClienteAsignacion'; // Este componente se usará DENTRO de VendedorFormModal

const VendedoresPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para paginación y búsqueda
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalVendedores, setTotalVendedores] = useState(0);

  const totalPages = totalVendedores > 0 ? Math.ceil(totalVendedores / itemsPerPage) : 1;

  const fetchVendedores = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await vendedorService.getAllVendedores(
        currentPage,
        itemsPerPage,
        searchTerm
      );
      if (response && Array.isArray(response.items)) {
        setVendedores(response.items);
        setTotalVendedores(response.total_count);
      } else {
        console.warn("Formato de respuesta inesperado o servicio no implementado completamente:", response);
        toast.info("No se pudieron cargar los vendedores o la lista está vacía. Verifica la implementación del servicio.");
        setVendedores([]); // Asegurarse de limpiar en caso de error de formato
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
  }, [currentPage, itemsPerPage, searchTerm]);

  useEffect(() => {
    fetchVendedores();
  }, [fetchVendedores]);

  // Estados para los modales
  const [isVendedorFormModalOpen, setIsVendedorFormModalOpen] = useState(false);
  const [editingVendedor, setEditingVendedor] = useState<Vendedor | null>(null);
  const [isVendedorUploadModalOpen, setIsVendedorUploadModalOpen] = useState(false);

  // Handlers para el modal de Formulario de Vendedor (Crear/Editar)
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
  
  // Esta función se llama cuando los datos básicos del vendedor O sus asignaciones de clientes han cambiado.
  // Es crucial que VendedorFormModal (y su subcomponente VendedorClienteAsignacion)
  // invoquen onSaveSuccess después de cualquier operación exitosa que modifique datos
  // que deban reflejarse en la lista principal de VendedoresPage.
  const handleVendedorSaveSuccess = () => {
    handleCloseVendedorFormModal();
    fetchVendedores(); // Refrescar la lista de vendedores para mostrar los cambios
    // El toast de éxito específico (creado, actualizado, asignación añadida/modificada/eliminada)
    // debería manejarse dentro de VendedorFormModal o VendedorClienteAsignacion.
    // Aquí podríamos poner un toast genérico si quisiéramos, pero es mejor ser específico más adentro.
    // toast.success("Operación de vendedor completada exitosamente!");
  };

  // Handlers para el modal de Carga CSV
  const handleOpenVendedorUploadModal = () => {
    setIsVendedorUploadModalOpen(true);
  };

  const handleCloseVendedorUploadModal = () => {
    setIsVendedorUploadModalOpen(false);
  };

  const handleUploadSuccess = () => {
    handleCloseVendedorUploadModal();
    fetchVendedores(); 
    toast.success("Archivo CSV de vendedores procesado exitosamente!");
  };
  
  const handleDeleteVendedor = async (vendedorId: number) => {
    if (window.confirm(`¿Está seguro de eliminar al vendedor ID: ${vendedorId}? Esta acción también eliminará sus asignaciones de clientes y no se puede deshacer.`)) {
      try {
        await vendedorService.deleteVendedor(vendedorId); // Asume que este servicio existe y funciona
        toast.success(`Vendedor ID: ${vendedorId} eliminado exitosamente.`);
        fetchVendedores(); 
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || err.message || `Error al eliminar vendedor ID: ${vendedorId}.`;
        toast.error(errorMsg);
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

      {error && !isLoading && <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md border border-red-300">{error}</div>}

      <div className="mb-4">
        <input 
          type="text"
          placeholder="Buscar por Nombre o RUT de Vendedor..."
          className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
        />
      </div>

      <div className="bg-white p-0 sm:p-2 rounded-xl shadow-lg">
        {isLoading && vendedores.length === 0 ? (
          <p className="py-4 text-center text-gray-500 animate-pulse">Cargando vendedores...</p>
        ) : !isLoading && vendedores.length === 0 && !error ? (
          <p className="py-4 text-center text-gray-500">No hay vendedores registrados.</p>
        ) : !isLoading && error && vendedores.length === 0 ? ( // Condición para mostrar error solo si no hay vendedores
            <></> 
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre Completo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sueldo Base</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">Clientes Asignados (% Bono)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendedores.map(vendedor => (
                  <tr key={vendedor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{vendedor.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{vendedor.nombre_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{vendedor.rut}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ${typeof vendedor.sueldo_base === 'number' ? vendedor.sueldo_base.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : vendedor.sueldo_base}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {vendedor.clientes_asignados && vendedor.clientes_asignados.length > 0 ? (
                        <ul className="list-disc list-inside text-xs">
                          {vendedor.clientes_asignados.map((asig: ClienteAsignado) => (
                            <li key={asig.id /* ID de la asignación VendedorClientePorcentaje */}>
                              {asig.cliente?.razon_social || `Cliente ID ${asig.cliente_id}`}
                              <span className="font-semibold"> ({asig.porcentaje_bono}%)</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-400 italic">Ninguno</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button 
                        onClick={() => handleOpenEditVendedorModal(vendedor)} 
                        className="text-indigo-600 hover:text-indigo-800"
                      >
                        Editar / Asignar Clientes 
                      </button>
                      <button 
                        onClick={() => handleDeleteVendedor(vendedor.id)} 
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {isLoading && vendedores.length > 0 && <p className="text-sm text-gray-500 p-4 text-center animate-pulse">Actualizando lista...</p>}
      </div>

      {!isLoading && totalVendedores > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-center items-center space-x-2">
            <button onClick={handlePreviousPage} disabled={currentPage === 1 || isLoading} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50">Anterior</button>
            <span className="text-sm text-gray-700">Página {currentPage} de {totalPages}</span>
            <button onClick={handleNextPage} disabled={currentPage >= totalPages || isLoading} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
        </div>
      )}

      {/* Modal para Crear/Editar Vendedor.
        IMPORTANTE: La lógica para asignar clientes y porcentajes se implementará DENTRO de VendedorFormModal.
        Cuando `vendedorToEdit` no es null, VendedorFormModal debería mostrar una sección adicional
        (posiblemente usando el componente VendedorClienteAsignacion) para gestionar las asignaciones.
      */}
      {isVendedorFormModalOpen && (
        <VendedorFormModal
          isOpen={isVendedorFormModalOpen}
          onClose={handleCloseVendedorFormModal}
          onSaveSuccess={handleVendedorSaveSuccess} // Esta función se llamará tras guardar datos básicos O TRAS MODIFICAR ASIGNACIONES
          vendedorToEdit={editingVendedor}
          // Necesitarás pasarle todosLosClientes si VendedorFormModal carga el componente de asignaciones
          // y este último necesita la lista completa de clientes para un dropdown.
          // Ejemplo: todosLosClientes={listaDeTodosLosClientes} (deberías cargar esta lista en VendedoresPage o pasarla de alguna forma)
        />
      )}

      {/* Modal para Carga CSV de Vendedores (Placeholder) */}
      {/* {isVendedorUploadModalOpen && (
        <VendedorUploadCSVModal
          isOpen={isVendedorUploadModalOpen}
          onClose={handleCloseVendedorUploadModal}
          onUploadSuccess={handleUploadSuccess}
        />
      )}
      */}
       {isVendedorUploadModalOpen && ( 
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Cargar Vendedores desde CSV</h2>
            <p className="mb-4 text-sm text-gray-600">
              Funcionalidad de carga CSV pendiente de implementación.
              Aquí iría el componente <strong>VendedorUploadCSVModal</strong>.
            </p>
            <button
              onClick={handleCloseVendedorUploadModal}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendedoresPage;
