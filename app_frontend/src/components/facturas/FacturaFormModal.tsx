// src/components/facturas/FacturaFormModal.tsx
import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import { toast } from 'react-toastify';

import { FacturaCreate } from '../../types/factura';
import { Vendedor } from '../../types/vendedor';
import { Cliente } from '../../types/cliente';

import facturaService from '../../services/facturaService';
import vendedorService from '../../services/vendedorService';
import clienteService from '../../services/clienteService';

// Esquema de validación con Zod
const facturaSchema = z.object({
  numero_orden: z.string().min(1, "El número de orden es requerido."),
  numero_caso: z.string().optional(),
  honorarios_generados: z.preprocess(val => parseFloat(String(val).replace(',', '.')), z.number().min(0, "Los honorarios no pueden ser negativos.")),
  gastos_generados: z.preprocess(val => parseFloat(String(val).replace(',', '.')), z.number().min(0, "Los gastos no pueden ser negativos.")),
  fecha_venta: z.string().min(1, "La fecha de venta es requerida."),
  vendedor_id: z.number().min(1, "Debe seleccionar un vendedor."),
  cliente_id: z.number().min(1, "Debe seleccionar un cliente."),
});

type FacturaFormData = z.infer<typeof facturaSchema>;

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const FacturaFormModal: React.FC<FacturaFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FacturaFormData>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      fecha_venta: new Date().toISOString().split('T')[0], // Fecha de hoy por defecto
    }
  });
  
  // Cargar vendedores y clientes cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          const [vendedoresRes, clientesRes] = await Promise.all([
            vendedorService.getAllVendedoresSimple(),
            clienteService.getAllClientesSimple(),
          ]);
          setVendedores(vendedoresRes);
          setClientes(clientesRes);
        } catch (error) {
          toast.error("Error al cargar vendedores o clientes.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      reset(); // Limpiar el formulario cuando se cierra
    }
  }, [isOpen, reset]);

  const processSubmit: SubmitHandler<FacturaFormData> = async (data) => {
    setIsLoading(true);
    try {
      const facturaData: FacturaCreate = {
        ...data,
        numero_caso: data.numero_caso || undefined,
      };
      await facturaService.createFactura(facturaData);
      toast.success("Factura creada exitosamente.");
      onSave(); // Llama a la función onSave (que refrescará la lista y cerrará el modal)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al crear la factura.");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;

  // Opciones para los selectores
  const vendedorOptions = vendedores.map(v => ({ value: v.id, label: `${v.nombre_completo} (${v.rut})` }));
  const clienteOptions = clientes.map(c => ({ value: c.id, label: `${c.razon_social} (${c.rut})` }));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Carga Manual de Factura</h2>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-4">
            {/* Vendedor y Cliente en una fila */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Vendedor</label>
                <Controller
                  name="vendedor_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={vendedorOptions}
                      isLoading={isLoading}
                      placeholder="Buscar y seleccionar vendedor..."
                      onChange={option => field.onChange(option?.value)}
                      isClearable
                    />
                  )}
                />
                {errors.vendedor_id && <p className="text-red-500 text-xs mt-1">{errors.vendedor_id.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cliente</label>
                <Controller
                  name="cliente_id"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={clienteOptions}
                      isLoading={isLoading}
                      placeholder="Buscar y seleccionar cliente..."
                      onChange={option => field.onChange(option?.value)}
                      isClearable
                    />
                  )}
                />
                {errors.cliente_id && <p className="text-red-500 text-xs mt-1">{errors.cliente_id.message}</p>}
              </div>
            </div>

            {/* Resto de los campos */}
            <div>
              <label className="block text-sm font-medium text-gray-700">N° Factura / Orden</label>
              <Controller name="numero_orden" control={control} render={({ field }) => <input {...field} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>} />
              {errors.numero_orden && <p className="text-red-500 text-xs mt-1">{errors.numero_orden.message}</p>}
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Honorarios Generados</label>
                  <Controller name="honorarios_generados" control={control} render={({ field }) => <input type="number" step="0.01" {...field} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>} />
                  {errors.honorarios_generados && <p className="text-red-500 text-xs mt-1">{errors.honorarios_generados.message}</p>}
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">Gastos Generados</label>
                  <Controller name="gastos_generados" control={control} render={({ field }) => <input type="number" step="0.01" {...field} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>} />
                  {errors.gastos_generados && <p className="text-red-500 text-xs mt-1">{errors.gastos_generados.message}</p>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha de Venta</label>
                  <Controller name="fecha_venta" control={control} render={({ field }) => <input type="date" {...field} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>} />
                  {errors.fecha_venta && <p className="text-red-500 text-xs mt-1">{errors.fecha_venta.message}</p>}
                </div>
                 <div>
                  <label className="block text-sm font-medium text-gray-700">N° Caso (Opcional)</label>
                  <Controller name="numero_caso" control={control} render={({ field }) => <input {...field} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>} />
                </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-marrs-green text-white rounded-md">{isLoading ? "Guardando..." : "Guardar Factura"}</button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default FacturaFormModal;