// src/pages/ReportsPage.tsx
import React, { useState, useEffect } from 'react';
import { Vendedor } from '../types/vendedor';
import { Cliente } from '../types/cliente';
import { ReporteFacturaItem } from '../types/reporte';
import vendedorService from '../services/vendedorService';
import clienteService from '../services/clienteService';
import reportService from '../services/reportService';
import ReportTable from '../components/reportes/ReportTable';
import { toast } from 'react-toastify';

const ReportsPage: React.FC = () => {
  // Estados para los filtros
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    numero_caso: '',
    vendedorId: '',
    clienteId: '',
    vendedorRut: ''
  });

  // Estados para los resultados
  const [reportData, setReportData] = useState<ReporteFacturaItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos para los selectores de filtro
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [vendedoresRes, clientesRes] = await Promise.all([
          vendedorService.getAllVendedores(0, 1000),
          clienteService.getAllClientes(0, 1000)
        ]);
        setVendedores(vendedoresRes.items);
        setClientes(clientesRes.items);
      } catch (err) {
        toast.error("Error al cargar datos para filtros.");
      }
    };
    loadFilterData();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.warn("Debe seleccionar un período de fechas.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setReportData([]);
    setTotalCount(0);

    try {
      const params: any = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        numero_caso: filters.numero_caso || undefined,
        vendedor_id: filters.vendedorId ? parseInt(filters.vendedorId) : undefined,
        cliente_id: filters.clienteId ? parseInt(filters.clienteId) : undefined,
        vendedor_rut: filters.vendedorRut || undefined,
        // Paginación puede añadirse después si es necesario
        skip: 0,
        limit: 1000, // Cargar hasta 1000 registros para el reporte
      };
      const response = await reportService.getFacturacionReport(params);
      setReportData(response.items);
      setTotalCount(response.total_count);
      toast.success(`Reporte generado con ${response.total_count} registros.`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Error al generar el reporte.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">Generador de Reportes</h1>

      <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
        <h2 className="text-xl font-medium mb-4 text-gray-700">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtros aquí */}
          <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="..."/>
          <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="..."/>
          <input type="text" name="numero_caso" placeholder="N° de Caso" value={filters.numero_caso} onChange={handleFilterChange} className="..."/>
          <select name="vendedorId" value={filters.vendedorId} onChange={handleFilterChange} className="...">
            <option value="">Todos los Vendedores</option>
            {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre_completo}</option>)}
          </select>
          <select name="clienteId" value={filters.clienteId} onChange={handleFilterChange} className="...">
            <option value="">Todos los Clientes</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
          </select>
          <input type="text" name="vendedorRut" placeholder="RUT del Vendedor" value={filters.vendedorRut} onChange={handleFilterChange} className="..."/>
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={handleGenerateReport}
            disabled={isLoading}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-marrs-green hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marrs-green disabled:opacity-50"
          >
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </button>
        </div>
      </div>

      {error && <div className="p-4 text-red-700 bg-red-100 rounded-md">{error}</div>}

      {/* Resultados */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-medium mb-2 text-gray-700">Resultados del Reporte ({totalCount} registros)</h2>
        {isLoading ? (
          <p className="text-center text-gray-500 py-4">Generando reporte...</p>
        ) : (
          <ReportTable data={reportData} />
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
