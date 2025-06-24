// src/pages/ReportsPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Vendedor } from '../types/vendedor';
import { Cliente } from '../types/cliente';
import { ReporteFacturaItem, SumatoriaPorVendedor } from '../types/reporte';
import vendedorService from '../services/vendedorService';
import clienteService from '../services/clienteService';
import reportService from '../services/reportService';
import ReportTable from '../components/reportes/ReportTable';
import { toast } from 'react-toastify';

const ReportsPage: React.FC = () => {
  // Estados para los datos de los filtros (vendedores, clientes)
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  
  // Estado para los valores seleccionados en los filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    numero_caso: '',
    vendedorId: '',
    clienteId: '',
    vendedorRut: ''
  });

  // Estados para los resultados del reporte
  const [reportData, setReportData] = useState<ReporteFacturaItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [sumatoriaTotal, setSumatoriaTotal] = useState(0);
  const [sumatoriasVendedor, setSumatoriasVendedor] = useState<SumatoriaPorVendedor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos para los selectores de Vendedores y Clientes al montar el componente
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const [vendedoresRes, clientesRes] = await Promise.all([
          vendedorService.getAllVendedores(0, 1000), // Cargar hasta 1000 para el dropdown
          clienteService.getAllClientes(0, 1000)
        ]);
        setVendedores(vendedoresRes.items);
        setClientes(clientesRes.items);
      } catch (err) {
        toast.error("Error al cargar datos para los filtros de reportes.");
        console.error("Error cargando datos para filtros:", err);
      }
    };
    loadFilterData();
  }, []); // El array vacío asegura que se ejecute solo una vez

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleGenerateReport = async () => {
    if (!filters.startDate || !filters.endDate) {
      toast.warn("Debe seleccionar un período de fechas para generar el reporte.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setReportData([]);
    setTotalCount(0);
    setSumatoriaTotal(0);
    setSumatoriasVendedor([]);

    try {
      const params: any = {
        start_date: filters.startDate,
        end_date: filters.endDate,
        numero_caso: filters.numero_caso || undefined,
        vendedor_id: filters.vendedorId ? parseInt(filters.vendedorId) : undefined,
        cliente_id: filters.clienteId ? parseInt(filters.clienteId) : undefined,
        vendedor_rut: filters.vendedorRut || undefined,
        skip: 0,
        limit: 1000, // Cargar hasta 1000 registros para el reporte
      };
      const response = await reportService.getFacturacionReport(params);
      setReportData(response.items);
      setTotalCount(response.total_count);
      setSumatoriaTotal(response.sumatoria_total_honorarios);
      setSumatoriasVendedor(response.sumatorias_por_vendedor);
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
          
          {/* Filtro Fecha de Inicio */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
            <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"/>
          </div>

          {/* Filtro Fecha de Fin */}
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
            <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"/>
          </div>

          {/* Filtro N° de Caso */}
          <div>
            <label htmlFor="numero_caso" className="block text-sm font-medium text-gray-700">N° de Caso</label>
            <input type="text" name="numero_caso" id="numero_caso" placeholder="Ej: C-12345" value={filters.numero_caso} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"/>
          </div>
          
          {/* Filtro Vendedor */}
          <div>
            <label htmlFor="vendedorId" className="block text-sm font-medium text-gray-700">Vendedor</label>
            <select name="vendedorId" id="vendedorId" value={filters.vendedorId} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm rounded-md">
              <option value="">Todos los Vendedores</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre_completo}</option>)}
            </select>
          </div>

          {/* Filtro Cliente */}
          <div>
            <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700">Cliente</label>
            <select name="clienteId" id="clienteId" value={filters.clienteId} onChange={handleFilterChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm rounded-md">
              <option value="">Todos los Clientes</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>
          
          {/* Filtro RUT del Vendedor */}
          <div>
            <label htmlFor="vendedorRut" className="block text-sm font-medium text-gray-700">RUT del Vendedor</label>
            <input type="text" name="vendedorRut" id="vendedorRut" placeholder="Ej: 12345678-9" value={filters.vendedorRut} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"/>
          </div>

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
      {(totalCount > 0 || isLoading) && (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mt-8">
          <h2 className="text-xl font-medium mb-4 text-gray-700">Resultados del Reporte ({totalCount} registros encontrados)</h2>
          
          {isLoading ? (
            <p className="text-center text-gray-500 py-4">Generando reporte...</p>
          ) : (
            <>
              {/* Sección de Resumen */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500">Total Honorarios Generados</h3>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">
                    ${sumatoriaTotal.toLocaleString('es-CL')}
                  </p>
                </div>
                <div className="bg-gray-100 p-4 rounded-lg md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500">Honorarios por Vendedor</h3>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {sumatoriasVendedor.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {sumatoriasVendedor.map(sum => (
                          <li key={sum.vendedor_id} className="py-2 flex justify-between items-center">
                            <span className="text-sm text-gray-800">{sum.vendedor_nombre}</span>
                            <span className="text-sm font-medium text-gray-900">${sum.total_honorarios.toLocaleString('es-CL')}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-500">No hay desglose disponible.</p>}
                  </div>
                </div>
              </div>

              {/* Tabla de Resultados */}
              <ReportTable data={reportData} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
