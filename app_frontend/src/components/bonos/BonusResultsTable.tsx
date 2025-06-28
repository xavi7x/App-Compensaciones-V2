// src/components/bonos/BonusResultsTable.tsx
import React from 'react';
import { BonoVendedorResult } from '../../types/bono';

interface BonusResultsTableProps {
  resultados: BonoVendedorResult[];
}

const BonusResultsTable: React.FC<BonusResultsTableProps> = ({ resultados }) => {
  if (resultados.length === 0) {
    return <p className="text-gray-500 text-center py-4">No se encontraron resultados para los parámetros seleccionados.</p>;
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Honorarios</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Gastos</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Neto</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje Aplicado</th> {/* NUEVA COLUMNA */}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bono Calculado</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {resultados.map((res) => (
            <tr key={res.vendedor_id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{res.nombre_vendedor} ({res.rut_vendedor})</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${res.total_honorarios.toLocaleString('es-CL')}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">${res.total_gastos.toLocaleString('es-CL')}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">${res.total_neto.toLocaleString('es-CL')}</td>
              {/* CELDA PARA MOSTRAR EL NUEVO PORCENTAJE */}
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">
                {res.porcentaje_bono_aplicado !== undefined ? `${res.porcentaje_bono_aplicado.toLocaleString('es-CL')}%` : 'N/A'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-marrs-green text-right">${res.bono_calculado.toLocaleString('es-CL', {minimumFractionDigits: 2})}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BonusResultsTable;