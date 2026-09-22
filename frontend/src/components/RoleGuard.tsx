// src/components/RoleGuard.tsx
import React from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  requiredRole: string; // e.g., 'WARD_ENGINEER'
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ requiredRole, children }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate?.();

  const hasAccess = currentUser?.role === requiredRole;

  if (!hasAccess) {
    if (navigate) navigate('/');
    return null;
  }
  return <>{children}</>;
};
