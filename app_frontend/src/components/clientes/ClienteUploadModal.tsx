// src/components/clientes/ClienteUploadModal.tsx
import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import clienteService from '../../services/clienteService';
import { Cliente } from '../../types/cliente';
import { toast } from 'react-toastify'; // Importar toast

interface ClienteUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (uploadedClientes: Cliente[]) => void;
}

const ClienteUploadModal: React.FC<ClienteUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  // Añade un console.log al inicio para ver si el componente se monta
  useEffect(() => {
    if (isOpen) {
      console.log("ClienteUploadModal se está montando/abriendo.");
    }
  }, [isOpen]);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Resetear estados cuando el modal se abre
    if (isOpen) {
      setSelectedFile(null);
      setError(null);
      setSuccessMessage(null);
      setIsLoading(false); // Asegurarse que isLoading se resetea
      console.log("ClienteUploadModal: Estados reseteados al abrir.");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null; // No renderizar nada si el modal no está abierto
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setError(null); 
      setSuccessMessage(null); // Limpiar mensajes anteriores
      console.log("Archivo seleccionado:", event.target.files[0].name);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    // ...
    try {
      const uploadedClientes = await clienteService.uploadClientesCSV(selectedFile);
      // setSuccessMessage(`Carga exitosa. Se procesaron ${uploadedClientes.length} clientes.`); // Reemplazado por toast
      toast.success(`Carga exitosa. Se procesaron ${uploadedClientes.length} clientes.`);
      onUploadSuccess(uploadedClientes);
    } catch (err: any) {
      // ... (manejo de error existente)
      const errorDetail = err.response?.data?.detail;
      let finalErrorMsg = 'Error al subir el archivo CSV.';
      if (typeof errorDetail === 'object' && errorDetail !== null && errorDetail.errors) {
          finalErrorMsg = `Errores en el archivo CSV:\n${errorDetail.errors.map((e: any) => `Fila ${e.row} (RUT: ${e.rut || 'N/A'}): ${e.error}`).join('\n')}`;
          // Para errores largos en toast, considera un resumen o mostrarlo en el modal
          toast.error("Hubo errores en algunas filas del CSV. Revisa los detalles.", { autoClose: 7000 });
          setError(finalErrorMsg); // Aún puedes setear el error para mostrarlo en el modal
      } else if (typeof errorDetail === 'string') {
          finalErrorMsg = errorDetail;
          toast.error(finalErrorMsg);
          setError(finalErrorMsg);
      } else {
          toast.error(finalErrorMsg);
          setError(finalErrorMsg);
      }
    } finally {
      // ...
    }
  };

  // Intenta envolver el return en un try-catch para errores de renderizado (aunque es menos común aquí)
  try {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Cargar Clientes desde CSV</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {error && <pre className="mb-4 text-sm text-red-600 bg-red-100 p-3 rounded-md whitespace-pre-wrap max-h-40 overflow-y-auto">{error}</pre>}
          {successMessage && <p className="mb-4 text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-1">
                Seleccionar archivo CSV
              </label>
              <input
                type="file"
                name="csvFile"
                id="csvFile"
                accept=".csv"
                required
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-marrs-green file:text-white
                          hover:file:bg-opacity-80 cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500">
                Columnas requeridas: razon_social, rut. Opcionales: ramo, ubicacion.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Subiendo...' : 'Subir Archivo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  } catch (renderError) {
      console.error("ClienteUploadModal: Error durante el renderizado del JSX:", renderError);
      // Podrías retornar un fallback UI aquí, pero si esto falla, la pantalla en blanco es probable.
      return <div className="fixed inset-0 bg-red-100 text-red-700 p-4">Error al renderizar el modal de carga. Revisa la consola.</div>;
  }
};

export default ClienteUploadModal;