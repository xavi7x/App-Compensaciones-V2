// src/services/userService.ts
import apiClient from './apiClient';
import { User, UserUpdate } from '../types/user'; 

const getPendingApprovalUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users/pending-approval');
  return response.data;
};

// Obtiene solo usuarios activos y aprobados para la gestión principal
const getAllActiveUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users/'); // Este endpoint debería devolver solo usuarios activos/aprobados
  return response.data;
};

// --- NUEVA FUNCIÓN ---
// Obtiene usuarios rechazados o inactivos
const getArchivedUsers = async (): Promise<User[]> => {
  // Asumimos que tendrás un endpoint para esto. Si no, se puede filtrar desde /users/ si devuelve todo.
  // Por ahora, lo implementaremos asumiendo que el endpoint /users/archived existe.
  // Si no, necesitarías modificar el backend o filtrar en el frontend desde la lista completa.
  const response = await apiClient.get<User[]>('/users/archived'); // Endpoint hipotético
  return response.data;
};


const approveUser = async (userId: number): Promise<User> => {
  const response = await apiClient.post<User>(`/users/${userId}/approve`);
  return response.data;
};

const rejectUser = async (userId: number): Promise<User> => {
  const response = await apiClient.post<User>(`/users/${userId}/reject`);
  return response.data;
};

const updateUser = async (userId: number, data: UserUpdate): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${userId}`, data);
  return response.data;
};

const userService = {
  getPendingApprovalUsers,
  getAllActiveUsers, // Renombrado para mayor claridad
  getArchivedUsers, // <--- AÑADIR
  approveUser,
  rejectUser,
  updateUser, 
};

export default userService;