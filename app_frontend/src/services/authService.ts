// src/services/authService.ts
import apiClient from './apiClient';
import { UserCreate, UserRole, RegisterPayload } from '../types/user';
import axios from "axios";

interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

const login = async (username: string, password: string, totp_code?: string): Promise<LoginResponse> => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  if (totp_code) {
    formData.append('client_secret', totp_code);
  }
  const response = await apiClient.post<LoginResponse>(
    '/auth/login',
    formData,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
  );
  return response.data;
};

const register = async (data: RegisterPayload): Promise<any> => {
  const payloadForApi: UserCreate = {
      email: data.email,
      username: data.username,
      password: data.password,
      full_name: data.full_name || null,
      is_active: true,
      is_superuser: false,
      role: UserRole.USER,
  };
  const response = await apiClient.post('/users/', payloadForApi);
  return response.data;
};

const getMe = async (): Promise<any> => {
    const response = await apiClient.get('/users/me');
    return response.data;
};

const refreshToken = async (currentRefreshToken: string): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/auth/refresh-token', {
      refresh_token: currentRefreshToken
  });
  return response.data;
};

const authService = {
  login,
  register,
  getMe,
  refreshToken,
};

export default authService;