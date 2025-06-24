// src/services/reportService.ts
import apiClient from './apiClient';
import { ReporteResponse } from '../types/reporte';

interface ReportParams {
  start_date: string;
  end_date: string;
  numero_caso?: string;
  vendedor_id?: number;
  cliente_id?: number;
  vendedor_rut?: string;
  skip?: number;
  limit?: number;
}

const getFacturacionReport = async (params: ReportParams): Promise<ReporteResponse> => {
  // Limpiar parámetros opcionales que estén vacíos o nulos
  const cleanParams: { [key: string]: any } = {};
  for (const key in params) {
    if (params[key as keyof ReportParams] !== null && params[key as keyof ReportParams] !== '') {
      cleanParams[key] = params[key as keyof ReportParams];
    }
  }

  const response = await apiClient.get<ReporteResponse>('/reportes/facturacion', { params: cleanParams });
  return response.data;
};

const reportService = {
  getFacturacionReport,
};

export default reportService;
