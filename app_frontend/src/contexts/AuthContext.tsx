// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import authService from '../services/authService';
import apiClient from '../services/apiClient'; // Para actualizar el header por defecto de Axios
import { User as FrontendUser } from '../types/user'; // Asumiendo que tienes este tipo definido

// Define la forma del contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean;
  user: FrontendUser | null; // Estado para los datos del usuario
  accessToken: string | null; // Estado para el token de acceso
  isLoading: boolean;
  login: (accessToken: string, refreshToken?: string) => Promise<void>; // login ahora es async
  logout: () => void;
}

// Crea el contexto
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Crea el proveedor del contexto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FrontendUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState<boolean>(true); // Para la carga inicial

  // Determina si el usuario está autenticado basado en la presencia del token Y los datos del usuario
  const isAuthenticated = !!accessToken && !!user;

  useEffect(() => {
    const attemptAutoLogin = async () => {
      console.log("AuthContext: Iniciando attemptAutoLogin...");
      const storedToken = localStorage.getItem('accessToken');
      console.log("AuthContext: Token en localStorage:", storedToken);

      if (storedToken) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        setAccessTokenState(storedToken); // Actualiza el estado del token en el contexto
        try {
          console.log("AuthContext: Llamando a authService.getMe() para validar token y obtener usuario...");
          const currentUserData: FrontendUser = await authService.getMe();
          console.log("AuthContext: authService.getMe() exitoso, datos del usuario:", currentUserData);
          setUser(currentUserData); // Almacena los datos del usuario
        } catch (error: any) {
          console.error("AuthContext: Falló auto-login (getMe falló o token inválido):", error.response?.data?.detail || error.message);
          // Si getMe falla (ej. token expirado y el interceptor no pudo refrescar o no hay refresh token),
          // el interceptor de apiClient debería haber manejado la limpieza y redirección.
          // Pero como respaldo, limpiamos aquí también si el error es 401 o 403.
          if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            delete apiClient.defaults.headers.common['Authorization'];
            setAccessTokenState(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
      console.log("AuthContext: attemptAutoLogin finalizado. isLoading:", false);
    };

    attemptAutoLogin();
  }, []); // El array vacío asegura que esto solo se ejecute una vez al montar el componente

  const loginContext = async (newAccessToken: string, newRefreshToken?: string) => {
    console.log("AuthContext: loginContext llamado con newAccessToken:", newAccessToken);
    localStorage.setItem('accessToken', newAccessToken);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`; // Configura el header para futuras llamadas
    setAccessTokenState(newAccessToken);

    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
      console.log("AuthContext: Refresh token guardado.");
    }

    try {
      console.log("AuthContext: Llamando a authService.getMe() después del login...");
      const currentUserData: FrontendUser = await authService.getMe();
      console.log("AuthContext: authService.getMe() exitoso después del login, datos del usuario:", currentUserData);
      setUser(currentUserData); // Almacena los datos del usuario
    } catch (error) {
        console.error("AuthContext: Falló obtener datos del usuario después del login:", error);
        // Si falla obtener el usuario, consideramos el login fallido y deslogueamos.
        await logoutContext(); // Asegurar que logoutContext también pueda ser async si es necesario
    }
  };

  const logoutContext = () => {
    console.log("AuthContext: logoutContext llamado.");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    delete apiClient.defaults.headers.common['Authorization']; // Limpia el header de Axios
    setAccessTokenState(null);
    setUser(null); // Limpia los datos del usuario
    // Opcional: redirigir a /login. Esto es mejor manejarlo en los componentes o con ProtectedRoute.
    // if (window.location.pathname !== '/login') {
    //   window.location.href = '/login';
    // }
    console.log("AuthContext: Usuario deslogueado, tokens y estado limpiados.");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, accessToken, isLoading, login: loginContext, logout: logoutContext }}>
      {!isLoading ? children : <div className="min-h-screen flex items-center justify-center"><p>Cargando aplicación...</p></div>}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) { // Corregido de null a undefined para el check inicial
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};