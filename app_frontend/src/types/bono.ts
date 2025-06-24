// src/types/bono.ts

export interface BonoCalculationRequest {
    start_date: string; // Formato YYYY-MM-DD
    end_date: string;   // Formato YYYY-MM-DD
    vendedor_id?: number | null;
  }
  
  export interface BonoVendedorResult {
    vendedor_id: number;
    nombre_vendedor: string;
    rut_vendedor: string;
    total_honorarios: number;
    total_gastos: number;
    total_neto: number;
    bono_calculado: number;
    detalle_facturas: any[]; // O un tipo más específico si lo necesitas
  }
  
  export interface BonoCalculationResponse {
    start_date: string;
    end_date: string;
    resultados: BonoVendedorResult[];
  }