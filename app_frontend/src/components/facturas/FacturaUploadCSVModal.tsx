// src/components/facturas/FacturaUploadCSVModal.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import facturaService from '../../services/facturaService';
import { Factura } from '../../types/factura';

interface FacturaUploadCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (nuevasFacturas: Factura[]) => void;
}

const FacturaUploadCSVModal: React.FC<FacturaUploadCSVModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const response = await facturaService.uploadFacturasCSV(file);
      toast.success(`${response.length} facturas procesadas exitosamente.`);
      onUploadSuccess(response);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'object' && errorDetail.errors) {
        toast.error(<div><p>Errores en el archivo:</p><pre>{errorDetail.errors.join('\n')}</pre></div>, { autoClose: false });
      } else {
        toast.error(errorDetail || 'Error al procesar el archivo CSV.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Cargar Facturas desde CSV</h2>
        <p className="text-sm text-gray-600 mb-4">
          Columnas requeridas: <strong>numero_orden, honorarios_generados, gastos_generados, fecha_venta, vendedor_rut, cliente_rut</strong>.
        </p>
        <div {...getRootProps()} className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer">
          <input {...getInputProps()} />
          {file ? <p>{file.name}</p> : <p>Arrastra un archivo .csv aquí o haz clic.</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onClose} disabled={isUploading} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
          <button onClick={handleUpload} disabled={!file || isUploading} className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50">
            {isUploading ? 'Subiendo...' : 'Subir y Procesar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacturaUploadCSVModal;