// src/types/reporte.ts

export interface ReporteFacturaItem {
    factura_id: number;
    numero_orden?: string | null;
    numero_caso?: string | null;
    fecha_emision: string; // Las fechas llegan como strings
  
    honorarios_generados: number;
    gastos_generados: number;
  
    vendedor_id: number;
    vendedor_nombre: string;
    vendedor_rut: string;
  
    cliente_id: number;
    cliente_razon_social: string;
    cliente_rut: string;

    // --- CAMPO AÑADIDO PARA EL BONO ---
    bono_calculado?: number; 
  }
  
export interface SumatoriaPorVendedor {
    vendedor_id: number;
    vendedor_nombre: string;
    total_honorarios: number;
}

// --- INTERFAZ CORREGIDA Y UNIFICADA ---
export interface ReporteResponse {
    items: ReporteFacturaItem[];
    total_count: number;
    sumatoria_total_honorarios: number;
    sumatorias_por_vendedor: SumatoriaPorVendedor[];
}