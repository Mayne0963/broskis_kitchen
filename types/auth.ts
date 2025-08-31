import type { User } from 'firebase/auth';

export type Role = 'admin' | 'manager' | 'kitchen' | 'customer' | 'staff';

export interface Claims {
  admin?: boolean;
  role?: Role;
  kitchen?: boolean;
}

export interface AuthState {
  user: User | null;
  claims: Claims;
  loading: boolean;
}