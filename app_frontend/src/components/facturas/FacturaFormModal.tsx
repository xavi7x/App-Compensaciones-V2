// src/components/facturas/FacturaFormModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import { toast } from 'react-toastify';

import { Factura, FacturaCreate, FacturaUpdate } from '../../types/factura';
import { VendedorSimple } from '../../types/vendedor';
import { ClienteSimple } from '../../types/cliente';

import facturaService from '../../services/facturaService';
import vendedorService from '../../services/vendedorService';

// Schema de validación con Zod
const facturaSchema = z.object({
  numero_orden: z.string().min(1, "El número de orden es requerido"),
  numero_caso: z.string().optional(),
  honorarios_generados: z.preprocess(
    val => parseFloat(String(val).replace(',', '.')), 
    z.number({ invalid_type_error: "Debe ser un número" }).min(0, "Los honorarios no pueden ser negativos")
  ),
  gastos_generados: z.preprocess(
    val => parseFloat(String(val).replace(',', '.')), 
    z.number({ invalid_type_error: "Debe ser un número" }).min(0, "Los gastos no pueden ser negativos")
  ),
  fecha_emision: z.string().min(1, "La fecha es requerida"),
  vendedor_id: z.number({ required_error: "Debe seleccionar un vendedor" }).min(1, "Debe seleccionar un vendedor"),
  cliente_id: z.number({ required_error: "Debe seleccionar un cliente" }).min(1, "Debe seleccionar un cliente"),
});

// Extraemos el tipo del schema
type FacturaFormData = z.infer<typeof facturaSchema>;

// Props que recibe el componente
interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  facturaToEdit?: Factura | null;
}

