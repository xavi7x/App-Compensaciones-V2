// src/pages/DashboardPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, UserRole } from '../types/user';
import userService from '../services/userService';
import { toast } from 'react-toastify';

// --- COMPONENTE: Tarjeta de Perfil de Usuario ---
const UserProfileCard: React.FC<{ user: User }> = ({ user }) => (
  <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
    <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">Mi Perfil</h2>
    <div className="space-y-3 text-sm">
      <div className="flex justify-between py-1"><span className="font-medium text-gray-500">Nombre Completo:</span><span className="text-gray-900">{user.full_name}</span></div>
      <div className="flex justify-between py-1"><span className="font-medium text-gray-500">Nombre de Usuario:</span><span className="text-gray-900">{user.username}</span></div>
      <div className="flex justify-between py-1"><span className="font-medium text-gray-500">Email:</span><span className="text-gray-900">{user.email}</span></div>
      <div className="flex justify-between py-1"><span className="font-medium text-gray-500">Rol:</span><span className="font-semibold text-marrs-green uppercase">{user.role}</span></div>
      <div className="flex justify-between py-1"><span className="font-medium text-gray-500">Estado:</span><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">{user.approval_status}</span></div>
    </div>
  </div>
);

// --- COMPONENTE: Panel de Aprobación de Cuentas ---
const AdminApprovalPanel: React.FC = () => {
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const users = await userService.getPendingApprovalUsers();
      setPendingUsers(users);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || "Error al cargar usuarios pendientes.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPendingUsers(); }, [fetchPendingUsers]);

  const handleApprove = async (userId: number) => { /* ... (como en la versión anterior) ... */ };
  const handleReject = async (userId: number) => { /* ... (como en la versión anterior) ... */ };

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 mt-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">Panel de Aprobación de Cuentas</h2>
      {isLoading && <p className="text-gray-500">Cargando cuentas pendientes...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!isLoading && pendingUsers.length === 0 && <p className="text-gray-500">No hay cuentas pendientes de aprobación.</p>}
      {pendingUsers.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {pendingUsers.map(pendingUser => (
            <li key={pendingUser.id} className="py-4 flex flex-wrap items-center justify-between">
              <div className="flex-grow">
                <p className="text-sm font-medium text-gray-900">{pendingUser.full_name}</p>
                <p className="text-sm text-gray-500">{pendingUser.email} (username: {pendingUser.username})</p>
              </div>
              <div className="flex-shrink-0 mt-2 sm:mt-0 sm:ml-4 space-x-2">
                <button onClick={() => handleApprove(pendingUser.id)} className="px-3 py-1 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700">Aprobar</button>
                <button onClick={() => handleReject(pendingUser.id)} className="px-3 py-1 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">Rechazar</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// --- NUEVO COMPONENTE: Panel de Gestión de Todos los Usuarios ---
const AdminUserManagementPanel: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAllUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedUsers = await userService.getAllUsers();
            setUsers(fetchedUsers);
        } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Error al cargar la lista de usuarios.";
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllUsers(); }, [fetchAllUsers]);

    const handleRoleChange = async (userId: number, newRole: UserRole) => {
        try {
            await userService.updateUser(userId, { role: newRole });
            toast.success("Rol de usuario actualizado.");
            fetchAllUsers(); // Refrescar la lista para mostrar el cambio
        } catch (err: any) {
            toast.error(err.response?.data?.detail || "No se pudo actualizar el rol.");
        }
    };

    return (
        <div className="bg-white shadow-lg rounded-xl p-6 mt-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-4">Gestión de Usuarios</h2>
            {isLoading && <p>Cargando todos los usuarios...</p>}
            {error && <p className="text-red-500">{error}</p>}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol Actual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cambiar Rol</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.full_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 uppercase">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                        className="block w-full pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm rounded-md"
                                    >
                                        <option value={UserRole.USER}>Usuario</option>
                                        <option value={UserRole.ADMIN}>Administrador</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center p-8">Cargando datos del usuario...</div>;
  }

  if (!user) {
    return <div className="text-center p-8 text-red-500">Error: No se pudieron cargar los datos del usuario. Por favor, intenta iniciar sesión de nuevo.</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Bienvenido, {user.full_name || user.username}!</h1>

      <UserProfileCard user={user} />

      {user.role === UserRole.ADMIN && (
        <>
          <AdminApprovalPanel />
          <AdminUserManagementPanel />
        </>
      )}
    </div>
  );
};

export default DashboardPage;