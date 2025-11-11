export interface Claims {
  admin?: boolean;
  role?: 'admin' | 'manager' | 'kitchen' | 'customer';
  [key: string]: any;
}

export interface AuthState {
  user: any | null;
  claims: Claims;
  loading: boolean;
}