import React, { useEffect } from 'react';
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

  // Log access attempt for monitoring
  useEffect(() => {
    const accessLog = {
      timestamp: new Date().toISOString(),
      path: location.pathname,
      user: user?.id || 'anonymous',
      role: user?.role || 'none',
      authenticated: isAuthenticated,
      allowedRoles: allowedRoles,
      userAgent: navigator.userAgent
    };

    // Store access logs
    const existingLogs = JSON.parse(localStorage.getItem('agrogrowth_access_logs') || '[]');
    existingLogs.push(accessLog);
    
    // Keep only last 50 logs
    if (existingLogs.length > 50) {
      existingLogs.shift();
    }
    
    localStorage.setItem('agrogrowth_access_logs', JSON.stringify(existingLogs));
  }, [location.pathname, user, isAuthenticated, allowedRoles]);

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

  // Check role-based access
  if (allowedRoles.length > 0 && user) {
    if (!allowedRoles.includes(user.role)) {
      console.warn(`Access denied: User role '${user.role}' not in allowed roles [${allowedRoles.join(', ')}] for ${location.pathname}`);
      
      // Show unauthorized access page briefly before redirect
      setTimeout(() => {
        window.location.href = fallbackRoute;
      }, 2000);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              <h1 className="text-xl font-bold text-gray-900 mb-2">
                غير مصرح لك بالوصول
              </h1>
              
              <p className="text-gray-600 mb-2">
                هذه الصفحة مخصصة لـ: {allowedRoles.join(', ')}
              </p>
              
              <p className="text-gray-600 mb-6">
                دورك الحالي: {user.roleArabic}
              </p>
              
              <p className="text-sm text-gray-500 mb-4">
                سيتم توجيهك إلى الصفحة الرئيسية...
              </p>
              
              <button
                onClick={() => window.location.href = fallbackRoute}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                العودة إلى الصفحة الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Render the protected content
  return <>{children}</>;
}
