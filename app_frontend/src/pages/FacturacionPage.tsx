// src/pages/FacturacionPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import facturaService from '../services/facturaService';
import { Factura } from '../types/factura';
import { toast } from 'react-toastify';
import FacturaFormModal from '../components/facturas/FacturaFormModal';
import FacturaUploadCSVModal from '../components/facturas/FacturaUploadCSVModal';

const FacturacionPage: React.FC = () => {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalFacturas, setTotalFacturas] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(totalFacturas / itemsPerPage);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCsvOpen, setIsCsvOpen] = useState(false);

    const fetchFacturas = useCallback(async () => {
        setIsLoading(true);
        try {
            const skip = (currentPage - 1) * itemsPerPage;
            const response = await facturaService.getAllFacturas(skip, itemsPerPage);
            setFacturas(response.items);
            setTotalFacturas(response.total_count);
        } catch (error) {
            toast.error("Error al cargar las facturas.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, itemsPerPage]);

    useEffect(() => {
        fetchFacturas();
    }, [fetchFacturas]);

    const handleSaveSuccess = () => {
        setIsFormOpen(false);
        fetchFacturas();
    };

    const handleUploadSuccess = () => {
        setIsCsvOpen(false);
        fetchFacturas();
    };
    
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
    const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestión de Facturación</h1>
                <div className="flex gap-2">
                    <button onClick={() => setIsCsvOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Cargar CSV</button>
                    <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 bg-marrs-green text-white rounded-md hover:bg-opacity-80">+ Carga Manual</button>
                </div>
            </div>

            <FacturaFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSave={handleSaveSuccess} />
            <FacturaUploadCSVModal isOpen={isCsvOpen} onClose={() => setIsCsvOpen(false)} onUploadSuccess={handleUploadSuccess} />
            
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full table-auto">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left">N° Orden</th>
                            <th className="px-6 py-3 text-left">Vendedor</th>
                            <th className="px-6 py-3 text-left">Cliente</th>
                            <th className="px-6 py-3 text-left">Fecha Venta</th>
                            <th className="px-6 py-3 text-right">Honorarios</th>
                            <th className="px-6 py-3 text-right">Gastos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {isLoading ? (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">Cargando facturas...</td></tr>
                        ) : facturas.length > 0 ? facturas.map(factura => (
                            <tr key={factura.id}>
                                <td className="px-6 py-4">{factura.numero_orden}</td>
                                <td className="px-6 py-4">{factura.vendedor?.nombre_completo || 'N/A'}</td>
                                <td className="px-6 py-4">{factura.cliente?.razon_social || 'N/A'}</td>
                                <td className="px-6 py-4">{new Date(factura.fecha_venta).toLocaleDateString()}</td>
                                <td className="px-6 py-4 text-right">${factura.honorarios_generados.toLocaleString('es-CL')}</td>
                                <td className="px-6 py-4 text-right">${factura.gastos_generados.toLocaleString('es-CL')}</td>
                            </tr>
                        )) : (
                           <tr><td colSpan={6} className="p-4 text-center text-gray-500">No hay facturas registradas.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {!isLoading && totalFacturas > itemsPerPage && (
              <div className="mt-6 flex justify-center items-center space-x-2">
                  <button onClick={handlePreviousPage} disabled={currentPage === 1} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50">Anterior</button>
                  <span>Página {currentPage} de {totalPages}</span>
                  <button onClick={handleNextPage} disabled={currentPage >= totalPages} className="px-4 py-2 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-50 disabled:opacity-50">Siguiente</button>
              </div>
            )}
        </div>
    );
};

export default FacturacionPage;