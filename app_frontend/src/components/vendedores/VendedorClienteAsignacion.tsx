// src/components/vendedores/VendedorClienteAsignacion.tsx
import React, { useState, useEffect } from 'react';
import { Vendedor, VendedorClientePorcentaje, VendedorClientePorcentajeCreate, VendedorClientePorcentajeUpdate } from '../../types/vendedor'; // Ajusta según tu estructura de tipos
import { Cliente } from '../../types/cliente'; // Asegúrate que este tipo Cliente exista y sea correcto
import vendedorService from '../../services/vendedorService';
import clienteService from '../../services/clienteService'; // Para obtener la lista de todos los clientes
import { toast } from 'react-toastify';

interface VendedorClienteAsignacionProps {
  vendedor: Vendedor; 
  onAsignacionesUpdated: () => void; 
}

const VendedorClienteAsignacion: React.FC<VendedorClienteAsignacionProps> = ({
  vendedor,
  onAsignacionesUpdated,
}) => {
  const [asignaciones, setAsignaciones] = useState<VendedorClientePorcentaje[]>([]);
  const [todosLosClientes, setTodosLosClientes] = useState<Cliente[]>([]);
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [nuevoPorcentaje, setNuevoPorcentaje] = useState<string>('10'); 
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClientes, setIsLoadingClientes] = useState(true);

  useEffect(() => {
      const cargarTodosLosClientes = async () => {
        setIsLoadingClientes(true);
        try {
          const response = await clienteService.getAllClientes(1, 1000, ''); 
          if (response && Array.isArray(response.items)) {
            setTodosLosClientes(response.items);
          } else {
            console.warn("Respuesta inesperada de clienteService.getAllClientes:", response);
            toast.error("No se pudo cargar la lista de clientes para las asignaciones.");
            setTodosLosClientes([]);
          }
        } catch (error) {
          console.error("Error cargando todos los clientes:", error);
          toast.error("Error crítico al cargar la lista de todos los clientes.");
          setTodosLosClientes([]);
        } finally {
          setIsLoadingClientes(false);
        }
      };
      cargarTodosLosClientes();
  }, []);

  useEffect(() => {
    setAsignaciones(vendedor.clientes_asignados || []);
  }, [vendedor.clientes_asignados]);


  const handleAddAsignacion = async () => {
    if (!selectedClienteId || !nuevoPorcentaje) {
      toast.warn("Seleccione un cliente e ingrese un porcentaje.");
      return;
    }
    const clienteIdNum = parseInt(selectedClienteId, 10);
    const porcentajeInput = parseFloat(nuevoPorcentaje); 

    if (isNaN(clienteIdNum) || isNaN(porcentajeInput) || porcentajeInput <= 0 || porcentajeInput > 100) {
      toast.error("Cliente o porcentaje inválido. El porcentaje debe ser un número entre 1 y 100 (ej: 10 para 10%).");
      return;
    }
    const porcentajeDecimal = porcentajeInput / 100; 

    setIsLoading(true);
    try {
      const asignacionData: VendedorClientePorcentajeCreate = { 
        cliente_id: clienteIdNum, 
        porcentaje_bono: porcentajeDecimal 
      };
      await vendedorService.addClienteToVendedor(vendedor.id, asignacionData);
      toast.success("Cliente asignado exitosamente.");
      onAsignacionesUpdated(); 
      setSelectedClienteId('');
      setNuevoPorcentaje('10');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al asignar cliente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePorcentaje = async (asigToUpdate: VendedorClientePorcentaje) => {
    // **NUEVA VERIFICACIÓN CRÍTICA**
    if (typeof asigToUpdate.cliente_id !== 'number') {
        toast.error("Error: El ID del cliente para esta asignación no está definido. No se puede actualizar.");
        console.error("Datos de asignación incompletos:", asigToUpdate);
        return;
    }

    const currentPorcentajeDisplay = (asigToUpdate.porcentaje_bono * 100).toString();
    const nuevoPorcentajeStr = prompt(`Ingrese el nuevo porcentaje para ${asigToUpdate.cliente?.razon_social || `Cliente ID ${asigToUpdate.cliente_id}` } (actual: ${currentPorcentajeDisplay}%):`, currentPorcentajeDisplay);
    
    if (nuevoPorcentajeStr === null) return; 

    const porcentajeInput = parseFloat(nuevoPorcentajeStr);
    if (isNaN(porcentajeInput) || porcentajeInput <= 0 || porcentajeInput > 100) {
      toast.error("Porcentaje inválido. Debe ser un número entre 1 y 100.");
      return;
    }
    const porcentajeDecimal = porcentajeInput / 100; 

    setIsLoading(true);
    try {
      const updateData: VendedorClientePorcentajeUpdate = { porcentaje_bono: porcentajeDecimal };
      
      await vendedorService.updateClienteAsignacion(vendedor.id, asigToUpdate.cliente_id, updateData);
      
      toast.success("Porcentaje actualizado exitosamente.");
      onAsignacionesUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al actualizar porcentaje.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAsignacion = async (asigToRemove: VendedorClientePorcentaje) => {
    // **NUEVA VERIFICACIÓN CRÍTICA**
    if (typeof asigToRemove.cliente_id !== 'number') {
        toast.error("Error: El ID del cliente para esta asignación no está definido. No se puede eliminar.");
        console.error("Datos de asignación incompletos:", asigToRemove);
        return;
    }

    if (window.confirm(`¿Seguro que quieres quitar la asignación de ${asigToRemove.cliente?.razon_social || `Cliente ID ${asigToRemove.cliente_id}`}?`)) {
      setIsLoading(true);
      try {
        await vendedorService.removeClienteFromVendedor(vendedor.id, asigToRemove.cliente_id);
        
        toast.success("Asignación eliminada exitosamente.");
        onAsignacionesUpdated();
      } catch (err: any) {
        toast.error(err.response?.data?.detail || "Error al eliminar asignación.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clientesDisponibles = todosLosClientes.filter(
    cliente => !asignaciones.some(asig => asig.cliente_id === cliente.id)
  );

  if (isLoadingClientes) {
    return <p className="text-sm text-gray-500 mt-6 pt-6 border-t">Cargando lista de clientes...</p>;
  }

  return (
    <div className="mt-6 pt-6 border-t">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Clientes Asignados y Porcentajes</h3>
      {isLoading && <p className="text-sm text-gray-500 my-2">Actualizando asignaciones...</p>}
      
      <div className="mb-6 max-h-60 overflow-y-auto border rounded-md">
        {asignaciones.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {asignaciones.map(asig => (
              <li key={asig.id !== undefined ? asig.id : `cliente-${asig.cliente_id}`} className="flex justify-between items-center p-3 hover:bg-gray-50">
                <div>
                  <span className="font-medium text-sm text-gray-800">{asig.cliente?.razon_social || `Cliente ID ${asig.cliente_id}`}</span>
                  <span className="text-gray-600 text-sm">: {(asig.porcentaje_bono * 100).toFixed(1)}%</span>
                </div>
                <div className="space-x-2">
                   <button type="button" onClick={() => handleUpdatePorcentaje(asig)} className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50" disabled={isLoading}>Editar %</button>
                   <button type="button" onClick={() => handleRemoveAsignacion(asig)} className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50" disabled={isLoading}>Quitar</button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-500 p-3">Este vendedor no tiene clientes asignados.</p>}
      </div>


      <div className="space-y-4 p-4 border rounded-md bg-gray-50">
        <h4 className="text-md font-semibold text-gray-700">Añadir Nueva Asignación</h4>
        <div>
          <label htmlFor="clienteAsignar" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
          <select 
            id="clienteAsignar" 
            value={selectedClienteId} 
            onChange={(e) => setSelectedClienteId(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"
            disabled={isLoading || isLoadingClientes || clientesDisponibles.length === 0}
          >
            <option value="">{isLoadingClientes ? "Cargando clientes..." : (clientesDisponibles.length === 0 ? "No hay clientes disponibles" : "Seleccione un cliente...")}</option>
            {clientesDisponibles.map(cliente => (
              <option key={cliente.id} value={cliente.id}>{cliente.razon_social} ({cliente.rut})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nuevoPorcentaje" className="block text-sm font-medium text-gray-700 mb-1">Porcentaje Bono (ej: 10 para 10%)</label>
          <input 
            type="number" 
            id="nuevoPorcentaje" 
            step="0.1" 
            min="0.1" 
            max="100" 
            value={nuevoPorcentaje}
            onChange={(e) => setNuevoPorcentaje(e.target.value)}
            disabled={isLoading}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"
            placeholder="Ej: 10.5"
          />
        </div>
        <button 
          type="button" 
          onClick={handleAddAsignacion}
          disabled={isLoading || !selectedClienteId || isLoadingClientes}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Asignando...' : 'Añadir Asignación'}
        </button>
      </div>
    </div>
  );
};
export default VendedorClienteAsignacion;
