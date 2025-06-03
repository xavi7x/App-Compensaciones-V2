// src/components/clientes/ClienteFormModal.tsx
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Cliente, ClienteFormData, clienteSchema } from '../../types/cliente'; // Importa ClienteFormData y clienteSchema
import clienteService from '../../services/clienteService';
import { toast } from 'react-toastify'; // Para notificaciones

interface ClienteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void; // Cambiado para reflejar solo éxito y refrescar lista
  clienteToEdit?: Cliente | null;
}

const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  clienteToEdit,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue, // Para setear valores al editar
  } = useForm<ClienteFormData>({
    resolver: zodResolver(clienteSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (clienteToEdit) {
        // Poblar formulario con datos del cliente a editar
        setValue('razon_social', clienteToEdit.razon_social);
        setValue('rut', clienteToEdit.rut);
        setValue('ramo', clienteToEdit.ramo || '');
        setValue('ubicacion', clienteToEdit.ubicacion || '');
      } else {
        // Resetear formulario para nuevo cliente
        reset({
          razon_social: '',
          rut: '',
          ramo: '',
          ubicacion: '',
        });
      }
    }
  }, [isOpen, clienteToEdit, setValue, reset]);

  if (!isOpen) {
    return null;
  }

  const processSubmit: SubmitHandler<ClienteFormData> = async (data) => {
    try {
      if (clienteToEdit && clienteToEdit.id) {
        await clienteService.updateCliente(clienteToEdit.id, data);
        toast.success('Cliente actualizado exitosamente!');
      } else {
        await clienteService.createCliente(data);
        toast.success('Cliente creado exitosamente!');
      }
      onSaveSuccess(); // Llama al callback para refrescar la lista y cerrar
    } catch (err: any) {
      console.error("Error guardando cliente:", err);
      const errorMsg = err.response?.data?.detail || 'Error al guardar el cliente.';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-center p-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {clienteToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
          <div>
            <label htmlFor="razon_social" className="block text-sm font-medium text-gray-700">
              Razón Social <span className="text-red-500">*</span>
            </label>
            <input
              id="razon_social"
              type="text"
              {...register('razon_social')}
              className={`mt-1 block w-full px-3 py-2 border ${errors.razon_social ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm`}
            />
            {errors.razon_social && <p className="mt-1 text-xs text-red-500">{errors.razon_social.message}</p>}
          </div>
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700">
              RUT <span className="text-red-500">*</span>
            </label>
            <input
              id="rut"
              type="text"
              {...register('rut')}
              disabled={!!clienteToEdit} // No permitir editar RUT
              className={`mt-1 block w-full px-3 py-2 border ${errors.rut ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm ${!!clienteToEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Ej: 12345678-9"
            />
            {clienteToEdit && <p className="text-xs text-gray-500 mt-1">El RUT no se puede modificar al editar.</p>}
            {errors.rut && <p className="mt-1 text-xs text-red-500">{errors.rut.message}</p>}
          </div>
          <div>
            <label htmlFor="ramo" className="block text-sm font-medium text-gray-700">Ramo</label>
            <input
              id="ramo"
              type="text"
              {...register('ramo')}
              className={`mt-1 block w-full px-3 py-2 border ${errors.ramo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm`}
            />
            {errors.ramo && <p className="mt-1 text-xs text-red-500">{errors.ramo.message}</p>}
          </div>
          <div>
            <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-700">Ubicación</label>
            <input
              id="ubicacion"
              type="text"
              {...register('ubicacion')}
              className={`mt-1 block w-full px-3 py-2 border ${errors.ubicacion ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm`}
            />
            {errors.ubicacion && <p className="mt-1 text-xs text-red-500">{errors.ubicacion.message}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-marrs-green rounded-md hover:bg-opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marrs-green disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : (clienteToEdit ? 'Actualizar Cliente' : 'Crear Cliente')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteFormModal;