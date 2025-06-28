// src/types/bono.ts

export interface BonoCalculationRequest {
  start_date: string;
  end_date: string;
  vendedor_id?: number | null;
}

export interface BonoFacturaDetalle {
    factura_id: number;
    numero_orden: string | null;
    // --- NUEVO CAMPO AÑADIDO ---
    razon_social_cliente: string; 
    honorarios: number;
    gastos: number;
    neto: number;
    porcentaje_aplicado: number;
    bono_generado: number;
}

export interface BonoVendedorResult {
  vendedor_id: number;
  nombre_vendedor: string;
  rut_vendedor: string;
  total_honorarios: number;
  total_gastos: number;
  total_neto: number;
  bono_calculado: number;
  detalle_facturas: BonoFacturaDetalle[];
  porcentaje_bono_aplicado?: number;
}

export interface BonoCalculationResponse {
  start_date: string;
  end_date: string;
  resultados: BonoVendedorResult[];
}