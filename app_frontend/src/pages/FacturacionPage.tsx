// src/pages/FacturacionPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { VendedorSimple } from '../types/vendedor';
import { ClienteSimple } from '../types/cliente';
import facturaService from '../services/facturaService';
import vendedorService from '../services/vendedorService';
import clienteService from '../services/clienteService';
import { Factura } from '../types/factura';
import { toast } from 'react-toastify';
import FacturaFormModal from '../components/facturas/FacturaFormModal';
import FacturaUploadCSVModal from '../components/facturas/FacturaUploadCSVModal';
import FacturasTable from '../components/facturas/FacturasTable';

interface SelectOption {
    value: number;
    label: string;
}

const initialFilters = {
    start_date: '',
    end_date: '',
    vendedor_id: '' as number | '',
    cliente_id: '' as number | '',
};

const FacturacionPage: React.FC = () => {
    const [facturas, setFacturas] = useState<Factura[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [totalFacturas, setTotalFacturas] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isCsvOpen, setIsCsvOpen] = useState(false);
    const [facturaToEdit, setFacturaToEdit] = useState<Factura | null>(null);
    
    // Estados para los filtros
    const [filters, setFilters] = useState(initialFilters);
    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const [vendedores, setVendedores] = useState<VendedorSimple[]>([]);
    const [clientes, setClientes] = useState<ClienteSimple[]>([]);

    const totalPages = Math.ceil(totalFacturas / itemsPerPage);

    const fetchFacturasData = useCallback(async () => {
        setIsLoading(true);
        try {
            const skip = (currentPage - 1) * itemsPerPage;
            const response = await facturaService.getAllFacturas(skip, itemsPerPage, activeFilters);
            setFacturas(response.items);
            setTotalFacturas(response.total_count);
        } catch (error) {
            toast.error("Error al cargar las facturas.");
        } finally {
            setIsLoading(false);
        }
    }, [currentPage, activeFilters]);

    // Cargar datos para los filtros una sola vez
    useEffect(() => {
        vendedorService.getAllVendedoresSimple().then(setVendedores);
        clienteService.getAllClientesSimple().then(setClientes); // Esta llamada ahora funcionará
    }, []);

    useEffect(() => {
        fetchFacturasData();
    }, [fetchFacturasData]);

    const handleFilterChange = (name: string, value: any) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = () => {
        setCurrentPage(1);
        setActiveFilters(filters);
    };

    const handleOpenCreateModal = () => {
        setFacturaToEdit(null);
        setIsFormOpen(true);
    };

    const handleOpenEditModal = (factura: Factura) => {
        setFacturaToEdit(factura);
        setIsFormOpen(true);
    };

    const handleDelete = async (facturaId: number) => {
        if (window.confirm("¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.")) {
            try {
                await facturaService.deleteFactura(facturaId);
                toast.success("Factura eliminada exitosamente");
                fetchFacturasData();
            } catch (error: any) {
                const errorMsg = error.response?.data?.detail || "Error al eliminar la factura.";
                toast.error(errorMsg);
            }
        }
    };
    
    const handleSaveSuccess = () => {
        setIsFormOpen(false);
        setFacturaToEdit(null);
        fetchFacturasData();
    };

    const handleUploadSuccess = () => {
        setIsCsvOpen(false);
        fetchFacturasData();
    };
    
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
    const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };

    const vendedorOptions = vendedores.map(v => ({ value: v.id, label: v.nombre_completo }));
    const clienteOptions = clientes.map(c => ({ value: c.id, label: c.razon_social }));

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Gestión de Facturación</h1>
                <div className="flex gap-2">
                    <button onClick={() => setIsCsvOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Cargar CSV</button>
                    <button onClick={handleOpenCreateModal} className="px-4 py-2 bg-marrs-green text-white rounded-md hover:bg-opacity-80">+ Carga Manual</button>
                </div>
            </div>

            {/* Sección de Filtros */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6 shadow">
                <div className="grid grid-cols-1 md:grid-cols-5 items-center gap-4">
                    <input type="date" value={filters.start_date} onChange={e => handleFilterChange('start_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    <input type="date" value={filters.end_date} onChange={e => handleFilterChange('end_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md"/>
                    <Select options={vendedorOptions} onChange={opt => handleFilterChange('vendedor_id', opt?.value || '')} isClearable placeholder="Filtrar por vendedor..."/>
                    <Select options={clienteOptions} onChange={opt => handleFilterChange('cliente_id', opt?.value || '')} isClearable placeholder="Filtrar por cliente..."/>
                    <button 
                        onClick={handleSearch} 
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-marrs-green hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marrs-green disabled:opacity-50"
                    >
                        Buscar
                    </button>
                </div>
            </div>

            <FacturaFormModal 
                isOpen={isFormOpen} 
                onClose={() => setIsFormOpen(false)} 
                onSave={handleSaveSuccess}
                facturaToEdit={facturaToEdit}
            />
            <FacturaUploadCSVModal isOpen={isCsvOpen} onClose={() => setIsCsvOpen(false)} onUploadSuccess={handleUploadSuccess} />
            
            <FacturasTable 
                facturas={facturas}
                isLoading={isLoading}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
            />
            
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