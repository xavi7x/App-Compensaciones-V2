// src/types/vendedor.ts
import { Cliente } from './cliente';

export interface VendedorClientePorcentajeBase {
  cliente_id: number;
  porcentaje_bono: number;
}

export interface VendedorClientePorcentajeCreate extends VendedorClientePorcentajeBase {}

export interface VendedorClientePorcentajeUpdate {
    porcentaje_bono: number;
}

export interface VendedorClientePorcentaje extends VendedorClientePorcentajeBase {
  id: number;
  cliente?: Cliente;
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

// --- NUEVA INTERFAZ AÑADIDA ---
// Esta es la interfaz para la lista simplificada.
export interface VendedorSimple {
  id: number;
  nombre_completo: string;
}
