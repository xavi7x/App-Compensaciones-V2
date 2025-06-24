// src/components/reportes/ReportTable.tsx
import React from 'react';
import { ReporteFacturaItem } from '../../types/reporte';

interface ReportTableProps {
  data: ReporteFacturaItem[];
}

const ReportTable: React.FC<ReportTableProps> = ({ data }) => {
  if (data.length === 0) {
    return <p className="text-gray-500 text-center py-4">No se encontraron registros para los filtros seleccionados.</p>;
  }

  // Función para renderizar la barra de progreso
  const renderProgressBar = (honorarios: number, gastos: number) => {
    if (gastos <= 0) return <span className="text-gray-400 italic">N/A</span>;
    const progress = Math.min((honorarios / gastos) * 100, 100); // Limitar a 100%
    const color = progress < 50 ? 'bg-red-500' : progress < 80 ? 'bg-yellow-400' : 'bg-green-500';
    return (
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className={`${color} h-4 rounded-full text-xs font-medium text-white text-center p-0.5 leading-none`}
          style={{ width: `${progress}%` }}
        >
          {progress.toFixed(0)}%
        </div>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Caso</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendedor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Honorarios</th>
            <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Progreso vs Gastos</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.factura_id} className="hover:bg-gray-50">
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(item.fecha_emision).toLocaleDateString('es-CL')}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">{item.numero_caso || '-'}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.vendedor_nombre}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.cliente_razon_social}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-green-600">${item.honorarios_generados.toLocaleString('es-CL')}</td>
              <td className="px-3 py-4 whitespace-nowrap text-sm text-right text-red-600">${item.gastos_generados.toLocaleString('es-CL')}</td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">{renderProgressBar(item.honorarios_generados, item.gastos_generados)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;