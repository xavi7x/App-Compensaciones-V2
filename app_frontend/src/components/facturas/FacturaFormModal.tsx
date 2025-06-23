// src/components/facturas/FacturaFormModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Select from 'react-select';
import { toast } from 'react-toastify';

import { FacturaCreate } from '../../types/factura';
import { VendedorSimple } from '../../types/vendedor';
import { ClienteSimple } from '../../types/cliente';

import facturaService from '../../services/facturaService';
import vendedorService from '../../services/vendedorService';

const facturaSchema = z.object({
  numero_orden: z.string().min(1, "El número de orden es requerido"),
  numero_caso: z.string().optional(),
  honorarios_generados: z.preprocess(
    val => parseFloat(String(val).replace(',', '.')), 
    z.number().min(0, "Los honorarios no pueden ser negativos")
  ),
  gastos_generados: z.preprocess(
    val => parseFloat(String(val).replace(',', '.')), 
    z.number().min(0, "Los gastos no pueden ser negativos")
  ),
  fecha_venta: z.string().min(1, "La fecha de venta es requerida"),
  vendedor_id: z.number({ required_error: "Debe seleccionar un vendedor" }).min(1, "Debe seleccionar un vendedor"),
  cliente_id: z.number({ required_error: "Debe seleccionar un cliente" }).min(1, "Debe seleccionar un cliente"),
});

type FacturaFormData = z.infer<typeof facturaSchema>;

interface FacturaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const FacturaFormModal: React.FC<FacturaFormModalProps> = ({ isOpen, onClose, onSave }) => {
  const [vendedores, setVendedores] = useState<VendedorSimple[]>([]);
  const [clientesAsignados, setClientesAsignados] = useState<ClienteSimple[]>([]);
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [isClientesLoading, setIsClientesLoading] = useState(false);

  const { control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FacturaFormData>({
    resolver: zodResolver(facturaSchema),
    defaultValues: {
      fecha_venta: new Date().toISOString().split('T')[0],
      numero_orden: '',
      numero_caso: '',
      honorarios_generados: 0,
      gastos_generados: 0,
    }
  });

  const selectedVendedorId = watch('vendedor_id');
  
  const resetAndClear = useCallback(() => {
    reset({
        fecha_venta: new Date().toISOString().split('T')[0],
        vendedor_id: undefined,
        cliente_id: undefined,
    });
    setVendedores([]);
    setClientesAsignados([]);
  }, [reset]);

  useEffect(() => {
    if (isOpen) {
      resetAndClear();
      const fetchVendedores = async () => {
        setIsFormLoading(true);
        try {
          const vendedoresRes = await vendedorService.getAllVendedoresSimple();
          setVendedores(vendedoresRes || []);
        } catch (error) {
          toast.error("Error al cargar la lista de vendedores.");
        } finally {
          setIsFormLoading(false);
        }
      };
      fetchVendedores();
    }
  }, [isOpen, resetAndClear]);

  useEffect(() => {
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

  const processSubmit: SubmitHandler<FacturaFormData> = async (data) => {
    setIsFormLoading(true);
    try {
      const facturaData: FacturaCreate = {
        ...data,
        numero_caso: data.numero_caso || undefined,
      };
      await facturaService.createFactura(facturaData);
      toast.success("Factura creada exitosamente");
      onSave();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Error al crear la factura");
    } finally {
      setIsFormLoading(false);
    }
  };
  
  if (!isOpen) return null;

  const vendedorOptions = vendedores.map(v => ({ 
    value: v.id, 
    label: v.nombre_completo || 'Vendedor sin nombre'
  }));

  const clienteOptions = clientesAsignados.map(c => ({ 
    value: c.id, 
    label: c.razon_social || 'Cliente sin nombre'
  }));

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl overflow-y-auto max-h-full">
        <h2 className="text-xl font-semibold mb-4">Carga Manual de Factura</h2>
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
                    isLoading={isFormLoading}
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
              render={({ field }) => <input {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />}
            />
            {errors.numero_orden && <p className="text-red-500 text-xs mt-1">{errors.numero_orden.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Honorarios Generados *</label>
              <Controller
                name="honorarios_generados"
                control={control}
                render={({ field }) => <input type="number" step="0.01" {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />}
              />
              {errors.honorarios_generados && <p className="text-red-500 text-xs mt-1">{errors.honorarios_generados.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gastos Generados *</label>
              <Controller
                name="gastos_generados"
                control={control}
                render={({ field }) => <input type="number" step="0.01" {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />}
              />
              {errors.gastos_generados && <p className="text-red-500 text-xs mt-1">{errors.gastos_generados.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Venta *</label>
              <Controller
                name="fecha_venta"
                control={control}
                render={({ field }) => <input type="date" {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />}
              />
              {errors.fecha_venta && <p className="text-red-500 text-xs mt-1">{errors.fecha_venta.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">N° Caso (Opcional)</label>
              <Controller
                name="numero_caso"
                control={control}
                render={({ field }) => <input {...field} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={isFormLoading} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
            <button type="submit" disabled={isFormLoading || isClientesLoading} className="px-4 py-2 bg-marrs-green text-white rounded-md">
              {isFormLoading || isClientesLoading ? "Cargando..." : "Guardar Factura"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacturaFormModal;
