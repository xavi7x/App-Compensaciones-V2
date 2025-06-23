// src/services/vendedorService.ts
import apiClient from './apiClient';
import { 
    Vendedor, 
    VendedorCreate, 
    VendedorUpdate, 
    VendedorClientePorcentaje, 
    VendedorClientePorcentajeCreate, 
    VendedorClientePorcentajeUpdate,
    VendedorSimple
} from '../types/vendedor';
import { ClienteSimple } from '../types/cliente';

interface VendedoresResponse {
    items: Vendedor[];
    total_count: number;
}

// --- Vendedor CRUD ---
const getAllVendedores = async (skip: number = 0, limit: number = 10, search: string = ''): Promise<VendedoresResponse> => {
  const params: any = { skip, limit };
  if (search) params.search = search;
  const response = await apiClient.get<VendedoresResponse>('/vendedores/', { params });
  return response.data;
};

const getVendedorById = async (id: number): Promise<Vendedor> => {
  const response = await apiClient.get<Vendedor>(`/vendedores/${id}`);
  return response.data;
};

const createVendedor = async (data: VendedorCreate): Promise<Vendedor> => {
  const response = await apiClient.post<Vendedor>('/vendedores/', data);
  return response.data;
};

const updateVendedor = async (id: number, data: VendedorUpdate): Promise<Vendedor> => {
  const response = await apiClient.put<Vendedor>(`/vendedores/${id}`, data);
  return response.data;
};

const deleteVendedor = async (id: number): Promise<Vendedor> => {
  const response = await apiClient.delete<Vendedor>(`/vendedores/${id}`);
  return response.data;
};

// --- Vendedor-Cliente Asignaciones ---
const addClienteToVendedor = async (vendedorId: number, data: VendedorClientePorcentajeCreate): Promise<VendedorClientePorcentaje> => {
    const response = await apiClient.post<VendedorClientePorcentaje>(`/vendedores/${vendedorId}/clientes`, data);
    return response.data;
};

const updateClienteAsignacion = async (vendedorId: number, clienteId: number, data: VendedorClientePorcentajeUpdate): Promise<VendedorClientePorcentaje> => {
    const response = await apiClient.put<VendedorClientePorcentaje>(`/vendedores/${vendedorId}/clientes/${clienteId}`, data);
    return response.data;
};

const removeClienteFromVendedor = async (vendedorId: number, clienteId: number): Promise<VendedorClientePorcentaje> => {
    const response = await apiClient.delete<VendedorClientePorcentaje>(`/vendedores/${vendedorId}/clientes/${clienteId}`);
    return response.data;
};

// --- Carga Masiva CSV ---
const uploadVendedoresCSV = async (file: File): Promise<Vendedor[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<Vendedor[]>('/vendedores/upload-csv/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

// --- Funciones para listas simplificadas ---

// Obtiene TODOS los vendedores (para el primer dropdown)
const getAllVendedoresSimple = async (): Promise<VendedorSimple[]> => {
  const response = await apiClient.get<VendedorSimple[]>('/vendedores/simple');
  return response.data;
};

// --- NUEVA FUNCIÓN AÑADIDA Y CORREGIDA ---
const getAssignedClients = async (vendedorId: number): Promise<ClienteSimple[]> => {
    try {
        const response = await apiClient.get<ClienteSimple[]>(`/vendedores/${vendedorId}/clientes-asignados`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener los clientes asignados:", error);
        throw error;
    }
};

// Exportación del servicio completo
const vendedorService = {
  getAllVendedores,
  getVendedorById,
  createVendedor,
  updateVendedor,
  deleteVendedor,
  addClienteToVendedor,
  updateClienteAsignacion,
  removeClienteFromVendedor,
  uploadVendedoresCSV,
  getAllVendedoresSimple,
  getAssignedClients
};

export default vendedorService;
