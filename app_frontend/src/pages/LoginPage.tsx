// src/pages/LoginPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga para el submit del formulario
  const [requiresTotp, setRequiresTotp] = useState(false);
  const { login: contextLogin, isAuthenticated, isLoading: authIsLoading } = useAuth(); // isLoading del contexto
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    // Si el usuario ya está autenticado (y el contexto no está cargando su estado inicial),
    // redirige a la página 'from' o al dashboard.
    if (isAuthenticated && !authIsLoading) {
      console.log("LoginPage: Usuario ya autenticado, redirigiendo a:", from);
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authIsLoading, navigate, from]); // <--- Dependencias actualizadas

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true); // Inicia la carga local del formulario
    setRequiresTotp(false); // Resetea la necesidad de TOTP en cada intento
    console.log("LoginPage: Intentando login con:", { username, password, totpCode: requiresTotp ? totpCode : undefined });
    try {
      const data = await authService.login(username, password, requiresTotp ? totpCode : undefined);
      console.log("LoginPage: Respuesta del servicio de login (data):", data);
  
      if (data && data.access_token) {
        console.log("LoginPage: Access token recibido:", data.access_token);
        await contextLogin(data.access_token, data.refresh_token); // Llama al login del AuthContext
        console.log("LoginPage: Context login llamado. La navegación debería ocurrir por el useEffect o la lógica del AuthContext.");
        // La navegación a 'from' después de un login exitoso es manejada por el useEffect de arriba
        // o podría ser manejada dentro de contextLogin si esa fuera la lógica preferida.
        // Por ahora, el useEffect se encargará de ello cuando isAuthenticated cambie.
      } else {
        console.error("LoginPage: La respuesta del login no contenía access_token:", data);
        setError("Respuesta inesperada del servidor durante el login.");
      }
    } catch (err: any) {
      console.error("LoginPage: Error capturado en el submit:", err);
      const errorMessage = err.response?.data?.detail || 'Error al iniciar sesión.';
      setError(errorMessage);
      if (errorMessage.toLowerCase().includes("totp code required")) {
        console.log("LoginPage: Se requiere código TOTP.");
        setRequiresTotp(true);
      }
    } finally {
      setIsLoading(false); // Finaliza la carga local del formulario
    }
  };

  // Muestra "Cargando..." si el AuthContext está verificando el estado inicial
  // O si ya está autenticado y no hay error local ni carga local (esperando la redirección del useEffect)
  if (authIsLoading || (isAuthenticated && !error && !isLoading)) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100"><p>Cargando...</p></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="username-address" className="sr-only">Usuario</label>
              <input id="username-address" name="username" type="text" autoComplete="username" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm" placeholder="Nombre de usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div className="-mt-px">
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 ${requiresTotp ? '' : 'rounded-b-md'} focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm`} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {requiresTotp && (
              <div className="-mt-px">
                <label htmlFor="totp-code" className="sr-only">Código 2FA</label>
                <input id="totp-code" name="totpCode" type="text" autoComplete="one-time-code" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm" placeholder="Código de autenticación (6 dígitos)" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} />
              </div>
            )}
          </div>
          <div>
            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-marrs-green hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marrs-green disabled:opacity-50">
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </div>
        </form>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-medium text-marrs-green hover:text-opacity-80">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};
export default LoginPage;