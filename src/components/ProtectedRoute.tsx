import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requiresAdmin?: boolean;
}

// Simple access control - in a real app, this would check authentication
const ProtectedRoute = ({ children, requiresAdmin = false }: ProtectedRouteProps) => {
  // For demo purposes, admin access is open
  // In production, you would check actual authentication here
  
  if (requiresAdmin) {
    // Could add actual admin authentication check here
    // For now, allow all access to admin routes
  }

  return <>{children}</>;
};

export default ProtectedRoute;