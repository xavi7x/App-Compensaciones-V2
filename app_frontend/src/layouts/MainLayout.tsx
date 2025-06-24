// src/layouts/MainLayout.tsx
import React, { useState } from 'react';
import { Link, Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

const MainLayout: React.FC = () => {
  const { user, logout } = useAuth(); // Obtener estado de autenticación y función de logout
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Estilos para los enlaces de navegación en la barra lateral
  const navLinkStyle = "flex items-center px-4 py-2.5 text-gray-300 hover:bg-teal-700 hover:text-white rounded-md transition-colors duration-200";
  const activeNavLinkStyle = "bg-teal-700 text-white"; // Estilo para el enlace activo

  // Componente que renderiza los enlaces para reutilizarlo en móvil y desktop
  const navigationLinks = (
    <nav className="flex-grow">
      {user && (
        <div className="flex flex-col space-y-2">
          <div>
            <NavLink to="/dashboard" className={({ isActive }) => `${navLinkStyle} ${isActive ? activeNavLinkStyle : ''}`}>
              Inicio
            </NavLink>
          </div>
          <div>
            <NavLink to="/clientes" className={({ isActive }) => `${navLinkStyle} ${isActive ? activeNavLinkStyle : ''}`}>
              Clientes
            </NavLink>
          </div>
          <div>
            <NavLink to="/vendedores" className={({ isActive }) => `${navLinkStyle} ${isActive ? activeNavLinkStyle : ''}`}>
              Vendedores
            </NavLink>
          </div>
          <div>
            <NavLink to="/facturacion" className={({ isActive }) => `${navLinkStyle} ${isActive ? activeNavLinkStyle : ''}`}>
              Facturación
            </NavLink>
          </div>
          <div>
            <NavLink to="/calculo-bonos" className={({ isActive }) => `${navLinkStyle} ${isActive ? activeNavLinkStyle : ''}`}>
              Calcular Bonos
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="relative min-h-screen md:flex">
      {/* Overlay para móvil */}
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="md:hidden fixed inset-0 bg-black opacity-30 z-20"></div>}

      {/* Barra lateral (Sidebar) */}
      <aside className={`bg-marrs-green text-white w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col z-30`}>
        {/* Logo */}
        <Link to="/" className="text-white text-2xl font-extrabold px-4 flex items-center space-x-2">
          {/* Aquí podrías poner un SVG o un ícono si lo tienes */}
          <span>App de Compensaciones</span>
        </Link>
        
        {/* Enlaces de Navegación */}
        {navigationLinks}

        {/* Sección inferior (Logout / Login) */}
        <div>
          {user ? (
            <button onClick={logout} className={`w-full ${navLinkStyle} bg-red-600/80 hover:bg-red-600`}>
              Cerrar Sesión
            </button>
          ) : (
            <NavLink to="/login" className={({ isActive }) => `${navLinkStyle} ${isActive ? activeNavLinkStyle : ''}`}>
              Login
            </NavLink>
          )}
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col">
        {/* Barra superior para móvil (solo contiene el botón de menú) */}
        <header className="md:hidden bg-marrs-green text-white shadow-lg flex justify-end items-center p-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
            <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>
        
        <main className="flex-grow container mx-auto px-6 py-8">
          <Outlet />
        </main>
        
        <footer className="bg-gray-800 text-white text-center p-4">
          <p>&copy; {new Date().getFullYear()} Gesem Consultora. Todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
