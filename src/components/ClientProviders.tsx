'use client';
import React from 'react';
import { RoleProvider } from '@/context/RoleContext';
export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <RoleProvider>{children}</RoleProvider>;
}