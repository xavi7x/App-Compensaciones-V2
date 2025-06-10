// src/components/vendedores/VendedorUploadCSVModal.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import vendedorService from '../../services/vendedorService'; // Asume que este servicio existe y tiene el método de carga
import { Vendedor } from '../../types/vendedor'; // Para el tipado de la respuesta

interface VendedorUploadCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (nuevosVendedores: Vendedor[]) => void;
}

const VendedorUploadCSVModal: React.FC<VendedorUploadCSVModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
      } else {
        toast.error('Por favor, seleccione un archivo con formato .csv');
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: false,
  });

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.warn('Por favor, seleccione un archivo para subir.');
      return;
    }

    setIsUploading(true);
    try {
      const response = await vendedorService.uploadVendedoresCSV(selectedFile);
      toast.success(`${response.length} vendedores fueron creados o actualizados exitosamente.`);
      onUploadSuccess(response);
    } catch (err: any) {
      // El error puede contener detalles específicos de las filas con problemas
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'object' && errorDetail.errors) {
        // Si el backend devuelve una lista de errores
        const errorMessages = errorDetail.errors.join('\n');
        toast.error(<div><p>Ocurrieron errores durante la carga:</p><pre style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>{errorMessages}</pre></div>, { autoClose: 10000 });
      } else {
        toast.error(errorDetail || 'Error al procesar el archivo CSV.');
      }
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Cargar Vendedores desde CSV</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          El archivo CSV debe contener las columnas: <strong>nombre_completo</strong>, <strong>rut</strong>, y <strong>sueldo_base</strong>.
        </p>

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-marrs-green bg-teal-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="text-gray-700">
              <p>Archivo seleccionado:</p>
              <p className="font-semibold">{selectedFile.name}</p>
            </div>
          ) : isDragActive ? (
            <p>Suelta el archivo aquí...</p>
          ) : (
            <p>Arrastra y suelta un archivo .csv aquí, o haz clic para seleccionarlo.</p>
          )}
        </div>

        {selectedFile && (
          <div className="mt-4 flex justify-between items-center bg-gray-100 p-2 rounded">
            <span className="text-sm">{selectedFile.name}</span>
            <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700 text-sm font-semibold">Quitar</button>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="px-4 py-2 text-sm text-white bg-marrs-green rounded-md hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Subiendo...' : 'Subir y Procesar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendedorUploadCSVModal;
```
---

### 2. Backend: Endpoint y Lógica CRUD

Ahora, necesitas el endpoint en tu API para manejar este archivo.


```python
# app/api/v1/endpoints/vendedores.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
import io
# ... otras importaciones que ya tienes
from app import crud, models, schemas
from app.api import deps

router = APIRouter()

# ... (tus otros endpoints de vendedores: crear, leer, etc.) ...

@router.post("/upload-csv/", response_model=List[schemas.Vendedor])
def upload_vendedores_from_csv(
    *,
    db: Session = Depends(deps.get_db),
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_superuser)
):
    """
    Crea o actualiza vendedores desde un archivo CSV.
    El CSV debe tener las columnas: 'nombre_completo', 'rut', 'sueldo_base'.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="El archivo debe ser un CSV.")

    try:
        content = file.file.read()
        buffer = io.BytesIO(content)
        df = pd.read_csv(buffer)

        # Validar columnas necesarias
        required_columns = {'nombre_completo', 'rut', 'sueldo_base'}
        if not required_columns.issubset(df.columns):
            raise HTTPException(
                status_code=400,
                detail=f"El CSV debe contener las columnas: {', '.join(required_columns)}"
            )

        # Llamar a la función CRUD que procesará el DataFrame
        vendedores_procesados, errores = crud.vendedor.process_vendedores_csv(db=db, df=df)
        
        if errores:
            # Si hay errores, puedes decidir devolverlos en la respuesta
            # para que el frontend los muestre.
             raise HTTPException(
                status_code=400,
                detail={"message": "Se encontraron errores en el CSV.", "errors": errores}
            )
            
        return vendedores_procesados

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")

