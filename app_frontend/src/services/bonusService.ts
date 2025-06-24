// src/services/bonusService.ts
import apiClient from './apiClient';
import { BonoCalculationRequest, BonoCalculationResponse } from '../types/bono';

const calculateBonuses = async (params: BonoCalculationRequest): Promise<BonoCalculationResponse> => {
  const response = await apiClient.post<BonoCalculationResponse>('/bonos/calcular', params);
  return response.data;
};

const bonusService = {
  calculateBonuses,
};

export default bonusService;
