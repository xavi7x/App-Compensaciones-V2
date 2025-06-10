// src/types/cliente.ts
import { z } from 'zod';
import { validarRutChileno } from '../utils/validationUtils'; // Ajusta la ruta si es necesario

export interface ClienteBase {
  razon_social: string;
  rut: string;
  ramo?: string | null;
  ubicacion?: string | null;
}

export interface ClienteCreate extends ClienteBase {}

export interface ClienteUpdate extends Partial<ClienteBase> {}

export interface Cliente extends ClienteBase {
  id: number;
  created_at?: string | null;
  updated_at?: string | null;
}

// Esquema de Zod para la validación del formulario de cliente
export const clienteSchema = z.object({
  razon_social: z.string().min(3, "La razón social debe tener al menos 3 caracteres.").max(255),
  rut: z.string()
    .min(8, "El RUT debe tener al menos 8 caracteres.")
    .max(12, "El RUT no debe exceder los 12 caracteres.")
    .refine(validarRutChileno, "RUT inválido."),
  ramo: z.string().max(100).optional().nullable(),
  ubicacion: z.string().max(255).optional().nullable(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;
