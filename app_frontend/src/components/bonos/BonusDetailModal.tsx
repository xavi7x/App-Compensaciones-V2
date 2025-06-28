// src/components/bonos/BonusDetailModal.tsx
import React from 'react';
import { BonoVendedorResult, BonoFacturaDetalle } from '../../types/bono';

interface BonusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusResult: BonoVendedorResult | null;
}

const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const BonusDetailModal: React.FC<BonusDetailModalProps> = ({ isOpen, onClose, bonusResult }) => {
  if (!isOpen || !bonusResult) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h2 className="text-xl font-semibold">Detalle de Bonos para: <span className="text-marrs-green">{bonusResult.nombre_vendedor}</span></h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">&times;</button>
        </div>
        
        <div className="overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                    <tr>
                        {/* --- CAMBIO DE CABECERA --- */}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Razón Social Cliente</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">N° Orden</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Honorarios</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gastos</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Neto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Aplicado</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Bono Generado</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bonusResult.detalle_facturas.map((detalle: BonoFacturaDetalle) => (
                        <tr key={detalle.factura_id} className="hover:bg-gray-50">
                            {/* --- CAMBIO DE CELDA --- */}
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{detalle.razon_social_cliente}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{detalle.numero_orden || '-'}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{formatCurrency(detalle.honorarios)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600 text-right">{formatCurrency(detalle.gastos)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 font-medium text-right">{formatCurrency(detalle.neto)}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 text-right">{(detalle.porcentaje_aplicado * 100).toFixed(2)}%</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-bold text-marrs-green text-right">{formatCurrency(detalle.bono_generado)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default BonusDetailModal;