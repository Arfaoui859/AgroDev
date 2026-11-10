import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiresAuth?: boolean;
  fallbackRoute?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  requiresAuth = true,
  fallbackRoute = '/'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requiresAuth && !isAuthenticated) {
    console.warn(`Access denied: User not authenticated for ${location.pathname}`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Enforce role restrictions without storing personal access logs in
  // browser storage or scheduling a full-page redirect.
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    return (
      <Navigate
        to={fallbackRoute}
        state={{ accessDenied: true, attemptedPath: location.pathname }}
        replace
      />
    );
  }

  // Render the protected content
  return <>{children}</>;
}
