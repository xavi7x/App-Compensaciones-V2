// src/types/factura.ts
import { Cliente } from './cliente';
import { Vendedor } from './vendedor';

export interface FacturaBase {
    numero_orden?: string | null;
    numero_caso?: string | null;
    honorarios_generados: number;
    gastos_generados: number;
    vendedor_id: number;
    cliente_id: number;
}

export interface FacturaCreate extends FacturaBase {}

export interface FacturaUpdate {
    numero_orden?: string;
    numero_caso?: string;
    honorarios_generados?: number;
    gastos_generados?: number;
    vendedor_id?: number;
    cliente_id?: number;
}

export interface Factura extends FacturaBase {
    id: number;
    fecha_emision: string; // El backend la convierte a string (ISO format)
    created_at: string;
    vendedor?: Vendedor; // Objeto anidado
    cliente?: Cliente;   // Objeto anidado
}

export interface FacturasResponse {
    items: Factura[];
    total_count: number;
}