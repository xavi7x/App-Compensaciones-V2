// src/services/apiClient.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/v1",
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${apiClient.defaults.baseURL}/auth/refresh-token`, {
            refresh_token: refreshToken
          });
          const { access_token: newAccessToken, refresh_token: newRefreshToken } = response.data;
          localStorage.setItem('accessToken', newAccessToken);
          if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
          }
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error("Refresh token failed or expired", refreshError);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname !== '/login') {
               window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
         console.error("No refresh token available");
         localStorage.removeItem('accessToken');
         localStorage.removeItem('refreshToken');
         apiClient.defaults.headers.common['Authorization'] = '';
         if (window.location.pathname !== '/login') {
              window.location.href = '/login';
         }
      }
    }
    return Promise.reject(error);
  }
);
export default apiClient;