const FacturaFormModal: React.FC<FacturaFormModalProps> = ({ isOpen, onClose, onSave, facturaToEdit }) => {
  const isEditMode = !!facturaToEdit;

  const [vendedores, setVendedores] = useState<VendedorSimple[]>([]);
  const [clientesAsignados, setClientesAsignados] = useState<ClienteSimple[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClientesLoading, setIsClientesLoading] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FacturaFormData>({
    resolver: zodResolver(facturaSchema),
  });

  const selectedVendedorId = watch('vendedor_id');

  // Carga de datos inicial al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // FIX: Cargar la lista de vendedores siempre que se abra el modal.
      setIsLoading(true);
      vendedorService.getAllVendedoresSimple()
        .then(data => setVendedores(data || []))
        .catch(() => toast.error("No se pudo cargar la lista de vendedores."))
        .finally(() => setIsLoading(false));

      // Si estamos en modo edición, llenamos el formulario con los datos existentes.
      if (isEditMode && facturaToEdit) {
        reset({
          numero_orden: facturaToEdit.numero_orden || '',
          numero_caso: facturaToEdit.numero_caso || '',
          honorarios_generados: facturaToEdit.honorarios_generados,
          gastos_generados: facturaToEdit.gastos_generados,
          fecha_emision: new Date(facturaToEdit.fecha_emision).toISOString().split('T')[0],
          vendedor_id: facturaToEdit.vendedor_id,
          cliente_id: facturaToEdit.cliente_id,
        });
      } else {
        // Si estamos en modo creación, reseteamos a valores por defecto.
        reset({
          numero_orden: '',
          numero_caso: '',
          honorarios_generados: 0,
          gastos_generados: 0,
          fecha_emision: new Date().toISOString().split('T')[0],
          vendedor_id: undefined,
          cliente_id: undefined,
        });
      }
    }
  }, [isOpen, isEditMode, facturaToEdit, reset]);

  // Efecto para cargar los clientes asignados cuando se selecciona un vendedor
  useEffect(() => {
    // Limpiar selección de cliente anterior
    setValue('cliente_id', undefined, { shouldValidate: true });
    setClientesAsignados([]); 

    if (!selectedVendedorId) {
      return;
    }

    const fetchClientesAsignados = async () => {
      setIsClientesLoading(true);
      try {
        const clientesRes = await vendedorService.getAssignedClients(selectedVendedorId);
        setClientesAsignados(clientesRes || []); 
      } catch (error) {
        toast.error("Error al cargar los clientes de este vendedor.");
      } finally {
        setIsClientesLoading(false);
      }
    };
    fetchClientesAsignados();
  }, [selectedVendedorId, setValue]);

  // Función que se ejecuta al enviar el formulario
  const processSubmit: SubmitHandler<FacturaFormData> = async (data) => {
    setIsLoading(true);
    try {
      if (isEditMode && facturaToEdit) {
        // Lógica de Actualización
        const updateData: FacturaUpdate = { ...data, numero_caso: data.numero_caso || undefined };
        await facturaService.updateFactura(facturaToEdit.id, updateData);
        toast.success("Factura actualizada exitosamente");
      } else {
        // Lógica de Creación
        // Aseguramos que el tipo coincida con lo que espera el servicio
        const createData: FacturaCreate = { ...data, numero_caso: data.numero_caso || undefined };
        await facturaService.createFactura(createData);
        toast.success("Factura creada exitosamente");
      }
      onSave(); // Llama a la función onSave para refrescar la tabla
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al guardar la factura");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  // Formatear opciones para react-select
  const vendedorOptions = vendedores.map(v => ({ value: v.id, label: v.nombre_completo }));
  const clienteOptions = clientesAsignados.map(c => ({ value: c.id, label: c.razon_social }));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-full">
        <h2 className="text-xl font-semibold mb-4">{isEditMode ? 'Editar Factura' : 'Carga Manual de Factura'}</h2>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Vendedor *</label>
              <Controller
                name="vendedor_id"
                control={control}
                render={({ field }) => (
                  <Select
                    options={vendedorOptions}
                    isLoading={isLoading && !vendedores.length}
                    placeholder="Seleccionar vendedor..."
                    onChange={(option) => field.onChange(option?.value)}
                    value={vendedorOptions.find(opt => opt.value === field.value)}
                    isClearable
                  />
                )}
              />
              {errors.vendedor_id && <p className="text-red-500 text-xs mt-1">{errors.vendedor_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cliente *</label>
              <Controller
                name="cliente_id"
                control={control}
                render={({ field }) => (
                  <Select
                    options={clienteOptions}
                    isLoading={isClientesLoading}
                    placeholder={!selectedVendedorId ? "Seleccione un vendedor..." : "Seleccionar cliente..."}
                    isDisabled={!selectedVendedorId || isClientesLoading}
                    onChange={(option) => field.onChange(option?.value)}
                    value={clienteOptions.find(opt => opt.value === field.value)}
                    isClearable
                  />
                )}
              />
              {errors.cliente_id && <p className="text-red-500 text-xs mt-1">{errors.cliente_id.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">N° Factura/Orden *</label>
            <Controller
              name="numero_orden"
              control={control}
              render={({ field }) => <input {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-marrs-green focus:border-marrs-green" />}
            />
            {errors.numero_orden && <p className="text-red-500 text-xs mt-1">{errors.numero_orden.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Honorarios Generados *</label>
              <Controller
                name="honorarios_generados"
                control={control}
                render={({ field }) => <input type="number" step="0.01" {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-marrs-green focus:border-marrs-green" />}
              />
              {errors.honorarios_generados && <p className="text-red-500 text-xs mt-1">{errors.honorarios_generados.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gastos Generados *</label>
              <Controller
                name="gastos_generados"
                control={control}
                render={({ field }) => <input type="number" step="0.01" {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-marrs-green focus:border-marrs-green" />}
              />
              {errors.gastos_generados && <p className="text-red-500 text-xs mt-1">{errors.gastos_generados.message}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700">Fecha Emisión *</label>
                <Controller
                    name="fecha_emision"
                    control={control}
                    render={({ field }) => <input type="date" {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-marrs-green focus:border-marrs-green" />}
                />
                {errors.fecha_emision && <p className="text-red-500 text-xs mt-1">{errors.fecha_emision.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">N° Caso (Opcional)</label>
              <Controller
                name="numero_caso"
                control={control}
                render={({ field }) => <input {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-marrs-green focus:border-marrs-green" />}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
            <button type="submit" disabled={isLoading || isClientesLoading} className="px-4 py-2 bg-marrs-green text-white rounded-md hover:bg-opacity-80 disabled:opacity-50">
              {isLoading || isClientesLoading ? "Guardando..." : (isEditMode ? "Actualizar Factura" : "Guardar Factura")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacturaFormModal;