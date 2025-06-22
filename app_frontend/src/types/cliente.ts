// src/types/cliente.ts
import { z } from 'zod';

export interface Cliente {
  id: number;
  razon_social: string;
  rut: string;
  ramo?: string;
  ubicacion?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ClienteCreate extends ClienteBase {}
export interface ClienteUpdate extends Partial<Omit<ClienteBase, 'rut'>> {}

export interface Cliente extends ClienteBase {
  id: number;
  created_at?: string;
  updated_at?: string;
}

// Función de validación de RUT chileno
const validateRUT = (rut: string): boolean => {
  if (!rut) return false;
  
  // Limpiar RUT
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  if (cleanRut.length < 2) return false;

  const rutDigits = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  // Validar que los dígitos sean números
  if (!/^\d+$/.test(rutDigits)) return false;

  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;

  for (let i = rutDigits.length - 1; i >= 0; i--) {
    sum += parseInt(rutDigits.charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const calculatedDv = 11 - (sum % 11);
  const expectedDv = calculatedDv === 11 ? '0' : calculatedDv === 10 ? 'K' : calculatedDv.toString();

  return dv === expectedDv;
};

// Esquema base común
const clienteBaseSchema = z.object({
  razon_social: z.string()
    .min(3, "La razón social debe tener al menos 3 caracteres")
    .max(255, "La razón social no puede exceder 255 caracteres"),
  ramo: z.string().max(100, "El ramo no puede exceder 100 caracteres").optional(),
  ubicacion: z.string().max(255, "La ubicación no puede exceder 255 caracteres").optional()
});

// Esquema para creación de cliente
export const clienteCreateSchema = clienteBaseSchema.extend({
  rut: z.string()
    .min(8, "El RUT debe tener al menos 8 caracteres")
    .max(12, "El RUT no puede exceder 12 caracteres")
    .refine(validateRUT, {
      message: "RUT inválido. Formato: 12345678-9 o 12.345.678-9"
    })
});

// Esquema para actualización de cliente
export const clienteUpdateSchema = clienteBaseSchema.partial();

// Esquema para respuesta de API
export const clienteResponseSchema = clienteBaseSchema.extend({
  id: z.number(),
  rut: z.string(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

// Tipos inferidos
export type ClienteFormData = z.infer<typeof clienteCreateSchema>;
export type ClienteUpdateData = z.infer<typeof clienteUpdateSchema>;
export type ClienteResponse = z.infer<typeof clienteResponseSchema>;

// Tipo para respuesta paginada
export interface ClientesPaginados {
  items: ClienteResponse[];
  total_count: number;
}

// Añade este schema de validación
export const clienteSchema = z.object({
  razon_social: z.string().min(3, "Mínimo 3 caracteres"),
  rut: z.string().min(8, "RUT inválido").max(12, "RUT inválido"),
  ramo: z.string().optional(),
  ubicacion: z.string().optional()
});

export type ClienteFormData = z.infer<typeof clienteSchema>;