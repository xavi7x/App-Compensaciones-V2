// src/services/facturaService.ts
import apiClient from './apiClient';
import { Factura, FacturaCreate, FacturaUpdate, FacturasResponse } from '../types/factura';

// Se define una interfaz para los filtros
interface FacturaFilters {
  start_date?: string;
  end_date?: string;
  vendedor_id?: number | '';
  cliente_id?: number | '';
}

const getAllFacturas = async (skip: number, limit: number, filters: FacturaFilters): Promise<FacturasResponse> => {
    // Limpiar filtros vacíos antes de enviar
    const cleanFilters: { [key: string]: any } = {};
    for (const key in filters) {
        if (filters[key as keyof FacturaFilters]) {
            cleanFilters[key] = filters[key as keyof FacturaFilters];
        }
    }
    const response = await apiClient.get<FacturasResponse>('/facturas/', { params: { skip, limit, ...cleanFilters } });
    return response.data;
};

const createFactura = async (data: FacturaCreate): Promise<Factura> => {
    const response = await apiClient.post<Factura>('/facturas/', data);
    return response.data;
};

const updateFactura = async (id: number, data: FacturaUpdate): Promise<Factura> => {
    const response = await apiClient.put<Factura>(`/facturas/${id}`, data);
    return response.data;
}

const deleteFactura = async (id: number): Promise<void> => {
    await apiClient.delete(`/facturas/${id}`);
}

const uploadFacturasCSV = async (file: File): Promise<Factura[]> => {
    // ... (esta función no cambia)
};

const facturaService = {
    getAllFacturas,
    createFactura,
    updateFactura,
    deleteFactura,
    uploadFacturasCSV,
};

export default facturaService;