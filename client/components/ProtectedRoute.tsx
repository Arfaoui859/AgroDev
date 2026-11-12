import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { resolveRouteAccess } from '@/lib/routeAccess';

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
  const { user, isAuthenticated, isLoading, roleVerified } = useAuth();
  const location = useLocation();

  const decision = resolveRouteAccess({
    isLoading,
    requiresAuth,
    isAuthenticated,
    allowedRoles,
    userRole: user?.role ?? null,
    roleVerified,
  });

  // Show loading state while checking authentication
  if (decision === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (decision === 'redirect-login') {
    console.warn(`Access denied: User not authenticated for ${location.pathname}`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role restrictions fail closed: a null/unverified profile or a role outside
  // the allow-list is sent to the fallback rather than rendering the content.
  if (decision === 'redirect-fallback') {
    return (
      <Navigate
        to={fallbackRoute}
        state={{ accessDenied: true, attemptedPath: location.pathname }}
        replace
      />
    );
  }

  return <>{children}</>;
}
