// src/components/reportes/ReportTable.tsx
import React from 'react';
import { ReporteFacturaItem } from '../../types/reporte';

interface ReportTableProps {
  data: ReporteFacturaItem[];
  visibleColumns: { [key: string]: boolean };
}

// Se actualiza la etiqueta para la nueva columna de Margen
const COLUMN_LABELS: { [key: string]: string } = {
    fecha_emision: 'Fecha',
    numero_caso: 'N° Caso',
    vendedor_nombre: 'Vendedor',
    cliente_razon_social: 'Cliente',
    honorarios_generados: 'Honorarios',
    gastos_generados: 'Gastos',
    progreso_gastos: 'Margen (H-G)', // ETIQUETA ACTUALIZADA
    numero_orden: 'N° Orden',
    vendedor_rut: 'RUT Vendedor',
    cliente_rut: 'RUT Cliente',
    bono_calculado: 'Bono por Factura'
};

const COLUMN_ORDER: string[] = [
    'fecha_emision', 'numero_caso', 'vendedor_nombre', 'honorarios_generados', 'bono_calculado',
    'cliente_razon_social', 'gastos_generados', 'progreso_gastos',
    'numero_orden', 'vendedor_rut', 'cliente_rut'
];

const ReportTable: React.FC<ReportTableProps> = ({ data, visibleColumns }) => {
  if (data.length === 0) {
    return <p className="text-gray-500 text-center py-4">No se encontraron registros para los filtros seleccionados.</p>;
  }

  // --- NUEVA FUNCIÓN PARA CALCULAR Y MOSTRAR EL RENDIMIENTO ---
  const renderRendimiento = (honorarios: number, gastos: number) => {
    // Caso especial: Si no hay honorarios, no se puede calcular un margen.
    if (honorarios === 0) {
      // Si hay gastos pero no honorarios, es una pérdida total.
      if (gastos > 0) {
        return <span className="text-red-600 font-bold">Pérdida</span>;
      }
      // Si ambos son 0, el margen es 0.
      return <span className="text-gray-500">0.00%</span>;
    }

    const margen = ((honorarios - gastos) / honorarios) * 100;
    const color = margen < 0 ? 'text-red-600' : 'text-green-600';
    const sign = margen > 0 ? '+' : ''; // Añadir signo '+' a los valores positivos

    return (
      <span className={`${color} font-bold`}>
        {sign}{margen.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%
      </span>
    );
  };


  const visibleColumnKeys = COLUMN_ORDER.filter(key => visibleColumns[key]);

  const renderCellContent = (item: ReporteFacturaItem, key: string) => {
    switch (key) {
      case 'fecha_emision':
        return new Date(item.fecha_emision).toLocaleDateString('es-CL');
      case 'numero_caso':
        return item.numero_caso || '-';
      case 'vendedor_nombre':
        return item.vendedor_nombre;
      case 'cliente_razon_social':
        return item.cliente_razon_social;
      case 'honorarios_generados':
        return `$${item.honorarios_generados.toLocaleString('es-CL')}`;
      case 'gastos_generados':
        return `$${item.gastos_generados.toLocaleString('es-CL')}`;
      case 'progreso_gastos': // Llama a la nueva función de rendimiento
        return renderRendimiento(item.honorarios_generados, item.gastos_generados);
      case 'bono_calculado': 
        return `$${(item.bono_calculado ?? 0).toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      default:
        return item[key as keyof ReporteFacturaItem] ?? '-';
    }
  };
  
  const getCellClasses = (key: string): string => {
      switch(key) {
        case 'fecha_emision':
        case 'numero_caso':
            return "px-3 py-4 whitespace-nowrap text-sm text-gray-500";
        case 'vendedor_nombre':
        case 'cliente_razon_social':
            return "px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900";
        case 'honorarios_generados':
            return "px-3 py-4 whitespace-nowrap text-sm text-right text-green-600";
        case 'bono_calculado':
            return "px-3 py-4 whitespace-nowrap text-sm text-right font-bold text-marrs-green";
        case 'gastos_generados':
            return "px-3 py-4 whitespace-nowrap text-sm text-right text-red-600";
        case 'progreso_gastos': // Centramos el texto para mejor visualización
            return "px-4 py-4 whitespace-nowrap text-sm text-center";
        default:
             return "px-3 py-4 whitespace-nowrap text-sm text-gray-500";
      }
  }

  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {visibleColumnKeys.map(key => (
              <th key={key} className={key === 'progreso_gastos' ? "px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" : (key === 'honorarios_generados' || key === 'gastos_generados' || key === 'bono_calculado' ? "px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" : "px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider")}>
                {COLUMN_LABELS[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.factura_id} className="hover:bg-gray-50">
              {visibleColumnKeys.map(key => (
                <td key={`${item.factura_id}-${key}`} className={getCellClasses(key)}>
                  {renderCellContent(item, key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;