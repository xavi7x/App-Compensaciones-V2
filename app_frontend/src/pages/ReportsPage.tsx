// src/pages/ReportsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import { Vendedor } from '../types/vendedor';
import { Cliente } from '../types/cliente';
import { ReporteFacturaItem, SumatoriaPorVendedor } from '../types/reporte';
import vendedorService from '../services/vendedorService';
import clienteService from '../services/clienteService';
import reportService from '../services/reportService';
import bonusService from '../services/bonusService';
import ReportTable from '../components/reportes/ReportTable';
import { toast } from 'react-toastify';

const COLUMN_CONFIG: { [key: string]: { label: string, defaultVisible: boolean } } = {
  fecha_emision: { label: 'Fecha', defaultVisible: true },
  numero_caso: { label: 'N° Caso', defaultVisible: true },
  vendedor_nombre: { label: 'Vendedor', defaultVisible: true },
  honorarios_generados: { label: 'Honorarios', defaultVisible: true },
  bono_calculado: { label: 'Bono por Factura', defaultVisible: true },
  porcentaje_bono_aplicado: { label: '% Bono Aplicado', defaultVisible: true },
  cliente_razon_social: { label: 'Cliente', defaultVisible: true },
  gastos_generados: { label: 'Gastos', defaultVisible: true },
  progreso_gastos: { label: 'Margen (H-G)', defaultVisible: true },
  numero_orden: { label: 'N° Orden', defaultVisible: false },
  vendedor_rut: { label: 'RUT Vendedor', defaultVisible: false },
  cliente_rut: { label: 'RUT Cliente', defaultVisible: false },
};

interface SelectOption {
    value: number | string;
    label: string;
}

const getInitialVisibility = () => {
    const initialState: { [key: string]: boolean } = {};
    for (const key in COLUMN_CONFIG) {
      initialState[key] = COLUMN_CONFIG[key].defaultVisible;
    }
    return initialState;
};
  
