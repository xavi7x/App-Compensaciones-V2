// src/pages/BonusCalculationPage.tsx
import React, { useState, useEffect } from 'react';
import { Vendedor } from '../types/vendedor';
import { BonoCalculationResponse } from '../types/bono';
import vendedorService from '../services/vendedorService';
import bonusService from '../services/bonusService';
import BonusResultsTable from '../components/bonos/BonusResultsTable';
import { toast } from 'react-toastify';

const BonusCalculationPage: React.FC = () => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [vendedoresError, setVendedoresError] = useState<string | null>(null); // Estado de error para el dropdown
  const [selectedVendedor, setSelectedVendedor] = useState<string>('todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<BonoCalculationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Cargar la lista de vendedores para el dropdown
  useEffect(() => {
    const loadVendedores = async () => {
      try {
        // Pedir hasta 1000 vendedores, que debería ser suficiente para un dropdown
        const response = await vendedorService.getAllVendedores(0, 1000); 
        setVendedores(response.items);
        setVendedoresError(null); // Limpiar error si la carga es exitosa
      } catch (err: any) {
        const errorMsg = err.response?.data?.detail || "No se pudo cargar la lista de vendedores.";
        console.error("Error cargando vendedores:", err);
        setVendedoresError(errorMsg); // Guardar el error específico para mostrarlo
        toast.error(errorMsg);
      }
    };
    loadVendedores();
  }, []); // Se ejecuta solo una vez al montar

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      toast.warn("Por favor, seleccione un rango de fechas.");
      return;
    }
    setCalculationError(null);
    setResults(null);
    setIsLoading(true);
    try {
      const params = {
        start_date: startDate,
        end_date: endDate,
        vendedor_id: selectedVendedor === 'todos' ? null : parseInt(selectedVendedor)
      };
      const response = await bonusService.calculateBonuses(params);
      setResults(response);
      toast.success(`Cálculo completado. Se encontraron ${response.resultados.length} resultados.`);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Error al calcular los bonos.";
      setCalculationError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-6">Cálculo de Bonos</h1>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-medium mb-4 text-gray-700">Parámetros de Cálculo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Selector de Vendedor */}
          <div>
            <label htmlFor="vendedor-select" className="block text-sm font-medium text-gray-700">Vendedor</label>
            <select 
              id="vendedor-select"
              value={selectedVendedor}
              onChange={(e) => setSelectedVendedor(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm rounded-md"
              disabled={!!vendedoresError} // Deshabilitar si hay error al cargar
            >
              <option value="todos">Todos los Vendedores</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nombre_completo}</option>
              ))}
            </select>
            {vendedoresError && <p className="text-xs text-red-500 mt-1">{vendedoresError}</p>}
          </div>
          {/* Selectores de Fecha */}
          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
            <input 
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm rounded-md"
            />
          </div>
          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
            <input 
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm rounded-md"
            />
          </div>
        </div>
        <div className="mt-6 text-right">
          <button
            onClick={handleCalculate}
            disabled={isLoading || !!vendedoresError} // Deshabilitar si hay error en vendedores
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-marrs-green hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marrs-green disabled:opacity-50"
          >
            {isLoading ? 'Calculando...' : 'Calcular Bonos'}
          </button>
        </div>
      </div>

      {calculationError && <div className="mt-6 p-4 text-red-700 bg-red-100 rounded-md">{calculationError}</div>}

      {results && <BonusResultsTable resultados={results.resultados} />}
    </div>
  );
};

export default BonusCalculationPage;