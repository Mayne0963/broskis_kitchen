'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToAuth } from '@/lib/auth';

export type Role = 'admin' | 'manager' | 'user' | null;

const Ctx = createContext<Role>(null);

export const useRole = () => useContext(Ctx);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  
  useEffect(() => subscribeToAuth(setRole), []);
  
  return <Ctx.Provider value={role}>{children}</Ctx.Provider>;
}