const ReportsPage: React.FC = () => {
    const [vendedores, setVendedores] = useState<Vendedor[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [filters, setFilters] = useState({
        startDate: '', endDate: '', numero_caso: '',
        vendedorId: '' as number | '',
        clienteId: '' as number | '',
        vendedorRut: ''
    });
    const [reportData, setReportData] = useState<ReporteFacturaItem[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [sumatoriaTotal, setSumatoriaTotal] = useState(0);
    const [sumatoriasVendedor, setSumatoriasVendedor] = useState<SumatoriaPorVendedor[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [visibleColumns, setVisibleColumns] = useState(getInitialVisibility());

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
            toast.error("Error al cargar datos para los filtros de reportes.");
          }
        };
        loadFilterData();
    }, []);

    const vendedorOptions = useMemo((): SelectOption[] => 
        [{ value: '', label: 'Todos los Vendedores' }, ...vendedores.map(v => ({ value: v.id, label: v.nombre_completo }))]
    , [vendedores]);

    const clienteOptions = useMemo((): SelectOption[] => 
        [{ value: '', label: 'Todos los Clientes' }, ...clientes.map(c => ({ value: c.id, label: c.razon_social }))]
    , [clientes]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleVendedorChange = (selectedOption: SelectOption | null) => {
        setFilters(prev => ({ ...prev, vendedorId: selectedOption ? (selectedOption.value as number) : '' }));
    };

    const handleClienteChange = (selectedOption: SelectOption | null) => {
        setFilters(prev => ({ ...prev, clienteId: selectedOption ? (selectedOption.value as number) : '' }));
    };
    
    const handleColumnVisibilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setVisibleColumns(prev => ({ ...prev, [name]: checked }));
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
        setSearchTerm('');
    
        try {
          const reportParams = {
            start_date: filters.startDate,
            end_date: filters.endDate,
            numero_caso: filters.numero_caso || undefined,
            vendedor_id: filters.vendedorId ? Number(filters.vendedorId) : undefined,
            cliente_id: filters.clienteId ? Number(filters.clienteId) : undefined,
            vendedor_rut: filters.vendedorRut || undefined,
            skip: 0,
            limit: 1000,
          };
    
          const bonusParams = {
            start_date: filters.startDate,
            end_date: filters.endDate,
            vendedor_id: filters.vendedorId ? Number(filters.vendedorId) : null
          };
    
          const [facturacionResponse, bonoResponse] = await Promise.all([
            reportService.getFacturacionReport(reportParams),
            bonusService.calculateBonuses(bonusParams)
          ]);
    
          const bonusRateMap = new Map<number, number>();
          bonoResponse.resultados.forEach(res => {
            if (res.total_honorarios > 0) {
              const rate = res.bono_calculado / res.total_honorarios;
              bonusRateMap.set(res.vendedor_id, rate);
            }
          });
    
          const enrichedReportData = facturacionResponse.items.map(item => {
            const rate = bonusRateMap.get(item.vendedor_id) || 0;
            const bonoPorFactura = item.honorarios_generados * rate;
            
            return {
              ...item,
              bono_calculado: bonoPorFactura,
              porcentaje_bono_aplicado: rate * 100,
            };
          });
    
          setReportData(enrichedReportData);
          setTotalCount(facturacionResponse.total_count);
          setSumatoriaTotal(facturacionResponse.sumatoria_total_honorarios);
          setSumatoriasVendedor(facturacionResponse.sumatorias_por_vendedor);
    
          if (facturacionResponse.total_count > 0) {
            toast.success(`Reporte generado con ${facturacionResponse.total_count} registros.`);
          } else {
            toast.info("La búsqueda no arrojó resultados.");
          }
        } catch (err: any) {
          const errorMsg = err.response?.data?.detail || "Error al generar el reporte o calcular los bonos.";
          setError(errorMsg);
          toast.error(errorMsg);
        } finally {
          setIsLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return reportData;
        const lowercasedTerm = searchTerm.toLowerCase();
        return reportData.filter(item => 
          Object.values(item).some(value => 
            String(value).toLowerCase().includes(lowercasedTerm)
          )
        );
    }, [searchTerm, reportData]);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">Generador de Reportes</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
                <h2 className="text-xl font-medium mb-4 text-gray-700">Filtros</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
                        <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
                        <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="numero_caso" className="block text-sm font-medium text-gray-700">N° de Caso</label>
                        <input type="text" name="numero_caso" id="numero_caso" placeholder="Ej: C-12345" value={filters.numero_caso} onChange={handleFilterChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"/>
                    </div>
                    <div>
                        <label htmlFor="vendedorId" className="block text-sm font-medium text-gray-700">Vendedor</label>
                        <Select
                        inputId="vendedorId"
                        options={vendedorOptions}
                        value={vendedorOptions.find(opt => opt.value === filters.vendedorId)}
                        onChange={handleVendedorChange}
                        isClearable
                        placeholder="Buscar vendedor..."
                        className="mt-1"
                        classNamePrefix="react-select"
                        />
                    </div>
                    <div>
                        <label htmlFor="clienteId" className="block text-sm font-medium text-gray-700">Cliente</label>
                        <Select
                        inputId="clienteId"
                        options={clienteOptions}
                        value={clienteOptions.find(opt => opt.value === filters.clienteId)}
                        onChange={handleClienteChange}
                        isClearable
                        placeholder="Buscar cliente..."
                        className="mt-1"
                        classNamePrefix="react-select"
                        />
                    </div>
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

            {(totalCount > 0 || isLoading) && (
                <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mt-8">
                {isLoading ? (
                    <p className="text-center text-gray-500 py-4">Generando reporte...</p>
                ) : (
                    <>
                    <div className="p-4 bg-gray-50 rounded-lg mb-6">
                        <h3 className="text-lg font-medium mb-4 text-gray-700">Opciones de Visualización</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">Buscar en resultados...</label>
                                <input
                                    type="search" id="searchTerm" name="searchTerm" value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Escriba para filtrar la tabla..."
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"
                                    disabled={reportData.length === 0}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Mostrar/Ocultar Columnas</label>
                                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                                    {Object.keys(COLUMN_CONFIG).map(key => (
                                        <div key={key} className="flex items-center">
                                            <input
                                                type="checkbox" id={`col-${key}`} name={key}
                                                checked={visibleColumns[key] ?? false}
                                                onChange={handleColumnVisibilityChange}
                                                className="h-4 w-4 text-marrs-green border-gray-300 rounded focus:ring-marrs-green"
                                            />
                                            <label htmlFor={`col-${key}`} className="ml-2 block text-sm text-gray-900">
                                                {COLUMN_CONFIG[key].label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-xl font-medium mb-4 text-gray-700">Resultados del Reporte ({filteredData.length} de {totalCount} registros encontrados)</h2>
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
                    <ReportTable data={filteredData} visibleColumns={visibleColumns} />
                    </>
                )}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;