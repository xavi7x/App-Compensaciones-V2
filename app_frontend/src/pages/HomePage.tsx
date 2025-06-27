// src/pages/HomePage.tsx
import { FiCheckCircle, FiClock, FiEye, FiSettings } from 'react-icons/fi';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div className="py-12 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
              Bienvenido a la App de Compensaciones
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Solución integral y transparente para la gestión de comisiones
            </p>
          </div>

          <div className="mt-16 bg-white p-8 shadow-md sm:rounded-xl border border-gray-200">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Beneficio 1 */}
              <div className="bg-marrs-green/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <FiCheckCircle className="text-2xl text-marrs-green mr-3" />
                  <h3 className="text-lg font-medium text-marrs-green">Precisión Garantizada</h3>
                </div>
                <p className="mt-2 text-gray-600 ml-9">
                  Elimina los errores humanos y asegura cálculos exactos en todo momento.
                </p>
              </div>

              {/* Beneficio 2 */}
              <div className="bg-marrs-green/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <FiClock className="text-2xl text-marrs-green mr-3" />
                  <h3 className="text-lg font-medium text-marrs-green">Ahorro de Tiempo</h3>
                </div>
                <p className="mt-2 text-gray-600 ml-9">
                  Automatiza procesos complejos y libera a tu equipo administrativo.
                </p>
              </div>

              {/* Beneficio 3 */}
              <div className="bg-marrs-green/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <FiEye className="text-2xl text-marrs-green mr-3" />
                  <h3 className="text-lg font-medium text-marrs-green">Transparencia Total</h3>
                </div>
                <p className="mt-2 text-gray-600 ml-9">
                  Ofrece a tus vendedores una visión clara y en tiempo real de sus ganancias y objetivos.
                </p>
              </div>

              {/* Beneficio 4 */}
              <div className="bg-marrs-green/10 p-6 rounded-lg">
                <div className="flex items-center">
                  <FiSettings className="text-2xl text-marrs-green mr-3" />
                  <h3 className="text-lg font-medium text-marrs-green">Flexibilidad Absoluta</h3>
                </div>
                <p className="mt-2 text-gray-600 ml-9">
                  Configura fácilmente cualquier tipo de bono variable, sin importar su complejidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-4 text-center text-sm text-gray-500">
        Copyright © 2025 Gesem. Todos los derechos reservados.
      </footer>
    </div>
  );
};

export default HomePage;