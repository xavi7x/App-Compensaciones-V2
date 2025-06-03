// src/components/vendedores/VendedorFormModal.tsx
import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Vendedor, VendedorCreate, VendedorUpdate, Cliente } from '../../types/vendedor'; // Ajusta la ruta y asegúrate que Cliente esté aquí o importado por separado si es necesario para VendedorClienteAsignacion
import vendedorService from '../../services/vendedorService'; // Ajusta la ruta
import { toast } from 'react-toastify';
import { validarRutChileno } from '../../utils/validationUtils'; // Asume que tienes esta utilidad
import VendedorClienteAsignacion from './VendedorClienteAsignacion'; // <--- IMPORTACIÓN AÑADIDA

// Esquema de Zod para la validación del formulario de vendedor
const vendedorSchema = z.object({
  nombre_completo: z.string().min(3, "El nombre completo es requerido y debe tener al menos 3 caracteres.").max(255),
  rut: z.string().refine(validarRutChileno, "RUT inválido. Formato: XXXXXXXX-X (sin puntos, con guion)."),
  sueldo_base: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val.replace(/\./g, '').replace(',', '.')) : val),
    z.number({ invalid_type_error: "El sueldo base debe ser un número." }).min(0, "El sueldo base no puede ser negativo.")
  ),
});
export type VendedorFormData = z.infer<typeof vendedorSchema>;

interface VendedorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  vendedorToEdit?: Vendedor | null;
  // Si VendedorClienteAsignacion necesita la lista de todos los clientes,
  // podrías cargarla en VendedoresPage y pasarla aquí, o VendedorClienteAsignacion la carga internamente.
  // Ejemplo: todosLosClientes?: Cliente[];
}

