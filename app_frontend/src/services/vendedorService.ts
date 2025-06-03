// src/services/vendedorService.ts
import apiClient from './apiClient';
import { 
    Vendedor, VendedorCreate, VendedorUpdate, 
    VendedorClientePorcentaje, VendedorClientePorcentajeCreate, VendedorClientePorcentajeUpdate 
} from '../types/vendedor';

interface VendedoresResponse { // Para la respuesta paginada
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

const deleteVendedor = async (id: number): Promise<Vendedor> => { // O Promise<void> si el backend no devuelve el objeto
  const response = await apiClient.delete<Vendedor>(`/vendedores/${id}`);
  return response.data;
};

// --- Vendedor-Cliente Asignaciones ---
const addClienteToVendedor = async (vendedorId: number, data: VendedorClientePorcentajeCreate): Promise<VendedorClientePorcentaje> => {
    const response = await apiClient.post<VendedorClientePorcentaje>(`/vendedores/${vendedorId}/clientes/`, data);
    return response.data;
};

const updateClienteAsignacion = async (vendedorId: number, clienteId: number, data: VendedorClientePorcentajeUpdate): Promise<VendedorClientePorcentaje> => {
    const response = await apiClient.put<VendedorClientePorcentaje>(`/vendedores/${vendedorId}/clientes/${clienteId}/`, data);
    return response.data;
};

const removeClienteFromVendedor = async (vendedorId: number, clienteId: number): Promise<VendedorClientePorcentaje> => { // O Promise<void>
    const response = await apiClient.delete<VendedorClientePorcentaje>(`/vendedores/${vendedorId}/clientes/${clienteId}/`);
    return response.data;
};

// TODO: Implementar uploadVendedoresCSV si se necesita para vendedores

const vendedorService = {
  getAllVendedores,
  getVendedorById,
  createVendedor,
  updateVendedor,
  deleteVendedor,
  addClienteToVendedor,
  updateClienteAsignacion,
  removeClienteFromVendedor,
};

export default vendedorService;