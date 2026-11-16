import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedStudentRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, studentProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070912]">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (studentProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#070912] px-4">
        <div className="max-w-md w-full rounded-2xl border border-rose-500/30 bg-white dark:bg-[#0D1121] p-8 text-center">
          <h1 className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">
            Account Suspended
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your student account has been suspended by Syntax Academy administration. Please contact{' '}
            <a href="tel:01012329975" className="font-semibold underline">
              01012329975
            </a>{' '}
            for assistance.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isServerAdmin, isFirebaseAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070912]">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isServerAdmin && !isFirebaseAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};
