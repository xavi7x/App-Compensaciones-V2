// src/services/facturaService.ts
import apiClient from './apiClient';
import { Factura, FacturaCreate, FacturasResponse } from '../types/factura';

const getAllFacturas = async (skip: number, limit: number): Promise<FacturasResponse> => {
    const response = await apiClient.get<FacturasResponse>('/facturas/', { params: { skip, limit } });
    return response.data;
};

const createFactura = async (data: FacturaCreate): Promise<Factura> => {
    const response = await apiClient.post<Factura>('/facturas/', data);
    return response.data;
};

const uploadFacturasCSV = async (file: File): Promise<Factura[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<Factura[]>('/facturas/upload-csv/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

const facturaService = {
    getAllFacturas,
    createFactura,
    uploadFacturasCSV,
};

export default facturaService;