const VendedorFormModal: React.FC<VendedorFormModalProps> = ({
  isOpen,
  onClose,
  onSaveSuccess,
  vendedorToEdit,
  // todosLosClientes, // Descomenta si decides pasar la lista de clientes como prop
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<VendedorFormData>({
    resolver: zodResolver(vendedorSchema),
    defaultValues: {
      nombre_completo: '',
      rut: '',
      sueldo_base: 0,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (vendedorToEdit) {
        setValue('nombre_completo', vendedorToEdit.nombre_completo);
        setValue('rut', vendedorToEdit.rut);
        setValue('sueldo_base', vendedorToEdit.sueldo_base);
      } else {
        reset({ // Asegúrate de resetear a los valores por defecto o vacíos
          nombre_completo: '',
          rut: '',
          sueldo_base: 0, // O undefined si el campo no es numérico por defecto y el schema lo maneja
        });
      }
    }
  }, [isOpen, vendedorToEdit, setValue, reset]);

  if (!isOpen) return null;

  const processSubmit: SubmitHandler<VendedorFormData> = async (data) => {
    try {
      if (vendedorToEdit && vendedorToEdit.id) {
        // Para VendedorUpdate, solo enviamos los campos que pueden cambiar del formulario principal
        const updatePayload: VendedorUpdate = {
            nombre_completo: data.nombre_completo,
            // El RUT generalmente no se actualiza o requiere lógica especial.
            // Si el RUT es parte de VendedorUpdate y puede cambiar, inclúyelo.
            // rut: data.rut, 
            sueldo_base: data.sueldo_base,
        };
        await vendedorService.updateVendedor(vendedorToEdit.id, updatePayload);
        toast.success('Datos básicos del vendedor actualizados exitosamente!');
        // onSaveSuccess se llamará también desde VendedorClienteAsignacion si las asignaciones cambian.
        // Si solo se guardan datos básicos y no hay componente de asignación o no hubo cambios allí,
        // puedes llamar onSaveSuccess aquí. Sin embargo, es más robusto que VendedorClienteAsignacion
        // también lo llame para asegurar que la UI se refresque tras cambios en asignaciones.
        // Por ahora, si VendedorClienteAsignacion llama a onSaveSuccess, esta llamada podría ser redundante
        // o incluso cerrar el modal antes de que el usuario termine con las asignaciones.
        // Considera un botón "Guardar Cambios de Asignaciones" separado o un guardado más explícito.
        // Por simplicidad, si onAsignacionesUpdated en VendedorClienteAsignacion llama a onSaveSuccess,
        // esta llamada aquí podría no ser necesaria si el usuario actualizó asignaciones.
        // Si no hay cambios en asignaciones, esta llamada es necesaria.
        // Una solución es que onSaveSuccess de VendedorFormModal solo se llame al final.
        // O que el botón "Actualizar Vendedor" solo guarde datos básicos y las asignaciones se guarden
        // interactivamente dentro de VendedorClienteAsignacion.

        // Para el flujo actual donde VendedorClienteAsignacion llama a onSaveSuccess (via onAsignacionesUpdated):
        // Si solo se actualizan datos básicos y no se toca VendedorClienteAsignacion, necesitamos llamar a onSaveSuccess.
        // Si se actualizan datos básicos Y LUEGO asignaciones, onSaveSuccess se llamará dos veces.
        // Esto es generalmente inofensivo (cierra modal, refresca lista).
        onSaveSuccess();

      } else {
        // Para VendedorCreate, el backend podría esperar 'clientes_asignados' o 'asignaciones'
        // El tipo VendedorCreate en tu types/vendedor.ts debe reflejar esto.
        // Aquí asumimos que VendedorCreate puede tomar los datos del formulario.
        // Las asignaciones iniciales al crear un vendedor no se manejan en este formulario básico.
        const createPayload: VendedorCreate = { 
            ...data,
            // Si tu VendedorCreate requiere 'clientes_asignados' iniciales (usualmente opcional y vacío):
            clientes_asignados: [] 
        };
        await vendedorService.createVendedor(createPayload);
        toast.success('Vendedor creado exitosamente!');
        onSaveSuccess();
      }
      // onSaveSuccess(); // Movido dentro de los bloques if/else para mayor claridad
    } catch (err: any) {
      console.error("Error guardando vendedor:", err);
      const errorMsg = err.response?.data?.detail || 'Error al guardar el vendedor.';
      toast.error(errorMsg);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full z-50 flex justify-center items-start pt-10 p-4"> {/* items-start pt-10 para más espacio arriba */}
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-lg mx-auto"> {/* max-w-lg para un poco más de ancho */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {vendedorToEdit ? 'Editar Vendedor' : 'Nuevo Vendedor'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
          <div>
            <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">Nombre Completo <span className="text-red-500">*</span></label>
            <input id="nombre_completo" type="text" {...register('nombre_completo')}
              className={`mt-1 block w-full px-3 py-2 border ${errors.nombre_completo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm`} />
            {errors.nombre_completo && <p className="mt-1 text-xs text-red-500">{errors.nombre_completo.message}</p>}
          </div>
          <div>
            <label htmlFor="rut" className="block text-sm font-medium text-gray-700">RUT <span className="text-red-500">*</span></label>
            <input id="rut" type="text" {...register('rut')} disabled={!!vendedorToEdit}
              className={`mt-1 block w-full px-3 py-2 border ${errors.rut ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm ${!!vendedorToEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Ej: 12345678-9" />
            {vendedorToEdit && <p className="text-xs text-gray-500 mt-1">El RUT no se puede modificar al editar.</p>}
            {errors.rut && <p className="mt-1 text-xs text-red-500">{errors.rut.message}</p>}
          </div>
          <div>
            <label htmlFor="sueldo_base" className="block text-sm font-medium text-gray-700">Sueldo Base <span className="text-red-500">*</span></label>
            <input id="sueldo_base" type="text" {...register('sueldo_base')} // type="text" para permitir comas/puntos, el schema lo parsea
              className={`mt-1 block w-full px-3 py-2 border ${errors.sueldo_base ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-marrs-green focus:border-marrs-green sm:text-sm`}
              placeholder="Ej: 500000" />
            {errors.sueldo_base && <p className="mt-1 text-xs text-red-500">{errors.sueldo_base.message}</p>}
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm text-white bg-marrs-green rounded-md hover:bg-opacity-80 disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : (vendedorToEdit ? 'Actualizar Datos Básicos' : 'Crear Vendedor')}
            </button>
          </div>
        </form>

        {/* Sección para asignar clientes, solo visible si estamos editando un vendedor existente */}
        {vendedorToEdit && vendedorToEdit.id !== undefined && (
          <VendedorClienteAsignacion 
            vendedor={vendedorToEdit} 
            onAsignacionesUpdated={() => {
              // Esta callback se llama desde VendedorClienteAsignacion después de una operación de asignación exitosa.
              // Queremos que la página principal (VendedoresPage) recargue la lista de vendedores
              // para reflejar los cambios en las asignaciones (que se muestran en la tabla).
              toast.info("Lista de asignaciones actualizada. Refrescando datos...");
              onSaveSuccess(); // Esto llama a handleVendedorSaveSuccess en VendedoresPage, que cierra el modal y hace fetchVendedores.
            }}
            // todosLosClientes={todosLosClientes} // Pasa la lista de todos los clientes si la cargas en VendedoresPage y la pasas a este modal
          />
        )}
      </div>
    </div>
  );
};
export default VendedorFormModal;
