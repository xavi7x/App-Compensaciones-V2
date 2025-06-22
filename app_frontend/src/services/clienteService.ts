// src/services/clienteService.ts
import apiClient from './apiClient';
import { Cliente, ClienteCreate, ClienteUpdate, ClienteFormData, ClienteUpdateData } from '../types/cliente';

interface ClientesResponse {
  items: Cliente[];
  total_count: number;
}

const getAllClientes = async (
  skip: number = 0, 
  limit: number = 100, 
  search: string = ''
): Promise<ClientesResponse> => {
  const params: any = { skip, limit };
  if (search) {
    params.search = search;
  }
  const response = await apiClient.get<ClientesResponse>('/clientes/', { params });
  return response.data; 
};

const getClienteById = async (id: number): Promise<Cliente> => {
  const response = await apiClient.get<Cliente>(`/clientes/${id}`);
  return response.data;
};

const createCliente = async (data: ClienteFormData): Promise<Cliente> => {
  // Asegurar que el RUT esté en formato correcto
  const formattedData = {
    ...data,
    rut: data.rut.replace(/\./g, '') // Eliminar puntos del RUT
  };
  const response = await apiClient.post<Cliente>('/clientes/', formattedData);
  return response.data;
};

const updateCliente = async (id: number, data: ClienteFormData): Promise<Cliente> => {
  // Eliminar campos que no deberían ser actualizados
  const { rut, ...updateData } = data;
  
  const response = await apiClient.put<Cliente>(`/clientes/${id}`, updateData);
  return response.data;
};

const deleteCliente = async (id: number): Promise<void> => {
  await apiClient.delete(`/clientes/${id}`);
};

const uploadClientesCSV = async (file: File): Promise<Cliente[]> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<Cliente[]>('/clientes/upload-csv/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const getAllClientesSimple = async (): Promise<Cliente[]> => {
  const response = await apiClient.get<ClientesResponse>('/clientes/', { params: { skip: 0, limit: 1000 } });
  return response.data.items;
};

export default {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  uploadClientesCSV,
  getAllClientesSimple
};