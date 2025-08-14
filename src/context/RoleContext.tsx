import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth } from '@/lib/auth';

type Role = 'admin' | 'manager' | 'user' | null;

const RoleCtx = createContext<Role>(null);
export const useRole = () => useContext(RoleCtx);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  useEffect(() => subscribeToAuth(setRole), []);
  return <RoleCtx.Provider value={role}>{children}</RoleCtx.Provider>;
}