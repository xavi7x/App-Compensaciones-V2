// src/pages/ClientesPage.tsx (VERSIÓN DE DEPURACIÓN)
import React, { useEffect, useState, useCallback } from 'react';
import clienteService from '../services/clienteService'; // Asegúrate que la ruta es correcta
import { Cliente } from '../types/cliente'; // Asegúrate que la ruta es correcta
import { toast } from 'react-toastify';

const ClientesPage_Depuracion: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[] | null>(null); // Inicia como null para diferenciar de array vacío
  const [isLoading, setIsLoading] = useState(true); // Inicia como true
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null); // Para ver la respuesta cruda

  const fetchClientesSimple = useCallback(async () => {
    console.log("ClientesPage_Depuracion: Iniciando fetchClientesSimple...");
    setIsLoading(true);
    setError(null);
    setClientes(null); // Resetear antes de la nueva carga
    setRawData(null);

    try {
      // Llama directamente al servicio sin paginación/búsqueda por ahora para simplificar
      const response = await clienteService.getAllClientes(0, 100); // Pide hasta 100 clientes
      console.log("ClientesPage_Depuracion: Respuesta COMPLETA del servicio:", JSON.stringify(response, null, 2));
      setRawData(response); // Guarda la respuesta cruda

      if (response && Array.isArray(response.items) && typeof response.total_count === 'number') {
        console.log(`ClientesPage_Depuracion: ${response.items.length} items recibidos. Total count: ${response.total_count}`);
        
        // Verificación detallada de cada cliente
        let validClientesCount = 0;
        response.items.forEach((cliente: any, index: number) => {
          console.log(`--- Cliente ${index + 1} ---`);
          console.log("Objeto completo:", cliente);
          console.log("ID:", cliente.id, "Tipo:", typeof cliente.id);
          console.log("Razón Social:", cliente.razon_social, "Tipo:", typeof cliente.razon_social);
          if (cliente && typeof cliente.id === 'number' && !isNaN(cliente.id)) {
            validClientesCount++;
          } else {
            console.warn("ID inválido o faltante para el cliente:", cliente);
          }
        });

        if (validClientesCount !== response.items.length) {
          toast.warn("Advertencia: Algunos clientes tienen IDs inválidos o faltantes. Revisa la consola.");
        }
        
        setClientes(response.items); // Guardamos todos los items por ahora para verlos
        // setClientes(response.items.filter(c => c && typeof c.id === 'number' && !isNaN(c.id))); // O filtrar como antes
        
      } else {
        console.error("ClientesPage_Depuracion: Formato de respuesta inesperado:", response);
        setError("Formato de respuesta del servidor inesperado.");
        toast.error("Error: Formato de respuesta del servidor inesperado.");
      }
    } catch (err: any) {
      console.error("ClientesPage_Depuracion: Error en fetchClientesSimple:", err.response || err);
      const errorMsg = err.response?.data?.detail || err.message || "Error desconocido al cargar clientes.";
      setError(errorMsg);
      toast.error(`Error al cargar clientes: ${errorMsg}`);
    } finally {
      setIsLoading(false);
      console.log("ClientesPage_Depuracion: fetchClientesSimple finalizado.");
    }
  }, []); // Sin dependencias para que se ejecute solo una vez al montar, o puedes añadir un botón para re-llamarla

  useEffect(() => {
    fetchClientesSimple();
  }, [fetchClientesSimple]);

  if (isLoading) {
    return <div className="p-6 text-center">Cargando clientes... (Versión de depuración)</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Página de Clientes (Modo Depuración)</h1>
      
      <button 
        onClick={fetchClientesSimple} 
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Recargar Clientes
      </button>

      {error && (
        <div className="my-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded">
          <h3 className="font-bold">Error al cargar datos:</h3>
          <pre className="whitespace-pre-wrap">{typeof error === 'string' ? error : JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="my-4">
        <h2 className="text-xl font-medium mb-2">Respuesta Cruda de la API:</h2>
        <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto max-h-96">
          {rawData ? JSON.stringify(rawData, null, 2) : "No hay datos crudos aún."}
        </pre>
      </div>

      {clientes !== null && (
        <div>
          <h2 className="text-xl font-medium mb-2">Lista de Clientes Procesados (IDs deberían ser números):</h2>
          {clientes.length === 0 && !isLoading && <p>No se encontraron clientes o todos tenían IDs inválidos.</p>}
          <ul>
            {clientes.map((cliente, index) => (
              <li key={cliente.id !== undefined ? cliente.id : index} className="border-b p-2">
                ID: {cliente.id === undefined ? 'UNDEFINED' : cliente.id} (Tipo: {typeof cliente.id}), 
                Razón Social: {cliente.razon_social || 'N/A'}, 
                RUT: {cliente.rut || 'N/A'}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ClientesPage_Depuracion; // Cambia el nombre para no sobreescribir tu página original aún

