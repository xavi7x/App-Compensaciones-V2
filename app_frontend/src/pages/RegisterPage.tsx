// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { RegisterPayload } from '../types/user';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);
    try {
      await authService.register({ 
        email, 
        username, 
        password, 
        full_name: fullName 
      });
      setSuccessMessage('¡Registro exitoso! Tu cuenta está pendiente de aprobación.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error en el registro.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Crear una Cuenta
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
          {successMessage && <p className="text-sm text-green-600 bg-green-100 p-3 rounded-md">{successMessage}</p>}
          <div className="space-y-4">
            <div>
              <label htmlFor="full-name" className="sr-only">Nombre Completo</label>
              <input 
                id="full-name" 
                name="fullName" 
                type="text" 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marrs-green focus:border-marrs-green" 
                placeholder="Nombre Completo" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="username-register" className="sr-only">Usuario</label>
              <input 
                id="username-register" 
                name="username" 
                type="text" 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marrs-green focus:border-marrs-green" 
                placeholder="Nombre de Usuario" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Correo</label>
              <input 
                id="email-address" 
                name="email" 
                type="email" 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marrs-green focus:border-marrs-green" 
                placeholder="Correo Electrónico" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="password-register" className="sr-only">Contraseña</label>
              <input 
                id="password-register" 
                name="password" 
                type="password" 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marrs-green focus:border-marrs-green" 
                placeholder="Contraseña" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirmar</label>
              <input 
                id="confirm-password" 
                name="confirmPassword" 
                type="password" 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-marrs-green focus:border-marrs-green" 
                placeholder="Confirmar Contraseña" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isLoading || !!successMessage} 
            className="w-full py-2 px-4 bg-marrs-green text-white rounded-md hover:bg-opacity-80 disabled:opacity-50"
          >
            {isLoading ? 'Registrando...' : 'Registrar'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-marrs-green hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;