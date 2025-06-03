// src/types/user.ts
// src/types/user.ts
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export enum ApprovalStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export interface UserBase {
  email: string;
  username: string;
  full_name?: string | null;
  is_active?: boolean | null;
  is_superuser?: boolean | null;
  role?: UserRole | null;
}

export interface UserCreate extends UserBase {
  password: string;
}

// ✅ ÚNICA DEFINICIÓN VÁLIDA
export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  full_name?: string;
}

export interface User extends UserBase {
  id: number;
  approval_status: ApprovalStatus;
  last_password_change_date?: string | null;
  is_two_factor_enabled: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}