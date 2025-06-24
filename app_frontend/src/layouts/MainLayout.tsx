// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { Link, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Componente de ícono genérico para mantener el alineamiento
const IconPlaceholder = () => <div className="w-6 h-6 mr-3"></div>;

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navLinkBaseStyle = "flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200";
  const navLinkInactiveStyle = "text-gray-300 hover:bg-teal-700 hover:text-white";
  const activeNavLinkStyle = "bg-white text-marrs-green shadow-sm";

  const navigationLinks = (
    <nav className="flex-grow px-4">
      <NavLink to="/dashboard" className={({ isActive }) => `${navLinkBaseStyle} ${isActive ? activeNavLinkStyle : navLinkInactiveStyle}`}>
        <IconPlaceholder /> Inicio
      </NavLink>
      <NavLink to="/clientes" className={({ isActive }) => `${navLinkBaseStyle} ${isActive ? activeNavLinkStyle : navLinkInactiveStyle} mt-2`}>
        <IconPlaceholder /> Clientes
      </NavLink>
      <NavLink to="/vendedores" className={({ isActive }) => `${navLinkBaseStyle} ${isActive ? activeNavLinkStyle : ''} mt-2`}>
        <IconPlaceholder /> Vendedores
      </NavLink>
      <NavLink to="/facturacion" className={({ isActive }) => `${navLinkBaseStyle} ${isActive ? activeNavLinkStyle : ''} mt-2`}>
        <IconPlaceholder /> Facturación
      </NavLink>
      <NavLink to="/calculo-bonos" className={({ isActive }) => `${navLinkBaseStyle} ${isActive ? activeNavLinkStyle : ''} mt-2`}>
        <IconPlaceholder /> Calcular Bonos
      </NavLink>
      <NavLink to="/reportes" className={({ isActive }) => `${navLinkBaseStyle} ${isActive ? activeNavLinkStyle : ''} mt-2`}>
        <IconPlaceholder /> Reportes
      </NavLink>
    </nav>
  );

  return (
    <div className="relative min-h-screen md:flex bg-gray-100 font-sans">
      {/* Overlay para móvil */}
      {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="md:hidden fixed inset-0 bg-black opacity-50 z-20"></div>}

      {/* Barra lateral (Sidebar) */}
      <aside className={`bg-marrs-green text-white w-64 space-y-6 py-7 absolute inset-y-0 left-0 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col z-30`}>
        <Link to="/" className="text-white text-xl font-bold px-6 flex items-center space-x-2">
          <span>App Compensaciones</span>
        </Link>

        {/* Solo muestra los enlaces si el usuario está logueado */}
        {user && navigationLinks}

        {/* Perfil de Usuario y Logout */}
        <div className="px-4 mt-auto"> {/* mt-auto empuja esto al fondo */}
          {user ? (
            <div className="text-center p-4 border-t border-teal-700">
              <p className="text-sm font-semibold">{user.full_name || user.username}</p>
              <p className="text-xs text-teal-200">{user.email}</p>
              <button onClick={logout} className="mt-4 w-full px-4 py-2 text-sm font-medium bg-teal-700 hover:bg-red-600 rounded-lg transition-colors duration-200">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <NavLink to="/login" className={({ isActive }) => `${navLinkBaseStyle} ${isActive ? activeNavLinkStyle : navLinkInactiveStyle}`}>
              Login
            </NavLink>
          )}
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Barra superior para móvil (solo contiene el botón de menú) */}
        <header className="md:hidden bg-white shadow-md flex justify-between items-center p-4 sticky top-0 z-10">
          <span className="text-xl font-bold text-marrs-green">App Compensaciones</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md text-gray-500 hover:text-marrs-green hover:bg-gray-100 focus:outline-none">
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="flex-grow p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;