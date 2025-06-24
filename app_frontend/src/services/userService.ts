// src/services/userService.ts
import apiClient from './apiClient';
import { User, UserUpdate } from '../types/user'; // Asegúrate de importar UserUpdate

// Obtener la lista de usuarios pendientes de aprobación
const getPendingApprovalUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users/pending-approval');
  return response.data;
};

// --- NUEVA FUNCIÓN ---
// Obtener la lista de TODOS los usuarios (para admin)
const getAllUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users/');
  return response.data;
};

// Aprobar la cuenta de un usuario por su ID
const approveUser = async (userId: number): Promise<User> => {
  const response = await apiClient.post<User>(`/users/${userId}/approve`);
  return response.data;
};

// Rechazar la cuenta de un usuario por su ID
const rejectUser = async (userId: number): Promise<User> => {
  const response = await apiClient.post<User>(`/users/${userId}/reject`);
  return response.data;
};

// --- NUEVA FUNCIÓN ---
// Actualizar un usuario (ej. para cambiar su rol)
const updateUser = async (userId: number, data: UserUpdate): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${userId}`, data);
  return response.data;
};

const userService = {
  getPendingApprovalUsers,
  getAllUsers, 
  approveUser,
  rejectUser,
  updateUser, 
};

export default userService;