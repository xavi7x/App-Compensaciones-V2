// src/services/clienteService.ts
import apiClient from './apiClient';
import { Cliente, ClienteCreate, ClienteUpdate } from '../types/cliente';

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

const createCliente = async (data: ClienteCreate): Promise<Cliente> => {
  const response = await apiClient.post<Cliente>('/clientes/', data);
  return response.data;
};

const updateCliente = async (id: number, data: ClienteUpdate): Promise<Cliente> => {
  const response = await apiClient.put<Cliente>(`/clientes/${id}`, data);
  return response.data;
};

const deleteCliente = async (id: number): Promise<Cliente> => { // El backend devuelve el cliente eliminado
  const response = await apiClient.delete<Cliente>(`/clientes/${id}`);
  return response.data;
};

const uploadClientesCSV = async (file: File): Promise<Cliente[]> => { // O un tipo de respuesta más complejo
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<Cliente[]>('/clientes/upload-csv/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const clienteService = {
  getAllClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  uploadClientesCSV,
};

export default clienteService;