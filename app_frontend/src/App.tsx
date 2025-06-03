// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import axios from "axios";

import HomePage from './pages/HomePage'; //
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import VendedoresPage from './pages/VendedoresPage'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { ToastContainer } from "react-toastify";

// Configura Axios globalmente (opcional)
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  return (
    <Router>
      <ToastContainer // Contenedor para las notificaciones toast
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored" // O "light" o "dark"
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/vendedores" element={<VendedoresPage />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
export default App;