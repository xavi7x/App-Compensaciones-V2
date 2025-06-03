// src/types/vendedor.ts
import { Cliente } from './cliente'; // Para mostrar info del cliente en la asignación

export interface VendedorClientePorcentajeBase {
  cliente_id: number;
  porcentaje_bono: number; // Frontend podría manejarlo como 0-100 y convertir antes de enviar
}

export interface VendedorClientePorcentajeCreate extends VendedorClientePorcentajeBase {}

export interface VendedorClientePorcentajeUpdate {
    porcentaje_bono: number;
}

export interface VendedorClientePorcentaje extends VendedorClientePorcentajeBase {
  id: number;
  cliente?: Cliente; // Cliente completo para mostrar en la UI
}

export interface VendedorBase {
  nombre_completo: string;
  rut: string;
  sueldo_base: number;
}

export interface VendedorCreate extends VendedorBase {
  asignaciones?: VendedorClientePorcentajeCreate[];
}

export interface VendedorUpdate extends Partial<VendedorBase> {}

export interface Vendedor extends VendedorBase {
  id: number;
  created_at?: string | null;
  updated_at?: string | null;
  clientes_asignados: VendedorClientePorcentaje[];
}

// Esquema de Zod para la validación del formulario de vendedor
// (Lo implementaremos en un paso de refinamiento, pero puedes empezar a definirlo)
// import { z } from 'zod';
// import { validarRutChileno } from '../utils/validationUtils';
// export const vendedorSchema = z.object({ ... });
// export type VendedorFormData = z.infer<typeof vendedorSchema>;
