'use client'

import { useAuth } from '@/lib/context/AuthContext';
import { createContext, useContext, ReactNode } from 'react';

interface RoleContextType {
  userRole: string | null;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const RoleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const userRole = user?.role || null;

  return (
    <RoleContext.Provider value={{ userRole, isLoading }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = (): RoleContextType => {
  const context = useContext(RoleContext);
  if (!context) {
    // Return null during build time or when outside provider
    return null;
  }
  return context.userRole;
};