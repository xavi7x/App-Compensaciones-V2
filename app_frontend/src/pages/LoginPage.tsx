// src/pages/LoginPage.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login: contextLogin, isAuthenticated, isLoading: authIsLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (!authIsLoading && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authIsLoading, navigate, from]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const data = await authService.login(username, password);
      if (data && data.access_token) {
        await contextLogin(data.access_token, data.refresh_token);
        toast.success("¡Bienvenido!");
        navigate(from, { replace: true });
      } else {
        throw new Error("Respuesta inesperada del servidor.");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'Usuario o contraseña incorrectos.';
      toast.error(errorMessage);
      console.error("Error en el login:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (authIsLoading || isAuthenticated) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p>Cargando...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between"> {/* Cambiado a justify-between */}
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            App de Compensaciones
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Inicia sesión en tu cuenta
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-md sm:rounded-xl sm:px-10 border border-gray-200">
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Nombre de Usuario
                </label>
                <div className="mt-1">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marrs-green hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marrs-green disabled:opacity-50"
                >
                  {isLoading ? 'Ingresando...' : 'Ingresar'}
                </button>
              </div>
            </form>
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">¿No tienes cuenta?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marrs-green"
                >
                  Regístrate aquí
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pie de página agregado */}
      <footer className="py-4 text-center text-sm text-gray-500">
        Copyright © 2025 Gesem. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default LoginPage;