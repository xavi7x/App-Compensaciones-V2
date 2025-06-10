import React, { useState, useEffect } from 'react';
import { updateVendedorPorcentajes } from '../services/vendedorService';
import { Vendedor } from '../types';

interface VendedorDetailProps {
  vendedor: Vendedor;
  onClose: () => void;
  onUpdate: () => void;
}

const VendedorDetail: React.FC<VendedorDetailProps> = ({ vendedor, onClose, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [porcentajes, setPorcentajes] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inicializar los porcentajes con los valores actuales
  useEffect(() => {
    if (vendedor && vendedor.clientes) {
      setPorcentajes(vendedor.clientes.map(c => c.porcentaje_bono));
    }
  }, [vendedor]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Preparar los datos para enviar
      const updates = vendedor.clientes.map((cliente, index) => ({
        cliente_id: cliente.id,
        porcentaje_bono: porcentajes[index]
      }));

      // Llamar al servicio para actualizar
      await updateVendedorPorcentajes(vendedor.id, updates);
      
      // Actualizar la lista de vendedores
      onUpdate();
      setEditing(false);
    } catch (err: any) {
      setError('Error al actualizar: ' + (err.message || 'Por favor intenta nuevamente'));
      console.error("Error al actualizar porcentajes:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!vendedor) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">{vendedor.nombre}</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="font-semibold">RUT:</p>
            <p>{vendedor.rut}</p>
          </div>
          <div>
            <p className="font-semibold">Sueldo Actual:</p>
            <p>${vendedor.sueldo_actual.toLocaleString()}</p>
          </div>
        </div>
        
        <h3 className="mt-4 font-semibold text-lg">Clientes Asociados:</h3>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full mt-2">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Cliente</th>
                <th className="py-2 px-4 text-left">Porcentaje de Bono</th>
              </tr>
            </thead>
            <tbody>
              {vendedor.clientes.map((cliente, index) => (
                <tr key={cliente.id} className="border-b">
                  <td className="py-2 px-4">
                    <div className="font-medium">{cliente.nombre}</div>
                    <div className="text-sm text-gray-600">{cliente.rut}</div>
                  </td>
                  <td className="py-2 px-4">
                    {editing ? (
                      <div className="flex items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={porcentajes[index]}
                          onChange={(e) => {
                            const newPcts = [...porcentajes];
                            newPcts[index] = parseFloat(e.target.value) || 0;
                            setPorcentajes(newPcts);
                          }}
                          className="border rounded px-2 py-1 w-24"
                        />
                        <span className="ml-2">%</span>
                      </div>
                    ) : (
                      <span>{cliente.porcentaje_bono}%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          {editing ? (
            <>
              <button
                onClick={() => {
                  setEditing(false);
                  // Restaurar valores originales al cancelar
                  setPorcentajes(vendedor.clientes.map(c => c.porcentaje_bono));
                }}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : 'Guardar Cambios'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Editar Porcentajes
              </button>
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cerrar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendedorDetail;