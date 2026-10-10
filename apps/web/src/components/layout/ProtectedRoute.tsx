import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerified?: boolean;
  requireRole?: ('STUDENT' | 'MODERATOR' | 'ADMIN')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireVerified = false,
  requireRole,
}) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="h-8 w-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-medium text-slate-500">Checking campus credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (requireVerified && !user?.emailVerified) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center">
        <div className="h-12 w-12 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="font-display font-bold text-lg text-amber-900">Email Verification Required</h3>
        <p className="text-sm text-amber-700 mt-2">
          To buy, sell, or bid on CampusLoop, please verify your college email (<strong>{user?.email}</strong>).
        </p>
        <p className="text-xs text-amber-600 mt-4">
          A verification link was sent upon registration. If you didn't receive it, please check your spam folder or contact your college administrator.
        </p>
      </div>
    );
  }

  if (requireRole && user && !requireRole.includes(user.role)) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
        <h3 className="font-display font-bold text-lg text-rose-900">Access Restricted</h3>
        <p className="text-sm text-rose-700 mt-2">
          You do not have moderator or administrative permissions to view this section.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
