// src/layouts/MainLayout.tsx
import { Link, Outlet } from 'react-router-dom';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header/Navbar */}
      <header className="bg-marrs-green text-white shadow-md">
        <nav className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
            <Link to="/" className="text-xl font-semibold">App Compensaciones</Link>
            </div>
            <div><Link to="/" className="text-gray-300 hover:bg-marrs-green hover:text-white px-3 py-2 rounded-md text-sm font-medium">Inicio</Link>
            </div>
              <Link to="/vendedores" className="text-gray-300 hover:bg-marrs-green hover:text-white px-3 py-2 rounded-md text-sm font-medium">Vendedores</Link>
            <div>
              <div>
              <Link to="/clientes" className="text-gray-300 hover:bg-marrs-green hover:text-white px-3 py-2 rounded-md text-sm font-medium">Clientes</Link>
              </div>
              <Link to="/login" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-opacity-75 hover:bg-marrs-green">Login</Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Contenido Principal */}
      <main className="flex-grow container mx-auto px-6 py-8">
        <Outlet /> {/* ✅ Siempre usa Outlet para rutas anidadas */}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white text-center p-4">
        <p>&copy; {new Date().getFullYear()} Gesem Consultora. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};
export default MainLayout;