// src/components/vendedores/VendedorUploadCSVModal.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import vendedorService from '../../services/vendedorService';
import { Vendedor } from '../../types/vendedor';

interface VendedorUploadCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (nuevosVendedores: Vendedor[]) => void;
}

const VendedorUploadCSVModal: React.FC<VendedorUploadCSVModalProps> = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
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
      const response = await vendedorService.uploadVendedoresCSV(file);
      toast.success(`${response.length} vendedores procesados.`);
      onUploadSuccess(response);
    } catch (err: any) {
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'object' && errorDetail.errors) {
        const errorMessages = errorDetail.errors.join('\n');
        toast.error(<div><p>Errores en el archivo:</p><pre>{errorMessages}</pre></div>, { autoClose: false });
      } else {
        toast.error(errorDetail || 'Error al procesar el archivo.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Cargar Vendedores desde CSV</h2>
        <p className="text-sm text-gray-600 mb-4">Columnas requeridas: <strong>nombre_completo, rut, sueldo_base</strong>.</p>
        <div {...getRootProps()} className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${isDragActive ? 'border-blue-500' : 'border-gray-300'}`}>
          <input {...getInputProps()} />
          {file ? <p>{file.name}</p> : <p>Arrastra un archivo .csv aquí, o haz clic para seleccionarlo.</p>}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
          <button onClick={onClose} disabled={isUploading} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
          <button onClick={handleUpload} disabled={!file || isUploading} className="px-4 py-2 bg-blue-500 text-white rounded-md disabled:opacity-50">
            {isUploading ? 'Subiendo...' : 'Subir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendedorUploadCSVModal;